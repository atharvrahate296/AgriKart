import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getHeaders() {
  const session = (await supabase.auth.getSession()).data.session
  return {
    'Authorization': session ? `Bearer ${session.access_token}` : '',
  }
}

export const predictDisease = async (imageFile: File, cropHint?: string) => {
  const headers = await getHeaders()
  const formData = new FormData()
  formData.append('image', imageFile)
  if (cropHint) {
    formData.append('crop_type', cropHint)
  }

  const res = await fetch(`${API_URL}/api/disease/predict`, {
    method: 'POST',
    headers: {
      ...headers,
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Prediction failed')
  }

  return (await res.json()).data
}

export const getPredictionHistory = async () => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/disease/history`, {
    headers,
  })
  if (!res.ok) throw new Error('Failed to fetch history')
  return (await res.json()).data
}

export const getPredictionById = async (id: string) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/disease/predictions/${id}`, {
    headers,
  })
  if (!res.ok) throw new Error('Prediction not found')
  return (await res.json()).data
}

export const submitFeedback = async (
  predictionId: string,
  feedbackType: 'correct' | 'incorrect',
  actualDiseaseId?: string,
  actualDiseaseName?: string,
  explanation?: string
) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/disease/feedback`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prediction_id: predictionId,
      feedback_type: feedbackType,
      actual_disease_id: actualDiseaseId,
      actual_disease_name: actualDiseaseName,
      explanation,
    }),
  })
  if (!res.ok) throw new Error('Failed to submit feedback')
  return (await res.json()).data
}

export const verifyPrediction = async (
  predictionId: string,
  verificationStatus: 'verified' | 'corrected' | 'invalid',
  diseaseId?: string,
  expertNotes?: string
) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/disease/predictions/${predictionId}/verify`, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      verification_status: verificationStatus,
      disease_id: diseaseId,
      expert_notes: expertNotes,
    }),
  })
  if (!res.ok) throw new Error('Verification failed')
  return (await res.json()).data
}

export const triggerRetraining = async (epochs?: number, batchSize?: number, learningRate?: number) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/disease/retrain`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      epochs,
      batch_size: batchSize,
      learning_rate: learningRate,
    }),
  })
  if (!res.ok) throw new Error('Failed to trigger retraining')
  return (await res.json()).data
}
