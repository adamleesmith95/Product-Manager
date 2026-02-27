const express = require('express');
const router = express.Router();
const { getPool } = require('../db/pool.cjs');

/** GET /api/display-categories/tree
 * Returns all Display Categories grouped by Display Group
 */
router.get('/display-categories/tree', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        sdg.display_group_code,
        sdg.description AS display_group_desc,
        sdg.display_order AS display_group_order,

        sdc.display_category_code,
        sdc.description AS display_category_desc,
        sdc.display_group_code AS display_category_group_code,
        sdc.active_ind AS display_category_active,
        sdc.display_order AS display_category_order,
        sdc.operator_id AS display_category_operator_id,
        CONVERT(VARCHAR, sdc.update_date, 103) AS display_category_update_date
      FROM s_display_group sdg
      JOIN s_display_category sdc
        ON sdg.display_group_code = sdc.display_group_code
      WHERE sdg.active_ind = 'Y'
        AND sdc.active_ind = 'Y'
      ORDER BY
        sdg.display_order,
        sdg.display_group_code,
        sdc.display_order,
        sdc.display_category_code;
    `);

    const rows = result.recordset;
    const groupMap = new Map();

    for (const r of rows) {
      let g = groupMap.get(r.display_group_code);
      if (!g) {
        g = {
          groupCode: r.display_group_code,
          label: r.display_group_desc,
          order: r.display_group_order,
          categories: [],
        };
        groupMap.set(r.display_group_code, g);
      }

      g.categories.push({
        code: r.display_category_code,
        label: r.display_category_desc,
        displayGroupCode: r.display_category_group_code,
        active: r.display_category_active,
        order: r.display_category_order,
        operatorId: r.display_category_operator_id,
        updated: r.display_category_update_date,
      });
    }

    const tree = Array.from(groupMap.values());
    res.json(tree);
  } catch (err) {
    next(err);
  }
});

module.exports = router;