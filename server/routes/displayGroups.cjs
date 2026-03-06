const express = require('express');
const router = express.Router();
const { getPool } = require('../db/pool.cjs');

router.get('/', async (req, res) => {
  try {
    const { code = '', description = '', active = 'Y' } = req.query;

    const pool = await getPool();
    const request = pool.request();
    request.input('code', `%${String(code).trim()}%`);
    request.input('description', `%${String(description).trim()}%`);
    request.input('active', String(active).trim());

    const query = `
      SELECT
        sdg.display_group_code AS code,
        sdg.description AS description,
        sdg.active_ind AS active,
        sdg.display_order AS displayOrder,
        sdg.operator_id AS operatorId,
        CONVERT(VARCHAR, sdg.update_date, 103) AS updated
      FROM s_display_group sdg
      WHERE
        (@active = '' OR sdg.active_ind = @active)
        AND (@code = '%%' OR sdg.display_group_code LIKE @code)
        AND (@description = '%%' OR sdg.description LIKE @description)
      ORDER BY
        sdg.display_order,
        sdg.display_group_code
    `;

    const result = await request.query(query);
    res.json({ rows: result.recordset ?? [] });
  } catch (err) {
    console.error('[display-groups] GET failed', err);
    res.status(500).json({ error: 'Failed to load display groups' });
  }
});

module.exports = router;