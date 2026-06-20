'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Car, Users, Calendar, CreditCard, TrendingUp, 
  ArrowLeft, CheckCircle2, XCircle, Clock, MapPin,
  DollarSign, BarChart3, Search, Download,
  Shield, AlertTriangle, Star, Package
} from 'lucide-react';
import Image from 'next/image';
import KycVerificationPanel from '@/components/KycVerificationPanel';


interface Booking {
  id: string;
  user_id: string;
  vehicle_id: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  drop_location: string;
  total_amount: number;
  advance_amount: number;
  payment_mode: string;
  status: string;
  payment_status: string;
  created_at: string;
  paid_at: string | null;
  profiles: { full_name: string; email: string; phone: string };
}

interface Vehicle {
  id: string;
  name: string;
  category: string;
  price_per_day: number;
  status: string;
  images: string[];
  bookings_count: number;
}

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalUsers: number;
  totalVehicles: number;
}

// ADMIN BYPASS EMAILS - For easy testing
const ADMIN_BYPASS_EMAILS = ['smk312111@gmail.com'];

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'vehicles' | 'users' | 'kyc'>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalUsers: 0,
    totalVehicles: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      checkAdmin();
    }
  }, [user, loading, router]);

  async function checkAdmin() {
    // BYPASS: Check if email is in bypass list
    if (user?.email && ADMIN_BYPASS_EMAILS.includes(user.email)) {
      setIsAdmin(true);
      fetchDashboardData();
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/');
    } else {
      setIsAdmin(true);
      fetchDashboardData();
    }
  }

  async function fetchDashboardData() {
    setDataLoading(true);

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles (full_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (bookingsData) setBookings(bookingsData as Booking[]);

    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (vehiclesData) {
      const vehiclesWithCounts = await Promise.all(
        vehiclesData.map(async (v) => {
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('vehicle_id', v.id)
            .neq('status', 'cancelled');
          return { ...v, bookings_count: count || 0 };
        })
      );
      setVehicles(vehiclesWithCounts);
    }

    const totalBookings = bookingsData?.length || 0;
    const totalRevenue = bookingsData?.reduce((sum, b) => sum + (b.payment_status === 'paid' ? b.total_amount : 0), 0) || 0;
    const pendingBookings = bookingsData?.filter(b => b.status === 'pending').length || 0;
    const confirmedBookings = bookingsData?.filter(b => b.status === 'confirmed').length || 0;
    const completedBookings = bookingsData?.filter(b => b.status === 'completed').length || 0;
    const cancelledBookings = bookingsData?.filter(b => b.status === 'cancelled').length || 0;

    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    setStats({
      totalBookings,
      totalRevenue,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalUsers: userCount || 0,
      totalVehicles: vehiclesData?.length || 0,
    });

    setDataLoading(false);
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (!error) {
      fetchDashboardData();
    }
  }

  async function updateVehicleStatus(vehicleId: string, status: string) {
    const { error } = await supabase
      .from('vehicles')
      .update({ status })
      .eq('id', vehicleId);

    if (!error) {
      fetchDashboardData();
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.vehicle_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = new Date(booking.created_at).toDateString() === new Date().toDateString();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(booking.created_at) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(booking.created_at) >= monthAgo;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Customer', 'Email', 'Vehicle', 'Pickup', 'Return', 'Amount', 'Status', 'Payment', 'Date'];
    const rows = filteredBookings.map(b => [
      b.id,
      b.profiles?.full_name || 'N/A',
      b.profiles?.email || 'N/A',
      b.vehicle_id,
      new Date(b.pickup_date).toLocaleDateString(),
      new Date(b.return_date).toLocaleDateString(),
      b.total_amount,
      b.status,
      b.payment_status,
      new Date(b.created_at).toLocaleDateString(),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="text-xl font-bold">
              <span className="text-red-500">Admin</span>Panel
            </div>
            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
              SUPER USER
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8 border-b border-white/10">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'bookings', label: 'Bookings', icon: Calendar },
            { id: 'vehicles', label: 'Vehicles', icon: Car },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'kyc', label: 'KYC Verification', icon: Shield },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="w-8 h-8 text-red-500" />
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">+12% this week</span>
                </div>
                <div className="text-3xl font-bold">{stats.totalBookings}</div>
                <div className="text-sm text-gray-400">Total Bookings</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">+8% this month</span>
                </div>
                <div className="text-3xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Revenue</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-500" />
                  <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">+5 new today</span>
                </div>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <Car className="w-8 h-8 text-amber-500" />
                  <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">{stats.totalVehicles} active</span>
                </div>
                <div className="text-3xl font-bold">{stats.totalVehicles}</div>
                <div className="text-sm text-gray-400">Total Vehicles</div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-amber-500" />
                  <span className="text-2xl font-bold">{stats.pendingBookings}</span>
                </div>
                <p className="text-amber-400">Pending Bookings</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <span className="text-2xl font-bold">{stats.confirmedBookings}</span>
                </div>
                <p className="text-green-400">Confirmed Bookings</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span className="text-2xl font-bold">{stats.cancelledBookings}</span>
                </div>
                <p className="text-red-400">Cancelled Bookings</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-bold">Recent Bookings</h3>
                <button onClick={() => setActiveTab('bookings')} className="text-sm text-red-500 hover:text-red-400">
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr className="text-left text-sm text-gray-400">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Vehicle</th>
                      <th className="px-6 py-4">Dates</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {bookings.slice(0, 5).map(booking => (
                      <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium">{booking.profiles?.full_name || 'N/A'}</div>
                          <div className="text-sm text-gray-400">{booking.profiles?.email}</div>
                        </td>
                        <td className="px-6 py-4">{booking.vehicle_id}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm">{new Date(booking.pickup_date).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-400">to {new Date(booking.return_date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 font-medium">₹{booking.total_amount?.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            booking.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                            booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bookings..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr className="text-left text-sm text-gray-400">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Vehicle</th>
                      <th className="px-6 py-4">Pickup/Drop</th>
                      <th className="px-6 py-4">Dates</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredBookings.map(booking => (
                      <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono">{booking.id.slice(0, 8)}...</td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{booking.profiles?.full_name || 'N/A'}</div>
                          <div className="text-sm text-gray-400">{booking.profiles?.email}</div>
                          <div className="text-sm text-gray-500">{booking.profiles?.phone}</div>
                        </td>
                        <td className="px-6 py-4">{booking.vehicle_id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-red-500" />
                            {booking.pickup_location}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <MapPin className="w-3 h-3 text-amber-500" />
                            {booking.drop_location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">{new Date(booking.pickup_date).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-400">{new Date(booking.return_date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">₹{booking.total_amount?.toLocaleString()}</div>
                          <div className="text-sm text-gray-400">{booking.payment_mode === 'advance' ? '30% advance' : 'Full payment'}</div>
                          <div className={`text-xs ${booking.payment_status === 'paid' ? 'text-green-400' : 'text-amber-400'}`}>
                            {booking.payment_status}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            booking.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                            booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                  className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                  title="Confirm"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                  title="Cancel"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'completed')}
                                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                title="Mark Complete"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredBookings.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  No bookings found matching your criteria
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map(vehicle => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                >
                  <div className="relative h-48">
                    <Image
                      src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db9?w=800'}
                      alt={vehicle.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        vehicle.status === 'available' ? 'bg-green-500/20 text-green-400' :
                        vehicle.status === 'booked' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {vehicle.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2">{vehicle.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{vehicle.category}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-red-500">₹{vehicle.price_per_day?.toLocaleString()}</span>
                      <span className="text-sm text-gray-400">/day</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {vehicle.bookings_count} bookings
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateVehicleStatus(vehicle.id, vehicle.status === 'available' ? 'maintenance' : 'available')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          vehicle.status === 'available'
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                      >
                        {vehicle.status === 'available' ? 'Mark Maintenance' : 'Mark Available'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold">All Users</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr className="text-left text-sm text-gray-400">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4">KYC Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {bookings.reduce((users: any[], booking) => {
                    if (!users.find(u => u.id === booking.user_id)) {
                      users.push({
                        id: booking.user_id,
                        ...booking.profiles,
                        created_at: booking.created_at,
                      });
                    }
                    return users;
                  }, []).map((user: any) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium">{user.full_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{user.phone || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {user.role || 'customer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm text-amber-400">
                          <AlertTriangle className="w-4 h-4" />
                          Pending
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'kyc' && <KycVerificationPanel />}
      </div>
    </div>
  );
}
