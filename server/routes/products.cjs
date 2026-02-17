
// server/routes/products.cjs
const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../db/pool.cjs');

router.get('/products/:phc/components', async (req, res, next) => {
  try {
    const { phc } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('phc', sql.NVarChar, phc)
      .query(`
        SELECT DISTINCT
            sphl.product_code        AS component_code,
            sp.description           AS component_desc
        FROM s_product_header_location sphl
        JOIN s_product sp
          ON sp.product_code = sphl.product_code
        WHERE sphl.product_header_code = @phc
        ORDER BY sp.description;
      `);

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
``
