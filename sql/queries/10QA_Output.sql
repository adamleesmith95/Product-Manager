/*
MY RPOS VERSION OF RTP'S OUTPUT TAB ON THE WB QA REPORT... TO QA YOU NEED TO CHANGE THE FOLLOWING:
@display_category_code
@dc_from
@dc_to
TO MATCH THE DISPLAY CATEGORY AND DISPLAY ORDER RANGE THAT YOU ARE LOOKING TO QA
-- -- Changelog: -- --
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/18/2020 nmorusiewicz: Changed query to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. Changed cats field
-- -------------------------- in temp table from INT to VARCHAR(50) to enable.
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

--SET @str = '14001'
--SET @str = '13254,13255,13256'
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
		sdc.display_category_code AS DisplayCategoryCode,
		sdc.display_order AS DisplayCategoryOrder,
		sdc.description AS DisplayCategory,
		sph.product_header_code AS ProductHeaderCode,
		sph.description AS ProductHeader,
		sph.active_ind as PHStatusCode,
		sph.display_ind as PHDisplayInd,
		sph.display_order AS PHOrder,
		sp.product_code AS ProductCode,
		sp.description AS Product,
		sp.active_ind,
		sp.display_ind,

		smt.media_template_code,
		smt.Description as MediaTemplate,

		spc.module_name,
		spop.print_label1,
		spop.print_label2,
		spop.print_label3,
		spop.print_label4,
		spop.print_quantity,
		spop.pos_component_code,

		spmt.Description as PassMediaType,
		sppp.pass_media_type_code,
		sppp.image_ind as PassMediaImageRequiredInd,
		sppp.image_optional_ind,
		sppp.pass_product_type_code,
		sppp.rf_media_ind


	FROM s_display_category sdc  ( NOLOCK )

	INNER JOIN s_product_header sph  ( NOLOCK )
		ON sdc.display_category_code = sph.display_category_code
		--AND sph.active_ind = ''Y''
	INNER JOIN	s_product_header_location sphl  ( NOLOCK )
		ON sph.product_header_code = sphl.product_header_code

	INNER JOIN	s_product sp  ( NOLOCK )
		ON sphl.product_code = sp.product_code
		AND sp.active_ind = ''Y''
	INNER JOIN	s_product_output_profile spop  ( NOLOCK )
		ON sp.product_code = spop.product_code
		--AND pop.SalesChannelCode = sc.SalesChannelCode

	INNER JOIN s_pos_component spc ( NOLOCK )
		ON spop.pos_component_code = spc.pos_component_code

	--Karl added Output Type, may not exist in RPOS
	--LEFT JOIN RTPOne.dbo.OutputType ot ( NOLOCK )
	--	ON pop.OutputTypeCode = ot.OutputTypeCode


	--Karl added Product Printer Stock, may not exist in RPOS
	--LEFT JOIN RTPOne.dbo.ProductPrinterStock pps ( NOLOCK )
	--	ON pop.ProductPrinterStockCode = pps.ProductPrinterStockCode

	INNER JOIN	s_media_template smt  ( NOLOCK )
		ON spop.media_template_code = smt.media_template_code
	--Karl added Media Template Group and Category, may not exist in RPOS
	--INNER JOIN RTPOne.dbo.MediaTemplateCategory mtc ( NOLOCK )
	--	ON mt.MediaTemplateCategoryCode = mtc.MediaTemplateCategoryCode
	--INNER JOIN RTPOne.dbo.MediaTemplateGroup mtg ( NOLOCK )
	--	ON mtc.MediaTemplateGroupCode = mtg.MediaTemplateGroupCode

	--Karl added Product Printer and Pass Media Product Profile
	--LEFT JOIN RTPOne.dbo.ProductPrinter pp ( NOLOCK )
	--	ON pop.ProductPrinterCode = pp.ProductPrinterCode

	LEFT JOIN s_pass_product_profile sppp ( NOLOCK )
		ON sp.product_code = sppp.product_code
	LEFT JOIN s_pass_media_type spmt ( NOLOCK )
		ON sppp.pass_media_type_code = spmt.pass_media_type_code

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
		sph.product_header_code
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #category_string