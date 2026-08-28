import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getHeaders() {
  const session = (await supabase.auth.getSession()).data.session
  return {
    'Authorization': session ? `Bearer ${session.access_token}` : '',
    'Content-Type': 'application/json',
  }
}

export interface CreateDemandPayload {
  buyer_profile_id: string
  crop_type: string
  required_quantity: number
  max_price_per_kg: number
  min_quality_grade?: string
  required_by: string
  latitude: number
  longitude: number
  delivery_address?: string
}

export const createDemand = async (payload: CreateDemandPayload) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/demands`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await res.json()).error?.message || 'Failed to create demand')
  return (await res.json()).data
}

export const getDemands = async (params?: { status?: string; crop_type?: string; buyer_id?: string }) => {
  const headers = await getHeaders()
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.crop_type) searchParams.set('crop_type', params.crop_type)
  if (params?.buyer_id) searchParams.set('buyer_id', params.buyer_id)

  const res = await fetch(`${API_URL}/api/demands?${searchParams}`, { headers })
  if (!res.ok) throw new Error('Failed to fetch demands')
  return (await res.json())
}

export const getDemandById = async (id: string) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/demands/${id}`, { headers })
  if (!res.ok) throw new Error('Demand not found')
  return (await res.json()).data
}

export const matchDemand = async (id: string) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/demands/${id}/match`, { method: 'POST', headers })
  if (!res.ok) throw new Error((await res.json()).error?.message || 'Matching failed')
  return (await res.json()).data
}

export const confirmDemand = async (id: string) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/demands/${id}/confirm`, { method: 'POST', headers })
  if (!res.ok) throw new Error('Confirmation failed')
  return (await res.json()).data
}
