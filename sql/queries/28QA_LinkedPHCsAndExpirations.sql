-- =============================================
-- Author:		Nick Morusiewicz
-- Create date: 10/08/2020
-- Description:	Retrieves all Linked Products associated with the product headers within a given display category and Link Type of 150, and the access expirations of those linked products, 
-- --			if applicable. This is similar to PassLinkedPHCsAndExpirations, but includes only link type 150.
-- ChangeLog:
-- --10/08/2020 Created.
-- --07/06/2021 nmorusiewicz: Re-wrote to be a single query with no temp table, rather than filling and updating a temp table. Since this iteration of the query is focused specifically on
-- -------------------------- non-Pass product headers with a link type of 150, those shenaigans to make Pass Insurance work right aren't necessary. Query will include all Add-On product
-- -------------------------- headers and components, whether they're lift access components or not.
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
SET @str = '1671, 1674'
SET @dc_from = '0'
SET @dc_to = '99999'
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
		PH.product_header_code,
		PH.description,
		PLT.product_link_type_code,
		PLT.description AS product_link_type,
		PHL.link_product_header_code,
		LPH.description AS link_phc_description,
		LPHL.product_code AS linked_component_code,
		LP.description as linked_component_desc,
		CASE
			WHEN LLPP.expiration_type = ''D''
				THEN CAST(LLPP.expiration_days AS VARCHAR(25))
			WHEN LLPP.expiration_type = ''T''
				THEN CAST(LLPP.expiration_date AS VARCHAR(25))
			ELSE ''Non-Access''
		END AS linked_component_expiration ,

		/* AS NEW FROM 2/4/2025 START */
		CASE
			WHEN LLPP.expiration_type = ''D''
				THEN ''Days''
			WHEN LLPP.expiration_type = ''T''
				THEN ''Date''
			ELSE LLPP.expiration_type
		END AS expiration_type

		/* AS NEW FROM 2/4/2025 END */
	FROM
		s_product_header PH
		JOIN s_product_header_link PHL
			ON PH.product_header_code = PHL.product_header_code AND PHL.product_link_type_code = 150
		JOIN s_product_link_type PLT
			ON PHL.product_link_type_code = PLT.product_link_type_code
		JOIN s_product_header LPH
			ON PHL.link_product_header_code = LPH.product_header_code
		JOIN s_product_header_location LPHL
			ON LPH.product_header_code = LPHL.product_header_code
		JOIN s_product LP
			ON LPHL.product_code = LP.product_code
		LEFT JOIN s_lift_product_profile LLPP
			ON LPHL.product_code = LLPP.product_code
		JOIN s_display_category DC
			ON PH.display_category_code = DC.display_category_code
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
--Add ORDER BY logic
SET @dynamic_query = CONCAT(@dynamic_query, '
	ORDER BY
		PH.Product_header_code ASC,
		PHL.link_product_header_code ASC,
		linked_component_code ASC,
		linked_component_expiration ASC
')
EXEC (@dynamic_query)

--Drop temp tables
DROP TABLE #SearchList
