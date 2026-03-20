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

          sp.product_profile_type_code AS component_product_profile_type_code,
          sppt.description       AS component_product_profile_type,

          sp.deferral_pattern_code   AS component_deferral_pattern_code,
          dp.description             AS component_deferral_pattern,

          sp.units              AS component_units,
          sp.revenue_report_ind AS component_revenue_report_ind,
          sp.change_revenue_location_ind AS component_change_revenue_location_ind,

          ISNULL(spip.InventoryPoolCode, '0') AS component_inventory_pool_code,
          ip.Description        AS component_inventory_pool,
          spip.offline_freesell_ind AS component_offline_freesell_ind,

          sp.sales_units        AS component_sale_units,
          sp.sales_statistic_code AS component_sales_statistic_code,
          ss.Description AS component_sales_statistic,
          ISNULL(spros.RosterCode, '0') AS component_roster_code,
          ros.Description AS component_roster,
          ISNULL(slpp.lift_product_type_code, '0') AS lift_product_type_code,
          slpt.description AS lift_product_type,
          
          
          
          ISNULL(slpp.scan_process_order_code, '0') AS component_scan_process_order_code,
        sspo.description AS component_scan_process_order,

        ISNULL(slpp.scan_type_code, '0') AS component_lift_scan_type_code,
        sst.description AS component_lift_scan_type,

        slpp.lift_charge_ind AS component_lift_charge_ind,
        slpp.load_to_media_ind AS component_load_to_media,
        CONVERT(varchar, slpp.effective_date, 103) AS component_lift_effective_date,
        slpp.expiration_type AS component_lift_expiration_type,
        slpp.expiration_days AS component_lift_expiration_days,
        CONVERT(varchar, slpp.expiration_date, 103) AS component_lift_expiration_date,

        ISNULL(slepp.lesson_product_type_code, '0') AS component_lesson_product_type_code,
        slept.description AS component_lesson_product_type,

        ISNULL(slepp.lesson_discipline_code, '0') AS component_lesson_discipline_code,
        sld.description AS component_lesson_discipline,

        ISNULL(slepp.instructor_activity_code, '0') AS component_instructor_activity_code,
        sia.description AS component_instructor_activity,
        ISNULL(slepp.schedule_instructor_ind, '0') AS component_schedule_instructor,

        ISNULL(spp.pass_product_type_code, '0') AS component_pass_product_type_code,
        sppt2.description AS component_pass_product_type,

        ISNULL(spp.pass_media_type_code, '0') AS component_pass_media_type_code,
        spmt.description AS component_pass_media_type,

        sp.operator_id AS component_operator_id,
        CONVERT(varchar, sp.update_date, 103) AS component_update_date,

        ISNULL(pdc.deferralcalendarcode, '0') AS component_deferral_calendar_code,
        dc.description AS component_deferral_calendar,

        ISNULL(pcps.customerpropertysetcode, '0') AS component_customer_property_set_code,
        cps.description AS component_customer_property_set 
      FROM s_product_group spg
      JOIN s_product_category spc
          ON spg.product_group_code = spc.product_group_code
         AND spg.active_ind = 'Y'
         AND spc.active_ind = 'Y'
      JOIN s_product sp
          ON spc.product_category_code = sp.product_category_code
         AND sp.active_ind = 'Y'
         AND sp.display_ind = 'Y'
      JOIN s_product_profile_type sppt
          ON sp.product_profile_type_code = sppt.product_profile_type_code
      JOIN s_deferral_pattern dp
          ON sp.deferral_pattern_code = dp.deferral_pattern_code
      LEFT JOIN s_product_inventory_pool spip
          ON sp.product_code = spip.product_code
      LEFT JOIN InventoryPool ip
          ON spip.InventoryPoolCode = ip.InventoryPoolCode
      LEFT JOIN s_product_roster spros
          ON sp.product_code = spros.product_code
      LEFT JOIN roster ros
          ON spros.RosterCode = ros.RosterCode
      LEFT JOIN s_statistic ss
        ON sp.sales_statistic_code = ss.statistic_code
      LEFT JOIN s_lift_product_profile slpp
         ON sp.product_code = slpp.product_code
      LEFT JOIN s_lift_product_type slpt
         ON slpp.lift_product_type_code = slpt.lift_product_type_code


      
      LEFT JOIN s_scan_process_order sspo
         ON slpp.scan_process_order_code = sspo.scan_process_order_code
      LEFT JOIN s_scan_type sst
         ON slpp.scan_type_code = sst.scan_type_code
      LEFT JOIN s_lesson_product_profile slepp
         ON sp.product_code = slepp.product_code
      LEFT JOIN s_lesson_product_type slept
         ON slepp.lesson_product_type_code = slept.lesson_product_type_code
      LEFT JOIN s_lesson_discipline sld
         ON slepp.lesson_discipline_code = sld.lesson_discipline_code
      LEFT JOIN s_instructor_activity sia
         ON slepp.instructor_activity_code = sia.instructor_activity_code
      LEFT JOIN s_pass_product_profile spp
         ON sp.product_code = spp.product_code
      LEFT JOIN s_pass_product_type sppt2
         ON spp.pass_product_type_code = sppt2.pass_product_type_code
      LEFT JOIN s_pass_media_type spmt
         ON spp.pass_media_type_code = spmt.pass_media_type_code
      LEFT JOIN ProductDeferralCalendar pdc
         ON sp.product_code = pdc.productcode
      LEFT JOIN DeferralCalendar dc
         ON pdc.deferralcalendarcode = dc.deferralcalendarcode
      LEFT JOIN ProductCustomerPropertySet pcps
         ON sp.product_code = pcps.productcode
      LEFT JOIN CustomerPropertySet cps
         ON pcps.CustomerPropertySetCode = cps.CustomerPropertySetCode
      
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
        product_category_code: r.product_category_code,
         product_category_desc: r.product_category_desc,
        product_profile_type_code: r.component_product_profile_type_code,
        product_profile_type: r.component_product_profile_type,
        deferral_pattern_code: r.component_deferral_pattern_code,
        deferral_pattern: r.component_deferral_pattern,

        units: r.component_units,
        revenue_report_ind: r.component_revenue_report_ind,
        change_revenue_location_ind: r.component_change_revenue_location_ind,
        inventory_pool_code: r.component_inventory_pool_code,
        inventory_pool: r.component_inventory_pool,
        offline_freesell_ind: r.component_offline_freesell_ind,
        sale_units: r.component_sale_units,
        sales_statistic_code: r.component_sales_statistic_code,
        sales_statistic: r.component_sales_statistic,
        roster_code: r.component_roster_code,
        roster: r.component_roster,
        lift_product_type_code: r.lift_product_type_code,
        lift_product_type: r.lift_product_type,
        scan_process_order_code: r.component_scan_process_order_code,
        scan_process_order: r.component_scan_process_order,
        lift_scan_type_code: r.component_lift_scan_type_code,
        lift_scan_type: r.component_lift_scan_type,
        lift_charge_ind: r.component_lift_charge_ind,
        load_to_media_ind: r.component_load_to_media,
        lift_effective_date: r.component_lift_effective_date,
        lift_expiration_type: r.component_lift_expiration_type,
        lift_expiration_days: r.component_lift_expiration_days,
        lift_expiration_date: r.component_lift_expiration_date,
        lesson_product_type_code: r.component_lesson_product_type_code,
        lesson_product_type: r.component_lesson_product_type,
        lesson_discipline_code: r.component_lesson_discipline_code,
        lesson_discipline: r.component_lesson_discipline,
        instructor_activity_code: r.component_instructor_activity_code,
        instructor_activity: r.component_instructor_activity,
        schedule_instructor: r.component_schedule_instructor,
        pass_product_type_code: r.component_pass_product_type_code,
        pass_product_type: r.component_pass_product_type,
        pass_media_type_code: r.component_pass_media_type_code,
        pass_media_type: r.component_pass_media_type,
        operator_id: r.component_operator_id,
        update_date: r.component_update_date,
        deferral_calendar_code: r.component_deferral_calendar_code,
        deferral_calendar: r.component_deferral_calendar,
        customer_property_set_code: r.component_customer_property_set_code,
        customer_property_set: r.component_customer_property_set

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

// --- Modal detail endpoints ---
router.get('/product-components/:productCode/general', async (req, res, next) => {
  try {
    const productCode = Number(req.params.productCode);
    const pool = await getPool();
    const request = pool.request();
    request.input('productCode', productCode);

    const result = await request.query(`
      SELECT
        sp.product_code AS productCode,
        sp.description AS description,
        spc.product_category_code AS productCategoryCode,
        spc.description AS productCategory,
        sp.display_order AS displayOrder,
        spp.description AS productProfileType,
        spp.product_profile_type_code AS productProfileTypeCode,
        sp.units AS units,
        sp.sales_units AS salesUnits,
        sp.active_ind AS active,
        sp.display_ind AS display,
        sp.change_revenue_location_ind AS changeRevenueLocation,
        CONVERT(VARCHAR, sp.payment_date, 103) AS paymentDate,
        sp.product_reference AS reference,
        sdp.description AS deferralPattern,
        sdp.deferral_pattern_code AS deferralPatternCode,
        sp.operator_id AS operatorId,
        CONVERT(VARCHAR, sp.update_date, 103) AS updateDate
      FROM s_product sp
      JOIN s_product_category spc ON sp.product_category_code = spc.product_category_code
      JOIN s_product_profile_type spp ON sp.product_profile_type_code = spp.product_profile_type_code
      JOIN s_deferral_pattern sdp ON sp.deferral_pattern_code = sdp.deferral_pattern_code
      WHERE sp.product_code = @productCode
    `);

    res.json({ row: result.recordset?.[0] ?? null });
  } catch (err) {
    next(err);
  }
});

router.get('/product-components/:productCode/additional', async (req, res, next) => {
  try {
    const productCode = Number(req.params.productCode);
    const pool = await getPool();
    const request = pool.request();
    request.input('productCode', productCode);

    const result = await request.query(`
      SELECT
        crmc.description AS crmCustomerType,
        ISNULL(crmpc.description, '') AS crmProductCategory,
        ISNULL(crmp.description, '') AS crmProduct,
        ISNULL(ip.description, '') AS inventoryPool,
        ssr.description AS revenueStatistic,
        ISNULL(r.Description, '<None>') AS roster,
        sss.description AS salesStatistic,
        ISNULL(dc.Description, '<None>') AS deferralCalendar,
        ISNULL(cps.Description, '<None>') AS customerPropertySet,
        sp.CRMEventInd AS crmEvent,
        'N' AS onlineHotlist,
        sp.revenue_report_ind AS reportRevenue,
        sp.PrintAcademyLabels AS printAcademyLabels,
        spip.offline_freesell_ind AS offlineFreeSell,
        CASE
          WHEN CONVERT(VARCHAR, sp.RevenueLocationOverrideCategoryCode) = 0 THEN '<None>'
          ELSE CONVERT(VARCHAR, sp.RevenueLocationOverrideCategoryCode)
        END AS revenueLocationOverrideCategory
      FROM s_product sp
      LEFT JOIN CRMCustomerType crmc ON sp.CRMCustomerTypeCode = crmc.CRMCustomerTypeCode
      LEFT JOIN CRMProduct crmp ON sp.CRMProductCode = crmp.CRMProductCode
      LEFT JOIN CRMProductCategory crmpc ON crmp.CRMProductCategoryCode = crmpc.CRMProductCategoryCode
      LEFT JOIN s_product_inventory_pool spip ON sp.product_code = spip.product_code
      LEFT JOIN InventoryPool ip ON spip.InventoryPoolCode = ip.InventoryPoolCode
      LEFT JOIN s_product_statistic sps ON sp.product_code = sps.product_code
      LEFT JOIN s_statistic ssr ON sps.statistic_code = ssr.statistic_code
      LEFT JOIN s_product_roster spr ON sp.product_code = spr.product_code
      LEFT JOIN Roster r ON spr.rostercode = r.rostercode
      LEFT JOIN s_statistic sss ON sp.sales_statistic_code = sss.statistic_code
      LEFT JOIN ProductDeferralCalendar pdc ON sp.product_code = pdc.productcode
      LEFT JOIN deferralcalendar dc ON pdc.deferralcalendarcode = dc.deferralcalendarcode
      LEFT JOIN ProductCustomerPropertySet pcps ON sp.product_code = pcps.ProductCode
      LEFT JOIN CustomerPropertySet cps ON pcps.CustomerPropertySetCode = cps.CustomerPropertySetCode
      WHERE sp.product_code = @productCode
    `);

    res.json({ row: result.recordset?.[0] ?? null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
