const express = require('express')
const path = require('path')
const apiRoutes = require('./app/api/route')

const app = express()

app.disable('x-powered-by')
app.use(require('cors')())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// di serverless (vercel) req.url bisa datang sebagai /api/index/... setelah rewrite
app.use((req, res, next) => {
  if (req.url.startsWith('/api/index')) {
    req.url = req.url.slice('/api/index'.length) || '/'
    if (!req.url.startsWith('/api')) req.url = '/api' + (req.url === '/' ? '' : req.url)
  }
  next()
})

app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate')
    }
  }
}))

app.use('/api', apiRoutes)

app.get('/healthz', (req, res) => res.json({ status: 'ok', brand: 'pall/am' }))

module.exports = app
