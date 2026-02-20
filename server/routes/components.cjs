
// server/routes/components.cjs
const express = require('express');
const router = express.Router();
const { getPool } = require('../db/pool.cjs');

router.get('/components/tree', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
          spg.product_group_code,
          spg.description        AS product_group_desc,
          spg.display_order      AS product_group_order,

          spc.product_category_code,
          spc.description        AS product_category_desc,
          spc.display_order      AS product_category_order,

          sp.product_code        AS component_code,
          sp.description         AS component_desc,
          sp.display_order       AS component_order,
          sp.active_ind          AS component_active,
          sp.display_ind         AS component_display,
          sp.units              AS component_units,
          NULL                  AS component_sale_units,
          sp.sales_statistic_code AS component_sales_statistic_code,
          sp.product_profile_type_code AS component_product_profile_type_code
      FROM s_product_group spg
      JOIN s_product_category spc
          ON spg.product_group_code = spc.product_group_code
         AND spg.active_ind = 'Y'
         AND spc.active_ind = 'Y'
      JOIN s_product sp
          ON spc.product_category_code = sp.product_category_code
         AND sp.active_ind = 'Y'
         AND sp.display_ind = 'Y'
      ORDER BY
          spg.display_order,
          spg.product_group_code,
          spg.description,
          spc.display_order,
          spc.product_category_code,
          spc.description,
          sp.display_order,
          sp.product_code,
          sp.description;
    `);

    const rows = result.recordset;

    // Shape into hierarchy (group -> category -> components)
    const groupMap = new Map();
    for (const r of rows) {
      // Group
      let g = groupMap.get(r.product_group_code);
      if (!g) {
        g = {
          groupCode: r.product_group_code,
          label: r.product_group_desc,
          order: r.product_group_order,
          categories: [],
          _catMap: new Map(),
        };
        groupMap.set(r.product_group_code, g);
      }
      // Category
      let c = g._catMap.get(r.product_category_code);
      if (!c) {
        c = {
          categoryCode: r.product_category_code,
          label: r.product_category_desc,
          order: r.product_category_order,
          components: [],
        };
        g._catMap.set(r.product_category_code, c);
        g.categories.push(c);
      }
      // Component
      c.components.push({
        code: r.component_code,
        label: r.component_desc,
        order: r.component_order,
        active_ind: r.component_active,
        display_ind: r.component_display,
        

        units: r.component_units,
        sale_units: r.component_sale_units,
        sales_statistic_code: r.component_sales_statistic_code,
        product_profile_type_code: r.component_product_profile_type_code

      });
    }

    const tree = Array.from(groupMap.values()).map(g => {
      delete g._catMap;
      return g;
    });

    res.json(tree);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
