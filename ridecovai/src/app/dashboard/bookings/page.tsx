"use client";

import { useEffect, useState } from 'react';
import { Calendar, Filter, MapPin, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data } = await supabase.from('admin_booking_summary').select('*');
      if (data) {
         // Filter by email in the frontend due to mock limitations, or display all if guest
         const myBookings = data.filter((b: any) => b.customer_email === session.user.email);
         // If no email mach, just show the first one or none for demo
         setBookings(myBookings.length > 0 ? myBookings : []);
      }
      setLoading(false);
    };
    fetchBookings();
  }, []);

  if (loading) return <div className="animate-pulse h-32 w-full bg-[#111] rounded-2xl"></div>;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-heading font-bold text-white mb-2">My Itineraries</h1>
           <p className="text-gray-400">View your upcoming and historical reservations.</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-[#111] rounded-2xl p-8 text-center mt-6">
           <p className="text-gray-400">No bookings found. <a href="/#fleet-section" className="text-white hover:underline">Book a car now.</a></p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
         {bookings.map((b, i) => (
             <div key={i} className="p-6 rounded-2xl bg-[#111] border border-white/5 hover:border-white/10 transition-colors flex flex-col group">
                 <div className="flex items-center justify-between mb-4">
                     <span className={`text-xs uppercase font-bold tracking-widest px-2 py-1 rounded ${b.status === 'confirmed' ? 'text-green-500 bg-green-500/10' : 'text-blue-500 bg-blue-500/10'}`}>{b.status}</span>
                     <span className="text-xs uppercase font-bold tracking-widest text-gray-500">Ref: {b.booking_ref}</span>
                 </div>
                 <h3 className="text-xl font-bold font-heading text-white">{b.vehicle_name}</h3>
                 <p className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-wide">{b.rental_mode?.replace('_', ' ')}</p>
                 
                 <div className="mt-8 flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                     <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Pick up</span>
                        <span className="text-sm font-bold text-white flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-400" /> {b.start_date || 'N/A'}</span>
                     </div>
                     <div className="flex flex-col text-right">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Return</span>
                        <span className="text-sm font-bold text-white flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-400" /> {b.end_date || 'N/A'}</span>
                     </div>
                 </div>

                 <div className="mt-auto pt-6 flex justify-between items-center">
                    <span className="text-xl font-bold font-mono">₹{b.total_amount}</span>
                    <button className="h-10 px-6 rounded bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors">Manage Route</button>
                 </div>
             </div>
         ))}
      </div>
      )}
    </div>
  );
}
