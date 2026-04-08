/* eslint-disable no-console */
require('dotenv').config();

/** Verify DB connectivity on startup */
const { getPool } = require('./db/pool.cjs');
getPool()
  .then(() => console.log('DB connected'))
  .catch((err) => {
    console.error('DB connect failed:', err);
    if (err?.originalError) console.error('originalError:', err.originalError);
    process.exit(1);
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
