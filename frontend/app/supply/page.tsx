/*!
 * AgriKart — Available Demands page
 * Farmer-facing page that lists open / partially‑matched demands
 * so farmers can commit their supply.
 */
"use client";

import { useEffect, useState } from 'react'
import { getAvailableDemands } from '@/lib/api/supply'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'

export default function SupplyPage() {
  const [demands, setDemands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Fetch available demands when the page loads
    const loadDemands = async () => {
      setLoading(true)
      try {
        const data = await getAvailableDemands({})
        setDemands(data?.data ?? [])
        setError(null)
      } catch (e: any) {
        console.error('Failed to load available demands:', e)
        setError(e?.message || 'Unknown error')
        setDemands([])
      } finally {
        setLoading(false)
      }
    }

    loadDemands()
    // cleanup – optional: refetch if user returns to page
    return () => {}
  }, [])

  if (loading) {
    return <p>Loading available demands…</p>
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Error loading demands</h2>
        <p>{error}</p>
        <button
          onClick={() => router.push('/demands')}
          className="mt-4 inline-block btn-primary"
        >
          Go to Demands Board
        </button>
      </div>
    )
  }

  if (demands.length === 0) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">No open demands</h2>
        <p>
          There are currently no open demands available for commitment. Check
          back later or go to the <a href="/demands" className="underline">Demands Board</a>.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Available Demands</h2>
      <div className="space-y-4">
        {demands.map((d: any) => (
          <div
            key={d.id}
            className="p-4 border rounded-lg border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-lg">{d.crop_type?.toUpperCase()} — {d.required_quantity} MT</h3>
            <p className="text-sm text-gray-600">
              Buyer: {d.buyer?.full_name || 'Unknown'}
            </p>
            <p className="text-sm text-gray-500">
              Deadline: {d.required_by} │ Status:{' '}
              {d.status === 'open' ? (
                'Open'
              ) : d.status === 'partially_matched' ? (
                'Partially matched'
              ) : (
                d.status
              )}
            </p>
            <p className="text-sm text-gray-500">
              Matched: {d.matched_quantity ?? 0} / {d.required_quantity} MT{' '}
              ({d.fulfillment_percentage ?? 0}%)
            </p>
            <button
              onClick={() => router.push(`/demands/${d.id}`)}
              className="mt-2 text-blue-600 underline cursor-pointer"
            >
              View details
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}