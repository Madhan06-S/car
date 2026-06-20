'use client'

import { useAuth } from '@/components/providers'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { User } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

export default function HeaderAuth() {
  const { user } = useAuth()

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          <NotificationBell />
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            <User className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="text-sm text-gray-400 hidden md:block">{user.email}</span>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            Log Out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="text-sm hover:text-white transition-colors">Log in</Link>
          <Link href="/login" className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors">Sign up</Link>
        </>
      )}
    </div>
  )
}
