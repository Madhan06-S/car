"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, MapPin, Navigation, Compass, Crosshair } from 'lucide-react';
import Image from 'next/image';

export default function AdminFleetPage() {
  const [vehicles, setVehicles] = useState<any[]>([
    { id: 1, name: 'BMW 5 Series', category: 'luxury', registration_no: 'TN33GH3456', status: 'On Trip', img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800' },
    { id: 2, name: 'Toyota Innova Crysta', category: 'muv', registration_no: 'TN33EF9012', status: 'Available', img: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800' },
    { id: 3, name: 'Honda City', category: 'sedan', registration_no: 'TN33CD5678', status: 'Available', img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800' },
    { id: 4, name: 'Maruti Swift', category: 'hatchback', registration_no: 'TN33AB1234', status: 'Maintenance', img: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800' },
  ]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Fleet Management</h1>
          <p className="text-gray-400">Track and manage your entire garage inventory.</p>
        </div>
        <button className="h-10 px-4 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      <div className="relative w-full max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input 
          type="text" 
          placeholder="Search by model, registration plate..." 
          className="w-full h-10 bg-[#111] border border-white/5 rounded-lg pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/20"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {vehicles.map((v) => (
          <div key={v.id} className="rounded-2xl border border-white/5 bg-[#0a0a0a] overflow-hidden group hover:border-white/10 transition-colors flex flex-col">
             <div className="relative h-48 w-full bg-[#111] overflow-hidden">
                <Image src={v.img} alt={v.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-md ${v.status === 'Available' ? 'bg-green-500/80 text-white' : v.status === 'On Trip' ? 'bg-blue-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                    {v.status}
                  </span>
                </div>
             </div>
             <div className="p-5 flex-1 flex flex-col">
                <span className="text-xs tracking-widest text-gray-500 uppercase font-bold mb-1">{v.category}</span>
                <h3 className="text-lg font-bold text-white font-heading">{v.name}</h3>
                <div className="mt-2 inline-flex items-center px-2 py-1 bg-white/5 border border-white/10 rounded-md">
                   <span className="font-mono text-xs font-bold text-gray-300 tracking-wider uppercase">{v.registration_no}</span>
                </div>
                
                <div className="mt-auto pt-6 flex justify-between gap-2">
                   <button className="flex-1 h-9 rounded bg-[#111] border border-white/5 text-gray-400 text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-1">
                     <Crosshair className="w-3 h-3" /> GPS
                   </button>
                   <button className="flex-1 h-9 rounded bg-[#111] border border-white/5 text-gray-400 text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-1">
                     Edit Settings
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
