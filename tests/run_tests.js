/**
 * run_tests.js — AgriKart Master Test Runner
 *
 * Runs all test suites in sequence with a pre-flight checklist.
 * Usage:  node run_tests.js
 */

'use strict'

const readline = require('readline')
const { execSync, spawnSync } = require('child_process')
const path   = require('path')
const fs     = require('fs')

// ── ANSI colours ──────────────────────────────────────────────────────────────
const C = {
  reset  : '\x1b[0m',
  bold   : '\x1b[1m',
  dim    : '\x1b[2m',
  red    : '\x1b[31m',
  green  : '\x1b[32m',
  yellow : '\x1b[33m',
  cyan   : '\x1b[36m',
  white  : '\x1b[97m',
  bgBlue : '\x1b[44m',
}

function c(color, text) { return `${C[color]}${text}${C.reset}` }
function bold(text)      { return `${C.bold}${text}${C.reset}` }
function header(text) {
  const line = '═'.repeat(60)
  console.log(`\n${c('cyan', line)}`)
  console.log(`${c('cyan', '  ' + text)}`)
  console.log(`${c('cyan', line)}`)
}
function step(text)  { console.log(`\n  ${c('yellow', '▸')} ${bold(text)}`) }
function ok(text)    { console.log(`  ${c('green',  '✔')} ${text}`) }
function warn(text)  { console.log(`  ${c('yellow', '⚠')} ${text}`) }
function fail(text)  { console.log(`  ${c('red',    '✘')} ${text}`) }
function info(text)  { console.log(`  ${c('dim', text)}`) }

// ── Prompt helper (readline) ──────────────────────────────────────────────────
function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

// ── Check if a port is responding ─────────────────────────────────────────────
async function isPortUp(port) {
  return new Promise((resolve) => {
    const net = require('net')
    const sock = new net.Socket()
    sock.setTimeout(1500)
    sock.once('connect',  () => { sock.destroy(); resolve(true) })
    sock.once('error',    () => { sock.destroy(); resolve(false) })
    sock.once('timeout',  () => { sock.destroy(); resolve(false) })
    sock.connect(port, '127.0.0.1')
  })
}

// ── Run a Jest test file, stream its output live ───────────────────────────────
function runJest(testFile) {
  const result = spawnSync(
    'npx',
    ['jest', testFile, '--runInBand', '--verbose', '--no-coverage', '--forceExit'],
    {
      cwd  : __dirname,
      stdio: 'inherit',        // stream stdout/stderr directly to terminal
      shell: true,
      env  : { ...process.env, FORCE_COLOR: '1' },
    }
  )
  return result.status === 0
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.clear()

  // ── Banner ─────────────────────────────────────────────────────────────────
  console.log()
  console.log(c('cyan', bold('  ╔══════════════════════════════════════════════════════╗')))
  console.log(c('cyan', bold('  ║         AgriKart  —  TEST RUNNER       ║')))
  console.log(c('cyan', bold('  ╚══════════════════════════════════════════════════════╝')))
  console.log()
  console.log(c('dim', '  Runs: Database · Backend API · Socket.io · Frontend'))
  console.log()

  // ── Step 1: Install dependencies if needed ─────────────────────────────────
  header('STEP 1 — Dependencies')
  const nmPath = path.join(__dirname, 'node_modules')

  if (!fs.existsSync(nmPath)) {
    step('node_modules not found — installing test dependencies...')
    try {
      execSync('npm install', { cwd: __dirname, stdio: 'inherit' })
      ok('Dependencies installed')
    } catch {
      fail('npm install failed. Check your internet connection and try again.')
      process.exit(1)
    }
  } else {
    ok('Dependencies already installed')
  }

  // ── Step 2: Check .env ─────────────────────────────────────────────────────
  header('STEP 2 — Environment Check')
  const envPath = path.join(__dirname, '../backend/.env')

  if (!fs.existsSync(envPath)) {
    warn('backend/.env not found!')
    info('Copy backend/.env.example → backend/.env and fill in your Supabase credentials.')
    info('Database tests will fail without this.')
    const cont = await prompt('\n  Continue anyway? (y/n): ')
    if (cont.toLowerCase() !== 'y') {
      console.log('\n  Aborting. Set up backend/.env first.\n')
      process.exit(0)
    }
  } else {
    ok('backend/.env found')
  }

  // ── Step 3: Pre-flight server check ───────────────────────────────────────
  header('STEP 3 — Server Status')

  const backendUp  = await isPortUp(3001)
  const frontendUp = await isPortUp(3000)

  if (backendUp)  ok('Backend  is running on http://localhost:3001')
  else            warn('Backend  is NOT running on port 3001')

  if (frontendUp) ok('Frontend is running on http://localhost:3000')
  else            warn('Frontend is NOT running on port 3000')

  if (!backendUp || !frontendUp) {
    console.log()
    console.log(c('yellow', bold('  ┌─ Servers required ───────────────────────────────────────┐')))
    console.log(c('yellow',      '  │                                                           │'))
    if (!backendUp)  {
      console.log(c('yellow',    '  │  Backend  →  cd backend  &&  npm run dev                  │'))
    }
    if (!frontendUp) {
      console.log(c('yellow',    '  │  Frontend →  cd frontend &&  npm run dev                  │'))
    }
    console.log(c('yellow',      '  │                                                           │'))
    console.log(c('yellow', bold('  └───────────────────────────────────────────────────────────┘')))
    console.log()

    const ans = await prompt(
      `  ${c('yellow', '?')} Some servers are offline.\n` +
      `    ${c('dim', '[d]')} Run database tests only (no server needed)\n` +
      `    ${c('dim', '[a]')} Run ALL tests anyway (offline tests will fail)\n` +
      `    ${c('dim', '[q]')} Quit and start servers first\n` +
      `  Choice [d/a/q]: `
    )

    if (ans.toLowerCase() === 'q') {
      console.log('\n  Start your servers and run  node run_tests.js  again.\n')
      process.exit(0)
    }

    if (ans.toLowerCase() === 'd') {
      // Database-only mode
      console.log()
      header('RUNNING — Database Tests Only')
      const passed = runJest('database.test.js')
      console.log()
      console.log(passed ? c('green', bold('  ✔ Database tests PASSED')) : c('red', bold('  ✘ Database tests FAILED')))
      console.log()
      process.exit(passed ? 0 : 1)
    }
    // else fall through and run all (some will fail — user chose 'a')
  } else {
    const ready = await prompt(`\n  ${c('green', '✔')} All servers are up! Press ${bold('Enter')} to start testing... `)
  }

  // ── Step 4: Run all test suites ────────────────────────────────────────────
  const suites = [
    { name: 'Database',     file: 'database.test.js',  needs: null    },
    { name: 'Backend API',  file: 'backend.test.js',   needs: 3001    },
    { name: 'Socket.io',    file: 'socket.test.js',    needs: 3001    },
    { name: 'Frontend',     file: 'frontend.test.js',  needs: 3000    },
  ]

  const results = []

  for (const suite of suites) {
    header(`RUNNING — ${suite.name} Tests  (${suite.file})`)

    // Skip if required server is down and user chose 'a'
    if (suite.needs && !(suite.needs === 3001 ? backendUp : frontendUp)) {
      warn(`Skipping — server on port ${suite.needs} is not running`)
      results.push({ name: suite.name, status: 'SKIPPED' })
      continue
    }

    const passed = runJest(suite.file)
    results.push({ name: suite.name, status: passed ? 'PASSED' : 'FAILED' })
  }

  // ── Final Summary ──────────────────────────────────────────────────────────
  console.log()
  console.log(c('cyan', '═'.repeat(60)))
  console.log(c('cyan', bold('  FINAL RESULTS')))
  console.log(c('cyan', '═'.repeat(60)))
  console.log()

  let allPassed = true
  for (const r of results) {
    if (r.status === 'PASSED')  { ok(bold(`${r.name.padEnd(16)} PASSED`)) }
    else if (r.status === 'SKIPPED') { warn(`${r.name.padEnd(16)} SKIPPED`) }
    else { fail(bold(`${r.name.padEnd(16)} FAILED`)); allPassed = false }
  }

  console.log()
  if (allPassed) {
    console.log(c('green', bold('  ✔ All tests completed successfully!')))
  } else {
    console.log(c('red', bold('  ✘ Some tests failed — see output above for details.')))
  }
  console.log()

  process.exit(allPassed ? 0 : 1)
}

main().catch((err) => {
  console.error('\n' + c('red', '  Unexpected error: ') + err.message)
  process.exit(1)
})
