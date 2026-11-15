const fs = require('fs')
const path = require('path')
const cfg = require('./config')

const dataDir = cfg.dataDir
const file = path.join(dataDir, 'sessions.json')
const LIMIT = 20

const storage = cfg.serverless ? 'tmp' : (dataDir === path.join(cfg.root, 'data') ? 'file' : 'dir')

function ensureDir() {
  if (fs.existsSync(dataDir)) return
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

// daftar untuk publik — refresh token tidak pernah ikut
function list() {
  return read()
    .map(({ refreshToken, ...safe }) => safe)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, LIMIT)
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

module.exports = { list, add, find, storage, file }
