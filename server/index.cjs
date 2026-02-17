
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

/** Load connection string from .env or appsettings.json */
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
    } catch (e) {
      console.warn('appsettings.json exists but could not be parsed:', e.message);
    }
  }
  return null;
}

const connectionString = loadConnectionString();

/** Decide which driver to use */
const wantV8 =
  process.env.DB_DRIVER === 'msnodesqlv8' ||
  /Trusted_Connection\s*=\s*(Yes|True)/i.test(connectionString || '');

/** Import the correct mssql variant */
const sql = wantV8 ? require('mssql/msnodesqlv8') : require('mssql');
console.log(
  `Driver in use: ${wantV8 ? 'msnodesqlv8' : 'tedious'} (module: ${
    wantV8 ? 'mssql/msnodesqlv8' : 'mssql'
  })`
);

/** Build the pool config */
let poolConfig;
if (connectionString) {
  // simplest and most robust: pass a single connection string
  poolConfig = { connectionString };
} else {
  // fallback to discrete fields if you don’t want a single string
  const bool = (v, d) => String(v ?? d).toLowerCase() === 'true';
  poolConfig = wantV8
    ? {
        server: process.env.DB_SERVER, // e.g. HOST or HOST\\INSTANCE
        database: process.env.DB_NAME,
        options: {
          trustedConnection: bool(process.env.DB_TRUSTED, true),
          trustServerCertificate: bool(process.env.DB_TRUST_SERVER_CERT, true),
          encrypt: bool(process.env.DB_ENCRYPT, true),
        },
      }
    : {
        server: process.env.DB_SERVER,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        options: {
          trustServerCertificate: bool(process.env.DB_TRUST_SERVER_CERT, true),
          encrypt: bool(process.env.DB_ENCRYPT, true),
        },
      };
}

/** Spin up Express after we know the driver */
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors()); // dev only
app.use(express.json());

/** Connection pool */
const pool = new sql.ConnectionPool(poolConfig);
const poolConnect = pool.connect();
poolConnect
  .then(() => console.log('DB connected'))
  .catch((err) => {
    console.error('DB connect failed:', err);
    if (err?.originalError) console.error('originalError:', err.originalError);
    process.exit(1);
  });

/** Generic helper to add simple lookup endpoints */
function addLookupRoute(routePath, sqlText) {
  app.get(routePath, async (_req, res) => {
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
addLookupRoute(
  '/api/lookups/primary-lobs',
  `
  SELECT lob_code AS code, description AS label
  FROM s_lob
  ORDER BY description;
`
);

addLookupRoute(
  '/api/lookups/audit-categories',
  `
  SELECT audit_category_code AS code, description AS label
  FROM s_audit_category
  ORDER BY description;
`
);

addLookupRoute(
  '/api/lookups/sales-report-groups',
  `
  SELECT SalesReportGroupCode AS code, description AS label
  FROM SalesReportGroup
  ORDER BY description;
`
);

addLookupRoute(
  '/api/lookups/sales-report-categories',
  `
  SELECT SalesReportCategoryCode AS code, Description AS label
  FROM SalesReportCategory
  ORDER BY Description;
`
);

addLookupRoute(
  '/api/lookups/display-categories',
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
`
);


// LOBs (independent from Display Group/Category)
addLookupRoute(
  '/api/lookups/lobs',
  `
  SELECT lob_code AS code, description AS label
  FROM s_lob
  -- If you have an active flag, keep it (uncomment):
  -- WHERE active_ind IN ('Y')
  ORDER BY description;
`
);

// Display Groups (used to filter Display Categories list)
addLookupRoute(
  '/api/lookups/display-groups',
  `
  SELECT display_group_code AS code, description AS label
  FROM s_display_group
  -- If you have an active flag, keep it (uncomment):
  -- WHERE active_ind IN ('Y')
  ORDER BY description;
`
);



/** Helper to map SQL aliases -> UI model */
function mapRow(r) {
  return {
    code: r['Code'],
    description: r['Description'],
    active: r['Active'],
    displayOrder: r['Display Order'],
    display: r['Display'],
    displayCategoryCode: r['Display Category Code'],
    displayCategory: r['Display Category'],
    maxQuantity: r['Max Qty'],
    securityLevel: r['Security Level'],
    priceChangeLevel: r['Price Change'],
    commission: r['Commission'],
    passComp: r['Pass Comp'],
    ticketComp: r['Ticket Comp'],
    otherComp: r['Other Comp'],
    passTrade: r['Pass Trade'],
    ticketTrade: r['Ticket Trade'],
    otherTrade: r['Other Trade'],
    identifyCustomer: r['ID Customer'],
    coupon: r['Coupon'],
    reservation: r['Reservation'],
    primaryLob: r['Primary LOB'],
    primaryLobCode: r['Primary LOB Code'],
    receiptLabel: r['Receipt Label'],
    loyaltyProduct: r['Loyalty Product'],
    auditCategory: r['Audit Category'],
    auditCategoryCode: r['Audit Category Code'],
    redemptionProduct: r['Redemption Product'],
    comment: r['Comment'],
    shippingCategoryCode: r['Shipping Category Code'],
    shippingCategory: r['Shipping Category'],
    moreInfoUrl: r['More Info URL'],
    imageUrl: r['Image URL'],
    imageHeight: r['Image Height'],
    imageWidth: r['Image Width'],
    specialStartDate: r['Special Start Date'],
    specialEndDate: r['Special End Date'],
    specialText: r['Special Text'],
    operatorId: r['Operator ID'],
    updateDate: r['Update Date'],
    validateCustomerSp: r['Validate Customer SP'],
    featuredProduct: r['Featured Product'],
    customerAgeMin: r['Customer Age (Min)'],
    customerAgeMax: r['Customer Age (Max)'],
    minAdvanceDays: r['Min Advance Days'],
    maxAdvanceDays: r['Max Advance Days'],
    salesReportCategoryCode: r['Sales Report Category Code'],
    salesReportCategory: r['Sales Report Category'],
    internetAuthorizationCode: r['InternetAuthorizationCode'],
    internetAuthorization: r['Internet Authorization'],
    priceByLocation: r['Price By Location'],
    priceBySeason: r['Price By Season'],
    paymentProfileRequired: r['Payment Profile Required'],
    salesReportGroupCode: r['Sales Report Group Code'],
    salesReportGroup: r['Sales Report Group'],
    depositRequired: r['Deposit Required'],
    allowDelivery: r['Allow Delivery'],
    pickupLocationTypeCode: r['Pickup Location Type Code'],
    pickupLocationType: r['Pickup Location Type'],
    units: r['units'],
    unitOfMeasureCode: r['unit_of_measure_code'],
    relationId: r['relation_id'],
    autoRenew: r['Auto Renew'],
    displayTitle: r['Display Title'],
    internalComment: r['Internal Comment'],
    hideReceiptPrice: r['Hide Receipt Price'],
    currencyCode: r['Currency Code'],
    priceByPricingRule: r['Price By Pricing Rule'],
    priceBySalesChannel: r['Price By Sales Channel'],
  };
}

/** GET /api/products (filters + paging + expand-by-code) */
app.get('/api/products', async (req, res) => {
  await poolConnect;

  const {
    code,
    expandCategory, // 'true' to expand category by code
    active, // <-- we will bind this
    categoryCode, // legacy server param
    displayCategory, // current client param
    description, // text search on description
    codeLike, // prefix match on code
    
    lob,            // NEW: LOB filter from Advanced
    displayGroup,   // NEW: Display Group filter from Advance

    page = '1',
    pageSize = '50',
  } = req.query;

  const p = pool.request();

  // Page math
  const pageNum = Math.max(1, parseInt(page, 10));
  const sizeNum = Math.min(3000, Math.max(1, parseInt(pageSize, 10)));
  const offset = (pageNum - 1) * sizeNum;

  
// 👇 NEW: nullify code when expanding category so SQL doesn't restrict to one PHC
const effectiveCode = expandCategory === 'true' ? null : code;


  // Bind common params (bind NULL when not provided)

const activeParam =
    typeof active === 'string' && active.trim().length === 0 ? null : active ?? null;
  p.input('active', sql.VarChar(1), activeParam);

  //p.input('code', sql.VarChar(50), code ?? null);
  p.input('code', sql.VarChar(50), effectiveCode ?? null);           // <-- changed
  p.input('codeLike', sql.VarChar(50), codeLike ? `${codeLike}%` : null);
  // SQL below uses LIKE '%' + @description + '%', so pass plain text here
  p.input('description', sql.NVarChar(200), description ?? null);
  p.input('offset', sql.Int, offset);
  p.input('limit', sql.Int, sizeNum);

// NEW: optional Advanced filters (NULL = ignore)
  p.input('lob', sql.VarChar(50), lob ?? null);
  p.input('displayGroup', sql.VarChar(50), displayGroup ?? null);


  // Resolve category:
  // prefer explicit categoryCode/displayCategory; else if expandCategory && code, look it up.
  let catValue = categoryCode ?? displayCategory ?? null;
  let anchorCategoryName = null;

  if (expandCategory === 'true' && code && !catValue) {
    const catReq = pool.request();
    catReq.input('code', sql.VarChar(50), code);
    const catSql = `
      SELECT TOP 1
        sdc.display_category_code AS cat,
        sdc.description AS catName
      FROM s_product_header sph
      JOIN s_display_category sdc
        ON sdc.display_category_code = sph.display_category_code
      WHERE sph.product_header_code = @code;
    `;
    try {
      const catResult = await catReq.query(catSql);
      const row = catResult.recordset[0];
      if (!row) {
        // If anchoring requested but PHC not found, 404
        return res.status(404).json({ error: 'PHC_NOT_FOUND', code });
      }
      catValue = row.cat;
      anchorCategoryName = row.catName;
    } catch (err) {
      console.error('DB_ERROR (resolve category by code):', err);
      return res.status(500).json({ error: 'DB_ERROR', detail: err.message });
    }
  }

  // Bind @cat (use Int if numeric, otherwise VarChar fallback)
  const catAsInt = catValue != null && !Number.isNaN(Number(catValue)) ? parseInt(catValue, 10) : null;
  if (catAsInt != null) {
    p.input('cat', sql.Int, catAsInt);
  } else {
    p.input('cat', sql.VarChar(50), catValue ?? null);
  }

  // Core SELECT with filters
  const selectCore = `
SELECT
  sph.product_header_code [Code],
  sph.description [Description],
  sph.active_ind [Active],
  sph.display_order [Display Order],
  sph.display_ind [Display],
  sdc.display_category_code [Display Category Code],
  sdc.description [Display Category],
  sph.max_quantity [Max Qty],
  sph.security_level [Security Level],
  sph.price_change_level [Price Change],
  sph.commission_ind [Commission],
  CASE WHEN sphmf.mm_function_code = 35 THEN 'Y' ELSE '' END AS [Pass Comp],
  CASE WHEN sphmf.mm_function_code = 10 THEN 'Y' ELSE '' END AS [Ticket Comp],
  CASE WHEN sphmf.mm_function_code = 12 THEN 'Y' ELSE '' END AS [Other Comp],
  CASE WHEN sphmf.mm_function_code = 40 THEN 'Y' ELSE '' END AS [Pass Trade],
  CASE WHEN sphmf.mm_function_code = 42 THEN 'Y' ELSE '' END AS [Ticket Trade],
  CASE WHEN sphmf.mm_function_code = 45 THEN 'Y' ELSE '' END AS [Other Trade],
  sph.identify_customer_ind [ID Customer],
  CASE WHEN sphmf.mm_function_code = 80 THEN 'Y' ELSE '' END AS [Coupon],
  '' [Reservation],
  slob.description [Primary LOB],
  sph.primary_lob_code [Primary LOB Code],
  sph.receipt_label [Receipt Label],
  sph.loyalty_product_code [Loyalty Product],
  sac.description [Audit Category],
  sph.audit_category_code [Audit Category Code],
  sph.redemption_product_code [Redemption Product],
  sph.comment_text [Comment],
  ssc.shipping_category_code [Shipping Category Code],
  ssc.description [Shipping Category],
  sphi.more_info_url [More Info URL],
  sphi.image_url [Image URL],
  sphi.image_height [Image Height],
  sphi.image_width [Image Width],
  CONVERT(nvarchar, sphi.special_start_date, 23) [Special Start Date],
  CONVERT(nvarchar, sphi.special_end_date, 23) [Special End Date],
  sphi.special_text [Special Text],
  sph.operator_id [Operator ID],
  CONVERT(nvarchar, sph.update_date, 23) [Update Date],
  sph.validate_customer_sp [Validate Customer SP],
  sphi.featured_product_ind [Featured Product],
  sph.customer_min_age [Customer Age (Min)],
  sph.customer_max_age [Customer Age (Max)],
  sphad.max_advance_days [Advance Days],
  sph.SalesReportCategoryCode [Sales Report Category Code],
  src.Description [Sales Report Category],
  sphi.internet_authorization_code [InternetAuthorizationCode],
  sia.description [Internet Authorization],
  sph.price_by_location_ind [Price By Location],
  sph.price_by_season_ind [Price By Season],
  sph.payment_profile_required_ind [Payment Profile Required],
  srg.SalesReportGroupCode [Sales Report Group Code],
  srg.description [Sales Report Group],
  sph.deposit_required_ind [Deposit Required],
  sph.allow_delivery_ind [Allow Delivery],
  sph.pickup_location_type_code [Pickup Location Type Code],
  '' [Pickup Location Type],
  sph.units [units],
  sph.unit_of_measure_code [unit_of_measure_code],
  sphruh.relation_id [relation_id],
  sph.renewal_ind [Auto Renew],
  sph.display_title [Display Title],
  sphad.min_advance_days [Min Advance Days],
  sphad.max_advance_days [Max Advance Days],
  sph.internal_comment [Internal Comment],
  sph.receipt_price_hidden_ind [Hide Receipt Price],
  sph.CurrencyCode [Currency Code],
  sph.price_by_pricingrule_ind [Price By Pricing Rule],
  sph.price_by_sales_channel_ind [Price By Sales Channel]
FROM s_display_group sdg
JOIN s_display_category sdc
  ON sdg.display_group_code = sdc.display_group_code
JOIN s_product_header sph
  ON sdc.display_category_code = sph.display_category_code
JOIN s_lob slob
  ON sph.primary_lob_code = slob.lob_code
LEFT JOIN s_audit_category sac
  ON sph.audit_category_code = sac.audit_category_code
LEFT JOIN s_product_header_internet sphi
  ON sph.product_header_code = sphi.product_header_code
LEFT JOIN s_shipping_category ssc
  ON sphi.shipping_category_code = ssc.shipping_category_code
LEFT JOIN SalesReportCategory src
  ON sph.SalesReportCategoryCode = src.SalesReportCategoryCode
LEFT JOIN s_internet_authorization sia
  ON sphi.internet_authorization_code = sia.internet_authorization_code
LEFT JOIN s_product_header_mm_function sphmf
  ON sph.product_header_code = sphmf.product_header_code
LEFT JOIN s_system_function sf
  ON sphmf.mm_function_code = sf.system_function_code
LEFT JOIN s_product_header_advance_days sphad
  ON sph.product_header_code = sphad.product_header_code
LEFT JOIN SalesReportGroup srg
  ON src.SalesReportGroupCode = srg.SalesReportGroupCode
LEFT JOIN s_product_header_resort_units_header sphruh
  ON sph.product_header_code = sphruh.product_header_code
WHERE sdc.active_ind = 'Y'
  AND (@active IS NULL OR sph.active_ind = @active)
  
  AND (@lob IS NULL OR sph.primary_lob_code = @lob)
  AND (@displayGroup IS NULL OR sdg.display_group_code = @displayGroup)

  AND (@cat IS NULL OR sdc.display_category_code = @cat)
  AND (@description IS NULL OR sph.description LIKE '%' + @description + '%')
  AND (@code IS NULL OR sph.product_header_code = @code)
  AND (@codeLike IS NULL OR sph.product_header_code LIKE @codeLike)
`;

  const paged = `
WITH base AS (
  ${selectCore}
)
SELECT * FROM base
ORDER BY [Display Order]
OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
`;


/** -------------------------------------------
 * Product Components: Available Components (Tree)
 * GET /api/components/tree
 * ------------------------------------------- */
app.get('/api/components/tree', async (_req, res) => {
  await poolConnect;
  try {
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
          sp.display_order       AS component_order
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

    // Shape to hierarchical JSON the UI expects:
    // [{ groupCode, label, order, categories: [{ categoryCode, label, order, components: [{code,label,order}] }] }]
    const groupMap = new Map();
    for (const r of rows) {
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
    console.error('DB_ERROR (/api/components/tree):', err);
    res.status(500).json({ error: 'DB_ERROR', detail: err.message });
  }
});

/** -------------------------------------------
 * Product Components: Assigned to a Product PHC
 * GET /api/products/:phc/components
 * ------------------------------------------- */
app.get('/api/products/:phc/components', async (req, res) => {
  await poolConnect;
  try {
    const { phc } = req.params;
    const p = pool.request();
    p.input('phc', sql.NVarChar, phc);

    const result = await p.query(`
      SELECT DISTINCT
          sphl.product_code        AS component_code,
          sp.description           AS component_desc
      FROM s_product_header_location sphl
      JOIN s_product sp
        ON sp.product_code = sphl.product_code
      WHERE sphl.product_header_code = @phc
      ORDER BY sp.description;
    `);

    // UI expects: [{ component_code, component_desc }, ...]
    res.json(result.recordset);
  } catch (err) {
    console.error('DB_ERROR (/api/products/:phc/components):', err);
    res.status(500).json({ error: 'DB_ERROR', detail: err.message });
  }
});
``


  try {
    const result = await p.query(paged);
    res.json({
      rows: result.recordset.map(mapRow),
      page: pageNum,
      pageSize: sizeNum,
      anchorCode: code ?? null,
      anchorCategory:
        catAsInt != null ? catAsInt : catValue ?? null,
      anchorCategoryName: anchorCategoryName ?? null,
    });
  } catch (err) {
    console.error('DB_ERROR:', err);
    res.status(500).json({ error: 'DB_ERROR', detail: err.message });
  }
});

/** Start server (keep this at the bottom) */
const port = parseInt(process.env.PORT, 10) || 3001;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));