const express = require('express')
const cfg = require('../../../lib/config')

const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    status: 'online',
    brand: cfg.brand,
    version: cfg.version,
    simulate: cfg.simulate,
    timestamp: new Date().toISOString()
  })
})

module.exports = router
