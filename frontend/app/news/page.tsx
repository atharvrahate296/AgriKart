'use client'

import { useState, useEffect } from 'react'
import { getArticles, getAlerts } from '@/lib/api/news'
import { FiAlertTriangle, FiBookOpen, FiClock, FiMapPin } from 'react-icons/fi'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function NewsAlertsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [articles, setArticles] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/news')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadNewsData()
    }
  }, [user, activeCategory])

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
  const loadNewsData = async () => {
    setLoading(true)
    try {
      const artRes = await getArticles(activeCategory ? { category: activeCategory } : undefined)
      setArticles(artRes || [])
      const alertRes = await getAlerts()
      setAlerts(alertRes || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { id: '', name: 'All News' },
    { id: 'market', name: 'Market Updates' },
    { id: 'weather', name: 'Weather Alerts' },
    { id: 'pest', name: 'Pest Alert' },
    { id: 'government', name: 'Government News' }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">📰 Agri News & Alerts</h1>
      <p className="text-gray-600 mb-8">Stay updated with regional pest warning forecasts, market commodity price rates, and government bulletins.</p>

      {/* Emergency Alerts Banners */}
      {alerts.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
            <FiAlertTriangle className="text-red-500 animate-pulse" /> Critical Regional Alerts
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((al) => (
              <div
                key={al.id}
                className={`p-4 rounded-xl border flex gap-3 shadow-sm ${
                  al.severity === 'critical'
                    ? 'bg-red-50 border-red-200 text-red-950'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-950'
                }`}
              >
                <FiAlertTriangle className={`text-xl shrink-0 mt-0.5 ${al.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                <div>
                  <h4 className="font-bold text-sm">{al.title}</h4>
                  <p className="text-xs mt-1 text-gray-700 leading-normal">{al.message}</p>
                  <div className="flex gap-2 items-center mt-3 text-[10px] text-gray-500 font-semibold">
                    <span className="flex items-center gap-0.5"><FiMapPin /> {al.relevant_states?.join(', ') || 'National'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Categories Tab Bar & Article List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Categories */}
          <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-2 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`shrink-0 text-sm font-semibold pb-2 px-1 border-b-2 transition-colors ${
                  activeCategory === c.id
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading articles feed...</div>
          ) : articles.length > 0 ? (
            <div className="space-y-6">
              {articles.map((art) => (
                <div key={art.id} className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-lg transition-shadow">
                  {art.featured_image_url && (
                    <img
                      src={art.featured_image_url}
                      alt={art.title}
                      className="w-full md:w-48 h-32 object-cover rounded-xl shrink-0"
                    />
                  )}
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {art.category}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <FiClock /> {new Date(art.published_at || art.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 leading-snug mt-1 hover:text-green-600 cursor-pointer">
                        {art.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-2">{art.description}</p>
                    </div>

                    <div className="flex justify-between items-center mt-4 text-xs font-semibold text-gray-500">
                      <span>Source: {art.author_name || 'AgriKart Desk'}</span>
                      {art.source_url && (
                        <a
                          href={art.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline"
                        >
                          Read Original
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-500">
              <FiBookOpen className="text-4xl text-gray-300 mx-auto mb-2" />
              <p className="font-semibold">No News Articles Found</p>
              <p className="text-xs text-gray-400 mt-1">Check back later for agricultural updates.</p>
            </div>
          )}
        </div>

        {/* Right Side: Quick Info Widget */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-md">
            <h3 className="font-bold text-lg mb-2">🌿 Crop Care Guides</h3>
            <p className="text-xs leading-relaxed opacity-90 mb-4">Access curated recommendations, expert pest prevention forecasts, and sustainable irrigation guidelines to improve crop yield metrics.</p>
            <button
              onClick={() => window.location.href = '/disease/detect'}
              className="bg-white text-green-700 text-xs font-bold py-2.5 px-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Get Crop Diagnosis
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-base mb-3">Weather Pest Outlook</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-50 pb-2 text-xs">
                <span className="font-semibold text-gray-600">Late Blight Outlook</span>
                <span className="text-red-500 font-bold">High Risk</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 pb-2 text-xs">
                <span className="font-semibold text-gray-600">Stem Borer Warning</span>
                <span className="text-yellow-600 font-bold">Medium Risk</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-600">Rust Forecast</span>
                <span className="text-green-600 font-bold">Low Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
