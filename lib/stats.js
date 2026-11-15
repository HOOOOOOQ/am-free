const fs = require('fs');
const os = require('os');
const path = require('path');

// di vercel filesystem read-only kecuali /tmp, jadi stats disimpan di sana
const serverless = !!process.env.VERCEL;
const dataDir = path.join(__dirname, '..', 'data');
const seedFile = path.join(dataDir, 'stats.json');
const statsFile = serverless
  ? path.join(os.tmpdir(), 'pall-am-stats.json')
  : seedFile;

function ensureDataDir() {
  if (fs.existsSync(dataDir)) return;
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (e) {
    console.error('Failed to create data directory:', e);
  }
}

const defaultStats = {
  totalPremium: 0,
  todayPremium: 0,
  lastDate: getTodayDateString()
};

function getTodayDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function seedStats() {
  if (!serverless) return null;
  try {
    if (!fs.existsSync(statsFile) && fs.existsSync(seedFile)) {
      fs.copyFileSync(seedFile, statsFile);
    }
  } catch (err) {
    console.error('Error seeding stats file:', err);
  }
  return null;
}

function loadStats() {
  seedStats();
  try {
    if (fs.existsSync(statsFile)) {
      const raw = fs.readFileSync(statsFile, 'utf8');
      const data = JSON.parse(raw);

      const today = getTodayDateString();
      if (data.lastDate !== today) {
        data.todayPremium = 0;
        data.lastDate = today;
        saveStats(data);
      }
      return data;
    }
  } catch (err) {
    console.error('Error reading stats.json, initializing defaults:', err);
  }

  ensureDataDir();
  saveStats(defaultStats);
  return { ...defaultStats };
}

function saveStats(statsObj) {
  try {
    ensureDataDir();
    fs.writeFileSync(statsFile, JSON.stringify(statsObj, null, 2), 'utf8');
  } catch (err) {
    // read-only fs (serverless dingin) — jangan sampai bikin request gagal
    console.error('Error writing stats file:', err.message);
  }
}

function getStats() {
  const current = loadStats();
  return {
    total: current.totalPremium || 0,
    today: current.todayPremium || 0
  };
}

function incrementStats() {
  const current = loadStats();
  current.totalPremium = (current.totalPremium || 0) + 1;
  current.todayPremium = (current.todayPremium || 0) + 1;
  current.lastDate = getTodayDateString();
  saveStats(current);
  return {
    total: current.totalPremium,
    today: current.todayPremium
  };
}

module.exports = {
  getStats,
  incrementStats,
  storage: serverless ? 'tmp' : 'file'
};
