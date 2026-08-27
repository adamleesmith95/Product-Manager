/*
MY RPOS VERSION OF RTP'S HEADER TAB ON THE WB QA REPORT... TO QA YOU NEED TO CHANGE THE FOLLOWING:
@display_category_code
@dc_from
@dc_to
TO MATCH THE DISPLAY CATEGORY AND DISPLAY ORDER RANGE THAT YOU ARE LOOKING TO QA
-- -- Changelog: -- --
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/05/2020 nmorusiewicz: Changed query to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. Changed cats field
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

--SET @str = '13124'
--SET @str = '13254,13255,13256' --DCs
--SET @str = '99775, 119525' --PHCs
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
	SELECT
		sph.product_header_code PHC ,
		sph.Description as ''PHC Description'' ,
		sph.active_ind AS ''PHC Active'' ,
		sph.display_ind AS ''PHC Display'' ,
		sph.commission_ind AS ''PHC Commissionable'' ,
		sph.identify_customer_ind AS ''PHC Identify Customer'' ,
		sph.display_order AS ''PHC Display Order'' ,
		sdc.description AS ''Display Category'' ,
		sdc.display_category_code AS ''Display Category Code'' ,
		sdc.display_order AS ''Display Category Order'' ,
		sph.max_quantity AS ''PHC Max Quantity'' ,
		sph.primary_lob_code AS ''PHC Primary LOB Code'' ,
		sl.description AS ''PHC Primary LOB'' ,
		sph.price_by_location_ind AS ''PHC Is Price By Location'' ,
		sph.price_by_season_ind AS ''PHC Is Price By Season'' ,
		srg.Description AS ''PHC Sales Report Group'' ,
		src.Description AS ''PHC Sales Report Category'' ,
		sph.price_change_level AS ''PHC Price Change Level'',
		sph.security_level AS ''PHC Security Level'',
		sph.validate_customer_sp AS ''Validate Customer'',
		sph.customer_min_age AS ''PHC Minimum Age'',
		sph.customer_max_age AS ''PHC Maximum Age'',
		sph.payment_profile_required_ind AS ''PHC Payment Profile Required'',
		sph.renewal_ind AS ''PHC Eligible for Autorenew'' ,
		sph.receipt_price_hidden_ind AS ''PHC Hide Receipt Price'' ,
		sph.receipt_label AS ''PHC Receipt Text'',
		sac.description AuditCategory ,
		sph.operator_id ,
		sph.update_date 

	FROM s_display_category sdc ( NOLOCK )
		JOIN s_product_header sph ( NOLOCK )
			ON sph.display_category_code = sdc.display_category_code
		LEFT JOIN s_audit_category sac ( NOLOCK )
			ON sac.audit_category_code = sph.audit_category_code

		JOIN s_lob sl WITH (NOLOCK )
			ON sl.lob_code = sph.primary_lob_code

		LEFT JOIN SalesReportCategory src  WITH ( NOLOCK )
			ON	src.SalesReportCategoryCode = sph.SalesReportCategoryCode
		LEFT JOIN SalesReportGroup srg  WITH ( NOLOCK )
			ON srg.SalesReportGroupCode = src.SalesReportGroupCode

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
		sph.display_order
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #category_string
