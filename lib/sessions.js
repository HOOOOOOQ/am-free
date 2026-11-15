const fs = require('fs')
const os = require('os')
const path = require('path')

// di vercel fs read-only kecuali /tmp — sama seperti lib/stats.js
const serverless = !!process.env.VERCEL
const dataDir = path.join(__dirname, '..', 'data')
const file = serverless
  ? path.join(os.tmpdir(), 'pall-am-sessions.json')
  : path.join(dataDir, 'sessions.json')

const LIMIT = 20

function ensureDir() {
  if (serverless || fs.existsSync(dataDir)) return
  try { fs.mkdirSync(dataDir, { recursive: true }) } catch (e) { console.error('mkdir data gagal:', e.message) }
}

function read() {
  try {
    if (!fs.existsSync(file)) return []
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
    return Array.isArray(raw) ? raw : []
  } catch (e) {
    console.error('baca sesi gagal:', e.message)
    return []
  }
}

function write(list) {
  try {
    ensureDir()
    fs.writeFileSync(file, JSON.stringify(list, null, 2), 'utf8')
  } catch (e) {
    console.error('tulis sesi gagal:', e.message)
  }
}

function list() {
  return read()
    .map(({ refreshToken, ...safe }) => safe)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
}

function add(entry) {
  const all = read().filter(s => s.email !== entry.email)
  all.unshift({
    email: entry.email,
    uid: entry.uid || '-',
    orderId: entry.orderId || null,
    status: entry.status || 'UNKNOWN',
    at: new Date().toISOString(),
    refreshToken: entry.refreshToken || null
  })
  write(all.slice(0, LIMIT))
  return list()
}

function find(email) {
  const target = String(email || '').trim().toLowerCase()
  return read().find(s => String(s.email).toLowerCase() === target) || null
}

module.exports = { list, add, find, storage: serverless ? 'tmp' : 'file' }
