// server/routes/lookupProducts.cjs
const express = require('express');
const router = express.Router();
const { getPool } = require('../db/pool.cjs');

/** Generic helper to add simple lookup endpoints */
function addLookupRoute(routePath, sqlText) {
  router.get(routePath, async (_req, res) => {
    try {
      const pool = await getPool();
      const result = await pool.request().query(sqlText);
      res.json({ rows: result.recordset });
    } catch (err) {
      console.error(`DB_ERROR (${routePath}):`, err);
      res.status(500).json({ error: 'DB_ERROR', detail: err.message });
    }
  });
}

/** Manage Products For Sale **/
addLookupRoute(
  '/lookups/primary-lobs',
  `SELECT lob_code AS code, description AS label
   FROM s_lob
   WHERE active_ind = 'Y'
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/audit-categories',
  `SELECT audit_category_code AS code, description AS label
   FROM s_audit_category
   WHERE active_ind = 'Y'
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/sales-report-groups',
  `SELECT SalesReportGroupCode AS code, description AS label
   FROM SalesReportGroup
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/sales-report-categories',
  `SELECT SalesReportCategoryCode AS code, Description AS label
   FROM SalesReportCategory
   ORDER BY Description;`
);

addLookupRoute(
  '/lookups/display-categories',
  `SELECT
     sdc.display_category_code AS code,
     sdc.description AS label,
     sdg.display_group_code AS groupCode,
     sdg.description AS groupLabel,
     sdc.display_order AS displayOrder
   FROM s_display_category sdc
   JOIN s_display_group sdg
     ON sdg.display_group_code = sdc.display_group_code
   WHERE sdc.active_ind = 'Y'
   ORDER BY sdc.display_order, sdc.description;`
);

addLookupRoute(
  '/lookups/lobs',
  `SELECT lob_code AS code, description AS label
   FROM s_lob
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/display-groups',
  `SELECT display_group_code AS code, description AS label
   FROM s_display_group
   ORDER BY description;`
);

/** Manage Product Components — General Tab **/
addLookupRoute(
  '/lookups/product-categories',
  `SELECT
     spc.product_category_code AS code,
     spc.description AS label,
     spg.product_group_code AS groupCode,
     spg.description AS groupLabel,
     spc.display_order AS displayOrder
   FROM s_product_group spg
   JOIN s_product_category spc
     ON spg.product_group_code = spc.product_group_code
   WHERE spc.active_ind = 'Y'
   ORDER BY spc.display_order, spc.description;`
);

addLookupRoute(
  '/lookups/product-profile-types',
  `SELECT product_profile_type_code AS code, description AS label
   FROM s_product_profile_type
   WHERE active_ind = 'Y'
   ORDER BY display_order, description;`
);

addLookupRoute(
  '/lookups/deferral-patterns',
  `SELECT deferral_pattern_code AS code, description AS label
   FROM s_deferral_pattern
   WHERE active_ind = 'Y'
   ORDER BY display_order, description;`
);

/** Manage Product Components — Additional Tab **/
addLookupRoute(
  '/lookups/crm-customer-types',
  `SELECT CRMCustomerTypeCode AS code, description AS label
   FROM CRMCustomerType
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/crm-product-categories',
  `SELECT CRMProductCategoryCode AS code, description AS label
   FROM CRMProductCategory
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/crm-products',
  `SELECT CRMProductCode AS code, description AS label
   FROM CRMProduct
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/inventory-pools',
  `SELECT InventoryPoolCode AS code, Description AS label
   FROM InventoryPool
   ORDER BY Description;`
);

addLookupRoute(
  '/lookups/revenue-statistics',
  `SELECT statistic_code AS code, description AS label
   FROM s_statistic
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/rosters',
  `SELECT RosterCode AS code, Description AS label
   FROM Roster
   ORDER BY Description;`
);

addLookupRoute(
  '/lookups/sales-statistics',
  `SELECT statistic_code AS code, description AS label
   FROM s_statistic
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/deferral-calendars',
  `SELECT deferralcalendarcode AS code, description AS label
   FROM DeferralCalendar
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/customer-property-sets',
  `SELECT CustomerPropertySetCode AS code, Description AS label
   FROM CustomerPropertySet
   ORDER BY Description;`
);

addLookupRoute(
  '/lookups/revenue-location-override-categories',
  `SELECT display_category_code AS code, description AS label
   FROM s_display_category
   WHERE active_ind = 'Y'
   ORDER BY description;`
);

/** Manage Product Components — Profile Tab **/
addLookupRoute(
  '/lookups/lift-product-types',
  `SELECT lift_product_type_code AS code, description AS label
   FROM s_lift_product_type
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/scan-process-orders',
  `SELECT scan_process_order_code AS code, description AS label
   FROM s_scan_process_order
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/lift-scan-types',
  `SELECT scan_type_code AS code, description AS label
   FROM s_scan_type
   ORDER BY description;`
);

addLookupRoute(
  '/lookups/expiration-types',
  `SELECT expiration_type AS code, expiration_type AS label
   FROM s_lift_product_profile
   WHERE expiration_type IS NOT NULL
   GROUP BY expiration_type
   ORDER BY expiration_type;`
);

module.exports = router;
