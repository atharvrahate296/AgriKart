'use client'

import { useState, useEffect } from 'react'
import { getChatSessions, createChatSession, getChatMessages, sendMessage } from '@/lib/api/chat'
import { FiSend, FiMessageSquare, FiPlus, FiSmile } from 'react-icons/fi'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function AssistantPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [sessions, setSessions] = useState<any[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>('')
  const [messages, setMessages] = useState<any[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/assistant')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

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
  const loadSessions = async () => {
    try {
      const data = await getChatSessions()
      setSessions(data || [])
      if (data && data.length > 0) {
        setActiveSessionId(data[0].id)
        loadMessages(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load chat sessions', err)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      const data = await getChatMessages(sessionId)
      setMessages(data || [])
    } catch (err) {
      console.error('Failed to load messages', err)
    }
  }

  const handleCreateSession = async () => {
    try {
      const newSession = await createChatSession(`Chat Session ${sessions.length + 1}`)
      setSessions([newSession, ...sessions])
      setActiveSessionId(newSession.id)
      setMessages([])
    } catch (err) {
      alert('Failed to create session')
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || !activeSessionId) return

    const userMsg = { sender_role: 'user', content: inputMessage }
    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setIsLoading(true)

    try {
      const reply = await sendMessage(activeSessionId, userMsg.content)
      setMessages((prev) => [...prev, reply])
    } catch (err) {
      console.error(err)
      alert('Failed to get response')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (msg: string) => {
    setInputMessage(msg)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto border-x border-gray-200 bg-white">
      {/* Sidebar - Sessions List */}
      <div className="w-80 border-r border-gray-200 flex flex-col justify-between bg-gray-50/50">
        <div>
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">AI Conversations</h2>
            <button
              onClick={handleCreateSession}
              className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
            >
              <FiPlus />
            </button>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-10rem)]">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id)
                  loadMessages(s.id)
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm font-semibold transition-colors ${
                  activeSessionId === s.id
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FiMessageSquare className="shrink-0" />
                <span className="truncate">{s.title || 'Agri Session'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Feed */}
      <div className="flex-1 flex flex-col bg-gray-50/20">
        {activeSessionId ? (
          <>
            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <FiSmile className="text-4xl text-green-500 mx-auto" />
                  <h3 className="text-lg font-bold text-gray-800">Your Agricultural Assistant</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">Ask about crop diseases, eligible government schemes, weather alerts, or product recommendations.</p>
                  
                  {/* Suggestions Chips */}
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto pt-4">
                    {[
                      'How to prevent late potato blight?',
                      'Which government schemes apply to Maharashtra?',
                      'Best seeds for cotton cultivation?',
                      'Tell me weather pest warnings.'
                    ].map((sug) => (
                      <button
                        key={sug}
                        onClick={() => handleSuggestionClick(sug)}
                        className="text-xs bg-white hover:bg-gray-100 text-gray-600 font-semibold py-1.5 px-3 rounded-full border border-gray-200 transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl shadow-sm leading-relaxed text-sm ${
                      msg.sender_role === 'user'
                        ? 'bg-green-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                    {msg.model_version && (
                      <span className="block text-[10px] text-gray-400 mt-2 font-mono">
                        Powered by {msg.model_version}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask your query..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <FiSend /> Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <FiMessageSquare className="text-4xl mb-2 text-gray-300" />
            <p className="font-semibold">No Conversation Selected</p>
            <button
              onClick={handleCreateSession}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
