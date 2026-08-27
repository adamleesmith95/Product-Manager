/*
MY RPOS VERSION OF RTP'S INVENTORY POOL TAB ON THE WB QA REPORT... TO QA YOU NEED TO CHANGE THE FOLLOWING:
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

--SET @str = '114631'
--SET @str = '114631,13255,13256'
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
		siplip.InventoryPoolLocationCode,
		sl.description,
		sip.InventoryPoolCode,
		sip.Description AS InventoryPool,
		sip.DisplayOrder AS InventoryPoolOrder,
		-- sip.StatusCode, -- TE 3/21/2019 removed so this tab is compatible with Inventory Pool uploader in MRGA

		siplip.EffectiveDate,
		siplip.ExpirationDate,
		siplip.WarningLevel,
		siplip.MaximumLevel,
		siplip.HardCeilingInd ,
		datediff(dy,convert(date,siplip.EffectiveDate),convert(date,siplip.ExpirationDate)) as DateRange



	FROM InventoryPool sip ( NOLOCK )

		INNER JOIN s_product_inventory_pool spip ( NOLOCK )
		ON sip.InventoryPoolCode = spip.InventoryPoolCode

		INNER JOIN s_product_header sph ( NOLOCK )

		INNER JOIN s_display_category sdc ( NOLOCK )
		on sph.display_category_code = sdc.display_category_code
		--AND sph.active_ind = ''Y''

		INNER JOIN s_product_header_location sphl ( NOLOCK )
		ON sph.product_header_code = sphl.product_header_code



		INNER JOIN s_Product sp ( NOLOCK )
		ON sphl.product_code = sp.product_code
		ON spip.product_code = sp.product_code
			AND sp.active_ind = ''Y''
		INNER JOIN InventoryPoolLocationInventoryPool siplip ( NOLOCK )
		ON sip.InventoryPoolCode = siplip.InventoryPoolCode

		INNER JOIN s_location sl ( NOLOCK )
		ON sl.location_code = siplip.InventoryPoolLocationCode


	WHERE
		sph.display_order BETWEEN ', @dc_from, ' AND ', @dc_to
)
--sip.InventoryPoolCode IN (	10003,--o	WB G1 Fleet DH Bike Rental � AM
--							10012,--o	WB XC Rental Bike � AM
--							9765,--o	WB � Bike � AM XC Tour
--							9767,--WB - Bike - Enduro (DF/XC) Tour
--							9768,--WB - Bike - AM Lakes Tour
--							9771,--WB - Bike - AM ebike Lakes Tour
--							10021,--WB e-bike - AM
--							10018,--WB Valley Bike Tours Rental - AM
--							10013--WB XC Rental Bike - PM


--							)

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
		sip.DisplayOrder,
		sip.InventoryPoolCode,
		siplip.EffectiveDate
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #category_string