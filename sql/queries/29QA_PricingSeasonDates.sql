/*
MY RPOS VERSION OF RTP'S  PRICE RANGE TAB ON THE WB QA REPORT... TO QA YOU NEED TO CHANGE THE FOLLOWING:
@display_category_code
@dc_from
@dc_to
TO MATCH THE DISPLAY CATEGORY AND DISPLAY ORDER RANGE THAT YOU ARE LOOKING TO QA
-- -- Changelog: -- --
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/18/2020 nmorusiewicz: Changed query to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. Changed cats field
-- -------------------------- in temp table from INT to VARCHAR(50) to enable.
-- --08/21/2020 nmorusiewicz: Wrapped y.i.value() in LTRIM(RTRIM()) to ensure PHC parameters are read correctly whether or not the user includes a space.
-- -- 01/14/2021 alsmith1: Leveraged DefCal SQL QA to identify all Pricing Season Dates per Pricing Season in a QA
-- --07/22/2021 nmorusiewicz: Added support for Season Location-based pricing by LEFT JOINing to s_season_product_price and s_season_location_product_price, and adding an OR to the joins to
-- -------------------------- s_product and PricingSeason.
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
/*
SET @str = '1038'
--SET @str = '13254,13255,13256'
SET @dc_from = '0'
SET @dc_to = '9000'
SET @active_ind = 'Y'
SET @search_type = '0'
*/
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
		ps.PricingSeasonCode ,
		ps.Description  ,
		CAST(psd.PricingSeasonDate AS Date) PricingSeasonDate

	FROM s_display_category sdc ( NOLOCK )

		JOIN s_product_header sph ( NOLOCK )
		ON sdc.display_category_code = sph.display_category_code
		

		LEFT JOIN dbo.s_season_product_price spp WITH (NOLOCK)
		ON sph.product_header_code = spp.product_header_code

		LEFT JOIN s_season_location_product_price SLPP WITH (NOLOCK)
		ON sph.product_header_code = SLPP.product_header_code


		JOIN s_product sp ( NOLOCK )
		ON spp.product_code = sp.product_code OR SLPP.product_code = sp.product_code
		
		JOIN PricingSeason ps ( NOLOCK )
		ON spp.PricingSeasonCode = ps.PricingSeasonCode OR SLPP.PricingSeasonCode = ps.PricingSeasonCode

		left outer JOIN PricingSeasonDate psd ( NOLOCK )
		ON ps.PricingSeasonCode = psd.PricingSeasonCode

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
		1 ,--ps.PricingSeasonCode ,
		3 --psd.PricingSeasonDate
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)
 
--select * FROM #category_string
DROP TABLE #category_string