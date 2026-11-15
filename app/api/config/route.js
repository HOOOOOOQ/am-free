const express = require('express')
const cfg = require('../../../lib/config')
const { storage } = require('../../../lib/stats')
const sessions = require('../../../lib/sessions')

const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    success: true,
    brand: cfg.brand,
    version: cfg.version,
    emailDomain: cfg.emailDomain,
    suggestedEmail: cfg.suggestedEmail,
    simulate: cfg.simulate,
    timeout: cfg.timeout,
    retries: cfg.retries,
    rateLimit: cfg.rateLimit,
    storage: { stats: storage, sessions: sessions.storage }
  })
})

module.exports = router
