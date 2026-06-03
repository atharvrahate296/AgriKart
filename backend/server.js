require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const socketIo = require('socket.io')
const { createClient } = require('@supabase/supabase-js')

// Initialize Express app
const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() })
})

// Products Routes
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, sortBy } = req.query

    let query = supabase
      .from('products')
      .select('*, vendor:vendors(*)', { count: 'exact' })

    if (search) query = query.ilike('name', `%${search}%`)
    if (category) query = query.eq('category', category)

    if (sortBy === 'price_low') query = query.order('price', { ascending: true })
    else if (sortBy === 'price_high') query = query.order('price', { ascending: false })
    else if (sortBy === 'rating') query = query.order('rating', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query.limit(50)

    if (error) throw error

    res.json({
      data,
      count,
      timestamp: new Date(),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, vendor:vendors(*), reviews(*)')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Search products
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query

    const { data, error } = await supabase
      .from('products')
      .select('id, name, image, price, rating')
      .ilike('name', `%${q}%`)
      .limit(10)

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Vendor routes
app.get('/api/vendors/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Orders routes
app.post('/api/orders', async (req, res) => {
  try {
    const { user_id, items, total, status } = req.body

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id,
          items,
          total,
          status: status || 'pending',
          created_at: new Date(),
        },
      ])
      .select()

    if (error) throw error
    res.json(data[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Socket.io events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id)

  // Vendor-Farmer messaging
  socket.on('join_chat', (data) => {
    const { user_id, vendor_id } = data
    const roomId = [user_id, vendor_id].sort().join('_')
    socket.join(roomId)
    console.log(`User ${socket.id} joined room ${roomId}`)
  })

  socket.on('send_message', async (data) => {
    try {
      const { sender_id, receiver_id, message, product_id } = data
      const roomId = [sender_id, receiver_id].sort().join('_')

      // Save message to DB
      await supabase.from('messages').insert([
        {
          sender_id,
          receiver_id,
          product_id,
          message,
          created_at: new Date(),
          read: false,
        },
      ])

      // Emit to room
      io.to(roomId).emit('receive_message', {
        sender_id,
        message,
        timestamp: new Date(),
      })
    } catch (error) {
      console.error('Message error:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  socket.on('typing', (data) => {
    const { user_id, vendor_id } = data
    const roomId = [user_id, vendor_id].sort().join('_')
    socket.to(roomId).emit('user_typing', { user_id })
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`✓ REST API available at http://localhost:${PORT}/api`)
  console.log(`✓ WebSocket server ready for connections`)
})

module.exports = { app, io, server }
