
// server/db/pool.cjs
const sql = require('mssql/msnodesqlv8');

const config = {
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
