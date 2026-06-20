"use client";

import { Save } from 'lucide-react';

export default function CustomerSettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-heading font-bold text-white mb-2">Account Configuration</h1>
           <p className="text-gray-400">Manage your profile, preferences, and verified documents.</p>
        </div>
      </div>

      <div className="max-w-3xl mt-6 space-y-8">
         <div className="p-8 rounded-2xl bg-[#0a0a0a] border border-white/5 space-y-6">
            <h3 className="text-lg font-heading font-bold text-white uppercase tracking-widest">Personal Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Full Legal Name</label>
                  <input type="text" defaultValue="Jonathan Doe" className="w-full h-12 bg-[#111] border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-white/30" />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Contact Number</label>
                  <input type="tel" defaultValue="+91 91234 56789" className="w-full h-12 bg-[#111] border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-white/30" />
               </div>
               <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Email Address (Read-only)</label>
                  <input type="email" defaultValue="client@company.com" disabled className="w-full h-12 bg-[#050505] border border-transparent rounded-lg px-4 text-sm text-gray-500 cursor-not-allowed" />
               </div>
            </div>
         </div>

         <div className="p-8 rounded-2xl bg-[#0a0a0a] border border-white/5 space-y-6">
            <h3 className="text-lg font-heading font-bold text-white uppercase tracking-widest">KYC Documents</h3>
            <div className="p-6 rounded-xl border border-white/5 border-dashed bg-[#111] flex flex-col items-center justify-center text-center">
               <p className="text-sm text-gray-400 font-medium mb-4">Upload your Driver's License or Government ID to accelerate your key handover process.</p>
               <button className="h-10 px-6 rounded-lg bg-white/10 text-white text-sm font-bold uppercase tracking-wider hover:bg-white/20 transition-colors">Select Scan or Image</button>
            </div>
         </div>

         <div className="flex justify-end pt-4 border-t border-white/10">
            <button className="h-12 px-8 rounded-xl bg-white text-black font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors group">
               <Save className="w-4 h-4 text-black group-hover:scale-110 transition-transform" /> Save Configurations
            </button>
         </div>
      </div>
    </div>
  );
}
