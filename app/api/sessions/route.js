const express = require('express')
const sessions = require('../../../lib/sessions')
const auth = require('../../../lib/auth')

const router = express.Router()

// daftar riwayat (tanpa refresh token)
router.get('/', (req, res) => {
  res.json({ success: true, sessions: sessions.list(), storage: sessions.storage })
})

// aktivasi ulang pakai refresh token yang tersimpan
router.post('/reactivate', async (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ success: false, message: 'email wajib diisi.' })

  const session = sessions.find(email)
  if (!session) return res.status(404).json({ success: false, message: 'sesi tidak ditemukan, verifikasi ulang dulu.' })
  if (!session.refreshToken) return res.status(400).json({ success: false, message: 'sesi ini tidak punya refresh token.' })

  const r = await auth.re(session.refreshToken)
  if (!r.ok) return res.status(400).json({ success: false, message: r.why || 'refresh token gagal.' })

  const premium = await auth.pro(r.id)
  const entry = sessions.add({
    email: session.email,
    uid: session.uid,
    orderId: premium.ok ? premium.order : session.orderId,
    status: premium.ok ? 'ACTIVE' : 'INACTIVE',
    refreshToken: r.ref || session.refreshToken
  })

  return res.json({
    success: true,
    message: premium.ok ? 'aktivasi ulang berhasil, premium aktif.' : 'login berhasil, aktivasi premium gagal.',
    data: {
      email: session.email,
      uid: session.uid,
      orderId: premium.ok ? premium.order : session.orderId,
      status: premium.ok ? 'ACTIVE' : 'INACTIVE',
      idToken: r.id,
      simulated: !!r.simulated,
      premiumError: premium.ok ? null : premium.why
    },
    sessions: entry
  })
})

module.exports = router
