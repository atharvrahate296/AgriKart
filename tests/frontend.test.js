/**
 * frontend.test.js
 * Smoke-tests the Next.js frontend — verifies pages load correctly
 * and key HTML elements are present in the response.
 *
 * ⚠️  Requires the frontend dev server to be running:
 *     cd frontend && npm run dev
 *
 * Run:  npm run test:frontend
 */

const axios = require('axios')

const FRONTEND_URL = 'http://localhost:3000'

// Axios instance — never throw on non-2xx
const browser = axios.create({
  baseURL: FRONTEND_URL,
  validateStatus: () => true,
  timeout: 15000,
  headers: { Accept: 'text/html' },
})

// ── Guard: check frontend is reachable ────────────────────────────────────────
beforeAll(async () => {
  try {
    await browser.get('/')
  } catch {
    throw new Error(
      `\n❌ Frontend server is NOT running at ${FRONTEND_URL}\n` +
      `   Start it first:  cd frontend && npm run dev\n`
    )
  }
})

// ── 1. Home Page ──────────────────────────────────────────────────────────────
describe('1. Home Page — GET /', () => {
  let html

  beforeAll(async () => {
    const res = await browser.get('/')
    html = res.data
  })

  test('responds with HTTP 200', async () => {
    const res = await browser.get('/')
    expect(res.status).toBe(200)
  })

  test('returns HTML content', () => {
    expect(typeof html).toBe('string')
    expect(html.toLowerCase()).toContain('<!doctype html')
  })

  test('page contains a <title> tag', () => {
    expect(html).toMatch(/<title[^>]*>/)
  })
})

// ── 2. Products Page ──────────────────────────────────────────────────────────
describe('2. Products Page — GET /products', () => {
  test('responds with HTTP 200', async () => {
    const res = await browser.get('/products')
    expect(res.status).toBe(200)
  })

  test('returns HTML content', async () => {
    const res = await browser.get('/products')
    expect(res.data.toLowerCase()).toContain('<!doctype html')
  })
})

// ── 3. Cart Page ──────────────────────────────────────────────────────────────
describe('3. Cart Page — GET /cart', () => {
  test('responds with HTTP 200', async () => {
    const res = await browser.get('/cart')
    expect(res.status).toBe(200)
  })

  test('returns HTML content', async () => {
    const res = await browser.get('/cart')
    expect(res.data.toLowerCase()).toContain('<!doctype html')
  })
})

// ── 4. Checkout Page ──────────────────────────────────────────────────────────
describe('4. Checkout Page — GET /checkout', () => {
  test('responds with HTTP 200', async () => {
    const res = await browser.get('/checkout')
    expect(res.status).toBe(200)
  })
})

// ── 5. Auth Pages ─────────────────────────────────────────────────────────────
describe('5. Auth Pages', () => {
  test('GET /auth/login responds with 200', async () => {
    const res = await browser.get('/auth/login')
    expect(res.status).toBe(200)
  })

  test('GET /auth/signup responds with 200', async () => {
    const res = await browser.get('/auth/signup')
    expect(res.status).toBe(200)
  })
})

// ── 6. Vendor Dashboard ───────────────────────────────────────────────────────
describe('6. Vendor Dashboard — GET /vendor', () => {
  test('responds with HTTP 200', async () => {
    const res = await browser.get('/vendor')
    expect(res.status).toBe(200)
  })
})

// ── 7. Static Assets ─────────────────────────────────────────────────────────
describe('7. Static Assets & Next.js Infrastructure', () => {
  test('Next.js _next/static chunk responds with 200', async () => {
    // Fetch the homepage to find a real chunk URL
    const home = await browser.get('/')
    const chunkMatch = home.data.match(/\/_next\/static\/[^"']+\.js/)
    if (!chunkMatch) {
      // No static chunks found in HTML — skip gracefully
      console.warn('⚠️  No _next/static chunk found in HTML — skipping static asset test')
      return
    }
    const res = await browser.get(chunkMatch[0])
    expect(res.status).toBe(200)
  })

  test('404 page for unknown route returns 404', async () => {
    const res = await browser.get('/this-route-does-not-exist-xyz')
    expect(res.status).toBe(404)
  })
})

// ── 8. Response Time ─────────────────────────────────────────────────────────
describe('8. Performance — Response Times', () => {
  test('home page responds within 3 seconds', async () => {
    const start = Date.now()
    await browser.get('/')
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(3000)
  })

  test('products page responds within 3 seconds', async () => {
    const start = Date.now()
    await browser.get('/products')
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(3000)
  })
})
