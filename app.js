const express = require('express')
const path = require('path')
const cfg = require('./lib/config')
const apiRoutes = require('./app/api/route')
const rateLimit = require('./lib/ratelimit')

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', true)

// header keamanan dasar — sengaja tanpa X-Frame-Options / CSP frame-ancestors
// biar app tetap bisa di-embed di preview
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  next()
})

app.use(require('cors')())
app.use(express.json({ limit: '64kb' }))
app.use(express.urlencoded({ extended: true, limit: '64kb' }))

// di serverless (vercel) req.url bisa datang sebagai /api/index/... setelah rewrite
app.use((req, res, next) => {
  if (req.url.startsWith('/api/index')) {
    req.url = req.url.slice('/api/index'.length) || '/'
    if (!req.url.startsWith('/api')) req.url = '/api' + (req.url === '/' ? '' : req.url)
  }
  next()
})

app.use(express.static(path.join(cfg.root, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate')
    }
  }
}))

app.use('/api', rateLimit, apiRoutes)

// endpoint api yang nggak ada tetap balas json
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'endpoint nggak ada.' })
})

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', brand: cfg.brand, version: cfg.version, simulate: cfg.simulate })
})

// halaman lain → 404 json
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'halaman nggak ditemukan.' })
})

// error handler terakhir
app.use((err, req, res, next) => {
  console.error('server error:', err.message)
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500
  res.status(status).json({
    success: false,
    message: status === 413 ? 'payload terlalu besar.' : 'terjadi kesalahan di server.'
  })
})

module.exports = app
