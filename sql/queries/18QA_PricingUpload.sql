-- -- Changelog: -- --
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/18/2020 nmorusiewicz: Changed all 4 queries to be dynamic and enabled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. 
-- -------------------------- Changed cats field in temp table from INT to VARCHAR(50) to enable.
-- --08/21/2020 nmorusiewicz: Wrapped y.i.value() in LTRIM(RTRIM()) to ensure PHC parameters are read correctly whether or not the user includes a space.
SET NOCOUNT ON
IF OBJECT_ID('tempdb.dbo.#uploadPricing', 'U') IS NOT NULL
  DROP TABLE #uploadPricing;
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

--SET @str = '3345'
--SET @str = '13254,13255,13256'
--SET @dc_from = '0'
--SET @dc_to = '9000'
--SET @active_ind = 'Y'
--SET @search_type = '0'

CREATE TABLE #category_string (cats VARCHAR(50))

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

CREATE TABLE #uploadPricing (
	[PHC] nvarchar(20) ,
	[PHC Description] nvarchar(50) ,
	[Display Order] INT ,
	[Display Category] nvarchar(100) ,
	[Component] nvarchar(20) ,
	[Component Description] nvarchar(100) ,
	[Effective Date] DATE NULL ,
	[Expiration Date] date NULL ,
	[Master Season] nvarchar(50) ,
	[Season Code] INT ,
	[Season Description] nvarchar(100) ,
	[Location Code] INT ,
	[Location Description] nvarchar(50) ,
	[Price] DECIMAL(10,2) , -- someone decided TO put IN 99999999 AS a price 
	[Active Indicator] nvarchar(5) ,
	[Price Allocation Indicator] nvarchar(5) ,
	[Discount Allocation Indicator] nvarchar(5) ,
	[Commission Allocation Indicator] nvarchar(5) ,
	[Pricing Type] nvarchar(5) ,

)

/*	 make sure TO INSERT ALL 4 tables	*/
--Declare variable to hold dynamic query text
DECLARE @dynamic_query VARCHAR(MAX)

/* Season NO location	*/
--Build SELECT clause
SET @dynamic_query = CONCAT(@dynamic_query, '
	INSERT INTO #uploadPricing
	SELECT
		spp.product_header_code ,
		ph.description ,
		ph.display_order ,
		ph.display_category_code , -- map IN string OF description here
		spp.product_code ,
		'''' ,
		NULL ,
		NULL ,
		NULL , -- master season code
		spp.PricingSeasonCode ,
		'''' , -- ps DESC
		NULL , -- location
		NULL , -- location
		spp.price ,
		ph.active_ind ,
		spp.price_allocation_ind ,
		spp.discount_allocation_ind ,
		spp.commission_allocation_ind ,
		CASE
			WHEN ph.price_by_location_ind = ''N'' AND ph.price_by_season_ind = ''N'' THEN ''D''	-- DATE Range
			WHEN ph.price_by_location_ind = ''N'' AND ph.price_by_season_ind = ''Y'' THEN ''S''	-- Season Range
			WHEN ph.price_by_location_ind = ''Y'' AND ph.price_by_season_ind = ''N'' THEN ''LD''	-- DATE Location
			WHEN ph.price_by_location_ind = ''Y'' AND ph.price_by_season_ind = ''Y'' THEN ''LS''	-- Season Location
		END

	FROM dbo.s_season_product_price spp

	JOIN dbo.s_product_header ph
		ON spp.product_header_code = ph.product_header_code

	WHERE
		ph.display_order BETWEEN ', @dc_from, ' AND ', @dc_to
)
--Define active status
IF @active_ind IN ('Y', 'N')
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.active_ind = ''', @active_ind, '''
	')
END

--Define Search Type
IF @search_type = '1' --By product_header_code
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.product_header_code IN (
			SELECT cats FROM #category_string
		)
	')
END
ELSE IF @search_type = '2' --By primary_lob_code
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.primary_lob_code IN (
			SELECT CAST(cats AS INT) FROM #category_string
		)
	')
END
--IF @search_type = 0 
ELSE --By display_category_code, need to cast code as INT to avoid conversion error at execution time
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.display_category_code IN (
			SELECT CAST(cats AS INT) FROM #category_string
		)
	')
END
--Execute Season query
EXEC (@dynamic_query)

/*DATE Range*/
SET @dynamic_query = CONCAT('
	INSERT INTO #uploadPricing
	SELECT
		spp.product_header_code ,
		ph.description ,
		ph.display_order ,
		ph.display_category_code , -- map IN string OF description here
		spp.product_code ,
		'''' ,
		spp.effective_date ,	-- effective
		spp.expiration_date ,	-- expiration
		NULL , -- master season code
		NULL ,
		NULL , -- ps DESC
		NULL , -- location
		NULL , -- location
		spp.price ,
		ph.active_ind ,
		spp.price_allocation_ind ,
		spp.discount_allocation_ind ,
		spp.commission_allocation_ind ,
		CASE
			WHEN ph.price_by_location_ind = ''N'' AND ph.price_by_season_ind = ''N'' THEN ''D''	-- DATE Range
			WHEN ph.price_by_location_ind = ''N'' AND ph.price_by_season_ind = ''Y'' THEN ''S''	-- Season Range
			WHEN ph.price_by_location_ind = ''Y'' AND ph.price_by_season_ind = ''N'' THEN ''LD''	-- DATE Location
			WHEN ph.price_by_location_ind = ''Y'' AND ph.price_by_season_ind = ''Y'' THEN ''LS''	-- Season Location
		END

	FROM dbo.s_date_range_product_price spp

	JOIN dbo.s_product_header ph
		ON spp.product_header_code = ph.product_header_code

	WHERE
		ph.display_order BETWEEN ', @dc_from, ' AND ', @dc_to
)
--Define active status
IF @active_ind IN ('Y', 'N')
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.active_ind = ''', @active_ind, '''
	')
END

--Define Search Type
IF @search_type = '1' --By product_header_code
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.product_header_code IN (
			SELECT cats FROM #category_string
		)
	')
END
ELSE IF @search_type = '2' --By primary_lob_code
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.primary_lob_code IN (
			SELECT CAST(cats AS INT) FROM #category_string
		)
	')
END
--IF @search_type = 0 
ELSE --By display_category_code, need to cast code as INT to avoid conversion error at execution time
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.display_category_code IN (
			SELECT CAST(cats AS INT) FROM #category_string
		)
	')
END
--Execute Date Range query
EXEC (@dynamic_query)

/*Season AND Location	*/
SET @dynamic_query = CONCAT('
	INSERT INTO #uploadPricing
	SELECT
		spp.product_header_code ,
		ph.description ,
		ph.display_order ,
		ph.display_category_code , -- map IN string OF description here
		spp.product_code ,
		'''' ,
		NULL ,	-- effective
		NULL ,	-- expiration
		NULL , -- master season code
		spp.PricingSeasonCode ,	-- pricing season
		NULL , -- ps DESC
		spp.sale_location_code , -- location
		NULL , -- location
		spp.price ,
		ph.active_ind ,
		spp.price_allocation_ind ,
		spp.discount_allocation_ind ,
		spp.commission_allocation_ind ,
		CASE
			WHEN ph.price_by_location_ind = ''N'' AND ph.price_by_season_ind = ''N'' THEN ''D''	-- DATE Range
			WHEN ph.price_by_location_ind = ''N'' AND ph.price_by_season_ind = ''Y'' THEN ''S''	-- Season Range
			WHEN ph.price_by_location_ind = ''Y'' AND ph.price_by_season_ind = ''N'' THEN ''LD''	-- DATE Location
			WHEN ph.price_by_location_ind = ''Y'' AND ph.price_by_season_ind = ''Y'' THEN ''LS''	-- Season Location
		END

	FROM dbo.s_season_location_product_price spp

	JOIN dbo.s_product_header ph
		ON spp.product_header_code = ph.product_header_code

	WHERE
		ph.display_order BETWEEN ', @dc_from, ' AND ', @dc_to
)
--Define active status
IF @active_ind IN ('Y', 'N')
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.active_ind = ''', @active_ind, '''
	')
END

--Define Search Type
IF @search_type = '1' --By product_header_code
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.product_header_code IN (
			SELECT cats FROM #category_string
		)
	')
END
ELSE IF @search_type = '2' --By primary_lob_code
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.primary_lob_code IN (
			SELECT CAST(cats AS INT) FROM #category_string
		)
	')
END
--IF @search_type = 0 
ELSE --By display_category_code, need to cast code as INT to avoid conversion error at execution time
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.display_category_code IN (
			SELECT CAST(cats AS INT) FROM #category_string
		)
	')
END
--Execute Season/Location query
EXEC (@dynamic_query)

/*DATE AND Location	*/
SET @dynamic_query = CONCAT('
	INSERT INTO #uploadPricing
	SELECT
		spp.product_header_code ,
		ph.description ,
		ph.display_order ,
		ph.display_category_code , -- map IN string OF description here
		spp.product_code ,
		'''' ,
		spp.effective_date ,	-- effective
		spp.expiration_date ,	-- expiration
		NULL , -- master season code
		NULL ,	-- season code
		NULL , -- ps DESC
		spp.sale_location_code , -- location code
		NULL , -- location
		spp.price ,
		ph.active_ind ,
		spp.price_allocation_ind ,
		spp.discount_allocation_ind ,
		spp.commission_allocation_ind ,
		CASE
			WHEN ph.price_by_location_ind = ''N'' AND ph.price_by_season_ind = ''N'' THEN ''D''	-- DATE Range
			WHEN ph.price_by_location_ind = ''N'' AND ph.price_by_season_ind = ''Y'' THEN ''S''	-- Season Range
			WHEN ph.price_by_location_ind = ''Y'' AND ph.price_by_season_ind = ''N'' THEN ''LD''	-- DATE Location
			WHEN ph.price_by_location_ind = ''Y'' AND ph.price_by_season_ind = ''Y'' THEN ''LS''	-- Season Location
		END

	FROM dbo.s_date_range_location_product_price spp

	JOIN dbo.s_product_header ph
		ON spp.product_header_code = ph.product_header_code

	WHERE
		ph.display_order BETWEEN ', @dc_from, ' AND ', @dc_to
)
--Define active status
IF @active_ind IN ('Y', 'N')
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.active_ind = ''', @active_ind, '''
	')
END

--Define Search Type
IF @search_type = '1' --By product_header_code
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.product_header_code IN (
			SELECT cats FROM #category_string
		)
	')
END
ELSE IF @search_type = '2' --By primary_lob_code
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.primary_lob_code IN (
			SELECT CAST(cats AS INT) FROM #category_string
		)
	')
END
--IF @search_type = 0 
ELSE --By display_category_code, need to cast code as INT to avoid conversion error at execution time
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.display_category_code IN (
			SELECT CAST(cats AS INT) FROM #category_string
		)
	')
END
--Execute Date Range/Location query
EXEC (@dynamic_query)

/*	update ALL the descriptions*/

UPDATE a
SET a.[Master Season] = (
			SELECT
				mps.Description
				--ps.Description

			FROM dbo.PricingSeason ps
			JOIN dbo.MasterPricingSeason mps
				ON ps.MasterPricingSeasonCode = mps.MasterPricingSeasonCode

			WHERE ps.PricingSeasonCode = a.[Season Code]
)
FROM #uploadPricing a

UPDATE a
SET a.[Season Description] = (
			SELECT
				--mps.Description
				ps.Description

			FROM dbo.PricingSeason ps
			JOIN dbo.MasterPricingSeason mps
				ON ps.MasterPricingSeasonCode = mps.MasterPricingSeasonCode

			WHERE ps.PricingSeasonCode = a.[Season Code]
)
FROM #uploadPricing a

UPDATE a
SET a.[Component Description] = (
			SELECT

				pc.Description

			FROM dbo.s_product pc

			WHERE pc.product_code = a.Component
)
FROM #uploadPricing a

UPDATE a
SET a.[Location Description] = (
			SELECT

				l.Description

			FROM dbo.s_location l

			WHERE l.location_code = a.[Location Code]
)
FROM #uploadPricing a


SELECT *
FROM #uploadPricing
