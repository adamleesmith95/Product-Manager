
/*
MY RPOS VERSION OF RTP'S ACCOUNTING TAB ON THE WB QA REPORT... TO QA YOU NEED TO CHANGE THE FOLLOWING:
@display_category_code
@dc_from
@dc_to
TO MATCH THE DISPLAY CATEGORY AND DISPLAY ORDER RANGE THAT YOU ARE LOOKING TO QA

IN (SELECT c.cats FROM #category_string c)

-- -- Changelog: -- --
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/05/2020 nmorusiewicz: Re-wrote query to be dynamic  to enable the user to choose whetehr to search by display_Category_code, product_header_code, or primary_lob_code. Changed
-- -------------------------- cats field in temp table from INT to VARCHAR to ensure compatibility with all searchtypes.
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

--SET @str = '13124'
--SET @str = '13254,13255,13256'
--SET @dc_from = '1002'
--SET @dc_to = '1002'
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
		sdc.display_category_code AS ''Display Category Code'',
		sdc.display_order AS ''Display Category Display Order'' ,
		sdc.description AS ''Display Category Description'',
		sph.product_header_code AS ''PHC'',
		sph.description AS ''PHC Description'',
		sph.active_ind  AS ''PHC Active'',
		sph.display_order AS ''PHC Display Order'',
		sph.display_ind AS ''PHC Display'',
		sp.product_code AS ''Component Code'',
		sp.description AS ''Component Description'',
		sp.active_ind AS ''Component Active'',
		sp.display_ind AS ''Component Display'',
		sdp.description AS ''Component Deferral Pattern'',
		slob.description AS ''Product Group LOB Description'',
		spg.description AS ''Product Group Description'',
		spc.product_category_code AS ''Product Category Code'',
		spc.description AS ''Product Category Description'',
		sl.description AS ''Component Sales Location'',
		srl.description AS ''Component Revenue Location'',
		srevl.default_earned_segment1 AS ''Revenue Location Earned Segment 1'',
		sphl.earned_segment1 AS ''PHC Earned Segment 1'',
		srevl.default_earned_segment2 AS ''Revenue Location Earned Segment 2'',
		sphl.earned_segment2 AS ''PHC Earned Segment 2'',
		spc.default_earned_segment3 AS ''Product Category Earned Segment 3'',
		sphl.earned_segment3 AS ''PHC Earned Segment 3'',
		srevl.default_unearned_segment1 AS ''Revenue Location Unearned Segment 1'',
		sphl.unearned_segment1 AS ''PHC Unearned Segment 1'',
		srevl.default_unearned_segment2 AS ''Revenue Location Unearned Segment 2'',
		sphl.unearned_segment2 AS ''PHC Unearned Segment 2'',
		spc.default_unearned_segment3 AS ''Product Category Unearned Segment 3'',
		sphl.unearned_segment3 AS ''PHC Unearned Segment 3''
	FROM
		s_display_category sdc ( NOLOCK )
		INNER JOIN	s_product_header sph ( NOLOCK )
			ON sdc.display_category_code = sph.display_category_code
			--AND sph.active_ind = ''Y''
		INNER JOIN	s_product_header_location sphl ( NOLOCK )
			ON sph.product_header_code = sphl.product_header_code

		INNER JOIN	s_product sp ( NOLOCK )
			ON sphl.product_code = sp.product_code
			AND sp.active_ind = ''Y''
		INNER JOIN	s_product_category spc ( NOLOCK )
			on sp.product_category_code = spc.product_category_code
			AND spc.active_ind = ''Y''
		INNER JOIN	s_product_group spg ( NOLOCK )
			on spc.product_group_code = spg.product_group_code
			AND spg.active_ind = ''Y''
		INNER JOIN	s_lob slob ( NOLOCK )
			on spg.lob_code = slob.lob_code
			AND slob.active_ind = ''Y''
		INNER JOIN	s_deferral_pattern sdp ( NOLOCK )
			ON sp.deferral_pattern_code = sdp.deferral_pattern_code
		INNER JOIN	s_location sl ( NOLOCK )
			ON sphl.sale_location_code = sl.location_code
		INNER JOIN	s_location srl ( NOLOCK )
			ON sphl.revenue_location_code = srl.location_code
		INNER JOIN s_revenue_location srevl	( NOLOCK )
			ON sphl.revenue_location_code = srevl.revenue_location_code
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