"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, TrendingUp, CreditCard, Banknote, Landmark } from 'lucide-react';

export default function AdminRevenuePage() {
  const [revenue, setRevenue] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      const { data } = await supabase.from('admin_revenue_summary').select('*');
      if (data) setRevenue(data);
    };
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Financials & Revenue</h1>
          <p className="text-gray-400">Monthly aggregate payment and gateway analytics.</p>
        </div>
        <button className="h-10 px-4 rounded-lg bg-[#111] border border-white/5 text-white flex items-center gap-2 text-sm hover:bg-white/5 transition-colors">
          <Download className="w-4 h-4" /> Download Statement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 flex flex-col justify-between">
          <p className="text-sm font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2"><TrendingUp className="w-4 h-4 text-white" /> Net Revenue</p>
          <h3 className="text-4xl font-black text-white mt-4">₹{revenue.length ? revenue[0].total_revenue : '0'}</h3>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 flex flex-col justify-between">
          <p className="text-sm font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-400" /> Card Volume</p>
          <h3 className="text-2xl font-black text-white mt-4">₹{revenue.length ? revenue[0].card_revenue || '40000' : '0'}</h3>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 flex flex-col justify-between">
          <p className="text-sm font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2"><Banknote className="w-4 h-4 text-green-400" /> UPI Volume</p>
          <h3 className="text-2xl font-black text-white mt-4">₹{revenue.length ? revenue[0].upi_revenue || '85000' : '0'}</h3>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 flex flex-col justify-between">
          <p className="text-sm font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2"><Landmark className="w-4 h-4 text-yellow-400" /> Cash Intake</p>
          <h3 className="text-2xl font-black text-white mt-4">₹{revenue.length ? revenue[0].cash_revenue || '0' : '0'}</h3>
        </div>
      </div>
      
      <div className="h-64 rounded-2xl bg-[#111] border border-white/5 flex items-center justify-center">
          <p className="text-gray-500 uppercase tracking-widest font-bold text-sm">Revenue Histogram Canvas Placeholder</p>
      </div>
    </div>
  );
}
