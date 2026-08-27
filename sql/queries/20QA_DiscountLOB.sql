-- -- Changelog: -- --
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/18/2020 nmorusiewicz: Changed query to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. Changed cats field
-- -------------------------- in temp table from INT to VARCHAR(50) to enable.
-- --08/21/2020 nmorusiewicz: Wrapped y.i.value() in LTRIM(RTRIM()) to ensure PHC parameters are read correctly whether or not the user includes a space.
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

--SET @str = '103028'
----SET @str = '13251,13250,13259,13260'
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

--Declare variable to hold dynamic query text
DECLARE @dynamic_query VARCHAR(MAX)
--Build SELECT clause
SET @dynamic_query = CONCAT(@dynamic_query, '
	SELECT DISTINCT
		sdc.display_category_code AS DisplayCategoryCode,
		sdc.display_order AS DisplayCategoryOrder,
		sdc.description AS DisplayCategory,
		sph.product_header_code AS ProductHeaderCode,
		sph.description AS ProductHeader,
		sph.active_ind as PHStatusCode,
		sph.display_ind as PHDisplayInd,
		sph.display_order AS PHOrder,


		sd.amount_change_level as AmountChangeSecurityLevel,


		slob.Description as LOB,
		spld.discount_code as LOBDiscountCode,
		sd.Description as Discount,
		sdcate.Description as DiscountCategory,
		sd.display_ind as DiscountDisplayInd,
		sd.security_level,
		CAST(spld.effective_date AS DATE) effective_date,
		CAST(spld.expiration_date AS DATE) expiration_date,
		spld.discount_amount ,
		scme.Description as CalculationMethod,
		sd.amount_change_level as AmountChangeSecurityLevel
		



	FROM dbo.s_display_category sdc  with (nolock)

		INNER JOIN dbo.s_product_header sph  with (nolock)
		ON sdc.display_category_code = sph.display_category_code
			AND sph.active_ind = ''Y''
		INNER JOIN dbo.s_product_header_location sphl  with (nolock)
		ON sph.product_header_code = sphl.product_header_code




		LEFT JOIN dbo.s_lob_discount spld with (nolock)
		ON sph.primary_lob_code = spld.lob_code
		INNER JOIN dbo.s_lob slob with (nolock)
		ON spld.lob_code = slob.lob_code
		INNER JOIN dbo.s_Discount sd with (nolock)
		ON spld.discount_code = sd.discount_code AND sd.active_ind = ''Y''
		INNER JOIN dbo.s_discount_category sdcate with (nolock)
		ON sd.Discount_Category_Code = sdcate.Discount_Category_Code

		INNER JOIN dbo.s_discount_method scme with (nolock)
		ON spld.discount_method_code = scme.discount_method_code

	/* DON''T BELIEVE RPOS HAS COMPARE RULE CODES...
	LEFT JOIN dbo.CompareRule scr with (nolock)
		ON sphd.DiscountCode = scr.EntityInstanceCode
		and scr.rulecode = 8
	*/

	/* NEW 5/18/2024 Adam Smith - ONLY displaying Discounts WHERE the Discounts ARE ONLY available AT the Sales Locations ON the PHCs being run IN the QA */
	
	JOIN s_discount_location_filter sdlf
		ON sphl.sale_location_code = sdlf.sale_location_code AND spld.discount_code = sdlf.discount_code
		


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
	ORDER BY sdc.display_order, 
		sph.display_order, 
		sph.product_header_code,
		--sdg.Description,
		sdcate.Description,
		sd.Description,
		spld.discount_code
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #category_string