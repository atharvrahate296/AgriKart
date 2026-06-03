/**
 * database.test.js
 * Tests Supabase connection, table existence, CRUD operations, and seeded data.
 * Does NOT require any server to be running — connects directly to Supabase.
 *
 * Run:  npm run test:db
 */

const { createClient } = require('@supabase/supabase-js')

// ── Supabase client (loaded from backend/.env via setup.js) ──────────────────
let supabase

beforeAll(() => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    throw new Error(
      '❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in backend/.env\n' +
      '   Copy backend/.env.example → backend/.env and fill in your credentials.'
    )
  }

  supabase = createClient(url, key)
})

// ── 1. Connection ─────────────────────────────────────────────────────────────
describe('1. Supabase Connection', () => {
  test('client is created with valid credentials', () => {
    expect(supabase).toBeDefined()
    expect(typeof supabase.from).toBe('function')
  })

  test('can reach Supabase — products table responds', async () => {
    const { error } = await supabase.from('products').select('id').limit(1)
    expect(error).toBeNull()
  })
})

// ── 2. Table Existence ────────────────────────────────────────────────────────
describe('2. Required Tables Exist', () => {
  const tables = ['products', 'vendors', 'orders', 'messages']

  test.each(tables)('table "%s" is accessible', async (table) => {
    const { error } = await supabase.from(table).select('*').limit(1)
    // A "relation does not exist" error means the table is missing
    expect(error?.message).not.toMatch(/relation .+ does not exist/i)
  })
})

// ── 3. Products Queries ───────────────────────────────────────────────────────
describe('3. Products Table — Queries', () => {
  test('can fetch products list', async () => {
    const { data, error } = await supabase.from('products').select('*').limit(10)
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  test('can filter products by category', async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, category')
      .eq('category', 'Seeds')
      .limit(10)
    expect(error).toBeNull()
    // If any rows returned, they should all be Seeds
    if (data.length > 0) {
      data.forEach((p) => expect(p.category).toBe('Seeds'))
    }
  })

  test('can search products by name (ILIKE)', async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .ilike('name', '%a%')
      .limit(5)
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  test('can sort products by price ascending', async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, price')
      .order('price', { ascending: true })
      .limit(5)
    expect(error).toBeNull()
    // Verify ascending order
    for (let i = 1; i < data.length; i++) {
      expect(data[i].price).toBeGreaterThanOrEqual(data[i - 1].price)
    }
  })
})

// ── 4. Vendors Queries ────────────────────────────────────────────────────────
describe('4. Vendors Table — Queries', () => {
  test('can fetch vendors list', async () => {
    const { data, error } = await supabase.from('vendors').select('*').limit(10)
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  test('products-vendors join returns vendor metadata', async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, vendor:vendors(id, name)')
      .limit(5)
    expect(error).toBeNull()
    // If rows exist, each should have a vendor object or null
    data.forEach((p) => {
      if (p.vendor) expect(typeof p.vendor).toBe('object')
    })
  })
})

// ── 5. Orders — Insert & Fetch ────────────────────────────────────────────────
describe('5. Orders Table — CRUD', () => {
  let insertedOrderId

  test('can insert a test order', async () => {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id: 'test-user-jest',
          items: [{ product_id: 'test-product', qty: 1, price: 99 }],
          total: 99,
          status: 'pending',
        },
      ])
      .select()
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    insertedOrderId = data[0].id
  })

  test('can fetch the inserted order by id', async () => {
    if (!insertedOrderId) return // skip if insert failed
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', insertedOrderId)
      .single()
    expect(error).toBeNull()
    expect(data.status).toBe('pending')
    expect(data.total).toBe(99)
  })

  test('can delete the test order (cleanup)', async () => {
    if (!insertedOrderId) return
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', insertedOrderId)
    expect(error).toBeNull()
  })
})

// ── 6. Messages — Insert & Fetch ─────────────────────────────────────────────
describe('6. Messages Table — CRUD', () => {
  let insertedMsgId

  test('can insert a test message', async () => {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: 'jest-user',
          receiver_id: 'jest-vendor',
          message: 'Test message from Jest',
          product_id: null,
          read: false,
        },
      ])
      .select()
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data[0].read).toBe(false)
    insertedMsgId = data[0].id
  })

  test('can delete the test message (cleanup)', async () => {
    if (!insertedMsgId) return
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', insertedMsgId)
    expect(error).toBeNull()
  })
})
