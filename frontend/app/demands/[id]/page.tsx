'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiPlay, FiCheck, FiMapPin, FiUser, FiTruck } from 'react-icons/fi'
import { getDemandById, matchDemand, confirmDemand } from '@/lib/api/demands'
import { useAuth } from '@/lib/hooks/useAuth'

export default function DemandDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [demand, setDemand] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')

  const isBuyer = user?.id === demand?.buyer_profile_id

  useEffect(() => {
    loadDemand()
  }, [id])

  const loadDemand = async () => {
    setLoading(true)
    try {
      const data = await getDemandById(id)
      setDemand(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMatch = async () => {
    setActionLoading(true)
    setMessage('')
    try {
      const result = await matchDemand(id)
      setMessage(`Matched ${result.fulfillment_percentage}% of demand (${result.matches?.length ?? 0} FPOs)`)
      loadDemand()
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirm = async () => {
    setActionLoading(true)
    try {
      await confirmDemand(id)
      setMessage('Order confirmed! Logistics and escrow will be triggered.')
      loadDemand()
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!demand) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-3">🔍</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Demand Not Found</h2>
          <Link href="/demands" className="text-green-600 text-sm font-semibold hover:underline">← Back to Demands</Link>
        </div>
      </div>
    )
  }

  const groups = demand.fulfillment_groups ?? []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/demands" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
          <FiArrowLeft size={14} /> Back to Demands
        </Link>

        {/* Demand Header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌾</span>
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 capitalize">{demand.crop_type}</h1>
                  <p className="text-sm text-gray-500">Demand #{demand.id.slice(0, 8)}</p>
                </div>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase ${
              demand.status === 'open' ? 'bg-blue-50 text-blue-700' :
              demand.status === 'fully_matched' ? 'bg-green-50 text-green-700' :
              demand.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
              'bg-yellow-50 text-yellow-700'
            }`}>
              {demand.status?.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Quantity Required</p>
              <p className="font-bold text-gray-800">{demand.required_quantity} MT</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Max Price</p>
              <p className="font-bold text-gray-800">₹{demand.max_price_per_kg}/kg</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Min Quality</p>
              <p className="font-bold text-gray-800">{demand.min_quality_grade || 'B'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Required By</p>
              <p className="font-bold text-gray-800">{new Date(demand.required_by).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* Fulfillment Progress */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium">Fulfillment Progress</span>
              <span className="font-bold text-gray-700">{demand.fulfillment_percentage ?? 0}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(demand.fulfillment_percentage ?? 0, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {demand.matched_quantity ?? 0} / {demand.required_quantity} MT matched
            </p>
          </div>

          {/* Buyer Actions */}
          {isBuyer && demand.status === 'open' && (
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleMatch}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <FiPlay size={16} /> {actionLoading ? 'Matching...' : 'Find FPOs'}
              </button>
            </div>
          )}

          {isBuyer && ['partially_matched', 'fully_matched'].includes(demand.status) && groups.length > 0 && (
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <FiCheck size={16} /> {actionLoading ? 'Confirming...' : 'Confirm Order'}
              </button>
              <button
                onClick={handleMatch}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 bg-white text-blue-600 border border-blue-200 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                Re-match
              </button>
            </div>
          )}

          {message && (
            <div className={`mt-4 px-4 py-3 rounded-xl text-sm ${
              message.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Matched FPOs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <FiUser className="text-green-600" /> Matched FPOs ({groups.length})
          </h2>
          {groups.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">
              No FPOs matched yet. {isBuyer ? 'Click "Find FPOs" to start the matching algorithm.' : 'The buyer will trigger matching.'}
            </p>
          ) : (
            <div className="space-y-3">
              {groups.map((g: any, idx: number) => {
                const yield_ = g.fpo_yield
                const fpo = yield_?.fpo
                const audit = yield_?.audit?.[0]
                return (
                  <div key={g.id ?? idx} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-gray-800">{fpo?.full_name ?? 'FPO'}</span>
                          {audit?.is_certified && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                              ✓ Certified {audit.overall_grade}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Allocated</span>
                            <span className="ml-1 font-semibold text-gray-700">{g.allocated_quantity} MT</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Price</span>
                            <span className="ml-1 font-semibold text-gray-700">₹{g.agreed_price_per_kg}/kg</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiMapPin size={10} className="text-gray-400" />
                            <span className="text-gray-600">{yield_?.location_name ?? fpo?.location ?? '—'}</span>
                          </div>
                          {g.distance_km && (
                            <div className="flex items-center gap-1">
                              <FiTruck size={10} className="text-gray-400" />
                              <span className="text-gray-600">{g.distance_km} km</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        g.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {g.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
