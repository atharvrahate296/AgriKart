'use client'

import { useState, useEffect } from 'react'
import { predictDisease, submitFeedback, triggerRetraining } from '@/lib/api/disease'
import { FiUpload, FiCheckCircle, FiXCircle, FiTrendingUp } from 'react-icons/fi'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function DiseaseDetectPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [cropHint, setCropHint] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [prediction, setPrediction] = useState<any>(null)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const [isAdmin, setIsAdmin] = useState(true) // Simulating logged-in role
  const [retrainStatus, setRetrainStatus] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/disease/detect')
    }
  }, [user, loading, router])

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


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
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

  const handleRetrain = async () => {
    setRetrainStatus('retraining_triggered')
    try {
      const run = await triggerRetraining(5, 32, 0.001)
      setRetrainStatus(`Running. Job ID: ${run.run_id}`)
    } catch (err: any) {
      setRetrainStatus('Retraining failed')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🔬 Disease Intelligence</h1>
      <p className="text-gray-600 mb-8">Upload a clear photo of the infected crop leaf to get instant AI-powered diagnosis and verified treatment advice.</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Leaf Diagnosis</h2>
          <form onSubmit={handlePredict} className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors">
              <input type="file" onChange={handleFileChange} className="hidden" id="leaf-upload" accept="image/*" />
              <label htmlFor="leaf-upload" className="flex flex-col items-center cursor-pointer w-full text-center">
                <FiUpload className="text-gray-400 text-4xl mb-2" />
                <span className="text-sm font-semibold text-gray-700">
                  {imageFile ? imageFile.name : 'Click or Drag leaf photo'}
                </span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG or WEBP (Max 10MB)</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Crop Type Hint (Optional)</label>
              <select
                value={cropHint}
                onChange={(e) => setCropHint(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500"
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
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'Running Inference...' : 'Diagnose Disease'}
            </button>
          </form>
        </div>

        {/* Prediction Results */}
        <div className="flex flex-col justify-between">
          {prediction ? (
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {prediction.crop_type}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{prediction.predicted_disease}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-green-600">
                      {(prediction.confidence_score * 100).toFixed(0)}%
                    </span>
                    <p className="text-xs text-gray-400">confidence</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500">Inference Engine</h4>
                    <p className="text-sm text-gray-800 font-mono">{prediction.model_version}</p>
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
                    <FiCheckCircle /> Thank you! Your feedback helps retrain the ML model.
                  </p>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">Was this diagnosis accurate?</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleFeedback('correct')}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-lg text-sm font-semibold border border-green-200 transition-colors"
                      >
                        <FiCheckCircle /> Yes, Accurate
                      </button>
                      <button
                        onClick={() => handleFeedback('incorrect')}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-lg text-sm font-semibold border border-red-200 transition-colors"
                      >
                        <FiXCircle /> No, Incorrect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <p className="font-medium">No active prediction</p>
              <p className="text-xs text-gray-400 mt-1">Upload a leaf image to diagnose.</p>
            </div>
          )}

          {/* Admin Retrain Panel */}
          {isAdmin && (
            <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1">
                    <FiTrendingUp /> Retrain Model Registry
                  </h4>
                  <p className="text-xs text-gray-400">Trigger background retraining using expert feedback data.</p>
                </div>
                <button
                  onClick={handleRetrain}
                  className="bg-gray-800 hover:bg-gray-950 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Retrain API
                </button>
              </div>
              {retrainStatus && (
                <p className="text-xs font-mono text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                  Status: {retrainStatus}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
