/*
MY RPOS VERSION OF RTP'S COMPONENTS TAB ON THE WB QA REPORT... TO QA YOU NEED TO CHANGE THE FOLLOWING:
@display_category_code
@dc_from
@dc_to
TO MATCH THE DISPLAY CATEGORY AND DISPLAY ORDER RANGE THAT YOU ARE LOOKING TO QA
-- -- Changelog: -- --
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/05/2020 nmorusiewicz: Changed query to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. Changed cats field
-- -------------------------- in temp table from INT to VARCHAR to ensure compatibility.
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

--SET @str = '14001'
--SET @str = '13254,13255,13256'
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
		sdc.display_category_code ,
		sdc.display_order ,
		sdc.description AS DispCat ,
		sph.product_header_code ,
		sph.description AS ProductHeader ,
		sph.active_ind PH_STATUS ,
		sph.display_order PH_ORDER ,
		sph.display_ind PH_DISPLAY ,
		sp.product_code ,
		sp.description  As Product,
		sp.active_ind ,
		sp.display_order ,
		sp.display_ind ,
		ISNULL(sst.scan_type_code,'''') AS ScanTypeCode,
		ISNULL(sst.Description,'''') AS ScanTypeRule,
		ISNULL (sspo.scan_process_order_code, '''') ScanProcessOrderCode,
		ISNULL(sspo.Description,'''') AS ScanProcessOrder,
		--AccessCodeProcedure
		ISNULL(slpp.expiration_type,'''') as EffectiveTypeCode,
		--ISNULL(ee.EffectiveTypeName,'''') as EffectiveType,
		ISNULL(slpp.Effective_Date, '''') AS EffectiveDate,
		ISNULL(slpp.expiration_days,'''') AS  ExpirationDays,
		--ISNULL(et.Description,'''') as ExpirationType,
		ISNULL(slpp.expiration_date, '''') AS ExpirationDate,
		sdp.description As ''Deferral Type'',
		slpp.lift_charge_ind,
		slpp.load_to_media_ind
		--ISNULL(pab.PrepaidAccessBehaviorCode, '''') AS PrepaidAccessBehaviorCode,
		--ISNULL(pab.Description, '''') AS PrepaidAccessBehavior
		--lpp.AuthorizationTypeCode

	FROM s_display_category sdc ( NOLOCK )
	JOIN s_product_header sph ( NOLOCK )
	ON sph.display_category_code = sdc.display_category_code
	--and sph.active_ind = ''y''
	JOIN s_product_header_location sphl ( NOLOCK )
	ON sphl.product_header_code = sph.product_header_code
	JOIN s_product sp ( NOLOCK )
	ON sp.product_code = sphl.product_code
	AND sp.active_ind = ''y''
	join s_deferral_pattern sdp
	on sp.deferral_pattern_code = sdp.deferral_pattern_code

	LEFT JOIN s_lift_product_profile slpp  (nolock)
	on slpp.product_code = sphl.product_code

	LEFT JOIN	s_scan_type sst  (nolock)
		ON slpp.scan_type_code = sst.scan_type_code

	JOIN	s_scan_process_order sspo  (nolock)
		ON slpp.scan_process_order_code = sspo.scan_process_order_code

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
		sph.product_header_code ,
		sph.display_order
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #category_string