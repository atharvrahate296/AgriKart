'use client'

import { useState, useEffect } from 'react'
import { predictDisease, submitFeedback } from '@/lib/api/disease'
import { FiUpload, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function DiseaseDetectPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [cropHint, setCropHint] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [prediction, setPrediction] = useState<any>(null)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/disease/detect')
    }
  }, [user, loading, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      // Generate preview
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) return

    setIsLoading(true)
    setPrediction(null)
    setFeedbackSuccess(false)

    try {
      const data = await predictDisease(imageFile, cropHint || undefined)
      setPrediction(data)
    } catch (err: any) {
      alert(err.message || 'Diagnosis failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedback = async (type: 'correct' | 'incorrect') => {
    if (!prediction) return
    try {
      await submitFeedback(prediction.id, type)
      setFeedbackSuccess(true)
    } catch (err: any) {
      alert('Failed to submit feedback')
    }
  }

  const resetForm = () => {
    setImageFile(null)
    setImagePreview(null)
    setCropHint('')
    setPrediction(null)
    setFeedbackSuccess(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          AI-Powered Diagnosis
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🔬 Disease Intelligence</h1>
        <p className="text-gray-500 max-w-2xl">
          Upload a clear photo of the infected crop leaf to get instant AI-powered diagnosis and verified treatment advice.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Leaf Diagnosis</h2>
          <form onSubmit={handlePredict} className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-green-400 transition-all group relative overflow-hidden"
              onClick={() => document.getElementById('leaf-upload')?.click()}
            >
              <input type="file" onChange={handleFileChange} className="hidden" id="leaf-upload" accept="image/*" />
              {imagePreview ? (
                <div className="relative w-full">
                  <img
                    src={imagePreview}
                    alt="Leaf preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">Click to change</span>
                  </div>
                </div>
              ) : (
                <label htmlFor="leaf-upload" className="flex flex-col items-center cursor-pointer w-full text-center py-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
                    <FiUpload className="text-green-500 text-2xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Click or drag leaf photo</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG or WEBP (Max 10MB)</span>
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Crop Type Hint (Optional)</label>
              <select
                value={cropHint}
                onChange={(e) => setCropHint(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
              >
                <option value="">Auto Detect</option>
                <option value="potato">Potato</option>
                <option value="tomato">Tomato</option>
                <option value="apple">Apple</option>
                <option value="corn">Corn</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading || !imageFile}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Running Inference...
                </span>
              ) : (
                'Diagnose Disease'
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results */}
        <div className="flex flex-col justify-between">
          {prediction ? (
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex-1 flex flex-col justify-between animate-fade-in">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {prediction.crop_type}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-800 mt-2">{prediction.predicted_disease}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-green-600">
                      {(prediction.confidence_score * 100).toFixed(0)}%
                    </span>
                    <p className="text-xs text-gray-400">confidence</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500">Inference Engine</h4>
                    <p className="text-sm text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded mt-1 inline-block">{prediction.model_version}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500">Treatment Recommendations</h4>
                    <p className="text-sm text-gray-700 leading-relaxed mt-1">
                      Check preventive guidelines. Ensure balanced irrigation, apply fungicides, or consult regional experts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feedback Loop */}
              <div className="border-t border-gray-100 pt-4 mt-6">
                {feedbackSuccess ? (
                  <p className="text-sm text-green-600 font-semibold flex items-center gap-1">
                    <FiCheckCircle /> Thank you! Your feedback helps improve the ML model.
                  </p>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">Was this diagnosis accurate?</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleFeedback('correct')}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 py-2.5 rounded-lg text-sm font-semibold border border-green-200 transition-all active:scale-[0.97]"
                      >
                        <FiCheckCircle /> Yes, Accurate
                      </button>
                      <button
                        onClick={() => handleFeedback('incorrect')}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-lg text-sm font-semibold border border-red-200 transition-all active:scale-[0.97]"
                      >
                        <FiXCircle /> No, Incorrect
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* New Scan Button */}
              <button
                onClick={resetForm}
                className="mt-4 w-full text-center text-sm text-gray-500 hover:text-green-600 font-medium py-2 border border-gray-200 hover:border-green-300 rounded-lg transition-all"
              >
                ↻ Start New Diagnosis
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🔬</span>
              </div>
              <p className="font-medium text-gray-600">No active prediction</p>
              <p className="text-xs text-gray-400 mt-1">Upload a leaf image to begin AI-powered diagnosis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
