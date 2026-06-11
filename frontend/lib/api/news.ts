import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getHeaders() {
  const session = (await supabase.auth.getSession()).data.session
  return {
    'Authorization': session ? `Bearer ${session.access_token}` : '',
    'Content-Type': 'application/json',
  }
}

export const getArticles = async (filters?: any) => {
  const session = (await supabase.auth.getSession()).data.session
  const headers = session ? { 'Authorization': `Bearer ${session.access_token}` } : undefined
  const queryParams = new URLSearchParams()
  if (filters?.category) queryParams.append('category', filters.category)
  if (filters?.state) queryParams.append('state', filters.state)
  if (filters?.crop) queryParams.append('crop', filters.crop)
  if (filters?.search) queryParams.append('search', filters.search)

  const res = await fetch(`${API_URL}/api/news/articles?${queryParams.toString()}`, { headers })
  if (!res.ok) throw new Error('Failed to fetch articles')
  return (await res.json()).data
}

export const getArticle = async (idOrSlug: string) => {
  const session = (await supabase.auth.getSession()).data.session
  const headers = session ? { 'Authorization': `Bearer ${session.access_token}` } : undefined
  const res = await fetch(`${API_URL}/api/news/articles/${idOrSlug}`, { headers })
  if (!res.ok) throw new Error('Article not found')
  return (await res.json()).data
}

export const createArticle = async (articleData: any) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/news/articles`, {
    method: 'POST',
    headers,
    body: JSON.stringify(articleData),
  })
  if (!res.ok) throw new Error('Failed to create article')
  return (await res.json()).data
}

export const getAlerts = async (filters?: any) => {
  const session = (await supabase.auth.getSession()).data.session
  const headers = session ? { 'Authorization': `Bearer ${session.access_token}` } : undefined
  const queryParams = new URLSearchParams()
  if (filters?.type) queryParams.append('type', filters.type)
  if (filters?.severity) queryParams.append('severity', filters.severity)
  if (filters?.crop) queryParams.append('crop', filters.crop)

  const res = await fetch(`${API_URL}/api/news/alerts?${queryParams.toString()}`, { headers })
  if (!res.ok) throw new Error('Failed to fetch alerts')
  return (await res.json()).data
}

export const createAlert = async (alertData: any) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/news/alerts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(alertData),
  })
  if (!res.ok) throw new Error('Failed to create alert')
  return (await res.json()).data
}
