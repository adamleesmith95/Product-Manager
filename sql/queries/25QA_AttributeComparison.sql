-- =============================================
-- Author:		Nick Morusiewicz
-- Create date: 04/12/2019
-- Description:	Compares attribute values across a given group of products
-- ChangeLog:
-- --04/12/2019: Created.
-- --04/14/2019 nmorusiewicz: In addition to pulling in attribute that exist on any one of the given PHCs to be compared, should now also pull in attributes flagged as required
-- --	in Freeride for each business segment tied to at least one of the products to be compared, even if none of the products contain those attributes. Also, the column headers will
-- --	now be prefixed wit hthe business segment code of the business segment to which they're tied - this is to allow the viewer to differentiate between different instances of
-- --	the same attribute if products from more than one business segment are on the comparison list. Ex: If both Lesson and Activity products exist for comaprison, we need to
-- --	distinguish between the Friendly Name attribute tied to the Lessons segment and the Friendly Name attribute tied to the Activities segment.
-- --04/20/2019 nmorusiewicz: Line 256 - Updated ALTER TABLE statement to add the new column wit ha MAX NVARCHAR length - previous was 250, which resulted in "String or Binary Data
-- --	would be Truncated" error in the Season Passes business segment.
-- --06/13/2019 nmorusiewicz: Lines 247-248 - Added "ORDER BY" clause to the loop that adds attribute names as columns to ensure column headings are grouped by business segment and in 
-- --	alphabetical order.
-- --09/11/2019 nmorusiewicz: Lines 122-123 - Added check in WHERE clause to ensure only PHCs with a display order within dc_from and dc_to parameters are retrieved.
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/19/2020 nmorusiewicz: Changed initial query to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. Renamed
-- --                         temp table from #DCCs to #SearchList and the field from display_category_code to search_code to reflect its new flexibility.
-- =============================================
SET NOCOUNT ON

--Table to store relevant PHCs
IF OBJECT_ID('tempdb.dbo.#commonPHCs', 'U') IS NOT NULL
BEGIN
	DROP TABLE #commonPHCs
END
CREATE TABLE #commonPHCs (
	product_header_code NVARCHAR(50)
)

--Table to store all attributes that are associated with at least one of the PHCs
IF OBJECT_ID('tempdb.dbo.#allAttributes', 'U') IS NOT NULL
BEGIN
	DROP TABLE #allAttributes
END
CREATE TABLE #allAttributes (
	attribute_code NVARCHAR(50),
	attribute_name NVARCHAR(250),
	business_segment_code INT
)

--Table to store comparison data
IF OBJECT_ID('tempdb.dbo.#horizontalAVs', 'U') IS NOT NULL
BEGIN
	DROP TABLE #horizontalAVs
END
CREATE TABLE #horizontalAVs (
	display_category NVARCHAR(50),
	product_header_code NVARCHAR(25),
	product_header_description NVARCHAR(50),
	business_segment NVARCHAR(25)
)

--Table to store user-provided display category codes
IF OBJECT_ID('tempdb.dbo.#DCCs', 'U') IS NOT NULL
BEGIN
	DROP TABLE #SearchList
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

/*
SET @str = '13650'
SET @dc_from = '0'
SET @dc_to = '9999'
--SET @active_ind = 'Y'
--SET @search_Type = '0'
*/


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

DECLARE @tableAlter NVARCHAR(MAX)
DECLARE @tableUpdate NVARCHAR(MAX)
DECLARE @commonInsert NVARCHAR(MAX)
DECLARE @curAttCode INT
DECLARE @curAttName NVARCHAR(50)
DECLARE @curAttBusSeg INT

--Build list of PHCs for whom we want to compare attribute values. Query is dynamic to enable search by display_Categoyr_code, PHC, or primary_lob_code
SET @commonInsert = CONCAT('
	INSERT INTO #commonPHCs
	SELECT
		PH.product_header_code
	FROM
		s_product_header PH
	WHERE
		PH.display_order BETWEEN ', @dc_from, ' AND ', @dc_to
)
--Define active status
IF @active_ind IN ('Y', 'N')
BEGIN
	SET @commonInsert = CONCAT(@commonInsert, '
		AND
		PH.active_ind = ''', @active_ind, '''
	')
END

--Define Search Type
IF @search_type = '1' --By product_header_code
BEGIN
	SET @commonInsert = CONCAT(@commonInsert, '
		AND
		PH.product_header_code IN (
			SELECT search_code FROM #SearchList
		)
	')
END
ELSE IF @search_type = '2' --By primary_lob_code
BEGIN
	SET @commonInsert = CONCAT(@commonInsert, '
		AND
		PH.primary_lob_code IN (
			SELECT CAST(search_code AS INT) FROM #SearchList
		)
	')
END
--IF @search_type = 0 
ELSE --By display_category_code, need to cast code as INT to avoid conversion error at execution time
BEGIN
	SET @commonInsert = CONCAT(@commonInsert, '
		AND
		PH.display_category_code IN (
			SELECT CAST(search_code AS INT) FROM #SearchList
		)
	')
END
EXEC (@commonInsert)

--Build list of all attributes that are added to at least one of the products to be compared
INSERT INTO #allAttributes
SELECT DISTINCT
	A.attribute_code,
	A.attribute_name,
	A.business_segment_code
FROM
	s_attribute A
	JOIN s_attribute_value AV
		ON A.attribute_code = AV.attribute_code
	JOIN s_attribute_prodheader_value APHV
		ON AV.attribute_value_code = APHV.attribute_value_code
	JOIN s_attribute_busnsegment_prodheader ABSPH
		ON APHV.header_segment_code = ABSPH.header_segment_code
WHERE
	ABSPH.product_header_code IN (
		SELECT product_header_code FROM #commonPHCs
	)

--Insert Freeride attributes that are required for any business segments currently present in the table if they don't already exist.
IF EXISTS (SELECT business_segment_code FROM #allAttributes WHERE business_segment_code = 1) --Lift Tickets
BEGIN
	INSERT INTO #allAttributes (
		attribute_code,
		attribute_name,
		business_segment_code
	)
	SELECT
		A.attribute_code,
		A.attribute_name,
		A.business_segment_code
	FROM
		s_attribute A
	WHERE
		A.attribute_code IN (1, 2, 6, 33)
		AND
		A.attribute_code NOT IN (SELECT attribute_code FROM #allAttributes)
END
IF EXISTS (SELECT business_segment_code FROM #allAttributes WHERE business_segment_code = 2) --Lessons
BEGIN
	INSERT INTO #allAttributes (
		attribute_code,
		attribute_name,
		business_segment_code
	)
	SELECT
		A.attribute_code,
		A.attribute_name,
		A.business_segment_code
	FROM
		s_attribute A
	WHERE
		A.attribute_code IN (17,19,20,21,23,24,25,27,35,36,37,38,39,40,41,42,43,44,45,46,1132,1131,231)
		AND
		A.attribute_code NOT IN (SELECT attribute_code FROM #allAttributes)
END
IF EXISTS (SELECT business_segment_code FROM #allAttributes WHERE business_segment_code = 3) --Season Passes
BEGIN
	INSERT INTO #allAttributes (
		attribute_code,
		attribute_name,
		business_segment_code
	)
	SELECT
		A.attribute_code,
		A.attribute_name,
		A.business_segment_code
	FROM
		s_attribute A
	WHERE
		A.attribute_code IN (28,29,31,52,53,56,57,109,119,120)
		AND
		A.attribute_code NOT IN (SELECT attribute_code FROM #allAttributes)
END
IF EXISTS (SELECT business_segment_code FROM #allAttributes WHERE business_segment_code = 4) --Activities
BEGIN
	INSERT INTO #allAttributes (
		attribute_code,
		attribute_name,
		business_segment_code
	)
	SELECT
		A.attribute_code,
		A.attribute_name,
		A.business_segment_code
	FROM
		s_attribute A
	WHERE
		A.attribute_code IN (69,70,71,72,73,74,75,76,77,78,93,121)
		AND
		A.attribute_code NOT IN (SELECT attribute_code FROM #allAttributes)
END

--Initialize comparison table and insert PHCs and descriptions to be compared in the first two columns
INSERT INTO #horizontalAVs (
	display_category,
	product_header_code,
	product_header_description,
	business_segment
)
SELECT DISTINCT
	DC.description,
	CPH.product_header_code,
	PH.description AS product_header_description,
	ABS.business_segment
FROM
	#commonPHCs CPH
	JOIN s_product_header PH
		ON CPH.product_header_Code = PH.product_header_code
	JOIN s_display_category DC
		ON PH.display_category_code = DC.display_category_code
	LEFT JOIN s_attribute_busnsegment_prodheader ABSPH
		ON CPH.product_header_code = ABSPH.product_header_code
	LEFT JOIN s_attribute_busnsegment ABS
		ON ABSPH.business_segment_code = ABS.business_segment_code

--Iterate through list of attributes and add a column to the comparison table for each unique attribute
WHILE (SELECT COUNT(*) FROM #allAttributes) > 0
BEGIN
	--Store attribute code and attribute name for the current iteration
	SELECT TOP 1
		@curAttCode = attribute_code,
		@curAttName = attribute_name,
		@curAttBusSeg = business_segment_code
	FROM
		#allAttributes
	ORDER BY
		business_segment_code ASC, attribute_name ASC

	--Reset ALTER statement
	SET @tableAlter = '
	ALTER TABLE #horizontalAVs
	ADD ['

	--Update ALTER statement to add a column sharing the name of the currently attribute
	SET @tableAlter = CONCAT(@tableAlter, @curAttBusSeg, '-', REPLACE(@curAttName, ' ', '_'), '] NVARCHAR(MAX)')

	--PRINT @tableAlter
	--Execute the ALTER statement to add the column
	EXEC (@tableAlter)

	--Create update statement to retrieve the values associated with the current attribute for each comparison PHC and add those values into the comparison table in the new column
	SET @tableUpdate = CONCAT('
		UPDATE
			#horizontalAVs
		SET
			[', @curAttBusSeg, '-', REPLACE(@curAttName, ' ', '_'), '] = STUFF((
				SELECT
					CONCAT('';'', AV.attribute_value)
				FROM
					s_attribute_busnsegment_prodheader ABSPH
					JOIN s_attribute_prodheader_value APHV
						ON ABSPH.header_segment_code = APHV.header_segment_code
					JOIN s_attribute_value AV
						ON APHV.attribute_value_code = AV.attribute_value_code
				WHERE
					ABSPH.product_header_code = HAV.product_header_code AND AV.attribute_code = ', @curAttCode, '
				FOR XML PATH('''')
			), 1, 1, '''')
		FROM
			#horizontalAVs HAV'
	)

	--PRINT @tableUpdate
	--Execute the UPDATE statement
	EXEC (@tableUpdate)

	--Delete the record for the current attribute from the attributes table and move to next iteration
	DELETE FROM #allAttributes WHERE attribute_code = @curAttCode
END
--View comparison results
SELECT * FROM #horizontalAVs

--Drop temp tables
DROP TABLE #commonPHCs
DROP TABLE #allAttributes
DROP TABLE #horizontalAVs
DROP TABLE #SearchList

