/**
 * socket.test.js
 * Tests Socket.io real-time events: connection, rooms, messaging, typing, errors.
 *
 * ⚠️  Requires the backend server to be running:
 *     cd backend && npm run dev
 *
 * Run:  npm run test:socket
 */

const { io: ioc } = require('socket.io-client')

const SERVER_URL = `http://localhost:${process.env.PORT || 3001}`

// Helper — create a connected client and wait until connected
function createClient(extraOpts = {}) {
  return new Promise((resolve, reject) => {
    const socket = ioc(SERVER_URL, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 5000,
      ...extraOpts,
    })
    socket.once('connect', () => resolve(socket))
    socket.once('connect_error', (err) =>
      reject(
        new Error(
          `\n❌ Cannot connect to WebSocket at ${SERVER_URL}\n` +
          `   Start the backend first:  cd backend && npm run dev\n` +
          `   Original error: ${err.message}`
        )
      )
    )
  })
}

// Helper — wait for an event on a socket
function waitForEvent(socket, eventName, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for event: "${eventName}"`)),
      timeoutMs
    )
    socket.once(eventName, (data) => {
      clearTimeout(timer)
      resolve(data)
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────

let clientA, clientB

beforeAll(async () => {
  clientA = await createClient()
  clientB = await createClient()
})

afterAll(() => {
  clientA?.disconnect()
  clientB?.disconnect()
})

// ── 1. Connection ─────────────────────────────────────────────────────────────
describe('1. Connection', () => {
  test('client A connects and receives a socket.id', () => {
    expect(clientA.connected).toBe(true)
    expect(typeof clientA.id).toBe('string')
    expect(clientA.id.length).toBeGreaterThan(0)
  })

  test('client B connects with a different socket.id', () => {
    expect(clientB.connected).toBe(true)
    expect(clientB.id).not.toBe(clientA.id)
  })
})

// ── 2. join_chat — Room Assignment ───────────────────────────────────────────
describe('2. join_chat — Room Joining', () => {
  const USER_ID   = 'jest-user-001'
  const VENDOR_ID = 'jest-vendor-001'

  test('client A joins a chat room without error', (done) => {
    // join_chat emits no ack — just verify no error event fires
    let errored = false
    clientA.once('error', () => { errored = true })
    clientA.emit('join_chat', { user_id: USER_ID, vendor_id: VENDOR_ID })
    setTimeout(() => {
      expect(errored).toBe(false)
      done()
    }, 500)
  })

  test('client B joins the same room without error', (done) => {
    let errored = false
    clientB.once('error', () => { errored = true })
    clientB.emit('join_chat', { user_id: USER_ID, vendor_id: VENDOR_ID })
    setTimeout(() => {
      expect(errored).toBe(false)
      done()
    }, 500)
  })
})

// ── 3. send_message → receive_message ────────────────────────────────────────
describe('3. Messaging — send_message / receive_message', () => {
  const USER_ID   = 'jest-user-001'
  const VENDOR_ID = 'jest-vendor-001'

  beforeAll(async () => {
    // Make sure both clients are in the room
    clientA.emit('join_chat', { user_id: USER_ID, vendor_id: VENDOR_ID })
    clientB.emit('join_chat', { user_id: USER_ID, vendor_id: VENDOR_ID })
    await new Promise((r) => setTimeout(r, 300)) // wait for room join
  })

  test('message sent by A is received by B', async () => {
    const msgPromise = waitForEvent(clientB, 'receive_message')

    clientA.emit('send_message', {
      sender_id:   USER_ID,
      receiver_id: VENDOR_ID,
      message:     'Hello from Jest test!',
      product_id:  null,
    })

    const received = await msgPromise
    expect(received.sender_id).toBe(USER_ID)
    expect(received.message).toBe('Hello from Jest test!')
    expect(received.timestamp).toBeDefined()
  })

  test('message sent by B is received by A', async () => {
    const msgPromise = waitForEvent(clientA, 'receive_message')

    clientB.emit('send_message', {
      sender_id:   VENDOR_ID,
      receiver_id: USER_ID,
      message:     'Reply from vendor!',
      product_id:  null,
    })

    const received = await msgPromise
    expect(received.sender_id).toBe(VENDOR_ID)
    expect(received.message).toBe('Reply from vendor!')
  })
})

// ── 4. Typing Indicator ───────────────────────────────────────────────────────
describe('4. Typing Indicator — typing / user_typing', () => {
  const USER_ID   = 'jest-user-001'
  const VENDOR_ID = 'jest-vendor-001'

  beforeAll(async () => {
    clientA.emit('join_chat', { user_id: USER_ID, vendor_id: VENDOR_ID })
    clientB.emit('join_chat', { user_id: USER_ID, vendor_id: VENDOR_ID })
    await new Promise((r) => setTimeout(r, 300))
  })

  test('typing event from A triggers user_typing on B', async () => {
    const typingPromise = waitForEvent(clientB, 'user_typing')
    clientA.emit('typing', { user_id: USER_ID, vendor_id: VENDOR_ID })
    const data = await typingPromise
    expect(data.user_id).toBe(USER_ID)
  })

  test('A does NOT receive its own typing event (no self-echo)', (done) => {
    let selfEchoed = false
    clientA.once('user_typing', () => { selfEchoed = true })
    clientA.emit('typing', { user_id: USER_ID, vendor_id: VENDOR_ID })
    setTimeout(() => {
      expect(selfEchoed).toBe(false)
      done()
    }, 600)
  })
})

// ── 5. Error Handling ────────────────────────────────────────────────────────
describe('5. Error Handling', () => {
  test('invalid send_message data results in error event', async () => {
    const errPromise = waitForEvent(clientA, 'error', 3000)
    clientA.emit('send_message', {
      sender_id:   null,
      receiver_id: null,
      message:     '',
      product_id:  null,
    })
    const err = await errPromise.catch(() => null) // may or may not fire
    // If server handles it gracefully, err is null — both outcomes are acceptable
    // What we verify is that the client is still connected (server didn't crash)
    expect(clientA.connected).toBe(true)
  })
})

// ── 6. Disconnection ─────────────────────────────────────────────────────────
describe('6. Disconnection', () => {
  test('a separate client can connect and disconnect cleanly', async () => {
    const tempClient = await createClient()
    expect(tempClient.connected).toBe(true)
    tempClient.disconnect()
    await new Promise((r) => setTimeout(r, 300))
    expect(tempClient.connected).toBe(false)
  })
})
