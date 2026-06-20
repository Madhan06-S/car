"use client";

import { Users, MoreVertical, Search, ShieldCheck } from 'lucide-react';

export default function AdminCustomersPage() {
  const users = [
    { pId: 'USR-2026-991', name: 'System Admin', email: 'admin@ridecovai.com', role: 'admin', phone: '-', status: 'Verified' },
    { pId: 'USR-2026-992', name: 'Jonathan Doe', email: 'client@company.com', role: 'customer', phone: '+91 91234 56789', status: 'KYC Pending' },
    { pId: 'USR-2026-993', name: 'Ananya Sharma', email: 'ananya@example.com', role: 'customer', phone: '+91 98765 43210', status: 'Verified' },
    { pId: 'USR-2026-994', name: 'Rahul Verma', email: 'rahul.v@example.com', role: 'driver', phone: '+91 87654 32109', status: 'Verification Failed' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">User Registry</h1>
          <p className="text-gray-400">Manage customers, drivers, and platform operators.</p>
        </div>
      </div>

      <div className="relative w-full max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input 
          type="text" 
          placeholder="Search by name, email, or ID..." 
          className="w-full h-10 bg-[#111] border border-white/5 rounded-lg pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/20"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111]">
                <th className="px-6 py-4 text-xs tracking-widest font-bold uppercase text-gray-600 border-b border-white/5 whitespace-nowrap">Profile ID</th>
                <th className="px-6 py-4 text-xs tracking-widest font-bold uppercase text-gray-600 border-b border-white/5">User Info</th>
                <th className="px-6 py-4 text-xs tracking-widest font-bold uppercase text-gray-600 border-b border-white/5">Role</th>
                <th className="px-6 py-4 text-xs tracking-widest font-bold uppercase text-gray-600 border-b border-white/5">Status</th>
                <th className="px-6 py-4 border-b border-white/5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u, idx) => (
                <tr key={idx} className="hover:bg-[#111] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">
                    {u.pId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                       {u.name}
                       {u.status === 'Verified' && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{u.email} &bull; {u.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded border text-xs font-bold uppercase tracking-wider
                      ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                      u.role === 'driver' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                      'bg-gray-500/10 text-gray-400 border-gray-500/20'}
                    `}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs font-semibold
                      ${u.status.includes('Verified') ? 'text-green-500' : 
                        u.status.includes('Failed') ? 'text-red-500' : 
                      'text-yellow-500'}
                    `}>
                      {u.status}
                    </span>
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
