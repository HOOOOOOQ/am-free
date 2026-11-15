const express = require('express')
const auth = require('../../../lib/auth')
const { friendlyFirebaseError } = require('../../../lib/errors')
const cfg = require('../../../lib/config')

const router = express.Router()

router.post('/', async (req, res) => {
  const { email } = req.body
  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ success: false, message: 'email gak valid.' })
  }
  const em = email.trim().toLowerCase()
  const r = await auth.link(em)
  if (!r.ok) {
    return res.status(400).json({ success: false, message: friendlyFirebaseError(r.why), code: r.why })
  }
  const message = cfg.simulate
    ? `mode simulasi: link untuk ${em} tidak benar-benar dikirim. isi apa saja di langkah 2.`
    : `link dikirim ke ${em}. cek inbox / spam.`

  return res.json({ success: true, email: em, simulated: cfg.simulate, message })
})

module.exports = router