// konfigurasi terpusat — semua bisa diatur lewat env, default-nya aman buat lokal
const fs = require('fs')
const os = require('os')
const path = require('path')

// baca .env tanpa dependency tambahan (env asli tetap menang)
function loadDotEnv() {
  const file = path.join(__dirname, '..', '.env')
  try {
    if (!fs.existsSync(file)) return
    fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m) return
      const key = m[1]
      const value = m[2].replace(/^['"]|['"]$/g, '')
      if (process.env[key] === undefined) process.env[key] = value
    })
  } catch (e) {
    console.error('baca .env gagal:', e.message)
  }
}

loadDotEnv()

const num = (value, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const root = path.join(__dirname, '..')
const serverless = !!process.env.VERCEL

// di host read-only (vercel) data ditaruh di /tmp, tapi tetap bisa diarahkan manual
const dataDir = process.env.PALL_AM_DATA_DIR
  ? path.resolve(process.env.PALL_AM_DATA_DIR)
  : (serverless ? os.tmpdir() : path.join(root, 'data'))

const config = {
  brand: 'pall/am',
  version: '1.0.0',
  root,
  serverless,
  dataDir,

  // mode simulasi: semua panggilan firebase/verifyPurchase di-mock, aman buat QA
  simulate: /^(1|true|yes|on)$/i.test(String(process.env.PALL_AM_SIMULATE || '')),

  // timeout & retry request keluar (biar nggak mati gara-gara socket disconnect)
  timeout: num(process.env.PALL_AM_TIMEOUT, 15000),
  retries: Number.isFinite(Number(process.env.PALL_AM_RETRIES)) ? Math.max(0, Number(process.env.PALL_AM_RETRIES)) : 2,

  // batas request POST per IP per menit (0 = matikan)
  rateLimit: Number.isFinite(Number(process.env.PALL_AM_RATE_LIMIT)) ? Math.max(0, Number(process.env.PALL_AM_RATE_LIMIT)) : 30
}

config.storage = config.dataDir === path.join(root, 'data') ? 'file' : path.join('dir:', config.dataDir)

module.exports = config
