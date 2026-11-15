const fs = require('fs')
const path = require('path')
const cfg = require('./config')

const dataDir = cfg.dataDir
const seedFile = path.join(cfg.root, 'data', 'stats.json')
const statsFile = path.join(dataDir, 'stats.json')

const storage = cfg.serverless ? 'tmp' : (dataDir === path.join(cfg.root, 'data') ? 'file' : 'dir')

function ensureDataDir() {
  if (fs.existsSync(dataDir)) return
  try {
    fs.mkdirSync(dataDir, { recursive: true })
  } catch (e) {
    console.error('Failed to create data directory:', e.message)
  }
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0]
}

const defaultStats = {
  totalPremium: 0,
  todayPremium: 0,
  lastDate: getTodayDateString()
}

// kalau file counter belum ada (mis. /tmp kosong setelah cold start), ambil angka bawaan repo
function seedStats() {
  try {
    if (statsFile === seedFile) return
    if (!fs.existsSync(statsFile) && fs.existsSync(seedFile)) {
      ensureDataDir()
      fs.copyFileSync(seedFile, statsFile)
    }
  } catch (err) {
    console.error('Error seeding stats file:', err.message)
  }
}

function loadStats() {
  seedStats()
  try {
    if (fs.existsSync(statsFile)) {
      const data = JSON.parse(fs.readFileSync(statsFile, 'utf8'))
      const today = getTodayDateString()
      if (data.lastDate !== today) {
        data.todayPremium = 0
        data.lastDate = today
        saveStats(data)
      }
      return data
    }
  } catch (err) {
    console.error('Error reading stats.json, initializing defaults:', err.message)
  }

  saveStats(defaultStats)
  return { ...defaultStats }
}

function saveStats(statsObj) {
  try {
    ensureDataDir()
    fs.writeFileSync(statsFile, JSON.stringify(statsObj, null, 2), 'utf8')
  } catch (err) {
    // read-only fs — jangan sampai bikin request gagal
    console.error('Error writing stats file:', err.message)
  }
}

function getStats() {
  const current = loadStats()
  return {
    total: current.totalPremium || 0,
    today: current.todayPremium || 0
  }
}

function incrementStats() {
  const current = loadStats()
  current.totalPremium = (current.totalPremium || 0) + 1
  current.todayPremium = (current.todayPremium || 0) + 1
  current.lastDate = getTodayDateString()
  saveStats(current)
  return {
    total: current.totalPremium,
    today: current.todayPremium
  }
}

module.exports = {
  getStats,
  incrementStats,
  storage,
  file: statsFile
}
