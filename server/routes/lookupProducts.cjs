const express = require('express');
const router = express.Router();
//const sql = require('mssql'); // or msnodesqlv8, as needed


/** Generic helper to add simple lookup endpoints */
function addLookupRoute(routePath, sqlText, pool, poolConnect) {
  router.get(routePath, async (_req, res) => {
    await poolConnect;
    try {
      const result = await pool.request().query(sqlText);
      res.json({ rows: result.recordset });
    } catch (err) {
      console.error(`DB_ERROR (${routePath}):`, err);
      res.status(500).json({ error: 'DB_ERROR', detail: err.message });
    }
  });
}

/** Register lookups */
module.exports = (pool, poolConnect) => {
/** Manage Products For Sale **/
addLookupRoute(
  '/lookups/primary-lobs',
  `
  SELECT lob_code AS code, description AS label
  FROM s_lob
  WHERE s_lob.active_ind = 'Y'
  ORDER BY description;
` ,pool, poolConnect
);

addLookupRoute(
  '/lookups/audit-categories',
  `
  SELECT audit_category_code AS code, description AS label
  FROM s_audit_category
  WHERE s_audit_category.active_ind = 'Y'

  ORDER BY description;
` ,pool, poolConnect
);

addLookupRoute(
  '/lookups/sales-report-groups',
  `
  SELECT SalesReportGroupCode AS code, description AS label
  FROM SalesReportGroup
  ORDER BY description;
` ,pool, poolConnect
);

addLookupRoute(
  '/lookups/sales-report-categories',
  `
  SELECT SalesReportCategoryCode AS code, Description AS label
  FROM SalesReportCategory
  ORDER BY Description;
` ,pool, poolConnect
);

addLookupRoute(
  '/lookups/display-categories',
  `
  SELECT
    sdc.display_category_code AS code,
    sdc.description AS label,
    sdg.display_group_code AS groupCode,
    sdg.description AS groupLabel,
    sdc.display_order AS displayOrder
  FROM s_display_category sdc
  JOIN s_display_group sdg
    ON sdg.display_group_code = sdc.display_group_code
  WHERE sdc.active_ind IN ('Y')
  ORDER BY sdc.display_order, sdc.description;
` ,pool, poolConnect
);


// LOBs (independent from Display Group/Category)
addLookupRoute(
  '/lookups/lobs',
  `
  SELECT lob_code AS code, description AS label
  FROM s_lob
  -- If you have an active flag, keep it (uncomment):
  -- WHERE active_ind IN ('Y')
  ORDER BY description;
` ,pool, poolConnect
);

// Display Groups (used to filter Display Categories list)
addLookupRoute(
  '/lookups/display-groups',
  `
  SELECT display_group_code AS code, description AS label
  FROM s_display_group
  -- If you have an active flag, keep it (uncomment):
  -- WHERE active_ind IN ('Y')
  ORDER BY description;
` ,pool, poolConnect
);

// Manage Product Components // General Tab
addLookupRoute(
  '/lookups/product-categories',
  `
  SELECT
    spc.product_category_code AS code,
	spc.description AS label,
    spg.product_group_code AS groupCode,
	spg.description AS groupLabel,
	spc.display_order AS displayOrder

FROM s_product_group spg
	JOIN s_product_category spc
		ON spg.product_group_code = spc.product_group_code
WHERE spc.active_ind IN ('Y')
ORDER BY
	spc.display_order, spc.description;
  ` ,pool, poolConnect
);

addLookupRoute(
  '/lookups/product-profile-types',
  `
  SELECT sppt.product_profile_type_code AS code, sppt.description AS label
  FROM s_product_profile_type sppt
  WHERE sppt.active_ind IN ('Y')
  ORDER BY
  sppt.display_order, sppt.description;
  ` ,pool, poolConnect
);


addLookupRoute(
  '/lookups/deferral-patterns',
  `
  SELECT sdp.deferral_pattern_code AS code, sdp.description AS label
  FROM s_deferral_pattern sdp
  WHERE sdp.active_ind IN ('Y')
  ORDER BY
  sdp.display_order, sdp.description;
  ` ,pool, poolConnect
);

return router;
};