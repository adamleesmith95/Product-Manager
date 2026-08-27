/*
MY RPOS VERSION OF RTP'S COMPONENTS TAB ON THE WB QA REPORT... TO QA YOU NEED TO CHANGE THE FOLLOWING:
@display_category_code
@dc_from
@dc_to
TO MATCH THE DISPLAY CATEGORY AND DISPLAY ORDER RANGE THAT YOU ARE LOOKING TO QA
-- -- Changelog: -- --
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/15/2020 nmorusiewicz: Changed query to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. Changed cats field
-- -------------------------- in temp table from INT to VARCHAR to ensure compatibility.
-- --08/21/2020 nmorusiewicz: Wrapped y.i.value() in LTRIM(RTRIM()) to ensure PHC parameters are read correctly whether or not the user includes a space.
-- --02/23/2022 nmorusiewicz: Per MCantwell, added column for number of days in the associated deferral calendar, if applicable. This will be comapred against Units/Sales
-- -------------------------- Units in spreadsheet validation.
-- --11/09/2022 nmorusiewicz: Per alsmith, added column returning Inventory Pool Status (LEFT JOINing InventoryPool to Status on StatusCode to return text description, rather than integer code)
*/
SET NOCOUNT ON
IF OBJECT_ID('tempdb.dbo.#category_string', 'U') IS NOT NULL
  DROP TABLE #category_string;


DECLARE @str varchar(MAX)
DECLARE @dc_from VARCHAR(50)
DECLARE @dc_to VARCHAR(50)
DECLARE @active_ind VARCHAR(50)
DECLARE @search_type VARCHAR(50)

SET @str = 'disp_cat_code_here'
SET @dc_from = 'header_order_from'
SET @dc_to = 'header_order_to'
SET @active_ind = 'header_active_ind'
SET @search_type = 'search_type_here'

--SET @str = '7212'
------SET @str = '13254,13255,13256'
--SET @dc_from = '0'
--SET @dc_to = '9000'
--SET @active_ind = 'Y'
--SET @search_type = '0'

CREATE TABLE #category_string
(
	cats VARCHAR(50)
)

INSERT INTO #category_string
SELECT display_categories = LTRIM(RTRIM(y.i.value('(./text())[1]', 'nvarchar(1000)')))
FROM
	(
		SELECT
		n = CONVERT(XML, '<i>'
				+ REPLACE(@str, ',' , '</i><i>')
				+ '</i>')
	) AS a
	CROSS APPLY n.nodes('i') AS y(i)

/*	Query begins here	*/
--Declare variable to hold dynamic query text
DECLARE @dynamic_query VARCHAR(MAX)
--Build SELECT clause
SET @dynamic_query = CONCAT(@dynamic_query, '
	SELECT DISTINCT
		sdc.display_category_code,
		sdc.display_order,
		sdc.description,
		sph.product_header_code,
		sph.description,
		sph.active_ind PH_STATUS,
		sph.display_order PH_ORDER,
		sph.display_ind PH_DISPLAY,
		sp.product_code,
		sp.description,
		sp.active_ind,
		sp.display_order,
		sp.display_ind,
		sp.deferral_pattern_code,
		sdp.description DEFERRAL,
		sp.product_category_code,
		spc.description PRODCAT,
		spg.lob_code,
		slob.description ComponentLOB,
		sp.revenue_report_ind,
		sp.units,
		sp.sales_units,
		sp.product_reference,
		sp.product_profile_type_code,
		sppt.description PPT_DESC,
		sp.sales_statistic_code ,
		ISNULL(ps.statistic_code, ''0'') revenue_statistic_code ,
		ISNULL(ss.description, '''') revenue_statistic_desc ,
		--ss.description STAT,
		slpp.scan_type_code,
		ip.InventoryPoolCode,
		ip.Description INV_POOL,
		S.Description AS inv_pool_status,
		pdc.DeferralCalendarCode,
		dc.description DEF_CALENDAR,
		CASE
			WHEN ISNULL(pdc.DeferralCalendarCode, '''') = ''''
				THEN ''''
			ELSE (
				SELECT COUNT(DCD.RevenueRecognitionDate) FROM DeferralCalendarDate DCD
				WHERE DCD.DeferralCalendarCode = PDC.DeferralCalendarCode
			)
		END AS DeferralCalendarDateCount,
		smmpp.expiration_type MM_ExpType,
			CASE WHEN smmpp.expiration_type = ''T'' THEN CAST(smmpp.expiration_date AS DATE) ELSE NULL END AS MM_ExpDate ,
			CASE WHEN smmpp.expiration_type = ''D'' THEN smmpp.expiration_days ELSE NULL END AS MM_ExpDays ,
			cps.CustomerPropertySetCode ChildReg ,
		sld.description [Lesson Discipline] ,
		sia.description [Instructor Activity] ,
		slepp.schedule_instructor_ind [Schedule Instructor] ,
		sp.operator_id,
		sp.update_date



	FROM s_display_category sdc ( NOLOCK )
		JOIN s_product_header sph ( NOLOCK )
		ON sph.display_category_code = sdc.display_category_code
		JOIN s_product_header_location sphl ( NOLOCK )
		ON sphl.product_header_code = sph.product_header_code
		JOIN s_product sp ( NOLOCK )
		ON sp.product_code = sphl.product_code
		JOIN s_deferral_pattern sdp ( NOLOCK )
		ON sp.deferral_pattern_code = sdp.deferral_pattern_code
		JOIN s_product_category spc ( NOLOCK )
		ON sp.product_category_code = spc.product_category_code
		JOIN s_product_profile_type sppt ( NOLOCK )
		ON sp.product_profile_type_code = sppt.product_profile_type_code
		JOIN s_product_GROUP spg
			ON spc.product_group_code = spg.product_group_code

		JOIN s_lob slob ( NOLOCK )
		ON slob.lob_code = spg.lob_code

		LEFT JOIN dbo.s_product_statistic ps (NOLOCK)
		ON ps.product_code = sp.product_code
		LEFT JOIN dbo.s_statistic ss (NOLOCK)
		ON ss.statistic_code = ps.statistic_code


		--LEFT JOIN s_statistic ss ( NOLOCK )
		--ON sp.sales_statistic_code = ss.statistic_code

		LEFT OUTER JOIN ProductDeferralCalendar pdc ( NOLOCK )
		INNER JOIN DeferralCalendar dc ( NOLOCK )
		ON pdc.DeferralCalendarCode = dc.DeferralCalendarCode
		ON sp.product_code = pdc.ProductCode


		LEFT OUTER JOIN s_lift_product_profile slpp  with (nolock)
		ON sp.Product_Code = slpp.Product_Code


		LEFT OUTER JOIN s_product_inventory_pool spip  with (nolock)
		INNER JOIN InventoryPool ip (nolock)
		ON spip.InventoryPoolCode = ip.InventoryPoolCode
		ON sp.Product_Code = spip.Product_Code
		LEFT JOIN Status S
			ON IP.StatusCode = S.StatusCode


		LEFT JOIN s_mm_product_profile smmpp WITH (NOLOCK)
		ON smmpp.product_code = sp.product_code

		LEFT JOIN ProductCustomerPropertySet cps
		ON cps.ProductCode = sp.product_code

		-- Adding Lesson Product Profile, Discipline AND Instructor Activitiy 8/7/24 Adam Smith
		LEFT JOIN s_lesson_product_profile slepp
			ON sp.product_code = slepp.product_code
		
		LEFT JOIN s_lesson_discipline sld
		ON slepp.lesson_discipline_code = sld.lesson_discipline_code
		
		LEFT JOIN s_instructor_activity sia
		ON slepp.instructor_activity_code = sia.instructor_activity_code

	WHERE
		sph.display_order BETWEEN ', @dc_from, ' AND ', @dc_to
)

--Define active status
IF @active_ind IN ('Y', 'N')
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		SPH.active_ind = ''', @active_ind, '''
	')
END

--Define Search Type
IF @search_type = '1' --By product_header_code
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		SPH.product_header_code IN (
			SELECT cats FROM #category_string
		)
	')
END
ELSE IF @search_type = '2' --By primary_lob_code
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		SPH.primary_lob_code IN (
			SELECT CAST(cats AS INT) FROM #category_string
		)
	')
END
--IF @search_type = 0 
ELSE --By display_category_code, need to cast code as INT to avoid conversion error at execution time
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		SPH.display_category_code IN (
			SELECT CAST(cats AS INT) FROM #category_string
		)
	')
END

--Add ORDER BY clause
SET @dynamic_query = CONCAT(@dynamic_query, '
	ORDER BY
		sdc.display_order ,
		sph.product_header_code,
		sph.display_order
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #category_string
