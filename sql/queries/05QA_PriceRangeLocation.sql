/*
MY RPOS VERSION OF RTP'S  PRICE RANGE TAB ON THE WB QA REPORT... TO QA YOU NEED TO CHANGE THE FOLLOWING:
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

--SET @str = '13124'
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
		sdc.display_category_code AS DisplayCategoryCode,
		sdc.display_order AS DisplayCategoryOrder,
		sdc.description AS DisplayCategory,
		sph.product_header_code AS ProductHeaderCode,
		sph.description AS ProductHeader,
		sph.active_ind as PHStatusCode,
		sph.display_ind as PHDisplayInd,
		sph.display_order AS PHOrder ,
		sp.product_code AS ProductCode,
		sp.description AS Product,
		sp.active_ind,
		sp.display_ind,
		sdrpp.sale_location_code ,
		l.[description] ,
		CONVERT(DATE,sdrpp.effective_date) AS effective_date,
		CONVERT(DATE,sdrpp.expiration_date) AS expiration_date,
		sdrpp.price,
		sdrpp.price_allocation_ind,
		sdrpp.discount_allocation_ind,
		sdrpp.commission_allocation_ind ,
		spt.tax_code,
		stax.description TAX



	FROM s_product_header sph ( NOLOCK )

		INNER JOIN s_date_range_location_product_price sdrpp ( NOLOCK )
		ON sph.product_header_code = sdrpp.product_header_code

		JOIN dbo.s_display_category sdc ( NOLOCK )
		ON sph.display_category_code = sdc.display_category_code

		INNER JOIN dbo.s_product sp ( NOLOCK )
		ON sdrpp.product_code = sp.product_code
		--AND sp.active_ind = ''Y''

		join dbo.s_location l with (NOLOCK)
		on sdrpp.sale_location_code = l.location_code

		LEFT OUTER JOIN s_product_tax spt ( NOLOCK )
		ON sp.product_code = spt.product_code

		LEFT OUTER JOIN s_tax stax  ( NOLOCK )
		ON spt.tax_code = stax.tax_code



	--INNER JOIN s_tax_location stl ( NOLOCK )
	--	ON stax.tax_code = stl.tax_code

	/*
		--This column seems to lag/slow the query down BIG TIME!
	INNER JOIN s_tax_method stm ( NOLOCK )
		ON stl.tax_method_code = stm.tax_method_code
		and stl.active_ind = ''Y''
	*/
	/* Not sure if this will work in RPOS, as it came from the RTP Price Range SQL SP?
	LEFT OUTER JOIN
		(SELECT ProductCode,
		[1] AS GST, [2] AS PST, [3], [4], [5] AS LiqTax, [6], [7], [8] AS HST, [9], [10] AS HST5
		FROM s_product_tax AS SourceTable
		PIVOT
		(
		AVG(TaxCode)
		FOR TaxCode IN ([1], [2], [3], [4], [5], [6], [7], [8], [9], [10])
		) AS PivotTableTax) stp
			ON sp.product_code = stp.product_code
	*/

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
		sph.display_order,
		sph.product_header_code
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #category_string