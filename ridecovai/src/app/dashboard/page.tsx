'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Car, Calendar, Clock, CreditCard, Shield, User, LogOut,
  Home, FileText, Settings, CheckCircle2, XCircle,
  Upload, AlertTriangle, MapPin, Wallet, Gift, Copy, Check
} from 'lucide-react';
import Image from 'next/image';
import NotificationBell from '@/components/NotificationBell';
import GoogleMapPickup from '@/components/GoogleMapPickup';
import ReferralSystem from '@/components/ReferralSystem';

interface Booking {
  id: string;
  vehicle_id: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  drop_location: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  vehicles: { name: string; category: string; images: string[] };
}

interface Profile {
  full_name: string;
  phone: string;
  role: string;
  driving_license: string | null;
  id_proof: string | null;
  kyc_status: string;
  email: string;
  referral_code: string;
  referral_credits: number;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'payments' | 'settings' | 'referrals'>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) { fetchBookings(); fetchProfile(); }
  }, [user]);

  async function fetchBookings() {
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('name, category, images');

      if (vehiclesError) console.error('Fetch vehicles error:', vehiclesError);

      if (bookingsData) {
        const mapped = bookingsData.map((booking: any) => {
          const vehicle = vehiclesData?.find((v: any) => {
            const slug = v.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
            return slug === booking.vehicle_id;
          });
          return {
            ...booking,
            vehicles: vehicle ? {
              name: vehicle.name,
              category: vehicle.category,
              images: vehicle.images || []
            } : {
              name: booking.vehicle_id ? booking.vehicle_id.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown Car',
              category: 'Car',
              images: []
            }
          };
        });
        setBookings(mapped as Booking[]);
      }
    } catch (err) {
      console.error('fetchBookings error:', err);
    }
  }

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
    if (data) {
      if (!data.referral_code) {
        const code = 'RC' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase.from('profiles').update({ referral_code: code }).eq('id', user?.id);
        data.referral_code = code;
      }
      setProfile({ ...data, email: user?.email || '' } as Profile);
    }
  }

  async function uploadDocument(type: 'driving_license' | 'id_proof', file: File) {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}_${type}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file, { upsert: true });
    if (uploadError) { alert('Upload failed: ' + uploadError.message); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
    await supabase.from('profiles').update({ [type]: publicUrl, kyc_status: 'pending' }).eq('id', user?.id);
    fetchProfile(); setUploading(false); alert('Uploaded! Awaiting verification.');
  }

  async function cancelBooking(bookingId: string) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    fetchBookings();
  }

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>;
  if (!user) return null;

  const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  const totalSpent = bookings.reduce((sum, b) => sum + (b.payment_status === 'paid' ? b.total_amount : 0), 0);
  const isKycVerified = profile?.kyc_status === 'verified';

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'payments', label: 'Payment History', icon: CreditCard },
    { id: 'referrals', label: 'Refer & Earn', icon: Gift },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userInitial = profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar - Only ONE sidebar */}
      <aside className="w-64 bg-[#111] border-r border-white/5 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="text-xl font-bold">
            <span className="text-red-500">Ride</span>Covai
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left cursor-pointer ${
                activeTab === item.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm font-bold">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'Driver'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors mt-2 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content - NO nested sidebar */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Fleet</Link>
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Corporate</Link>
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">About Us</Link>
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm text-gray-400">{user.email}</span>
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || 'Driver'}</h1>
            <p className="text-gray-400">Manage your seamless ride experiences from here.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm">Active Bookings</span>
                <Calendar className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-4xl font-bold">{upcoming.length}</div>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm">Past Trips</span>
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-4xl font-bold">{past.filter(b => b.status === 'completed').length}</div>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm">Total Spent</span>
                <Wallet className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-4xl font-bold">₹{totalSpent.toLocaleString()}</div>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm">Account Status</span>
                <Shield className="w-8 h-8 text-gray-600" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isKycVerified ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className={`font-bold ${isKycVerified ? 'text-green-500' : 'text-amber-500'}`}>
                  {isKycVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* KYC Warning */}
          {!isKycVerified && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 flex items-center gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-400">Complete KYC to unlock bookings</p>
                <p className="text-sm text-gray-400">Upload your driving license and ID proof to start renting cars.</p>
              </div>
              <button onClick={() => setActiveTab('settings')}
                className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm cursor-pointer">
                Complete Now
              </button>
            </motion.div>
          )}

          {/* Referral Banner */}
          <div className="bg-gradient-to-r from-red-900/20 to-red-600/10 border border-red-500/20 rounded-xl p-4 mb-8 flex items-center gap-4">
            <Gift className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-400">Earn ₹500 per referral!</p>
              <p className="text-sm text-gray-400">Share your code and get credits when friends book.</p>
            </div>
            <button onClick={() => setActiveTab('referrals')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm cursor-pointer">
              Invite Friends
            </button>
          </div>

          {/* TAB CONTENT */}
          
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              {bookings.length === 0 ? (
                <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No upcoming journeys</p>
                  <p className="text-gray-400 text-sm mb-6">Looks like you haven&apos;t booked anything yet.</p>
                  <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl transition-colors">
                    <Car className="w-5 h-5" /> Browse Fleet
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="bg-[#111] border border-white/5 rounded-xl p-6 flex items-center gap-6">
                      <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={booking.vehicles?.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db9?w=800'}
                          alt={booking.vehicles?.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{booking.vehicles?.name}</h3>
                        <p className="text-sm text-gray-400">{new Date(booking.pickup_date).toLocaleDateString()} → {new Date(booking.return_date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">{booking.pickup_location} → {booking.drop_location}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-500">₹{booking.total_amount?.toLocaleString()}</div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                          booking.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>{booking.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">My Bookings</h2>
              {bookings.map(booking => (
                <div key={booking.id} className="bg-[#111] border border-white/5 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-16 rounded-lg overflow-hidden">
                        <Image src={booking.vehicles?.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db9?w=800'}
                          alt={booking.vehicles?.name} fill className="object-cover" />
                      </div>
                      <div>
                        <h3 className="font-bold">{booking.vehicles?.name}</h3>
                        <p className="text-sm text-gray-400">{booking.vehicles?.category}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                      booking.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{booking.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div><p className="text-gray-400">Pickup</p><p>{new Date(booking.pickup_date).toLocaleDateString()}</p><p className="text-gray-500">{booking.pickup_location}</p></div>
                    <div><p className="text-gray-400">Return</p><p>{new Date(booking.return_date).toLocaleDateString()}</p><p className="text-gray-500">{booking.drop_location}</p></div>
                    <div><p className="text-gray-400">Amount</p><p className="font-bold text-red-500">₹{booking.total_amount?.toLocaleString()}</p><p className={`text-xs ${booking.payment_status === 'paid' ? 'text-green-400' : 'text-amber-400'}`}>{booking.payment_status}</p></div>
                  </div>
                  {booking.status === 'pending' && (
                    <button onClick={() => cancelBooking(booking.id)} className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer">
                      <XCircle className="w-4 h-4" /> Cancel Booking
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* PAYMENTS */}
          {activeTab === 'payments' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Payment History</h2>
              {bookings.filter(b => b.payment_status === 'paid').length === 0 ? (
                <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center">
                  <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No payment history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.filter(b => b.payment_status === 'paid').map(booking => (
                    <div key={booking.id} className="bg-[#111] border border-white/5 rounded-xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium">{booking.vehicles?.name}</p>
                          <p className="text-sm text-gray-400">{new Date(booking.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400">₹{booking.total_amount?.toLocaleString()}</div>
                        <p className="text-xs text-gray-500">Paid</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REFERRALS */}
          {activeTab === 'referrals' && profile && (
            <ReferralSystem referralCode={profile.referral_code} credits={profile.referral_credits || 0} />
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-xl font-bold">KYC Verification</h2>
              
              <div className="bg-[#111] border border-white/5 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-6 h-6 text-red-500" />
                  <div><h3 className="font-bold">Document Verification</h3><p className="text-sm text-gray-400">Required for booking vehicles</p></div>
                  <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                    isKycVerified ? 'bg-green-500/20 text-green-400' :
                    profile?.kyc_status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{profile?.kyc_status || 'Not Started'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <h4 className="font-medium">Driving License</h4>
                      {profile?.driving_license && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
                    </div>
                    {profile?.driving_license ? (
                      <div>
                        <a href={profile.driving_license} target="_blank" className="text-red-500 hover:text-red-400 text-sm underline">View Document</a>
                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uploaded</p>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-white/10 rounded-xl hover:border-red-500/50 transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-500" />
                        <span className="text-sm text-gray-400">Click to upload license</span>
                        <input type="file" accept="image/*,.pdf" className="hidden"
                          onChange={(e) => e.target.files?.[0] && uploadDocument('driving_license', e.target.files[0])} />
                      </label>
                    )}
                  </div>

                  <div className="border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-5 h-5 text-amber-500" />
                      <h4 className="font-medium">ID Proof (Aadhar/PAN)</h4>
                      {profile?.id_proof && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
                    </div>
                    {profile?.id_proof ? (
                      <div>
                        <a href={profile.id_proof} target="_blank" className="text-red-500 hover:text-red-400 text-sm underline">View Document</a>
                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uploaded</p>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-white/10 rounded-xl hover:border-red-500/50 transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-500" />
                        <span className="text-sm text-gray-400">Click to upload ID proof</span>
                        <input type="file" accept="image/*,.pdf" className="hidden"
                          onChange={(e) => e.target.files?.[0] && uploadDocument('id_proof', e.target.files[0])} />
                      </label>
                    )}
                  </div>
                </div>

                {uploading && <p className="text-sm text-amber-400 mt-4 flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" /> Uploading...</p>}
              </div>

              {/* Google Maps */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-red-500" /> Pickup Locations</h3>
                <GoogleMapPickup />
              </div>

              <div className="bg-[#111] border border-white/5 rounded-xl p-6">
                <h3 className="font-bold mb-4">Profile Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm text-gray-400">Full Name</label><div className="mt-1 bg-black/50 border border-white/5 rounded-lg px-4 py-3">{profile?.full_name || 'Not set'}</div></div>
                  <div><label className="text-sm text-gray-400">Phone</label><div className="mt-1 bg-black/50 border border-white/5 rounded-lg px-4 py-3">{profile?.phone || 'Not set'}</div></div>
                  <div><label className="text-sm text-gray-400">Email</label><div className="mt-1 bg-black/50 border border-white/5 rounded-lg px-4 py-3 text-gray-400">{user.email}</div></div>
                  <div><label className="text-sm text-gray-400">Role</label><div className="mt-1 bg-black/50 border border-white/5 rounded-lg px-4 py-3 capitalize">{profile?.role || 'Customer'}</div></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
