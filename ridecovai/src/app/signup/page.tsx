"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, Lock, User, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Auth metadata includes full name for the Supabase trigger HandleNewUser
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          }
        }
      });
      
      if (signupError) {
        throw signupError;
      } else if (data.user) {
        setSuccess(true);
        // Next JS router or a generic message depending on email confirmation reqs
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        setError('Connection Failed: Please make sure you have added your Supabase URL and Anon Key to your .env.local file and restarted the server.');
      } else {
        setError(err.message || 'An unexpected error occurred during signup.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex w-full items-center justify-center bg-transparent p-4">
         <div className="w-full max-w-md p-8 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-center animate-fade-in-up shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white mb-4">Registration Complete</h2>
            <p className="text-gray-400 mb-8">Please check your email {email} to verify your account and join the luxury fleet.</p>
            <Link href="/login" className="h-12 w-full rounded-xl bg-white text-black font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
              Proceed to Sign In <ArrowRight className="w-4 h-4" />
            </Link>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-lg p-8 md:p-10 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 animate-fade-in-up shadow-2xl">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block mb-8">
            <span className="font-heading font-bold text-3xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-gray-500">
              RideCovai
            </span>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Join the Club</h1>
          <p className="text-gray-400 text-sm">Experience premium drives anywhere.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-white ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe" 
                required
                className="w-full h-14 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white ml-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210" 
                  required
                  className="w-full h-14 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium"
                />
              </div>
            </div>
             
            <div className="space-y-2">
              <label className="text-sm font-medium text-white ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                  required
                  className="w-full h-14 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                minLength={6}
                className="w-full h-14 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 mt-8 rounded-xl bg-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group shadow-lg shadow-primary/20"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:underline font-medium ml-1">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
