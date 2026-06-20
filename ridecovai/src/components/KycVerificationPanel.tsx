'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, CheckCircle2, XCircle, FileText } from 'lucide-react';

interface KycUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  kyc_status: string;
  driving_license: string | null;
  id_proof: string | null;
  kyc_verified_at: string | null;
  created_at: string;
}

export default function KycVerificationPanel() {
  const [users, setUsers] = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingKyc();
  }, []);

  async function fetchPendingKyc() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('kyc_status', ['pending', 'not_started'])
      .order('created_at', { ascending: false });

    if (data) setUsers(data as KycUser[]);
    setLoading(false);
  }

  async function verifyKyc(userId: string, approved: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (approved) {
      await supabase
        .from('profiles')
        .update({
          kyc_status: 'verified',
          kyc_verified_at: new Date().toISOString(),
          kyc_verified_by: user?.id
        })
        .eq('id', userId);

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'kyc',
        title: 'KYC Verified!',
        message: 'Your documents have been verified. You can now book vehicles.',
      });
    } else {
      await supabase
        .from('profiles')
        .update({ kyc_status: 'rejected' })
        .eq('id', userId);

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'kyc',
        title: 'KYC Rejected',
        message: 'Your documents were rejected. Please upload clearer copies.',
      });
    }

    fetchPendingKyc();
  }

  if (loading) return <div className="text-gray-400">Loading KYC requests...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Pending KYC Verifications ({users.length})
          </h3>
        </div>
        
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p>All KYC verifications are complete!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Documents</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="font-medium">{user.full_name || 'N/A'}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {user.driving_license && (
                          <a
                            href={user.driving_license}
                            target="_blank"
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            License
                          </a>
                        )}
                        {user.id_proof && (
                          <a
                            href={user.id_proof}
                            target="_blank"
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            ID Proof
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.kyc_status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {user.kyc_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => verifyKyc(user.id, true)}
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => verifyKyc(user.id, false)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
