'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Gift, Users, Wallet, MessageCircle, Link2 } from 'lucide-react';

interface ReferralSystemProps {
  referralCode: string;
  credits: number;
}

export default function ReferralSystem({ referralCode, credits }: ReferralSystemProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/?ref=${referralCode}` 
    : `https://ridecovai.com/?ref=${referralCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Hey! Join RideKovai and get ₹500 off your first car rental! 🚗\n\nUse my code: ${referralCode}\n\nSign up here: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareSMS = () => {
    const text = `Join RideKovai car rentals! Use code ${referralCode} for ₹500 off. ${referralLink}`;
    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 text-white">
      <h2 className="text-xl font-bold">Refer & Earn</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Your Credits</span>
            <Wallet className="w-8 h-8 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-500">₹{credits}</div>
          <p className="text-sm text-gray-400 mt-1">Available to use</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Friends Invited</span>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-3xl font-bold">0</div>
          <p className="text-sm text-gray-400 mt-1">Successful referrals</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Per Referral</span>
            <Gift className="w-8 h-8 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-500">₹500</div>
          <p className="text-sm text-gray-400 mt-1">You + Friend both get</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-red-900/20 to-red-600/10 border border-red-500/20 rounded-xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-red-500" /> Your Referral Code
        </h3>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 bg-black/50 border border-white/10 rounded-xl px-6 py-4">
            <p className="text-2xl font-bold tracking-wider">{referralCode}</p>
          </div>
          <button onClick={copyCode}
            className="px-6 py-4 bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 cursor-pointer">
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">Share via:</p>
        <div className="flex gap-3">
          <button onClick={shareWhatsApp}
            className="flex-1 py-3 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <MessageCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-400">WhatsApp</span>
          </button>
          <button onClick={shareSMS}
            className="flex-1 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <Link2 className="w-5 h-5 text-blue-500" />
            <span className="text-blue-400">SMS</span>
          </button>
        </div>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-xl p-6">
        <h3 className="font-bold mb-4">How it works</h3>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Share your code', desc: 'Send your unique code to friends via WhatsApp or SMS' },
            { step: '2', title: 'Friend signs up', desc: 'They create an account using your referral code' },
            { step: '3', title: 'Friend books a car', desc: 'They get ₹500 off their first booking' },
            { step: '4', title: 'You earn ₹500', desc: 'Credits added to your wallet automatically' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-500 font-bold text-sm">{item.step}</span>
              </div>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
