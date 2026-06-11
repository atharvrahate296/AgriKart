'use client'

import { FiPhone, FiMessageSquare, FiStar, FiMapPin, FiSend } from 'react-icons/fi'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { io, Socket } from 'socket.io-client'

export default function VendorCard({ vendor, productId }: any) {
  const [showChat, setShowChat] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const { user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const receiverId = vendor?.user_id || vendor?.id
  const vendorName = vendor?.name || vendor?.business_name || vendor?.company_name || 'Vendor'
  const vendorPhone = vendor?.business_phone || vendor?.phone_business || vendor?.phone

  // 1. Fetch chat history and initialize Socket.io when chat is opened
  useEffect(() => {
    if (!showChat || !user || !vendor) return

    // Fetch history from Supabase
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true })

        if (error) throw error
        setMessages(data || [])
      } catch (err) {
        console.error('Error fetching chat history:', err)
      }
    }

    fetchHistory()

    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const socket = io(socketUrl)
    socketRef.current = socket

    socket.emit('join_chat', { user_id: user.id, vendor_id: receiverId })

    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, {
        id: Math.random().toString(),
        sender_id: data.sender_id,
        receiver_id: user.id,
        message: data.message,
        created_at: data.timestamp
      }])
    })

    socket.on('user_typing', (data) => {
      if (data.user_id !== user.id) {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 3000)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [showChat, user, vendor])

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user || !receiverId || !socketRef.current) return

    const msgText = message.trim()
    setMessage('')

    // Emit message to Socket.io server
    socketRef.current.emit('send_message', {
      sender_id: user.id,
      receiver_id: receiverId,
      message: msgText,
      product_id: productId
    })

    // Optimistically update local message list
    setMessages((prev) => [...prev, {
      id: Math.random().toString(),
      sender_id: user.id,
      receiver_id: receiverId,
      message: msgText,
      created_at: new Date().toISOString()
    }])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (socketRef.current && user && vendor) {
      socketRef.current.emit('typing', { user_id: user.id, vendor_id: receiverId })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Vendor Profile */}
      <div className="text-center mb-6 pb-6 border-b">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
          {vendorName.charAt(0)}
        </div>
        <h3 className="text-xl font-bold text-gray-900">{vendorName}</h3>
        <p className="text-gray-600 text-sm mt-1">{vendor?.location || 'Unknown location'}</p>

        {/* Rating */}
        <div className="flex items-center justify-center gap-1 mt-3">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-lg">★</span>
            ))}
          </div>
          <span className="text-sm text-gray-600">{vendor?.rating || 4.5}/5</span>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {vendor?.reviews_count || 0} reviews • Seller for 2+ years
        </p>
      </div>

      {/* Contact Options */}
      <div className="space-y-3 mb-6">
        {/* Phone */}
        <a
          href={`tel:${vendorPhone || ''}`}
          className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
        >
          <FiPhone className="text-blue-600 flex-shrink-0" size={20} />
          <div>
            <p className="text-xs text-gray-600">Call Vendor</p>
            <p className="font-semibold text-gray-900">{vendorPhone || 'N/A'}</p>
          </div>
        </a>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/${vendorPhone || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition"
        >
          <FiMessageSquare className="text-green-600 flex-shrink-0" size={20} />
          <div>
            <p className="text-xs text-gray-600">WhatsApp</p>
            <p className="font-semibold text-gray-900">Quick Message</p>
          </div>
        </a>
      </div>

      {/* Chat Section */}
      <div className="border-t pt-6">
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-full py-2 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:shadow-lg transition"
        >
          {showChat ? 'Close Chat 💬' : '💬 Ask Vendor'}
        </button>

        {showChat && (
          <div className="mt-4 border rounded-xl overflow-hidden bg-gray-50 flex flex-col h-80">
            {/* Header */}
            <div className="bg-green-600 text-white px-4 py-2 text-sm font-semibold flex justify-between items-center">
              <span>Chat with Vendor</span>
              {isTyping && <span className="text-xs animate-pulse font-normal">typing...</span>}
            </div>

            {/* Message Area */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 flex flex-col">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-gray-500 my-auto">
                  No message history. Send a query to start!
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isOwnMessage = msg.sender_id === user?.id
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[80%] rounded-lg p-2.5 text-sm ${
                        isOwnMessage
                          ? 'bg-green-600 text-white self-end rounded-br-none'
                          : 'bg-white text-gray-800 self-start border rounded-bl-none'
                      }`}
                    >
                      <p>{msg.message}</p>
                      <span className={`block text-[10px] mt-1 text-right ${isOwnMessage ? 'text-green-200' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-2 border-t bg-white flex gap-2">
              <textarea
                value={message}
                onChange={handleInputChange}
                placeholder={user ? "Type your question..." : "Login to chat..."}
                disabled={!user}
                rows={1}
                className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-600 outline-none resize-none max-h-12"
              />
              <button
                type="submit"
                disabled={!user || !message.trim()}
                className="bg-green-600 text-white p-2.5 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                <FiSend size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t space-y-3 text-sm">
        <div className="flex justify-between items-center text-gray-700">
          <span>Response Time</span>
          <span className="font-semibold">Within 2 hours</span>
        </div>
        <div className="flex justify-between items-center text-gray-700">
          <span>Delivery</span>
          <span className="font-semibold">2-5 business days</span>
        </div>
        <div className="flex justify-between items-center text-gray-700">
          <span>Guarantee</span>
          <span className="font-semibold">30-day return</span>
        </div>
      </div>
    </div>
  )
}
