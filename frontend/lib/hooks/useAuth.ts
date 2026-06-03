import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string
  role: 'farmer' | 'vendor' | 'admin'
  verified: boolean
  created_at: string
}

export function useAuth() {
  const [user, setUser] = useState<(User & UserProfile) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Get current session
    const getSession = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Fetch profile from 'users' table
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (!error && profile) {
            setUser({ ...session.user, ...profile } as any)
          } else {
            setUser(session.user as any)
          }
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('Error fetching session:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setUser({ ...session.user, ...profile } as any)
        } catch (e) {
          setUser(session.user as any)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
