import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getHeaders() {
  const session = (await supabase.auth.getSession()).data.session
  return {
    'Authorization': session ? `Bearer ${session.access_token}` : '',
    'Content-Type': 'application/json',
  }
}

export const createChatSession = async (title: string, topic?: string) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/chat/sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, topic }),
  })
  if (!res.ok) throw new Error('Failed to create chat session')
  return (await res.json()).data
}

export const getChatSessions = async () => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/chat/sessions`, {
    headers,
  })
  if (!res.ok) throw new Error('Failed to fetch chat sessions')
  return (await res.json()).data
}

export const getChatMessages = async (sessionId: string) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/chat/sessions/${sessionId}/messages`, {
    headers,
  })
  if (!res.ok) throw new Error('Failed to fetch chat messages')
  return (await res.json()).data
}

export const sendMessage = async (sessionId: string, message: string) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/chat/sessions/${sessionId}/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return (await res.json()).data
}

export const archiveChatSession = async (sessionId: string) => {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/api/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error('Failed to archive chat session')
  return (await res.json()).data
}
