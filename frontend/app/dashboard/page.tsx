'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiLayers, FiTruck, FiCheckCircle, FiDollarSign, FiArrowRight, FiPlus } from 'react-icons/fi'
import { getDemands } from '@/lib/api/demands'
import { getMyCommitments } from '@/lib/api/supply'

function Stat({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [demands, setDemands] = useState<any[]>([])
  const [commitments, setCommitments] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const role = user?.role
  const isBuyer = role === 'buyer' || role === 'vendor'
  const isFarmer = role === 'farmer' || role === 'fpo_agent'
  const isAdmin = role === 'admin'

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/dashboard')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    setLoadingData(true)
    try {
      if (isBuyer) {
        const res = await getDemands({ buyer_id: user!.id })
        setDemands(res.data || [])
      } else if (isFarmer) {
        const data = await getMyCommitments(user!.id)
        setCommitments(data || [])
        const res = await getDemands()
        setDemands(res.data || [])
      } else {
        const res = await getDemands()
        setDemands(res.data || [])
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) return null

  const openDemands = demands.filter(d => d.status === 'open').length
  const matchedDemands = demands.filter(d => ['partially_matched', 'fully_matched'].includes(d.status)).length
  const deliveredDemands = demands.filter(d => d.status === 'delivered').length

  const roleLabels: Record<string, string> = {
    farmer: 'Farmer / FPO',
    buyer: 'Institutional Buyer',
    fpo_agent: 'FPO Field Agent',
    admin: 'Platform Admin',
    vendor: 'Buyer',
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-green-700">{roleLabels[role ?? 'farmer']} Dashboard</p>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Welcome, {user.full_name || 'User'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isBuyer ? 'Manage your demands, track fulfillment and settlements.' :
               isFarmer ? 'Browse demands, manage commitments and track payments.' :
               'Monitor platform activity, logistics and quality.'}
            </p>
          </div>
          {isBuyer && (
            <Link
              href="/demands/create"
              className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
            >
              <FiPlus size={16} /> Create Demand
            </Link>
          )}
          {isFarmer && (
            <Link
              href="/supply"
              className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
            >
              <FiLayers size={16} /> View Demands
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Open Demands" value={openDemands.toString()} icon={FiLayers} color="bg-blue-500" />
          <Stat label="Matched" value={matchedDemands.toString()} icon={FiCheckCircle} color="bg-green-500" />
          <Stat label="Delivered" value={deliveredDemands.toString()} icon={FiTruck} color="bg-emerald-500" />
          <Stat label={isBuyer ? 'Total Demands' : 'My Commitments'} value={isBuyer ? demands.length.toString() : commitments.length.toString()} icon={FiDollarSign} color="bg-amber-500" />
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Recent Demands</h2>
              <Link href="/demands" className="text-xs font-semibold text-green-600 hover:underline flex items-center gap-1">
                View All <FiArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {loadingData ? (
                <p className="text-sm text-gray-400 py-6 text-center">Loading...</p>
              ) : demands.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No demands yet</p>
              ) : (
                demands.slice(0, 5).map((d: any) => (
                  <Link key={d.id} href={`/demands/${d.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm capitalize truncate">{d.crop_type}</p>
                      <p className="text-xs text-gray-400">{d.required_quantity} MT · ₹{d.max_price_per_kg}/kg</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                      d.status === 'open' ? 'bg-blue-50 text-blue-700' :
                      d.status === 'fully_matched' ? 'bg-green-50 text-green-700' :
                      d.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {d.status?.replace('_', ' ')}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {isFarmer && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">My Commitments</h2>
                <Link href="/orders" className="text-xs font-semibold text-green-600 hover:underline flex items-center gap-1">
                  View All <FiArrowRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {commitments.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No active commitments</p>
                ) : (
                  commitments.slice(0, 5).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 text-sm capitalize truncate">{c.crop_type}</p>
                        <p className="text-xs text-gray-400">{c.available_quantity} MT · {c.quality_grade}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                        c.is_aggregated ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {c.is_aggregated ? 'Matched' : 'Available'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {(isBuyer || isAdmin) && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/demands/create" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-200 transition-colors">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><FiPlus className="text-green-600" /></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Create New Demand</p>
                    <p className="text-xs text-gray-400">Specify crop, quantity, quality and delivery</p>
                  </div>
                </Link>
                <Link href="/logistics" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FiTruck className="text-blue-600" /></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Logistics Overview</p>
                    <p className="text-xs text-gray-400">Track pickups and deliveries</p>
                  </div>
                </Link>
                <Link href="/quality" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-amber-50 hover:border-amber-200 transition-colors">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><FiCheckCircle className="text-amber-600" /></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Quality Dashboard</p>
                    <p className="text-xs text-gray-400">Review pending verifications</p>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
