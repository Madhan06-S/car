"use client";

import { CreditCard, Landmark, Receipt, CircleDollarSign } from 'lucide-react';

export default function CustomerPaymentsPage() {
  const transactions = [
    { date: 'Apr 08, 2026', desc: 'Advance Payment - BMW 5 Series', meth: 'UPI', status: 'Success', amt: '14500.00' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-heading font-bold text-white mb-2">Billing & Payments</h1>
           <p className="text-gray-400">Manage security deposits, saved cards, and download invoices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xl font-heading font-bold text-white tracking-wide">Transaction History</h3>
           <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-[#111]">
                 <tr>
                   <th className="px-6 py-4 text-xs tracking-widest font-bold uppercase text-gray-600 border-b border-white/5">Date</th>
                   <th className="px-6 py-4 text-xs tracking-widest font-bold uppercase text-gray-600 border-b border-white/5">Description</th>
                   <th className="px-6 py-4 text-xs tracking-widest font-bold uppercase text-gray-600 border-b border-white/5">Amount</th>
                   <th className="px-6 py-4 border-b border-white/5"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {transactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4 text-sm text-gray-400 font-mono">{tx.date}</td>
                       <td className="px-6 py-4">
                         <div className="text-sm font-bold text-white">{tx.desc}</div>
                         <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{tx.meth} &bull; <span className="text-green-500">{tx.status}</span></div>
                       </td>
                       <td className="px-6 py-4 font-mono text-white text-sm">₹{tx.amt}</td>
                       <td className="px-6 py-4 text-right">
                         <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#111] hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors">
                           <Receipt className="w-3 h-3" /> Invoice
                         </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>
        </div>
        
        <div className="space-y-6">
           <h3 className="text-xl font-heading font-bold text-white tracking-wide">Payment Methods</h3>
           <div className="p-6 rounded-2xl bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 flex items-center justify-between">
              <div className="flex gap-4 items-center">
                 <div className="w-12 h-8 bg-white rounded flex items-center justify-center border border-gray-300">
                    <span className="text-black font-black italic tracking-tighter text-sm">VISA</span>
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white tracking-widest">&bull;&bull;&bull;&bull; 4242</h4>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Expires 12/28</p>
                 </div>
              </div>
              <button className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Edit</button>
           </div>
           <button className="w-full h-12 rounded-xl border border-white/10 border-dashed text-gray-400 font-bold uppercase tracking-widest text-xs hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-2">
              <CircleDollarSign className="w-4 h-4" /> Add Payment Method
           </button>
        </div>
      </div>
    </div>
  );
}
