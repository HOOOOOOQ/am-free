const axios = require('axios')
const crypto = require('crypto')
const cfg = require('./config')

const key = 'AIzaSyDtG1AU22ErnQD60AzBAcaknySiz9_CEq0'
const idt = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty'
const vfy = 'https://us-central1-alight-creative.cloudfunctions.net/verifyPurchase'
const stk = 'https://securetoken.googleapis.com/v1/token'

const dip = () => `${crypto.randomInt(1, 255)}.${crypto.randomInt(0, 255)}.${crypto.randomInt(0, 255)}.${crypto.randomInt(1, 255)}`

const sp = h => ({
  ...h,
  'x-forwarded-for': dip(),
  'x-real-ip': dip(),
  'client-ip': dip(),
  'x-client-ip': dip(),
  'x-originating-ip': dip(),
  'x-cluster-client-ip': dip()
})

const h1 = {
  'content-type': 'application/json',
  'x-android-package': 'com.alightcreative.motion',
  'x-android-cert': 'ECA6BF91B8715A6F810ED0BBFC65B6CD578F52A8',
  'user-agent': 'dalvik/2.1.0 (linux; u; android 15; 23127pn0cc build/bp1a.250505.005)'
}

const h2 = {
  'content-type': 'application/json; charset=utf-8',
  'user-agent': 'okhttp/3.12.1',
  'accept-encoding': 'gzip'
}

const bad = e => {
  const d = e.response?.data
  return d ? (typeof d === 'object' ? JSON.stringify(d) : String(d)) : e.message
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// request keluar dengan timeout + retry (hanya untuk error jaringan / 5xx)
async function post(url, data, headers) {
  let last
  for (let i = 0; i <= cfg.retries; i++) {
    try {
      return await axios.post(url, data, { headers, timeout: cfg.timeout })
    } catch (e) {
      last = e
      const status = e.response?.status
      if (status && status < 500) break
      if (i < cfg.retries) await sleep(350 * (i + 1))
    }
  }
  throw last
}

function code(raw) {
  if (!raw) return null
  let s = String(raw).replace(/&amp;/g, '&')
  try { s = decodeURIComponent(s) } catch {}
  try {
    const u = new URL(s)
    let c = u.searchParams.get('oobCode')
    if (!c) {
      const n = u.searchParams.get('link') || u.searchParams.get('q') || u.searchParams.get('url')
      if (n) { try { c = new URL(n).searchParams.get('oobCode') } catch {} }
    }
    if (c) return c.replace(/[^a-zA-Z0-9_-]/g, '')
  } catch {}
  const m = s.match(/oobCode=([a-zA-Z0-9_-]+)/i)
  if (m) return m[1]
  const t = raw.trim()
  if (/^[a-zA-Z0-9_-]{10,}$/.test(t) && !t.includes('://')) return t
  return null
}

// ---- mode simulasi: tidak ada request keluar sama sekali ----
const sim = {
  token: () => 'sim.' + crypto.randomBytes(12).toString('hex'),
  refresh: () => 'sim-ref-' + crypto.randomBytes(9).toString('hex'),
  order: () => 'pall-sim-' + crypto.randomBytes(4).toString('hex')
}

async function link(email) {
  if (cfg.simulate) return { ok: true, simulated: true }
  try {
    await post(`${idt}/getOobConfirmationCode?key=${key}`, {
      requestType: 6,
      email: email,
      androidInstallApp: true,
      canHandleCodeInApp: true,
      continueUrl: 'https://alightcreative.com?ui_sid=0366624874&ui_sd=0',
      iosBundleId: 'com.alightcreative.motion',
      androidPackageName: 'com.alightcreative.motion',
      androidMinimumVersion: '585',
      clientType: 'CLIENT_TYPE_ANDROID'
    }, sp(h1))
    return { ok: true }
  } catch (e) { return { ok: false, why: bad(e) } }
}

async function auth(email, raw) {
  if (cfg.simulate) {
    // di simulasi semua link diterima, termasuk kata "sim"
    return {
      ok: true,
      simulated: true,
      email,
      id: sim.token(),
      ref: sim.refresh(),
      uid: 'sim-' + crypto.createHash('sha1').update(String(email)).digest('hex').slice(0, 12),
      baru: true,
      user: { email, emailVerified: true, displayName: null, localId: null }
    }
  }
  const c = code(raw)
  if (!c) return { ok: false, why: 'code gak ada' }
  try {
    const a = await post(`${idt}/emailLinkSignin?key=${key}`, {
      email: email, oobCode: c, clientType: 'CLIENT_TYPE_ANDROID'
    }, sp(h1))
    let u = null
    try {
      const b = await post(`${idt}/getAccountInfo?key=${key}`, { idToken: a.data.idToken }, sp(h1))
      u = b.data?.users?.[0] || null
    } catch {}
    return {
      ok: true, email: email,
      id: a.data.idToken, ref: a.data.refreshToken,
      uid: a.data.localId, baru: !!a.data.isNewUser, user: u
    }
  } catch (e) { return { ok: false, why: bad(e) } }
}

async function pro(id) {
  if (cfg.simulate) return { ok: true, simulated: true, order: sim.order(), r: { simulated: true } }
  const o = 'pall-' + crypto.randomBytes(6).toString('hex')
  const b = {
    data: {
      productId: 'am.full.sub.annual.19q4',
      token: 'mmgaobamlahbbeccfplmbkbb.AO-J1OzqG0or_GJJIx-ms8GrTm-jaglCRfhQSRPUZKpl2YspYS-oN7_94uv8RC5vQbvd_Ios2pPDStZ2n7F0hLE3FiOU7HS3R6Fquulv5xLXFECSv4ctElw',
      skuType: 'subs',
      orderId: o
    }
  }
  const h = {
    ...h2,
    authorization: 'Bearer ' + id,
    'firebase-instance-id-token': 'cSDnCyp3T-uwp07z3tL86T:APA91bFkmvvsHw5nnqa1SBFci-99DRsKClLiETdRrVcJjS5yBx1v_FbCb1d8WhBuea_zmwnYBktyTIzcRhN4b6uNOUur9wPc0gKXmJDoZic0LhNq5V2s0xI'
  }
  try {
    const r = await post(vfy, b, sp(h))
    return { ok: true, order: o, r: r.data }
  } catch (e) { return { ok: false, why: bad(e) } }
}

async function re(ref) {
  if (cfg.simulate) return { ok: true, simulated: true, id: sim.token(), ref: sim.refresh() }
  try {
    const r = await post(`${stk}?key=${key}`, {
      grant_type: 'refresh_token', refresh_token: ref
    }, sp({ 'content-type': 'application/json' }))
    return { ok: true, id: r.data.id_token, ref: r.data.refresh_token }
  } catch (e) { return { ok: false, why: bad(e) } }
}

module.exports = { link, auth, pro, re, code }
