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

**live:** [am.neonode.my.id](https://am.neonode.my.id)

<img src="https://img.shields.io/badge/status-unofficial-orange" alt="">
<img src="https://img.shields.io/badge/reverse--engineering-deep-red" alt="">
<img src="https://img.shields.io/badge/node-18%2B-green" alt="">

**team reverse — pall/am:** ansari • zenno

<a href="https://whatsapp.com/channel/0029Vb6hVYK8V0tkiz4bKs0N"><img src="https://img.shields.io/badge/Join%20Channel%20pall%2Fam-25D366?logo=whatsapp&logoColor=white" alt="Join Channel pall/am"></a>

</div>

> ⚠️ **UNOFFICIAL — `pall/am` bukan alat resmi dari Alight Creative.**
> Dibuat murni dari **reverse engineering mendalam** terhadap aplikasi Android Alight Motion: di-snip trafiknya, dibedah protokol Firebase Auth & endpoint `verifyPurchase`-nya, lalu di-reimplement jadi CLI + web. Kalau kelakuanmu kena ban, tanggung sendiri.

---

## apa yang bisa dilakuin

- **magic link login** — masuk pake email doang, tanpa password, tanpa akun google
- **premium aktif otomatis** — langsung nempel ke akun setelah verifikasi
- **auto refresh token** — aktivasi ulang kapan aja dari sesi tersimpan
- **dual mode** — CLI buat yang mager, web UI buat yang mau tampilan
- **stealth headers** — nyamar 100% sebagai app android asli (`x-android-package` + `x-android-cert`)

## cara pakai

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
```bash
npm install
node server.js
```
buka `http://localhost:3300` — ikuti 3 langkah di layar.

---

## palet

aksen `pall/am` pakai gradien yang **mengalir** (animasi `flow`, 300%% background-size):

| token | warna | nama |
|---|---|---|
| `--a1` | `#a78bfa` | violet |
| `--a2` | `#38bdf8` | sky |
| `--a3` | `#34d399` | mint |

dipakai di wordmark, tombol, underline step aktif, angka statistik, pita atas, dan ambient glow yang bergerak pelan.
semua animasi otomatis mati kalau user pakai `prefers-reduced-motion: reduce`.

## deploy

### vercel
```bash
vercel          # preview
vercel --prod   # production
```
atau import repo ini lewat dashboard vercel — nggak perlu setting apa-apa, semua sudah dibaca dari `vercel.json`.

| file | peran |
|---|---|
| `app.js` | express app (dipakai lokal **dan** serverless) |
| `server.js` | listener lokal (`node server.js`) |
| `api/index.js` | entry point serverless vercel |
| `vercel.json` | rewrite `/api/*` → function, static dari `public/` |

> catatan: di vercel filesystem read-only, jadi `lib/stats.js` nyimpen counter ke `/tmp`.
> artinya angka "total aktivasi" bisa reset tiap cold start. mau permanen? tinggal ganti storage-nya ke vercel kv / upstash redis.

---

<div align="center">

**disclaimer** — ini riset independen. tidak berafiliasi dengan alight creative / google.
semua merek dagang milik pemiliknya masing-masing. gunakan atas risiko sendiri.
penyalahgunaan (akun orang lain, massal, komersial) bukan tanggung jawab pembuat.

</div>
