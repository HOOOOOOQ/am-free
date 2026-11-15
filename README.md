<div align="center">

<pre>
             _ _    __
 _ __   __ _| | |  / /_ _ _ __ ___
| '_ \ / _` | | | / / _` | '_ ` _ \
| |_) | (_| | | |/ / (_| | | | | | |
| .__/ \__,_|_|_/_/ \__,_|_| |_| |_|
|_|
</pre>

# pall/am — AlightMotion Premium Activate

**unofficial alight motion premium activator**

*reverse engineered — cli & web, no ads, no tracking*

<img src="https://img.shields.io/badge/version-1.0.0-a78bfa" alt="">
<img src="https://img.shields.io/badge/tests-12%20passed-34d399" alt="">
<img src="https://img.shields.io/badge/status-unofficial-orange" alt="">
<img src="https://img.shields.io/badge/node-18%2B-green" alt="">

**team reverse — pall/am:** ansari • zenno

<a href="https://whatsapp.com/channel/0029Vb6hVYK8V0tkiz4bKs0N"><img src="https://img.shields.io/badge/Join%20Channel%20pall%2Fam-25D366?logo=whatsapp&logoColor=white" alt="Join Channel pall/am"></a>

</div>

> ⚠️ **UNOFFICIAL — `pall/am` bukan alat resmi dari Alight Creative.**
> Dibuat murni dari **reverse engineering mendalam** terhadap aplikasi Android Alight Motion: di-snip trafiknya, dibedah protokol Firebase Auth & endpoint `verifyPurchase`-nya, lalu di-reimplement jadi CLI + web. Kalau kelakuanmu kena ban, tanggung sendiri.

---

## fitur

| | |
|---|---|
| **magic link login** | masuk pake email doang, tanpa password, tanpa akun google |
| **premium aktif otomatis** | langsung nempel ke akun setelah verifikasi |
| **riwayat sesi** | sesi tersimpan lokal, bisa **aktivasi ulang** tanpa kirim magic link baru |
| **dual mode** | CLI buat yang mager, web UI buat yang mau tampilan |
| **mode simulasi** | firebase & `verifyPurchase` di-mock — QA UI/CLI tanpa nyentuh API asli |
| **auto retry** | timeout 15s + retry 2x buat error jaringan / 5xx |
| **stealth headers** | nyamar sebagai app android asli (`x-android-package` + `x-android-cert`) |
| **rate limit** | 30 request POST / IP / menit (bisa diatur) |
| **siap serverless** | `app.js` dipakai bareng lokal & function vercel |

## quickstart

```bash
npm install
npm start                 # web  → http://localhost:3300
node am.js                # cli
npm run sim               # web mode simulasi (tanpa panggilan API asli)
npm test                  # 12 test
```

### cli
```
node am.js
```
| | |
|---|---|
| `1` | kirim magic link ke email |
| `2` | paste link dari email → premium aktif |
| `3` | aktivasi ulang dari sesi tersimpan |
| `4` | lihat sesi tersimpan |

### web
3 langkah di layar: **email → link → premium aktif**. Di panel bawah ada **riwayat sesi** dengan tombol aktivasi ulang. Enter di kolom input = lanjut ke langkah berikutnya.

## config

semua opsional dan punya default. copy `.env.example` → `.env` kalau mau diubah (dibaca tanpa dependency tambahan, env asli tetap menang).

| env | default | fungsi |
|---|---|---|
| `EMAIL_DOMAIN` | `sipall.my.id` | domain yang disarankan di form (`am@sipall.my.id`). **tidak** memblokir domain lain |
| `PALL_AM_SIMULATE` | `0` | `1` = mode simulasi, `verifyPurchase` di-mock, counter stats tidak nambah |
| `PALL_AM_TIMEOUT` | `15000` | timeout request keluar (ms) |
| `PALL_AM_RETRIES` | `2` | jumlah retry untuk error jaringan / 5xx |
| `PALL_AM_RATE_LIMIT` | `30` | batas POST / IP / menit (`0` = matikan) |
| `PALL_AM_DATA_DIR` | `./data` (`/tmp` di vercel) | lokasi file `stats.json` & `sessions.json` |
| `PORT` | `3300` | port server lokal |

## api

| method | path | fungsi |
|---|---|---|
| `GET` | `/healthz` | health check ringkas |
| `GET` | `/api/config` | brand, versi, domain, mode simulasi, storage |
| `GET` | `/api/status` | status service |
| `GET` | `/api/stats` | total & hari ini |
| `POST` | `/api/send-link` | kirim magic link (`{ email }`) |
| `POST` | `/api/verify-link` | verifikasi + premium (`{ email, magicLink }`) |
| `GET` | `/api/sessions` | riwayat sesi (refresh token tidak pernah dikirim) |
| `POST` | `/api/sessions/reactivate` | aktivasi ulang (`{ email }`) |

semua respons pakai bentuk `{ success, message, data? }`. error 400/404/429/500 selalu balas JSON.

## struktur

```
am.js                 cli (menu 1–4)
server.js             listener lokal
app.js                express app — dipakai lokal & serverless
api/index.js          entry point function vercel
lib/auth.js           firebase auth + verifyPurchase, retry/timeout, simulasi
lib/config.js         env + .env loader, path data
lib/sessions.js       riwayat sesi (maks 20, refresh token privat)
lib/stats.js          counter aktivasi
lib/ratelimit.js      rate limit in-memory per IP
lib/errors.js         pesan error firebase → bahasa manusia
app/api/*/route.js    endpoint per fitur
public/index.html     web UI (single file, tanpa build step)
public/favicon.svg    ikon `p/a`
test/api.test.js      test end-to-end (node --test)
```

## deploy

### vercel
```bash
vercel          # preview
vercel --prod   # production
```
atau import repo lewat dashboard — semua konfigurasi dibaca dari `vercel.json` (`/api/*` → function, static dari `public/`).

isi env di dashboard: `EMAIL_DOMAIN` (opsional), `PALL_AM_SIMULATE=0`.

> di vercel filesystem read-only, jadi data disimpan ke `/tmp` → counter & riwayat reset tiap cold start.
> mau permanen? arahkan `PALL_AM_DATA_DIR` ke volume, atau ganti storage ke vercel kv / upstash redis.

### docker / vps
```bash
npm install --omit=dev
PALL_AM_DATA_DIR=/var/lib/pall-am PORT=3300 node server.js
```

## troubleshooting

| gejala | solusi |
|---|---|
| `Client network socket disconnected` | jaringan blokir host google/firebase — coba dari host lain, atau naikkan `PALL_AM_TIMEOUT` |
| `429 terlalu banyak request` | tunggu 1 menit atau set `PALL_AM_RATE_LIMIT` lebih besar |
| counter/riwayat hilang setelah deploy | normal di serverless (`/tmp`), set `PALL_AM_DATA_DIR` ke volume permanen |
| `code gak ada` | link yang ditempel bukan dari email magic link, atau sudah dipakai |

---

<div align="center">

<sub>MIT license — lihat <code>LICENSE</code></sub>

**disclaimer** — ini riset independen. tidak berafiliasi dengan alight creative / google.
semua merek dagang milik pemiliknya masing-masing. gunakan atas risiko sendiri.
penyalahgunaan (akun orang lain, massal, komersial) bukan tanggung jawab pembuat.

</div>
