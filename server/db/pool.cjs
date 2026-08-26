// server/db/pool.cjs
const fs = require('fs');
const path = require('path');
const sql = require('mssql/msnodesqlv8');

const SERVERS = {
  lhotse:  'rposdblhotse',
  gasher:  'rposdbgasher',
  makalu:  'rposdbmakalu',
  manaslu: 'rposdbmanaslu',
  'cho-oyu': 'cho-oyu',
};

const APP_SETTINGS_PATH = path.join(process.cwd(), 'appsettings.json');

function buildConfig(serverKey) {
  return {
    server: SERVERS[serverKey],
    database: 'rtpx2',
    options: {
      trustedConnection: true,
      encrypt: false,
      trustServerCertificate: true,
    },
  };
}

function serverKeyFromConnectionString(cs) {
  for (const [key, host] of Object.entries(SERVERS)) {
    if (cs.toLowerCase().includes(host.toLowerCase())) return key;
  }
  return null;
}

function loadInitialServerKey() {
  if (process.env.CONNECTION_STRING && process.env.CONNECTION_STRING.trim()) {
    const key = serverKeyFromConnectionString(process.env.CONNECTION_STRING);
    if (key) return key;
  }
  if (fs.existsSync(APP_SETTINGS_PATH)) {
    try {
      const raw = fs.readFileSync(APP_SETTINGS_PATH, 'utf8');
      const json = JSON.parse(raw);
      const cs = json?.ConnectionStrings?.AppDb;
      if (typeof cs === 'string' && cs.trim()) {
        const key = serverKeyFromConnectionString(cs);
        if (key) return key;
      }
    } catch { /* fall through */ }
  }
  return 'lhotse';
}

let activeServerKey = loadInitialServerKey();
let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(buildConfig(activeServerKey)).connect()
      .catch((err) => {
        poolPromise = null; // don't cache failures — let the next call retry
        throw err;
      });
  }
  return poolPromise;
}

function switchServer(serverKey) {
  if (!SERVERS[serverKey]) throw new Error(`Unknown server key: ${serverKey}`);

  // Abandon the existing pool immediately (close in background, don't wait)
  const oldPromise = poolPromise;
  poolPromise = null;
  if (oldPromise) {
    oldPromise
      .then((pool) => pool.close())
      .catch(() => { /* ignore — pool may never have connected */ });
  }

  activeServerKey = serverKey;

  // Persist server key to appsettings.json
  try {
    let settings = {};
    if (fs.existsSync(APP_SETTINGS_PATH)) {
      settings = JSON.parse(fs.readFileSync(APP_SETTINGS_PATH, 'utf8'));
    }
    settings.ConnectionStrings = settings.ConnectionStrings || {};
    settings.ConnectionStrings.AppDb = `Server=${SERVERS[serverKey]};Database=rtpx2;Trusted_Connection=True;TrustServerCertificate=True;`;
    fs.writeFileSync(APP_SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.warn('Could not persist appsettings.json:', err.message);
  }

  // Pool will be created on the next actual request
}

function getCurrentServerKey() {
  return activeServerKey;
}

module.exports = { sql, getPool, switchServer, getCurrentServerKey, SERVERS };
