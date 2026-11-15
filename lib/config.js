// konfigurasi terpusat — semua bisa diatur lewat env, default-nya aman buat lokal
const fs = require('fs')
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
const config = {
  brand: 'pall/am',

  // domain email yang dipakai buat saran alamat (tidak memblokir domain lain)
  emailDomain: String(process.env.EMAIL_DOMAIN || 'sipall.my.id').trim().toLowerCase(),

  // mode simulasi: semua panggilan firebase/verifyPurchase di-mock, aman buat QA
  simulate: /^(1|true|yes|on)$/i.test(String(process.env.PALL_AM_SIMULATE || '')),

  // timeout & retry request keluar (biar nggak mati gara-gara socket disconnect)
  timeout: Number(process.env.PALL_AM_TIMEOUT || 15000),
  retries: Number(process.env.PALL_AM_RETRIES || 2)
}

config.suggestedEmail = 'am@' + config.emailDomain

module.exports = config
