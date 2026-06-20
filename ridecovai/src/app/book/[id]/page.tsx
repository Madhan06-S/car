"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle, Car, MapPin, Calendar, CreditCard, Banknote } from 'lucide-react';
import Image from 'next/image';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleName = decodeURIComponent(params.id as string);
  
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mode, setMode] = useState('self_drive');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  // Customer Details if not logged in
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    const init = async () => {
      // 1. Get user session if exists
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // Pre-fill profile details
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setCustomerName(profile.full_name || '');
          setCustomerPhone(profile.phone || '');
          setCustomerEmail(session.user.email || '');
        }
      }

      // 2. Fetch vehicle details (we'll fetch all and find by name for mock simplicity, or find by eq)
      const { data: vehicles } = await supabase.from('vehicles').select('*');
      if (vehicles) {
        const found = vehicles.find((v: any) => v.name.toLowerCase() === vehicleName.toLowerCase());
        setVehicle(found || vehicles[0]); // Fallback to first if not found
      }
      
      setLoading(false);
    };
    init();
  }, [vehicleName]);

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const totalAmount = vehicle ? calculateDays() * vehicle.price_per_day : 0;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const ref = `RC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    setBookingRef(ref);

    const bookingPayload = {
      booking_ref: ref,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      vehicle_name: vehicle.name,
      rental_mode: mode,
      start_date: startDate,
      end_date: endDate,
      total_amount: totalAmount.toFixed(2),
      status: paymentMethod === 'online' ? 'confirmed' : 'pending',
      payment_method: paymentMethod
    };

    if (paymentMethod === 'online') {
      try {
        // Create order via our next API
        const response = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalAmount,
            currency: 'INR',
            bookingId: ref,
            customerId: customerEmail || 'guest'
          }),
        });

        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || 'Payment order failed');
        }
        
        await response.json();
        
        // Simulating Razorpay checkout visually to avoid requiring RAZORPAY API loaded dynamically
        // Since we are mocking the application locally
        setTimeout(async () => {
             // Fake razorpay success after 1 second for demo
             await supabase.from('admin_booking_summary').insert(bookingPayload);
             setSuccess(true);
             setIsProcessing(false);
        }, 1500);

      } catch (err) {
        console.error(err);
        alert('Payment failed. Please try again.');
        setIsProcessing(false);
      }
    } else {
      // Cash on delivery
      await supabase.from('admin_booking_summary').insert(bookingPayload);
      setTimeout(() => {
        setSuccess(true);
        setIsProcessing(false);
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111] p-8 rounded-2xl border border-white/10 text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
          <p className="text-gray-400 mb-6">Your booking reference is <span className="text-white font-mono">{bookingRef}</span></p>
          
          <div className="bg-[#1a1a1a] rounded-xl p-4 text-left mb-8">
            <p className="text-sm text-gray-400 mb-1">Vehicle</p>
            <p className="text-white font-medium mb-3">{vehicle?.name}</p>
            <p className="text-sm text-gray-400 mb-1">Amount</p>
            <p className="text-white font-medium mb-3">₹{totalAmount}</p>
            <p className="text-sm text-gray-400 mb-1">Payment Method</p>
            <p className="text-white font-medium uppercase">{paymentMethod.replace('_', ' ')}</p>
          </div>

          <button onClick={() => router.push(user ? '/dashboard' : '/')} className="w-full h-12 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-colors">
            {user ? 'Go to Dashboard' : 'Return Home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Vehicle Info */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-heading font-bold text-white mb-2">{vehicle?.name}</h1>
              <p className="text-gray-400 flex items-center gap-2">
                <span className="uppercase tracking-widest text-xs font-bold text-primary">{vehicle?.category}</span>
                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                <span className="text-sm">{vehicle?.transmission} - {vehicle?.fuel_type}</span>
              </p>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/5 bg-[#111]">
              <Image 
                src={vehicle?.images?.[0] || vehicle?.image || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800'} 
                alt={vehicle?.name} 
                fill 
                className="object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#111] border border-white/5 p-4 rounded-xl">
                 <p className="text-sm text-gray-500 mb-1">Rate per day</p>
                 <p className="text-2xl font-bold text-white">₹{vehicle?.price_per_day || vehicle?.price || 1500}</p>
               </div>
               <div className="bg-[#111] border border-white/5 p-4 rounded-xl">
                 <p className="text-sm text-gray-500 mb-1">Pickup Location</p>
                 <p className="text-md font-medium text-white flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-500"/> {vehicle?.location_name || 'Coimbatore Branch'}</p>
               </div>
            </div>
          </div>

          {/* Right: Booking Form */}
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Reserve this vehicle
            </h2>

            <form onSubmit={handleBooking} className="space-y-6">
              
              <div className="space-y-4">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Customer Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                     <input type="text" required value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full h-12 bg-black/50 border border-white/10 rounded-xl px-4 text-white focus:border-white/30 outline-none" placeholder="John Doe" />
                   </div>
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                     <input type="tel" required value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} className="w-full h-12 bg-black/50 border border-white/10 rounded-xl px-4 text-white focus:border-white/30 outline-none" placeholder="+91 9876543210" />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                   <input type="email" required value={customerEmail} onChange={e=>setCustomerEmail(e.target.value)} className="w-full h-12 bg-black/50 border border-white/10 rounded-xl px-4 text-white focus:border-white/30 outline-none" placeholder="john@example.com" />
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Rental Details</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                     <input type="date" required value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full h-12 bg-black/50 border border-white/10 rounded-xl px-4 text-white focus:border-white/30 outline-none" />
                   </div>
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">End Date</label>
                     <input type="date" required value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full h-12 bg-black/50 border border-white/10 rounded-xl px-4 text-white focus:border-white/30 outline-none" />
                   </div>
                 </div>
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Mode</label>
                    <div className="grid grid-cols-2 gap-4">
                       <button type="button" onClick={() => setMode('self_drive')} className={`h-12 rounded-xl border font-medium transition-colors ${mode === 'self_drive' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'}`}>Self Drive</button>
                       <button type="button" onClick={() => setMode('with_driver')} className={`h-12 rounded-xl border font-medium transition-colors ${mode === 'with_driver' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'}`}>With Driver</button>
                    </div>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Payment</h3>
                 <div className="space-y-3">
                   <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'online' ? 'bg-primary/10 border-primary' : 'bg-black/50 border-white/5 hover:border-white/20'}`}>
                     <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="w-4 h-4 accent-primary" />
                     <CreditCard className="w-5 h-5 text-gray-300" />
                     <div className="flex-1">
                       <p className="font-medium text-white">Pay Online</p>
                       <p className="text-xs text-gray-400">Razorpay - Credit/Debit/UPI</p>
                     </div>
                   </label>
                   
                   <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'cash' ? 'bg-primary/10 border-primary' : 'bg-black/50 border-white/5 hover:border-white/20'}`}>
                     <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="w-4 h-4 accent-primary" />
                     <Banknote className="w-5 h-5 text-gray-300" />
                     <div className="flex-1">
                       <p className="font-medium text-white">Cash on Delivery / Walk-in</p>
                       <p className="text-xs text-gray-400">Pay when you pick up</p>
                     </div>
                   </label>
                 </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex justify-between items-end mb-6">
                  <p className="text-gray-400 text-sm">Total Amount ({calculateDays()} Days)</p>
                  <p className="text-3xl font-bold text-white">₹{totalAmount}</p>
                </div>
                
                <button type="submit" disabled={isProcessing} className="w-full h-14 rounded-xl bg-white text-black font-semibold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isProcessing ? 'Processing Order...' : `Pay ₹${totalAmount}`}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
