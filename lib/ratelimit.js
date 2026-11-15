const cfg = require('./config')

// rate limiter sederhana in-memory (per IP + method) — cukup buat 1 instance
const hits = new Map()
const WINDOW = 60 * 1000

function cleanup(now) {
  for (const [key, entry] of hits) {
    if (now - entry.start > WINDOW) hits.delete(key)
  }
}

function rateLimit(req, res, next) {
  if (!cfg.rateLimit || req.method !== 'POST') return next()

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown'
  const key = ip + ':' + req.baseUrl
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || now - entry.start > WINDOW) {
    if (hits.size > 5000) cleanup(now)
    hits.set(key, { start: now, count: 1 })
    return next()
  }

  entry.count += 1
  if (entry.count > cfg.rateLimit) {
    const retry = Math.ceil((WINDOW - (now - entry.start)) / 1000)
    res.setHeader('Retry-After', String(retry))
    return res.status(429).json({
      success: false,
      message: `terlalu banyak request, coba lagi dalam ${retry} detik.`
    })
  }

  next()
}

rateLimit.reset = () => hits.clear()

module.exports = rateLimit
