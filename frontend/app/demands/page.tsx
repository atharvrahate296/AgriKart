'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { FiPlus, FiFilter, FiArrowRight } from 'react-icons/fi'
import { getDemands } from '@/lib/api/demands'

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  open: { label: 'Open', bg: 'bg-blue-50', text: 'text-blue-700' },
  partially_matched: { label: 'Partially Matched', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  fully_matched: { label: 'Fully Matched', bg: 'bg-green-50', text: 'text-green-700' },
  delivered: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-500' },
}

export default function DemandsPage() {
  const { user } = useAuth()
  const [demands, setDemands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const isBuyer = user?.role === 'buyer' || user?.role === 'vendor'

  useEffect(() => {
    loadDemands()
  }, [filter, user])

  const loadDemands = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filter) params.status = filter
      if (isBuyer && user) params.buyer_id = user.id
      const res = await getDemands(params)
      setDemands(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statuses = ['', 'open', 'partially_matched', 'fully_matched', 'delivered']

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              {isBuyer ? 'My Demands' : 'Demand Board'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isBuyer ? 'Track your demand requirements and fulfillment status.' : 'Browse active demand requirements from institutional buyers.'}
            </p>
          </div>
          {isBuyer && (
            <Link
              href="/demands/create"
              className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
            >
              <FiPlus size={16} /> New Demand
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <FiFilter className="text-gray-400 shrink-0" />
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                filter === s
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700'
              }`}
            >
              {s === '' ? 'All' : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>

        {/* Demand Cards */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
            Loading demands...
          </div>
        ) : demands.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Demands Found</h3>
            <p className="text-gray-400 text-sm">
              {isBuyer ? "Create your first demand to get started." : "Check back later for new requirements."}
            </p>
            {isBuyer && (
              <Link href="/demands/create" className="inline-flex items-center gap-2 mt-4 text-green-600 font-semibold text-sm hover:underline">
                <FiPlus size={14} /> Create Demand
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demands.map((d: any) => {
              const status = statusConfig[d.status] ?? statusConfig.open
              return (
                <Link
                  key={d.id}
                  href={`/demands/${d.id}`}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-green-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xl mr-2">🌾</span>
                      <span className="font-bold text-gray-900 capitalize text-lg">{d.crop_type}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                    <div>
                      <p className="text-gray-400 text-xs">Quantity</p>
                      <p className="font-semibold text-gray-800">{d.required_quantity} MT</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Max Price</p>
                      <p className="font-semibold text-gray-800">₹{d.max_price_per_kg}/kg</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Min Quality</p>
                      <p className="font-semibold text-gray-800">{d.min_quality_grade || 'B'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Required By</p>
                      <p className="font-semibold text-gray-800">{new Date(d.required_by).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Fulfillment Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 font-medium">Fulfillment</span>
                      <span className="font-bold text-gray-700">{d.fulfillment_percentage ?? 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(d.fulfillment_percentage ?? 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Buyer Info */}
                  {d.buyer && (
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <span className="text-xs text-gray-400">
                        {isBuyer ? d.delivery_address || 'Delivery TBD' : `Buyer: ${d.buyer.full_name}`}
                      </span>
                      <FiArrowRight size={14} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
