import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getHeaders() {
  const session = (await supabase.auth.getSession()).data.session
  return {
    'Authorization': session ? `Bearer ${session.access_token}` : '',
    'Content-Type': 'application/json',
  }
}

export const getSchemes = async (filters?: any) => {
  const queryParams = new URLSearchParams()
  if (filters?.state) queryParams.append('state', filters.state)
  if (filters?.crop) queryParams.append('crop', filters.crop)
  if (filters?.role) queryParams.append('role', filters.role)
  if (filters?.isActive !== undefined) queryParams.append('isActive', String(filters.isActive))
  if (filters?.limit) queryParams.append('limit', String(filters.limit))
  if (filters?.offset) queryParams.append('offset', String(filters.offset))

  const res = await fetch(`${API_URL}/api/schemes?${queryParams.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch schemes')
  return await res.json()
}

export const checkEligibility = async (criteria: {
  state: string
  district: string
  land_size: number
  annual_income: number
  primary_crops: string[]
}) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/schemes/eligibility`, {
    method: 'POST',
    headers,
    body: JSON.stringify(criteria),
  })
  if (!res.ok) throw new Error('Failed to check eligibility')
  return (await res.json()).data
}

export const applyForScheme = async (
  schemeId: string,
  applicationData: {
    land_size_at_application?: number
    income_at_application?: number
    documents_submitted: Array<{ document_name: string; file_url: string }>
  }
) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/schemes/${schemeId}/apply`, {
    method: 'POST',
    headers,
    body: JSON.stringify(applicationData),
  })
  if (!res.ok) throw new Error('Failed to submit application')
  return (await res.json()).data
}

export const getDeadlineAlerts = async () => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/schemes/alerts/deadlines`, {
    headers,
  })
  if (!res.ok) throw new Error('Failed to fetch deadline alerts')
  return (await res.json()).data
}

export const getApplications = async (filters?: any) => {
  const headers = await getHeaders()
  const queryParams = new URLSearchParams()
  if (filters?.status) queryParams.append('status', filters.status)
  if (filters?.schemeId) queryParams.append('schemeId', filters.schemeId)
  if (filters?.farmerId) queryParams.append('farmerId', filters.farmerId)
  if (filters?.limit) queryParams.append('limit', String(filters.limit))
  if (filters?.offset) queryParams.append('offset', String(filters.offset))

  const res = await fetch(`${API_URL}/api/schemes/applications?${queryParams.toString()}`, {
    headers,
  })
  if (!res.ok) throw new Error('Failed to fetch applications')
  return (await res.json()).data
}
