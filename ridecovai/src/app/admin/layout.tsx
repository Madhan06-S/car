"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LayoutDashboard, Users, Car, CalendarCheck, Settings, LogOut, TrendingUp, Search } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Check role
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || (data.role !== 'admin' && data.role !== 'owner')) {
        // Not admin, redirect
        router.push('/dashboard');
      } else {
        setIsAdmin(true);
      }
      setLoading(false);
    };
    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium tracking-wide">Authenticating clearance...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#050505] flex w-full">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col pb-6 overflow-y-auto">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <Link href="/admin" className="font-heading font-black text-2xl tracking-tighter text-white">
            RD<span className="text-gray-500">ADMIN</span>
          </Link>
        </div>
        
        <div className="px-6 py-4">
           <p className="text-xs uppercase font-bold tracking-widest text-gray-600 mb-4">Core</p>
           <nav className="space-y-1">
             <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white text-black font-semibold transition-colors">
               <LayoutDashboard className="w-4 h-4" /> Operations
             </Link>
             <Link href="/admin/bookings" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 font-medium hover:bg-[#111] hover:text-white transition-colors">
               <CalendarCheck className="w-4 h-4" /> Bookings
             </Link>
           </nav>
        </div>
        
        <div className="px-6 py-4">
           <p className="text-xs uppercase font-bold tracking-widest text-gray-600 mb-4">Management</p>
           <nav className="space-y-1">
             <Link href="/admin/fleet" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 font-medium hover:bg-[#111] hover:text-white transition-colors">
               <Car className="w-4 h-4" /> Vehicles
             </Link>
             <Link href="/admin/customers" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 font-medium hover:bg-[#111] hover:text-white transition-colors">
               <Users className="w-4 h-4" /> Users & Drivers
             </Link>
             <Link href="/admin/revenue" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 font-medium hover:bg-[#111] hover:text-white transition-colors">
               <TrendingUp className="w-4 h-4" /> Financials
             </Link>
           </nav>
        </div>
        
        <div className="px-6 py-4 mt-auto">
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 font-medium hover:bg-red-500/10 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" /> Exit Console
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
         <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
           {/* Global Search */}
           <div className="relative w-96 hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
              <input 
                type="text"
                placeholder="Search RC-Refs, Customers, License Plates..."
                className="w-full h-10 bg-[#111] border border-white/10 rounded-full pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all"
              />
           </div>
           
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold">
                A
              </div>
           </div>
         </header>
         
         <div className="flex-1 overflow-y-auto p-8 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_40%)] pointer-events-none"></div>
            <div className="relative z-10 max-w-7xl mx-auto">
              {children}
            </div>
         </div>
      </main>
    </div>
  );
}
