'use client'

import VendorDashboard from '@/components/vendor-dashboard'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VendorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (!loading && user && user.role !== 'vendor') {
      router.push('/products')
    }
  }, [user, loading, router])

  if (loading) return <div className="text-center py-20">Loading...</div>
  if (!user || user.role !== 'vendor') return null

  return <VendorDashboard />
}
