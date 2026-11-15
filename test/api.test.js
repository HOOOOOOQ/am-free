// jalankan: npm test
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

// data diarahkan ke folder sementara biar nggak nyentuh data repo
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pall-am-test-'))
process.env.PALL_AM_DATA_DIR = tmpDir
process.env.PALL_AM_SIMULATE = '1'
process.env.PALL_AM_RATE_LIMIT = '5'

const app = require('../app')

let server
let base

const call = async (method, url, body) => {
  const res = await fetch(base + url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* html */ }
  return { status: res.status, json, text }
}

before(async () => {
  await new Promise(resolve => {
    server = app.listen(0, '127.0.0.1', () => {
      base = 'http://127.0.0.1:' + server.address().port
      resolve()
    })
  })
})

after(() => {
  server.close()
  fs.rmSync(tmpDir, { recursive: true, force: true })
  delete process.env.PALL_AM_DATA_DIR
  delete process.env.PALL_AM_SIMULATE
  delete process.env.PALL_AM_RATE_LIMIT
})

test('halaman utama tampil dengan branding pall/am', async () => {
  const res = await fetch(base + '/')
  const html = await res.text()
  assert.equal(res.status, 200)
  assert.match(html, /pall\/am/)
  assert.match(html, /id="simtag"/)
})

test('favicon tersedia', async () => {
  const res = await fetch(base + '/favicon.svg')
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type'), /svg/)
})

test('header keamanan terpasang', async () => {
  const res = await fetch(base + '/api/status')
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(res.headers.get('x-powered-by'), null)
})

test('GET /api/config balikin domain & mode simulasi', async () => {
  const { status, json } = await call('GET', '/api/config')
  assert.equal(status, 200)
  assert.equal(json.brand, 'pall/am')
  assert.equal(json.simulate, true)
})

test('GET /api/status online', async () => {
  const { status, json } = await call('GET', '/api/status')
  assert.equal(status, 200)
  assert.equal(json.status, 'online')
})

test('email tidak valid ditolak 400', async () => {
  const { status, json } = await call('POST', '/api/send-link', { email: 'bukan-email' })
  assert.equal(status, 400)
  assert.equal(json.success, false)
})

test('endpoint api yang tidak ada balas json 404', async () => {
  const { status, json } = await call('GET', '/api/tidak-ada')
  assert.equal(status, 404)
  assert.equal(json.success, false)
})

test('alur simulasi: kirim link → verifikasi → premium aktif', async () => {
  const email = 'produk@example.com'

  const sent = await call('POST', '/api/send-link', { email })
  assert.equal(sent.status, 200)
  assert.equal(sent.json.success, true)
  assert.equal(sent.json.simulated, true)

  const verified = await call('POST', '/api/verify-link', { email, magicLink: 'sim' })
  assert.equal(verified.status, 200)
  assert.equal(verified.json.data.status, 'ACTIVE')
  assert.match(verified.json.data.orderId, /^pall-sim-/)

  const sessions = await call('GET', '/api/sessions')
  assert.equal(sessions.json.sessions.length, 1)
  assert.equal(sessions.json.sessions[0].email, email)
  assert.equal(sessions.json.sessions[0].refreshToken, undefined, 'refresh token tidak boleh bocor')
})

test('aktifkan ulang pakai sesi tersimpan', async () => {
  const { status, json } = await call('POST', '/api/sessions/reactivate', { email: 'produk@example.com' })
  assert.equal(status, 200)
  assert.equal(json.data.status, 'ACTIVE')
  assert.match(json.data.idToken, /^sim\./)
})

test('sesi yang tidak ada → 404', async () => {
  const { status } = await call('POST', '/api/sessions/reactivate', { email: 'nobody@example.com' })
  assert.equal(status, 404)
})

test('simulasi tidak menambah counter stats', async () => {
  const before = await call('GET', '/api/stats')
  await call('POST', '/api/verify-link', { email: 'dua@example.com', magicLink: 'sim' })
  const after = await call('GET', '/api/stats')
  assert.equal(after.json.total, before.json.total)
})

test('rate limit POST per IP jalan', async () => {
  let limited = null
  for (let i = 0; i < 8; i++) {
    const r = await call('POST', '/api/send-link', { email: 'spam@example.com' })
    if (r.status === 429) { limited = r; break }
  }
  assert.ok(limited, 'harusnya kena 429 setelah limit')
  assert.equal(limited.json.success, false)
})
