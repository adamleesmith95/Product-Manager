/*
MY RPOS VERSION OF RTP'S ACCESS PRODUCT TAB ON THE WB QA REPORT... TO QA YOU NEED TO CHANGE THE FOLLOWING:
@display_category_code
@dc_from
@dc_to
TO MATCH THE DISPLAY CATEGORY AND DISPLAY ORDER RANGE THAT YOU ARE LOOKING TO QA
-- -- Changelog: -- --
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/18/2020 nmorusiewicz: Changed query to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. Changed cats field
-- -------------------------- in temp table from INT to VARCHAR(50) to enable.
-- --08/21/2020 nmorusiewicz: Wrapped y.i.value() in LTRIM(RTRIM()) to ensure PHC parameters are read correctly whether or not the user includes a space.
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

--SET @str = '7972'
----SET @str = '13254,13255,13256'
--SET @dc_from = '0'
--SET @dc_to = '9999'
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
		sdc.display_category_code ,
		sdc.display_order ,
		sdc.description ,
		sph.product_header_code ,
		sph.description ,
		sph.active_ind PH_STATUS ,
		sph.display_order PH_ORDER ,
		sph.display_ind PH_DISPLAY ,
	--	sc.SalesChannelCode ,
	--	sc.Description AS SCDescription ,

		sp.product_code ,
		sp.description ,
		sp.active_ind ,
		sp.display_order ,
		sp.display_ind ,
		sslg.description SCAN_GROUP ,

		ISNULL(sst.scan_type_code,'''') AS ScanTypeCode ,
		ISNULL(sst.Description,'''') AS ScanTypeRule ,
		sst.active_ind ,
		ssc.description ACCESS_RULE_CAT ,
		sseg.description ACCESS_EDIT_GROUP ,
		ssed.description Scan_Edit_Type ,
		CAST(sstpt.effective_date AS DATE) effective_date ,
		CAST(sstpt.expiration_date AS DATE) expiration_date ,
		sstpt.start_time ,
		sstpt.end_time ,
		sstpt.max_days ,
		sstpt.max_uses ,
		sstpt.total_days ,
		sstpt.sunday_ind ,
		sstpt.monday_ind ,
		sstpt.tuesday_ind ,
		sstpt.wednesday_ind ,
		sstpt.thursday_ind ,
		sstpt.friday_ind ,
		sstpt.saturday_ind ,
		sstlg.ignore_time ,
		sstlg.loop_time ,
		/*sstpt.default_beeps ACCESS_RULE_BEEPS ,
		b.Description GATE_BEEP_BEHAVIOUR ,*/
		sl.description [Revenue Location] ,
		sstlg.usage_segment1 ,
		sstlg.usage_segment2 ,
		sstlg.usage_segment3 ,
		sstlg.usage_segment4 ,
		sstap.start_time UsageStartTime ,
		sstap.end_time UsageEndTime ,
		sstap.autocharge_type_code ,
		sphu.product_header_code UsagePHC ,
		sphu.description UsagePH ,
		spmu.description UsagePaymentMethod ,
		sphdtl.product_header_code DTL_PHC ,
		sphdtl.description DTL_PH ,
		spm.description DTL_Payment_Method ,
		sst.barcode_expiration_date_ind


	FROM s_payment_method spm ( NOLOCK )

		RIGHT OUTER JOIN s_scan_type_autopost sstap ( NOLOCK )
			ON spm.payment_method_code = sstap.dtl_payment_method_code

		LEFT OUTER JOIN	s_payment_method spmu ( NOLOCK )
			ON sstap.usage_payment_method_code = spmu.payment_method_code

		LEFT OUTER JOIN	s_product_header sphdtl ( NOLOCK )
			ON sstap.dtl_product_header_code = sphdtl.product_header_code
			--AND sphdtl.active_ind = ''Y''

		LEFT OUTER JOIN	s_product_header sphu ( NOLOCK )
			ON sstap.usage_product_header_code = sphu.product_header_code
			--AND sphu.active_ind = ''Y''
		RIGHT OUTER JOIN s_scan_type_location_group sstlg ( NOLOCK )

		LEFT OUTER JOIN s_scan_edit_group sseg ( NOLOCK )
			ON sseg.scan_edit_group_code = sstlg.scan_edit_group_code

		INNER JOIN s_scan_type_product_type sstpt ( NOLOCK )
			ON sstlg.scan_type_code = sstpt.scan_type_code
			AND	sstlg.scan_product_type_code = sstpt.scan_product_type_code

		INNER JOIN s_scan_edit_type ssed ( NOLOCK )
			ON ssed.scan_edit_type_code = sstpt.scan_edit_type_code

	/* AS 5/18/24 removing the gate beep behaviour columns AS per ProdOps ticket # 9872
		LEFT JOIN Beep b ( NOLOCK )
			ON sstpt.default_beeps = b.BeepCount */

		INNER JOIN	s_location sl ( NOLOCK )
			ON sstlg.revenue_location_code = sl.location_code

		INNER JOIN	s_scan_location_group sslg ( NOLOCK )
			ON sstlg.scan_location_group_code = sslg.scan_location_group_code
			ON	sstap.scan_type_code = sstlg.scan_type_code
			AND sstap.scan_location_group_code= sstlg.scan_location_group_code

		RIGHT OUTER JOIN s_lift_product_profile slpp ( NOLOCK )

		INNER JOIN	s_scan_type sst ( NOLOCK )
			ON slpp.scan_type_code = sst.scan_type_code

		INNER JOIN	s_display_category sdc ( NOLOCK )

		INNER JOIN s_product_header sph ( NOLOCK )
			ON sdc.display_category_code = sph.display_category_code

		INNER JOIN	s_product_header_location sphl ( NOLOCK )
			ON sph.product_header_code = sphl.product_header_code

		INNER JOIN	s_product sp ( NOLOCK )
			ON sphl.product_code = sp.product_code
			ON slpp.product_code = sp.product_code
			AND sp.active_ind = ''Y''
		INNER JOIN	s_scan_category ssc ( NOLOCK )
			ON sst.scan_category_code = ssc.scan_category_code
			ON sstpt.scan_type_code = sst.scan_type_code

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
		sdc.display_order,
		sph.product_header_code,
		sph.display_order
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #category_string
