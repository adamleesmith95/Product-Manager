-- =============================================
-- Author:		Nick Morusiewicz
-- Create date: 04/11/2019
-- Description:	Displays sale location availability for a given set of PHCs in a PIVOT format
-- ChangeLog:
-- --08/01/2022: Created.
-- =============================================
SET NOCOUNT ON

IF OBJECT_ID('tempdb.dbo.#SearchList', 'U') IS NOT NULL
BEGIN
	DROP TABLE #SearchList
END

IF OBJECT_ID('tempdb.dbo.#LocList', 'U') IS NOT NULL
BEGIN
	DROP TABLE #LocList
END

CREATE TABLE #SearchList (
	search_code VARCHAR(MAX)
)

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

--SET @str = '4500'
--SET @str = '15000,15004'
--SET @dc_from = '0'
--SET @dc_to = '90009'
--SET @active_ind = 'Y'
--SET @search_type = '0'

WHILE CHARINDEX(',', @str) != 0 --Presence of a comma in the string indicates multiple values - iterate through and separate
BEGIN
	INSERT INTO #SearchList
	VALUES (
		--Insert everything from the beginning of the string up to the first comma into the table
		SUBSTRING(@str, 0, CHARINDEX(',', @str))
	)
	--Change string value to everything right of the first comma
	SET @str = RIGHT(@str, LEN(@str) - CHARINDEX(',', @str))
	--Trim just in case the user included spaces
	SET @str = LTRIM(RTRIM(@str))
END

--When no commas remain, insert last value
INSERT INTO #SearchList
VALUES (@str)

--Create #LocList table to holder PH/Sale Location data - must be done outside the dynamic query because temp tables created within dynamic queries don't persist outside that context
CREATE TABLE #LocList (
	display_category VARCHAR(40),
	product_header_code VARCHAR(18),
	description VARCHAR(40),
	active_ind CHAR(1),
	display_order INT,
	sale_location VARCHAR(40),
	at_location CHAR(1)
)

--Declare variable to hold dynamic query text
DECLARE @dynamic_query VARCHAR(MAX)
--Build SELECT clause
SET @dynamic_query = CONCAT(@dynamic_query, '
	INSERT INTO #LocList (
		display_category,
		product_header_code,
		description,
		active_ind,
		display_order,
		sale_location,
		at_location
	)
	SELECT DISTINCT
			DC.description AS display_category,
			PH.product_header_code,
			PH.description,
			PH.active_ind,
			PH.display_order,
		--	PHL.sale_location_code,
			SL.description AS sale_location,
			''X'' AS at_location
	--INTO
	--	#LocList
	FROM
		s_product_header PH
		JOIN s_display_category DC
			ON PH.display_category_code = DC.display_category_code
		JOIN s_product_header_location PHL
			ON PH.product_header_code = PHL.product_header_code
		JOIN s_location SL
			ON PHL.sale_location_code = SL.location_code
	WHERE
		PH.display_order BETWEEN ', @dc_from, ' AND ', @dc_to
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
			SELECT search_code FROM #SearchList
		)
	')
END
ELSE IF @search_type = '2' --By primary_lob_code
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.primary_lob_code IN (
			SELECT CAST(search_code AS INT) FROM #SearchList
		)
	')
END
--IF @search_type = 0 
ELSE --By display_category_code, need to cast code as INT to avoid conversion error at execution time
BEGIN
	SET @dynamic_query = CONCAT(@dynamic_query, '
		AND
		PH.display_category_code IN (
			SELECT CAST(search_code AS INT) FROM #SearchList
		)
	')
END

--Add ORDER BY clause
SET @dynamic_query = CONCAT(@dynamic_query, '
	ORDER BY
		DC.description ASC, PH.display_order ASC, PH.product_header_code ASC
')

EXEC(@dynamic_query)

IF (SELECT COUNT(*) FROM #LocList) = 0
BEGIN
	RETURN
END

DECLARE @DynamicSQL VARCHAR(MAX)

--Need to wrap every single PIVOT FOR column inside ISNULLs within the SELECT clause to replace NULL values with blanks in the PIVOT result set
SET @DynamicSQL = CONCAT('
	SELECT
		display_category,
		product_header_code,
		description,
		active_ind,
		display_order,
		',
			STUFF((
				SELECT DISTINCT CONCAT(',ISNULL([', sale_location, '],'''') AS [', sale_location, ']')
				FROM #LocList
				ORDER BY 1 ASC
				FOR XML PATH('')
			), 1, 1, ''),
		'
	FROM #LocList
	PIVOT (
		MAX(at_location)
		FOR sale_location IN (',
			STUFF((
				SELECT DISTINCT CONCAT(',[', sale_location, ']')
				FROM #LocList
				ORDER BY 1 ASC
				FOR XML PATH('')
			), 1, 1, ''),')
	) AS LocPivot')

SET @DynamicSQL = REPLACE(@DynamicSQL, '&amp;', '&')

--PRINT @DynamicSQL

EXEC(@DynamicSQL)

DROP TABLE #LocList
DROP TABLE #SearchList