-- -- Changelog: -- --
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/19/2020 nmorusiewicz: Changed query to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. Renamed temp table
-- -------------------------- from #DCCs to #SearchList and the field from display_category_code to search_code to reflect its new flexibility.
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
SET @str = '3345'
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
		DP.description AS deferral_pattern,
		L.description AS revenue_location,
		RL.default_earned_segment1,
		RL.default_earned_segment2,
		RL.default_unearned_segment1,
		RL.default_unearned_segment2,
		UST.description AS usage_stat,
		UST.earned_segment3 AS default_usage_earned_segment3,
		UST.unearned_segment3 AS default_usage_unearned_segment3,
		USTL.earned_segment1 AS usage_earned_segment1,
		USTL.earned_segment2 AS usage_earned_segment2,
		USTL.earned_segment3 AS usage_earned_segment3,
		USTL.unearned_segment1 AS usage_unearned_segment1,
		USTL.unearned_segment2 AS usage_unearned_segment2,
		USTL.unearned_segment3 AS usage_unearned_segment3,
		BST.description AS breakage_stat,
		BST.earned_segment3 AS default_breakage_earned_segment3,
		BST.unearned_segment3 AS default_breakage_unearned_segment3,
		BSTL.earned_segment1 AS breakage_earned_segment1,
		BSTL.earned_segment2 AS breakage_earned_segment2,
		BSTL.earned_segment3 AS breakage_earned_segment3,
		BSTL.unearned_segment1 AS breakage_unearned_segment1,
		BSTL.unearned_segment2 AS breakage_unearned_segment2,
		BSTL.unearned_segment3 AS breakage_unearned_segment3
	FROM
		s_product_header_location PHL
		JOIN s_product_header PH
			ON PHL.product_header_code = PH.product_header_code
		JOIN s_product P
			ON PHL.product_code = P.product_code
		LEFT JOIN s_deferral_pattern DP
			ON P.deferral_pattern_code = DP.deferral_pattern_code
		JOIN s_location L
			ON PHL.revenue_location_code = L.location_code
		JOIN s_revenue_location RL
			ON PHL.revenue_location_code = RL.revenue_location_code
		JOIN s_product_statistic PST
			ON PHL.product_code = PST.product_code
		JOIN s_statistic UST
			ON PST.statistic_code = UST.statistic_code
		LEFT JOIN s_statistic_location USTL
			ON (PST.statistic_code = USTL.statistic_code AND PHL.revenue_location_code = USTL.revenue_location_code)
		JOIN s_statistic BST
			ON UST.breakage_statistic_code = BST.statistic_code
		LEFT JOIN s_statistic_location BSTL
			ON (UST.breakage_statistic_code = BSTL.statistic_code AND PHL.revenue_location_code = BSTL.revenue_location_code)
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
		PHL.product_header_code ASC, product ASC, revenue_location ASC
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #SearchList