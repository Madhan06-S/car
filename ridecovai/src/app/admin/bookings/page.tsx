"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, MoreVertical, Calendar } from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data } = await supabase.from('admin_booking_summary').select('*').order('id', { ascending: false }).limit(50);
      if (data) setBookings(data);
    };
    fetchBookings();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Bookings Directory</h1>
          <p className="text-gray-400">View and manage all reservations across the fleet.</p>
        </div>
        <button className="h-10 px-4 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-colors">
          Export CSV
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by RC-Ref, Customer Name, or Phone..." 
            className="w-full h-10 bg-[#111] border border-white/5 rounded-lg pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/20"
          />
        </div>
        <button className="h-10 px-4 rounded-lg bg-[#111] border border-white/5 text-white flex items-center gap-2 text-sm hover:bg-white/5 transition-colors">
          <Filter className="w-4 h-4" /> Filter Status
        </button>
        <button className="h-10 px-4 rounded-lg bg-[#111] border border-white/5 text-white flex items-center gap-2 text-sm hover:bg-white/5 transition-colors">
          <Calendar className="w-4 h-4" /> Date Range
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111]">
                <th className="px-6 py-4 text-xs tracking-widest font-bold uppercase text-gray-600 border-b border-white/5 whitespace-nowrap">Rel Number</th>
                <th className="px-6 py-4 text-xs tracking-widest font-bold uppercase text-gray-600 border-b border-white/5">Customer Info</th>
                <th className="px-6 py-4 text-xs tracking-widest font-bold uppercase text-gray-600 border-b border-white/5">Vehicle Allocated</th>
                <th className="px-6 py-4 text-xs tracking-widest font-bold uppercase text-gray-600 border-b border-white/5">Status</th>
                <th className="px-6 py-4 text-xs tracking-widest font-bold uppercase text-gray-600 border-b border-white/5">Financials</th>
                <th className="px-6 py-4 border-b border-white/5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!bookings.length && (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">No bookings found.</td>
                 </tr>
              )}
              {bookings.map((b, idx) => (
                <tr key={idx} className="hover:bg-[#111] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-300">
                    {b.booking_ref}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{b.customer_name}</div>
                    <div className="text-xs text-gray-500 mt-1">{b.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-white uppercase tracking-wider">{b.vehicle_name}</div>
                    <div className="text-xs text-gray-500 mt-1">{b.rental_mode === 'self_drive' ? 'Self Drive' : 'Chauffeur Equipped'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${b.status === 'active' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : ''}
                      ${b.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : ''}
                      ${b.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : ''}
                      ${b.status === 'completed' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' : ''}
                    `}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-sm text-gray-300">
                    ₹{b.total_amount}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
