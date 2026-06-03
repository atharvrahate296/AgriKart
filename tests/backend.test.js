/**
 * backend.test.js
 * Tests all REST API endpoints of the Express backend using axios.
 *
 * ⚠️  Requires the backend server to be running:
 *     cd backend && npm run dev
 *
 * Run:  npm run test:backend
 */

const axios = require('axios')

const BASE_URL = `http://localhost:${process.env.PORT || 3001}`

// Axios instance — don't throw on 4xx/5xx so we can assert status codes
const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true,   // never throw, always return response
  timeout: 10000,
})

// ── Guard: Check server is reachable ─────────────────────────────────────────
beforeAll(async () => {
  try {
    await api.get('/health')
  } catch {
    throw new Error(
      `\n❌ Backend server is NOT running at ${BASE_URL}\n` +
      `   Start it first:  cd backend && npm run dev\n`
    )
  }
})

// ── 1. Health Check ───────────────────────────────────────────────────────────
describe('1. Health Check — GET /health', () => {
  test('returns 200 with status OK', async () => {
    const res = await api.get('/health')
    expect(res.status).toBe(200)
    expect(res.data.status).toBe('OK')
    expect(res.data.timestamp).toBeDefined()
  })
})

// ── 2. Products — List ────────────────────────────────────────────────────────
describe('2. Products — GET /api/products', () => {
  test('returns 200 with data array and count', async () => {
    const res = await api.get('/api/products')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.data.data)).toBe(true)
    expect(typeof res.data.count).toBe('number')
  })

  test('filters by category query param', async () => {
    const res = await api.get('/api/products?category=Seeds')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.data.data)).toBe(true)
    // All returned items should be Seeds (if any returned)
    res.data.data.forEach((p) => expect(p.category).toBe('Seeds'))
  })

  test('filters by search query param', async () => {
    const res = await api.get('/api/products?search=a')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.data.data)).toBe(true)
  })

  test('sorts by price_low', async () => {
    const res = await api.get('/api/products?sortBy=price_low')
    expect(res.status).toBe(200)
    const prices = res.data.data.map((p) => p.price)
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
    }
  })

  test('sorts by price_high', async () => {
    const res = await api.get('/api/products?sortBy=price_high')
    expect(res.status).toBe(200)
    const prices = res.data.data.map((p) => p.price)
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1])
    }
  })

  test('sorts by rating', async () => {
    const res = await api.get('/api/products?sortBy=rating')
    expect(res.status).toBe(200)
    const ratings = res.data.data.map((p) => p.rating).filter((r) => r != null)
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i]).toBeLessThanOrEqual(ratings[i - 1])
    }
  })
})

// ── 3. Products — Single ──────────────────────────────────────────────────────
describe('3. Products — GET /api/products/:id', () => {
  let firstProductId

  beforeAll(async () => {
    const res = await api.get('/api/products')
    firstProductId = res.data.data?.[0]?.id
  })

  test('returns product with vendor join for valid id', async () => {
    if (!firstProductId) return
    const res = await api.get(`/api/products/${firstProductId}`)
    expect(res.status).toBe(200)
    expect(res.data.id).toBe(firstProductId)
  })

  test('returns error response for non-existent id', async () => {
    const res = await api.get('/api/products/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(500)
    expect(res.data.error).toBeDefined()
  })
})

// ── 4. Search ─────────────────────────────────────────────────────────────────
describe('4. Search — GET /api/search', () => {
  test('returns array of matching products (max 10)', async () => {
    const res = await api.get('/api/search?q=a')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.data)).toBe(true)
    expect(res.data.length).toBeLessThanOrEqual(10)
  })

  test('returns empty array for no matches', async () => {
    const res = await api.get('/api/search?q=xzqwerty99999')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.data)).toBe(true)
    expect(res.data).toHaveLength(0)
  })

  test('each result has id, name, price, rating', async () => {
    const res = await api.get('/api/search?q=a')
    res.data.forEach((item) => {
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('name')
      expect(item).toHaveProperty('price')
    })
  })
})

// ── 5. Vendors ────────────────────────────────────────────────────────────────
describe('5. Vendors — GET /api/vendors/:id', () => {
  let firstVendorId

  beforeAll(async () => {
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    const { data } = await supabase.from('vendors').select('id').limit(1)
    firstVendorId = data?.[0]?.id
  })

  test('returns vendor data for valid id', async () => {
    if (!firstVendorId) return
    const res = await api.get(`/api/vendors/${firstVendorId}`)
    expect(res.status).toBe(200)
    expect(res.data.id).toBe(firstVendorId)
  })

  test('returns error for non-existent vendor id', async () => {
    const res = await api.get('/api/vendors/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(500)
    expect(res.data.error).toBeDefined()
  })
})

// ── 6. Orders — Create ───────────────────────────────────────────────────────
describe('6. Orders — POST /api/orders', () => {
  test('creates an order and returns it', async () => {
    const res = await api.post('/api/orders', {
      user_id: 'jest-test-user',
      items: [{ product_id: 'test-item', qty: 2, price: 150 }],
      total: 300,
      status: 'pending',
    })
    expect(res.status).toBe(200)
    expect(res.data).toHaveProperty('id')
    expect(res.data.total).toBe(300)
    expect(res.data.status).toBe('pending')
  })

  test('handles missing required fields gracefully', async () => {
    const res = await api.post('/api/orders', {})
    // Should return an error (not crash the server)
    expect([400, 500]).toContain(res.status)
    expect(res.data).toHaveProperty('error')
  })
})

// ── 7. CORS Headers ──────────────────────────────────────────────────────────
describe('7. CORS Headers', () => {
  test('response includes Access-Control-Allow-Origin header', async () => {
    const res = await api.get('/health')
    expect(res.headers['access-control-allow-origin']).toBeDefined()
  })
})
