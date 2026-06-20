create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


--------------------------------------------------------------
-- STEP 2: ENUMS (Type Definitions)
--------------------------------------------------------------

create type booking_status as enum (
  'pending', 'confirmed', 'active', 'completed', 'cancelled', 'refunded'
);

create type payment_status as enum (
  'pending', 'paid', 'failed', 'refunded', 'partial_refund'
);

create type payment_method as enum (
  'upi', 'credit_card', 'debit_card', 'net_banking', 'cash', 'wallet'
);

create type car_category as enum (
  'hatchback', 'sedan', 'suv', 'muv', 'luxury'
);

create type rental_mode as enum (
  'self_drive', 'with_driver'
);

create type driver_status as enum (
  'available', 'on_trip', 'off_duty', 'inactive'
);

create type user_role as enum (
  'customer', 'driver', 'admin', 'owner'
);


--------------------------------------------------------------
-- STEP 3: PROFILES TABLE (extends Supabase auth.users)
--------------------------------------------------------------

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null,
  phone           text unique,
  email           text,
  avatar_url      text,
  role            user_role default 'customer',
  address         text,
  city            text default 'Coimbatore',
  dl_number       text,                         -- Driving Licence (for self-drive)
  dl_verified     boolean default false,
  aadhar_number   text,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


--------------------------------------------------------------
-- STEP 4: VEHICLES TABLE
--------------------------------------------------------------

create table public.vehicles (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,               -- "Maruti Swift", "BMW 5 Series"
  model           text,
  year            int,
  category        car_category not null,
  registration_no text unique not null,
  color           text,
  fuel_type       text default 'Petrol',       -- Petrol, Diesel, EV, CNG
  transmission    text default 'Manual',       -- Manual, Automatic
  seats           int default 5,
  ac              boolean default true,
  images          text[],                      -- Array of Supabase storage URLs
  features        text[],                      -- ["GPS", "Music System", "USB"]
  -- Pricing
  price_per_day       numeric(10,2) not null,  -- Self-drive daily rate
  price_with_driver   numeric(10,2),           -- With driver daily rate
  price_per_km        numeric(6,2),            -- Extra KM charge
  security_deposit    numeric(10,2) default 2000,
  -- Availability
  is_available    boolean default true,
  is_active       boolean default true,
  -- Location
  current_lat     numeric(10,7),
  current_lng     numeric(10,7),
  location_name   text default 'Coimbatore',
  -- Metadata
  total_bookings  int default 0,
  rating          numeric(3,2) default 5.0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);


--------------------------------------------------------------
-- STEP 5: DRIVERS TABLE
--------------------------------------------------------------

create table public.drivers (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid references public.profiles(id) on delete cascade,
  license_no      text unique not null,
  license_expiry  date,
  experience_yrs  int default 0,
  languages       text[] default array['Tamil', 'English'],
  status          driver_status default 'available',
  rating          numeric(3,2) default 5.0,
  total_trips     int default 0,
  photo_url       text,
  is_active       boolean default true,
  created_at      timestamptz default now()
);


--------------------------------------------------------------
-- STEP 6: BOOKINGS TABLE
--------------------------------------------------------------

create table public.bookings (
  id              uuid primary key default uuid_generate_v4(),
  booking_ref     text unique not null,        -- "RC-2025-000123"
  -- Relations
  customer_id     uuid references public.profiles(id) on delete restrict,
  vehicle_id      uuid references public.vehicles(id) on delete restrict,
  driver_id       uuid references public.drivers(id) on delete set null,
  -- Booking Details
  rental_mode     rental_mode not null,
  pickup_date     date not null,
  return_date     date not null,
  total_days      int generated always as (return_date - pickup_date) stored,
  pickup_location text not null,
  drop_location   text,
  pickup_lat      numeric(10,7),
  pickup_lng      numeric(10,7),
  -- Pricing Breakdown
  base_amount     numeric(10,2) not null,      -- rate × days
  driver_amount   numeric(10,2) default 0,
  platform_fee    numeric(10,2) default 49,
  discount_amount numeric(10,2) default 0,
  tax_amount      numeric(10,2) default 0,
  total_amount    numeric(10,2) not null,
  security_deposit numeric(10,2) default 0,
  -- Status
  status          booking_status default 'pending',
  -- Customer Notes
  special_notes   text,
  -- Timestamps
  confirmed_at    timestamptz,
  started_at      timestamptz,
  completed_at    timestamptz,
  cancelled_at    timestamptz,
  cancel_reason   text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-generate booking reference
create or replace function generate_booking_ref()
returns trigger language plpgsql as $$
begin
  new.booking_ref := 'RC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('booking_ref_seq')::text, 6, '0');
  return new;
end;
$$;
create sequence if not exists booking_ref_seq start 1000;

create trigger set_booking_ref
  before insert on public.bookings
  for each row execute procedure generate_booking_ref();


--------------------------------------------------------------
-- STEP 7: PAYMENTS TABLE
--------------------------------------------------------------

create table public.payments (
  id                uuid primary key default uuid_generate_v4(),
  booking_id        uuid references public.bookings(id) on delete cascade,
  customer_id       uuid references public.profiles(id),
  -- Gateway Details
  gateway           text default 'razorpay',   -- 'razorpay', 'stripe', 'manual'
  gateway_order_id  text,                      -- Razorpay order_id
  gateway_payment_id text,                     -- Razorpay payment_id (after success)
  gateway_signature text,                      -- Razorpay signature (for verification)
  -- Payment Info
  amount            numeric(10,2) not null,
  currency          text default 'INR',
  method            payment_method not null,
  status            payment_status default 'pending',
  -- Refund Info
  refund_id         text,
  refund_amount     numeric(10,2),
  refund_reason     text,
  refunded_at       timestamptz,
  -- Receipt
  receipt_url       text,
  receipt_no        text,
  -- Metadata
  notes             jsonb,
  created_at        timestamptz default now(),
  paid_at           timestamptz
);

-- Update booking status when payment succeeds
create or replace function public.on_payment_success()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'paid' and old.status != 'paid' then
    update public.bookings
    set status = 'confirmed', confirmed_at = now(), updated_at = now()
    where id = new.booking_id;
    -- Increment vehicle booking count
    update public.vehicles
    set total_bookings = total_bookings + 1
    where id = (select vehicle_id from public.bookings where id = new.booking_id);
  end if;
  return new;
end;
$$;

create trigger on_payment_confirmed
  after update on public.payments
  for each row execute procedure public.on_payment_success();


--------------------------------------------------------------
-- STEP 8: GPS TRACKING TABLE
--------------------------------------------------------------

create table public.tracking (
  id          bigserial primary key,
  booking_id  uuid references public.bookings(id) on delete cascade,
  vehicle_id  uuid references public.vehicles(id) on delete cascade,
  latitude    numeric(10,7) not null,
  longitude   numeric(10,7) not null,
  speed_kmh   numeric(5,1),
  heading     numeric(5,1),
  recorded_at timestamptz default now()
);

-- Keep only last 24h of tracking data (run as cron via pg_cron or Supabase Edge Function)
-- delete from public.tracking where recorded_at < now() - interval '24 hours';

-- Latest location view
create view public.vehicle_live_location as
  select distinct on (vehicle_id)
    vehicle_id, latitude, longitude, speed_kmh, recorded_at, booking_id
  from public.tracking
  order by vehicle_id, recorded_at desc;


--------------------------------------------------------------
-- STEP 9: REVIEWS TABLE
--------------------------------------------------------------

create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid references public.bookings(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete cascade,
  vehicle_id  uuid references public.vehicles(id) on delete cascade,
  driver_id   uuid references public.drivers(id) on delete set null,
  rating      int check (rating between 1 and 5),
  comment     text,
  is_visible  boolean default true,
  created_at  timestamptz default now()
);

-- Auto-update vehicle rating when reviewed
create or replace function update_vehicle_rating()
returns trigger language plpgsql as $$
begin
  update public.vehicles
  set rating = (select avg(rating) from public.reviews where vehicle_id = new.vehicle_id)
  where id = new.vehicle_id;
  return new;
end;
$$;
create trigger after_review_insert
  after insert on public.reviews
  for each row execute procedure update_vehicle_rating();


--------------------------------------------------------------
-- STEP 10: NOTIFICATIONS TABLE
--------------------------------------------------------------

create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade,
  booking_id  uuid references public.bookings(id) on delete cascade,
  type        text,  -- 'booking_confirmed', 'payment_received', 'trip_started', etc.
  title       text not null,
  message     text,
  is_read     boolean default false,
  sent_sms    boolean default false,
  sent_email  boolean default false,
  created_at  timestamptz default now()
);


--------------------------------------------------------------
-- STEP 11: COUPONS / DISCOUNTS TABLE
--------------------------------------------------------------

create table public.coupons (
  id              uuid primary key default uuid_generate_v4(),
  code            text unique not null,
  description     text,
  discount_type   text default 'flat',       -- 'flat' or 'percent'
  discount_value  numeric(10,2) not null,
  min_booking_amt numeric(10,2) default 0,
  max_discount    numeric(10,2),             -- Cap for percent discounts
  usage_limit     int default 100,
  used_count      int default 0,
  valid_from      date,
  valid_until     date,
  is_active       boolean default true,
  created_at      timestamptz default now()
);


--------------------------------------------------------------
-- STEP 12: ROW LEVEL SECURITY (RLS)
--------------------------------------------------------------

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.drivers enable row level security;
alter table public.tracking enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.coupons enable row level security;

--------------------------------------------------------------
-- PROFILES POLICIES
--------------------------------------------------------------
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','owner')
  ));

--------------------------------------------------------------
-- VEHICLES POLICIES
--------------------------------------------------------------
create policy "Anyone can view active vehicles"
  on public.vehicles for select
  using (is_active = true);

create policy "Admins can insert vehicles"
  on public.vehicles for insert
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','owner')
  ));

create policy "Admins can update vehicles"
  on public.vehicles for update
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','owner')
  ));

--------------------------------------------------------------
-- BOOKINGS POLICIES
--------------------------------------------------------------
create policy "Customers can view own bookings"
  on public.bookings for select
  using (customer_id = auth.uid());

create policy "Customers can create bookings"
  on public.bookings for insert
  with check (customer_id = auth.uid());

create policy "Admins can view all bookings"
  on public.bookings for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','owner')
  ));

create policy "Admins can update bookings"
  on public.bookings for update
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','owner')
  ));

--------------------------------------------------------------
-- PAYMENTS POLICIES
--------------------------------------------------------------
create policy "Customers can view own payments"
  on public.payments for select
  using (customer_id = auth.uid());

create policy "Customers can create payments"
  on public.payments for insert
  with check (customer_id = auth.uid());

create policy "Admins can view all payments"
  on public.payments for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','owner')
  ));

--------------------------------------------------------------
-- TRACKING POLICIES
--------------------------------------------------------------
create policy "Customers can view tracking for their active bookings"
  on public.tracking for select
  using (exists (
    select 1 from public.bookings
    where id = booking_id
    and customer_id = auth.uid()
    and status = 'active'
  ));

create policy "Admins can view all tracking"
  on public.tracking for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','owner')
  ));

--------------------------------------------------------------
-- NOTIFICATIONS POLICIES
--------------------------------------------------------------
create policy "Users can view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can mark own notifications read"
  on public.notifications for update
  using (user_id = auth.uid());

--------------------------------------------------------------
-- REVIEWS POLICIES
--------------------------------------------------------------
create policy "Anyone can read visible reviews"
  on public.reviews for select
  using (is_visible = true);

create policy "Customers can add reviews for their completed bookings"
  on public.reviews for insert
  with check (
    customer_id = auth.uid() and
    exists (
      select 1 from public.bookings
      where id = booking_id
      and customer_id = auth.uid()
      and status = 'completed'
    )
  );

--------------------------------------------------------------
-- COUPONS POLICIES
--------------------------------------------------------------
create policy "Anyone can view active coupons"
  on public.coupons for select
  using (is_active = true and valid_until >= current_date);

create policy "Admins can manage coupons"
  on public.coupons for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','owner')
  ));


--------------------------------------------------------------
-- STEP 13: USEFUL FUNCTIONS & VIEWS
--------------------------------------------------------------

-- Check vehicle availability for a date range
create or replace function check_vehicle_availability(
  p_vehicle_id uuid,
  p_pickup_date date,
  p_return_date date
)
returns boolean language plpgsql as $$
begin
  return not exists (
    select 1 from public.bookings
    where vehicle_id = p_vehicle_id
    and status in ('confirmed', 'active')
    and pickup_date < p_return_date
    and return_date > p_pickup_date
  );
end;
$$;

-- Admin Dashboard: Revenue Summary View
create view public.admin_revenue_summary as
  select
    date_trunc('month', paid_at) as month,
    count(*) as total_payments,
    sum(amount) as total_revenue,
    sum(case when method = 'upi' then amount else 0 end) as upi_revenue,
    sum(case when method in ('credit_card','debit_card') then amount else 0 end) as card_revenue,
    sum(case when method = 'cash' then amount else 0 end) as cash_revenue
  from public.payments
  where status = 'paid'
  group by 1
  order by 1 desc;

-- Admin Dashboard: Booking Summary View
create view public.admin_booking_summary as
  select
    b.id, b.booking_ref, b.status,
    b.pickup_date, b.return_date, b.total_days,
    b.rental_mode, b.total_amount,
    p.full_name as customer_name, p.phone as customer_phone,
    v.name as vehicle_name, v.category,
    py.status as payment_status,
    py.method as payment_method
  from public.bookings b
  left join public.profiles p on b.customer_id = p.id
  left join public.vehicles v on b.vehicle_id = v.id
  left join public.payments py on py.booking_id = b.id
  order by b.created_at desc;


--------------------------------------------------------------
-- STEP 14: REALTIME (Enable for live tracking & notifications)
--------------------------------------------------------------

-- In Supabase Dashboard → Database → Replication → Tables
-- Enable Realtime for:
-- ✅ bookings      (for admin live updates)
-- ✅ tracking      (for live GPS map)
-- ✅ notifications (for real-time alerts)
-- ✅ payments      (for payment status updates)

-- Or run:
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.tracking;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.payments;


--------------------------------------------------------------
-- STEP 15: STORAGE BUCKETS (Pseudo logic to show buckets)
--------------------------------------------------------------

insert into storage.buckets (id, name, public) values 
('vehicle-images', 'vehicle-images', true),
('driver-photos', 'driver-photos', true),
('user-documents', 'user-documents', false),
('receipts', 'receipts', false)
on conflict do nothing;


--------------------------------------------------------------
-- STEP 16: SAMPLE DATA (For Testing)
--------------------------------------------------------------

insert into public.vehicles (name, model, year, category, registration_no, color, seats, price_per_day, price_with_driver, images, features, is_available)
values
  ('Maruti Swift', 'ZXi Plus', 2023, 'hatchback', 'TN33AB1234', 'Red', 5, 799, 1200,
   array['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800'],
   array['AC', 'Music System', 'USB Charging']),

  ('Honda City', 'ZX CVT', 2023, 'sedan', 'TN33CD5678', 'Silver', 5, 1299, 1800,
   array['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800'],
   array['AC', 'Sunroof', 'GPS', 'Music System', 'Bluetooth']),

  ('Toyota Innova Crysta', 'GX MT', 2022, 'muv', 'TN33EF9012', 'White', 7, 1899, 2600,
   array['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800'],
   array['AC', '7 Seats', 'GPS', 'USB', 'Music System']),

  ('BMW 5 Series', '530d M Sport', 2024, 'luxury', 'TN33GH3456', 'Black', 5, 4999, 6500,
   array['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'],
   array['AC', 'Leather Seats', 'Sunroof', 'GPS', 'Harman Kardon', 'ADAS']);

insert into public.coupons (code, description, discount_type, discount_value, min_booking_amt, valid_until)
values
  ('RIDECOVAI10', 'Flat 10% off for new users', 'percent', 10, 500, '2025-12-31'),
  ('WELCOME200',  'Flat ₹200 off on first ride',  'flat',    200, 799, '2025-12-31');
