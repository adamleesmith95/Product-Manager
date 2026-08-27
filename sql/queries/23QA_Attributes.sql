-- =============================================
-- Author:		Adam Smith
-- Create date: 04/11/2019
-- Description:	Retrieves PHCs and components where the given component does not have pricing on the given PHC
-- ChangeLog:
-- --04/11/2019: Created.
-- --04/11/2019 nmorusiewicz: Hard-coded PRODUCT TYPE field to populate with value 'PHC' to maintain compatibility with the PMAT
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/05/2020 nmorusiewicz: Changed query to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. Changed cats field
-- --                         in temp table from INT to VARCHAR(50) to enable.
-- --08/21/2020 nmorusiewicz: Wrapped y.i.value() in LTRIM(RTRIM()) to ensure PHC parameters are read correctly whether or not the user includes a space.
-- =============================================
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

--SET @str = '13124'
--SET @str = '13254,13255,13256'
--SET @dc_from = '0'
--SET @dc_to = '9000'
--SET @active_ind = 'Y'
--SET @search_Type = '0'

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
	SELECT
			sab.business_segment "BUSINESS SEGMENT" ,
			''PHC'' AS "PRODUCT TYPE",
			sdc.display_category_code "DISPCAT CODE" ,
			sabp.product_header_code "PRODUCT CODE" ,
			sph.description "PRODUCT DESCRIPTION" ,
			sph.active_ind "PRODUCT ACTIVE" ,
			sl.description "LOB" ,
			sdc.description "DISPLAY CATEGORY" ,
			sa.attribute_name "ATTRIBUTE" ,
			sa.multiselect_ind "MULTIPLE SELECT" ,
			sa.comment "ATTRIBUTE COMMENT" ,
			sav.attribute_value "ATTRIBUTE VALUE" ,
			sav.attribute_value_code "ATTRIBUTE VALUE CODE" ,
			sav.comment "ATTRIBUTE VAL COMMENT" ,
			sphi.special_text "SPECIAL TEXT" ,
			sph.display_title "DISPLAY TITLE"


	FROM dbo.s_attribute_busnsegment_prodheader sabp WITH (NOLOCK)
		LEFT JOIN dbo.s_attribute_prodheader_value sapv WITH (NOLOCK)
		ON sabp.header_segment_code = sapv.header_segment_code

		LEFT JOIN dbo.s_attribute_value sav  WITH ( NOLOCK )
		ON sapv.attribute_value_code = sav.attribute_value_code

		LEFT JOIN s_attribute sa  WITH ( NOLOCK )
		ON sa.attribute_code = sav.attribute_code

		LEFT JOIN dbo.s_attribute_busnsegment sab  WITH ( NOLOCK )
		ON sab.business_segment_code = sa.business_segment_code

		LEFT JOIN dbo.s_product_header sph  WITH ( NOLOCK )
		ON sph.product_header_code = sabp.product_header_code

		LEFT JOIN dbo.s_display_category sdc WITH (NOLOCK)
		ON sdc.display_category_code = sph.display_category_code

		LEFT JOIN dbo.s_lob sl  WITH ( NOLOCK )
		ON sph.primary_lob_code = sl.lob_code

		LEFT JOIN dbo.s_product_header_internet sphi  WITH ( NOLOCK )
		on sph.product_header_code = sphi.product_header_code

	WHERE

	/*
	ORDER BY 
		sabp.product_header_code ,
		sabp.business_segment_code ,
		sa.attribute_code ,
		sav.attribute_value_code
		*/
	
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
	ORDER BY
		sdc.display_order,
		sph.display_order,
		sph.product_header_code,
		sa.attribute_name
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #category_string