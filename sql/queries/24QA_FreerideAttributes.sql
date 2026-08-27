-- =============================================
-- Author:		Nick Morusiewicz
-- Create date: 04/11/2019
-- Description:	Retrieves Freeride-related attributes for a given set of products based on display category and business segment
-- ChangeLog:
-- --04/11/2019: Created.
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/05/2020 nmorusiewicz: Changed query to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. Changed temp table
-- --                         name from #DCCs to #SearchList and field from display_Category_Code to search_code to reflect new flexibility. Had to totally re-write the query FROM clause 
-- --                         to start from s_product_header instead of s_attribute.
-- =============================================
SET NOCOUNT ON

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
--SET @search_type = '0'
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

--Declare variable to hold dynamic query text
DECLARE @dynamic_query VARCHAR(MAX)
--Build SELECT clause
SET @dynamic_query = CONCAT(@dynamic_query, '
	SELECT DISTINCT
		PH.product_header_code,
		PH.description,
		ABS.business_segment,
		A.attribute_code,
		A.attribute_name,
		LTRIM(STUFF((
			SELECT CONCAT(''; '', AV.attribute_value) FROM s_attribute_value AV
			JOIN s_attribute_prodheader_value APHV ON AV.attribute_value_code = APHV.attribute_value_code
			JOIN s_attribute_busnsegment_prodheader ABSPH ON APHV.header_segment_code = ABSPH.header_segment_code
			WHERE A.attribute_code = AV.attribute_code AND ABSPH.product_header_code = PH.product_header_code
			FOR XML PATH('''')
		), 1, 1, '''')) AS attribute_value,
		CASE
			WHEN a.attribute_code IN (1,2,6,17,20,21,23,25,28,29,31,35,36,37,41,52,57,69,70,73,109,227,113)
				THEN ''Y''
			ELSE ''N''
		END AS value_req
	FROM
		s_product_header PH
		JOIN s_attribute_busnsegment_prodheader ABSPH
			ON PH.product_header_code = ABSPH.product_header_code
		JOIN s_attribute_busnsegment ABS
			ON ABSPH.business_segment_code = ABS.business_segment_code
		JOIN s_attribute A
			ON ABS.business_segment_code = A.business_segment_code
	--	JOIN s_attribute_prodheader_value APHV
	--		ON ABSPH.header_segment_code = APHV.header_segment_code
	--	JOIN s_attribute_value AV
	--		ON APHV.attribute_value_code = AV.attribute_value_code AND A.attribute_code = AV.attribute_code
	WHERE
		(
			(
				CASE WHEN ABSPH.business_segment_code = 2 THEN --Lessons
					A.attribute_code END IN (17,19,20,21,23,24,25,27,35,36,37,38,39,40,41,42,43,44,45,46,1132,1131,231)
			) OR (
				CASE WHEN ABSPH.business_segment_code = 4 THEN --Activities
					A.attribute_code END IN (69,70,71,72,73,74,75,76,77,78,93,121,159,117,1139,113,164,229,228)
			) OR (
				CASE WHEN ABSPH.business_segment_code = 3 THEN --Season Passes
					A.attribute_code END IN (28,29,31,52,53,56,57,109,119,120)
			) OR (
				CASE WHEN ABSPH.business_segment_code = 1 THEN --Lift Tickets
					A.attribute_code END IN (1,2,6,33,227,1138)
			)
		)
		AND
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
		PH.product_header_code ASC, attribute_name ASC
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #SearchList
--SELECT * FROM s_attribute_busnsegment