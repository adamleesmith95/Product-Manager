-- =============================================
-- Author:		Nick Morusiewicz
-- Create date: 09/11/2020
-- Description:	Retrieves PHC earned accounting and Scan Type Location usage accounting for any components using a Backload Earn by Usage deferral pattern associated with the given PHCs.
-- ChangeLog:
-- --09/11/2020: Created.
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
SET @str = '14001'
SET @dc_from = '0'
SET @dc_to = '9999'
--SET @active_ind = 'Y'
--SET @search_type = '1'
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
		PHL.product_header_code,
		PH.description AS product_header,
		PHL.product_code,
		P.description AS product,
		--PHL.sale_location_code,
		--SL.description AS sale_location,
		PHL.revenue_location_code AS product_revenue_location_code,
		PRL.description AS product_revenue_location,
		PHL.earned_segment1,
		PHL.earned_Segment2,
		PHL.earned_segment3,
		PHL.unearned_segment1,
		PHL.unearned_segment2,
		PHL.unearned_segment3,
		P.deferral_pattern_code,
		DP.description AS deferral_pattern,
		LPP.scan_type_code,
		ST.description AS scan_type,
		STLG.scan_location_group_code,
		SLG.description AS scan_location_group,
		STLG.revenue_location_code AS scan_revenue_locatin_code,
		SRL.description AS scan_revenue_location,
		STLG.usage_segment1,
		STLG.usage_segment2,
		STLG.usage_segment3
	FROM
		s_product_header_location PHL
		JOIN s_product_header PH
			ON PHL.product_header_code = PH.product_header_code
		JOIN s_product P
			ON PHL.product_code = P.product_code
		JOIN s_deferral_pattern DP
			ON P.deferral_pattern_code = DP.deferral_pattern_code
		JOIN s_lift_product_profile LPP
			ON P.product_code = LPP.product_code
		JOIN s_scan_type ST
			ON LPP.scan_type_code = ST.scan_type_code
		JOIN s_scan_type_location_group STLG
			ON LPP.scan_type_code = STLG.scan_type_code
		JOIN s_scan_location_group SLG
			ON STLG.scan_location_group_code = SLG.scan_location_group_code
		JOIN s_location SL
			ON PHL.sale_location_code = SL.location_code
		JOIN s_location PRL
			ON PHL.revenue_location_code = PRL.location_code
		JOIN s_location SRL
			ON STLG.revenue_location_code = SRL.location_code
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
		PHL.product_header_code ASC, product ASC, product_revenue_location ASC
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #SearchList