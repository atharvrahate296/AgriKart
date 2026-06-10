'use client'

import { useState, useEffect } from 'react'
import { getSchemes, checkEligibility, applyForScheme } from '@/lib/api/schemes'
import { FiSearch, FiSliders, FiFileText, FiAward, FiCheckCircle } from 'react-icons/fi'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function SchemesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [schemes, setSchemes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [stateFilter, setStateFilter] = useState('')
  const [cropFilter, setCropFilter] = useState('')

  // Eligibility Calculator Inputs
  const [userState, setUserState] = useState('Maharashtra')
  const [userDistrict, setUserDistrict] = useState('')
  const [userLandSize, setUserLandSize] = useState(2.5)
  const [userIncome, setUserIncome] = useState(150000)
  const [userCrops, setUserCrops] = useState<string[]>([])
  const [eligibleSchemes, setEligibleSchemes] = useState<any[] | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/schemes')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }


  // Application Modal state
  const [appliedId, setAppliedId] = useState<string | null>(null)
  const [applyingSchemeId, setApplyingSchemeId] = useState<string | null>(null)

  useEffect(() => {
    loadSchemes()
  }, [stateFilter, cropFilter])

  const loadSchemes = async () => {
    setLoading(true)
    try {
      const res = await getSchemes({
        state: stateFilter || undefined,
        crop: cropFilter || undefined,
      })
      setSchemes(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEvaluating(true)
    setEligibleSchemes(null)
    try {
      const results = await checkEligibility({
        state: userState,
        district: userDistrict,
        land_size: userLandSize,
        annual_income: userIncome,
        primary_crops: userCrops,
      })
      setEligibleSchemes(results || [])
    } catch (err) {
      alert('Failed to evaluate eligibility')
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleApply = async (schemeId: string) => {
    setApplyingSchemeId(schemeId)
    try {
      await applyForScheme(schemeId, {
        land_size_at_application: userLandSize,
        income_at_application: userIncome,
        documents_submitted: [{ document_name: 'Land Registry Certificate', file_url: 'https://supabase.storage.url/land.pdf' }],
      })
      setAppliedId(schemeId)
    } catch (err) {
      alert('Failed to submit application')
    } finally {
      setApplyingSchemeId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">📋 Government Scheme Intelligence</h1>
      <p className="text-gray-600 mb-8">Discover, filter, check your eligibility and directly apply to government agricultural subsidies, benefits, and loans.</p>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Side: Eligibility Checker */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 lg:col-span-1 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiSliders /> Eligibility Calculator
          </h2>
          <form onSubmit={handleEvaluate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">State</label>
              <select
                value={userState}
                onChange={(e) => setUserState(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500"
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Punjab">Punjab</option>
                <option value="Gujarat">Gujarat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">District</label>
              <input
                type="text"
                value={userDistrict}
                onChange={(e) => setUserDistrict(e.target.value)}
                placeholder="e.g. Pune"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Land Size (Acres)</label>
              <input
                type="number"
                step="0.1"
                value={userLandSize}
                onChange={(e) => setUserLandSize(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Annual Income (INR)</label>
              <input
                type="number"
                value={userIncome}
                onChange={(e) => setUserIncome(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={isEvaluating}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              {isEvaluating ? 'Checking Eligibility...' : 'Check My Eligibility'}
            </button>
          </form>

          {/* Results display */}
          {eligibleSchemes !== null && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Eligible Subsidies Found ({eligibleSchemes.length})</h3>
              {eligibleSchemes.length > 0 ? (
                <div className="space-y-2">
                  {eligibleSchemes.map((item) => (
                    <div key={item.id} className="p-3 bg-green-50 rounded-lg border border-green-100 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-green-800">{item.name}</p>
                        <p className="text-[10px] text-green-600 font-mono">Agency: {item.agency}</p>
                      </div>
                      {appliedId === item.id ? (
                        <span className="text-xs font-semibold text-green-700 flex items-center gap-0.5">
                          <FiCheckCircle /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApply(item.id)}
                          disabled={applyingSchemeId === item.id}
                          className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold py-1.5 px-3 rounded"
                        >
                          {applyingSchemeId === item.id ? 'Applying...' : 'Apply'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No eligible schemes found for the entered details.</p>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Schemes Directory List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <FiSearch className="text-gray-400 self-center" />
              <input
                type="text"
                placeholder="Search schemes..."
                className="w-full text-sm border-none focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
              >
                <option value="">All States</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Punjab">Punjab</option>
              </select>
              <select
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value)}
                className="border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
              >
                <option value="">All Crops</option>
                <option value="rice">Rice</option>
                <option value="wheat">Wheat</option>
                <option value="potato">Potato</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading government schemes directory...</div>
          ) : schemes.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {schemes.map((s) => (
                <div key={s.id} className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-shadow">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800 text-lg leading-tight">{s.name}</h3>
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                        {s.subsidy_type || 'Subsidy'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mb-3">Agency: {s.agency}</p>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">{s.description}</p>
                  </div>

                  <div className="border-t border-gray-50 pt-3 flex justify-between items-center text-xs">
                    <span className="text-gray-500 flex items-center gap-1 font-semibold">
                      <FiFileText /> Docs Required: {s.required_documents?.length || 0}
                    </span>
                    <span className="text-red-500 font-bold">
                      Deadline: {s.deadline ? new Date(s.deadline).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-500">
              <FiAward className="text-4xl text-gray-300 mx-auto mb-2" />
              <p className="font-semibold">No Schemes Found</p>
              <p className="text-xs text-gray-400 mt-1">Try resetting filters or checking eligibility calculator.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
