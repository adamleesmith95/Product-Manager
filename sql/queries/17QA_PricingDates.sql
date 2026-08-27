-- =============================================
-- Author:		Tim Esnouf
-- Create date: ???
-- Description:	Pulls a list of all dates on which the products in a given product display category are available, and lists the price by component on each date
-- ChangeLog:
-- --??/??/????: Created with support for products priced by Pricing Season only.
-- --05/23/2019 nmorusiewicz: Added support for products priced by Date Range. Location-based pricing is still not supported in any form.
-- --10/02/2019 nmorusiewicz: Added check to ensure that the minDate and maxDate are not more than a year in the past or future from the current date.
-- --			This prevents the PIVOT query exceeding column limits
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/18/2020 nmorusiewicz: Changed both Season and Date queries to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or 
-- --           primary_lob_code. Changed cats field in temp table from INT to VARCHAR(50) to enable.
-- --08/21/2020 nmorusiewicz: Wrapped y.i.value() in LTRIM(RTRIM()) to ensure PHC parameters are read correctly whether or not the user includes a space.
-- =============================================
/*
MY RPOS VERSION OF RTP'S  PRICE RANGE TAB ON THE WB QA REPORT... TO QA YOU NEED TO CHANGE THE FOLLOWING:
@display_category_code
@dc_from
@dc_to
TO MATCH THE DISPLAY CATEGORY AND DISPLAY ORDER RANGE THAT YOU ARE LOOKING TO QA
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

--SET @str = '3345'
--SET @str = '13254,13255,13256'
--SET @dc_from = '0'
--SET @dc_to = '99999'
--SET @active_ind = 'Y'
--SET @search_type = '1'

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
  
  
 
IF OBJECT_ID('tempdb.dbo.#PricingSeasonDates', 'U') IS NOT NULL
	DROP TABLE #PricingSeasonDates;

IF OBJECT_ID('tempdb.dbo.#dates', 'U') IS NOT NULL
	DROP TABLE #dates;
  


-- CREATE a holding TABLE FOR the PIVOT

CREATE TABLE #PricingSeasonDates (
	product_header_code nvarchar(25) ,
	ph_description nvarchar(100),
	product_code nvarchar(25),
	pc_description nvarchar(100),
	PricingSeasonCode INT ,
	ps_description nvarchar(100),
	PricingSeasonDate DATE ,
	price DECIMAL(7,2)
)
--Declare variable to hold dynamic query text
DECLARE @dynamic_query VARCHAR(MAX)
--Build SELECT clause
SET @dynamic_query = CONCAT(@dynamic_query, '
	INSERT INTO #PricingSeasonDates
	SELECT
		ph.product_header_code ,
		ph.description ,
		spp.product_code ,
		pc.description ,
		spp.PricingSeasonCode ,
		ps.Description ,
		CONVERT(DATE,psd.PricingSeasonDate) AS PricingSeasonDate ,
		spp.price
	

	FROM dbo.s_product_header ph WITH (NOLOCK)
	JOIN dbo.s_season_product_price spp WITH (NOLOCK)
		ON ph.product_header_code = spp.product_header_code
	JOIN dbo.s_product pc
		ON spp.product_code = pc.product_code
	JOIN dbo.PricingSeason ps WITH (NOLOCK)
		ON spp.PricingSeasonCode = ps.PricingSeasonCode
	JOIN dbo.PricingSeasonDate AS psd WITH (NOLOCK)
		ON spp.PricingSeasonCode = psd.PricingSeasonCode



	WHERE
		ph.display_order BETWEEN ', @dc_from, ' AND ', @dc_to, '
		-- currently only want TO look AT pricing seasons without locations ADD that later
		AND ph.price_by_season_ind = ''Y''
		AND ph.price_by_location_ind = ''N''
		AND ph.display_ind = ''Y''
')
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

/*  nmorusiewicz 05/23/2019
	Add logic to populate results with Price by Date products */

IF OBJECT_ID('tempdb.dbo.#DateRangeDates', 'U') IS NOT NULL
DROP TABLE #DateRangeDates;

CREATE TABLE #DateRangeDates (
	product_header_code VARCHAR(18),
	product_code VARCHAR(18),
	effective_date DATE,
	expiration_date DATE,
	price DECIMAL(16,2)
)
--Build SELECT clause
SET @dynamic_query = CONCAT('
	INSERT INTO #DateRangeDates
	SELECT
		PH.product_header_code,
		DRPP.product_code,
		DRPP.effective_date,
		DRPP.expiration_date,
		DRPP.price
	FROM
		s_product_header PH
		JOIN s_date_range_product_price DRPP
			ON PH.product_header_code = DRPP.product_header_code
		JOIN s_product P
			ON DRPP.product_code = P.product_code
	WHERE
		ph.display_order BETWEEN ', @dc_from, ' AND ', @dc_to, '
		-- currently only want TO look AT pricing seasons without locations ADD that later
		AND ph.price_by_season_ind = ''N''
		AND ph.price_by_location_ind = ''N''
		AND ph.display_ind = ''Y''
')
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

DECLARE @curPHC VARCHAR(18)
DECLARE @curPC VARCHAR(18)
DECLARE @curDate DATE
DECLARE @expDate DATE
DECLARE @curPrice DECIMAL(16,2)

WHILE ISNULL((SELECT TOP 1 product_header_code FROM #DateRangeDates), '-1') != '-1'
BEGIN
	SELECT TOP 1
		@curPHC = product_header_code,
		@curPC = product_code,
		@curDate = effective_date,
		@expDate = expiration_date,
		@curPrice = price
	FROM
		#DateRangeDates

	WHILE @curDate <= @expDate
	BEGIN
		INSERT INTO #PricingSeasonDates
		SELECT
			@curPHC,
			PH.description,
			@curPC,
			P.description,
			'',
			'',
			@curDate,
			@curPrice
		FROM
			s_product_header PH
			JOIN s_product P
				ON P.product_code = @curPC
		WHERE
			PH.product_header_code = @curPHC

		SET @curDate = DATEADD(dd,1,@curDate)
	END

	DELETE FROM #DateRangeDates
	WHERE product_header_code = @curPHC AND product_code = @curPC AND expiration_date = @expDate
END
		
/*
INSERT INTO #PricingSeasonDates
SELECT
	PH.product_header_code,
	PH.description,
	DRPP.product_code,
	P.description,
	'',
	'',
	DRPP.effective_date,
	DRPP.price
FROM
	s_product_header PH
	JOIN s_date_range_product_price DRPP
		ON PH.product_header_code = DRPP.product_header_code
	JOIN s_product P
		ON DRPP.product_code = P.product_code
WHERE
	ph.display_category_code IN (SELECT c.cats FROM #category_string c)
	AND ph.display_order BETWEEN @dc_from AND @dc_to
	-- currently only want TO look AT pricing seasons without locations ADD that later
	AND ph.price_by_season_ind = 'N'
	AND ph.price_by_location_ind = 'N'
	AND ph.display_ind = 'Y'

INSERT INTO #PricingSeasonDates
SELECT
	PH.product_header_code,
	PH.description,
	DRPP.product_code,
	P.description,
	'',
	'',
	DRPP.expiration_date,
	DRPP.price
FROM
	s_product_header PH
	JOIN s_date_range_product_price DRPP
		ON PH.product_header_code = DRPP.product_header_code
	JOIN s_product P
		ON DRPP.product_code = P.product_code
WHERE
	ph.display_category_code IN (SELECT c.cats FROM #category_string c)
	AND ph.display_order BETWEEN @dc_from AND @dc_to
	-- currently only want TO look AT pricing seasons without locations ADD that later
	AND ph.price_by_season_ind = 'N'
	AND ph.price_by_location_ind = 'N'
	AND ph.display_ind = 'Y'
*/
--SELECT * 
--FROM #PricingSeasonDates



DECLARE @minDate DATE = (SELECT MIN(p.PricingSeasonDate) FROM #PricingSeasonDates p)
DECLARE @maxDate DATE = (SELECT MAX(p.PricingSeasonDate) FROM #PricingSeasonDates p)
--Ensure that the min date and max date are no more than 1 year in the past or future from the current date.
--If a date range product is priced through 2100, for instance, this will cause the query to crash due to too many columns in the result set
IF DATEDIFF(dd, GETDATE(), @minDate) < -365
BEGIN
	SET @minDate = DATEADD(dd,-365,CAST(GETDATE() AS DATE))
END
IF DATEDIFF(dd, GETDATE(), @maxDate) > 365
BEGIN
	SET @maxDate = DATEADD(dd,365,CAST(GETDATE() AS DATE))
END

-- SET up the FULL DATE range FROM ealriest DATE TO latest date
CREATE TABLE #dates ( dte DATE )

DECLARE @iDate date

SET @iDate = @minDate

WHILE @iDate < = @maxDate
BEGIN
	INSERT INTO #dates 
	VALUES (@iDate)
	SET @iDate = dateadd(DAY, 1 , @iDate)
	
END


/*		lets SET up a pivot TABLE	*/
DECLARE @cols AS NVARCHAR(MAX), @query  AS NVARCHAR(MAX);

-- got cols working
SET @cols = stuff((SELECT ',' + QUOTENAME(d.dte) 
			FROM #dates d
			FOR xml PATH(''), TYPE
			).value('.', 'NVARCHAR(MAX)')
			,1,1,'')


-- now SET up pivots


SET @query = 'SELECT product_header_code , ph_description , product_code , pc_description , ps_description ,' + @cols + ' from
			(
				SELECT	
					psd.product_header_code , 
					psd.ph_description , 
					psd.product_code , 
					psd.pc_description , 
					psd.ps_description ,  
					psd.PricingSeasonDate ,
					psd.price 
				FROM #PricingSeasonDates psd
			) x
			pivot
			(
				MAX(price)
				FOR PricingSeasonDate IN (' + @cols + ')
			) p '

execute(@query)
