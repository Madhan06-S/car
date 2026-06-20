-- Add KYC columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_verified_by UUID;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  provider TEXT DEFAULT 'resend',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- Create KYC verification function
CREATE OR REPLACE FUNCTION verify_user_kyc(user_uuid UUID, admin_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET kyc_status = 'verified', 
      kyc_verified_at = NOW(), 
      kyc_verified_by = admin_uuid 
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update existing users
UPDATE profiles SET kyc_status = 'not_started' WHERE kyc_status IS NULL;
