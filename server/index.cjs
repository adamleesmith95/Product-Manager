/* eslint-disable no-console */
require('dotenv').config();

/** Verify DB connectivity on startup (non-fatal — user can switch via UI) */
const { getPool, switchServer, getCurrentServerKey, SERVERS } = require('./db/pool.cjs');
getPool()
  .then(() => console.log(`DB connected (${getCurrentServerKey()})`)) 
  .catch((err) => {
    console.warn(`DB connect failed for "${getCurrentServerKey()}" — server stays up so you can switch via the UI.`);
    if (err?.originalError) console.warn('originalError:', err.originalError);
  });

/** Express setup */
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors()); // dev only
app.use(express.json());

/** Mount routes */
const componentsRoutes = require('./routes/productTables/components.cjs');
const productsRoutes = require('./routes/productTables/products.cjs');
const displayCategoriesRoutes = require('./routes/productTables/displayCategories.cjs');
const displayGroupsRoutes = require('./routes/productTables/displayGroups.cjs');
const lookupProductsRoutes = require('./routes/lookupProducts.cjs');

app.use('/api', componentsRoutes);
app.use('/api', productsRoutes);
app.use('/api', displayCategoriesRoutes);
app.use('/api/display-groups', displayGroupsRoutes);
app.use('/api', lookupProductsRoutes);

/** DB server selector */
app.get('/api/db-server', (_req, res) => {
  res.json({ serverKey: getCurrentServerKey(), servers: Object.keys(SERVERS) });
});

app.post('/api/db-server', (req, res) => {
  const { serverKey } = req.body;
  if (!SERVERS[serverKey]) {
    return res.status(400).json({ error: `Unknown server key: ${serverKey}` });
  }
  try {
    switchServer(serverKey);
    console.log(`Switched DB to ${serverKey}`);
    res.json({ serverKey });
  } catch (err) {
    console.error('DB switch failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/** JSON error handler — must come after routes, before static/SPA fallback */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('API error:', err.message);
  res.status(err.status ?? 500).json({ error: err.message || 'Internal server error' });
});

const path = require("path");

// React build output (at project root)
const clientDistPath = path.join(__dirname, "../dist");

// Serve static files
app.use(express.static(clientDistPath));

// SPA fallback — FINAL middleware (no route pattern)
app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});



/** Start server */
const port = parseInt(process.env.PORT, 10) || 3001;
app.listen(port, () =>
  console.log(`API listening on http://localhost:${port}`)
);
