
// server/db/pool.cjs
const fs = require('fs');
const path = require('path');
const sql = require('mssql/msnodesqlv8');

function loadConnectionString() {
  if (process.env.CONNECTION_STRING && process.env.CONNECTION_STRING.trim()) {
    return process.env.CONNECTION_STRING.trim();
  }

  const appSettingsPath = path.join(process.cwd(), 'appsettings.json');
  if (fs.existsSync(appSettingsPath)) {
    try {
      const raw = fs.readFileSync(appSettingsPath, 'utf8');
      const json = JSON.parse(raw);
      const cs = json?.ConnectionStrings?.AppDb;
      if (typeof cs === 'string' && cs.trim()) return cs.trim();
    } catch {
    }
  }

  return null;
}

const connectionString = loadConnectionString();

const config = connectionString
  ? { connectionString }
  : {
      database: process.env.RPOSDBLHOTSE,
      server: process.env.RTPX2,
      options: {
        trustedConnection: true,
        encrypt: false,
      },
      driver: 'msnodesqlv8',
    };

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect();
  }
  return poolPromise;
}

module.exports = { sql, getPool };
``
