
/*
-- -- 08/18/2023 alsmith1: Query TO CHECK Sales Locations AND taxes.... WHERE a sale location EXISTS ON a PHC - identify which POS has this sale location,
	THEN identify the relevant Close Location ON said POS
	AND CHECK IF the relevant tax IS ON said CLOSE location.
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

--SET @str = '136115'
----SET @str = '13254,13255,13256'
--SET @dc_from = '0'
--SET @dc_to = '9000'
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
--Declare variable to hold dynamic query text
DECLARE @dynamic_query VARCHAR(MAX)
--Build SELECT clause
SET @dynamic_query = CONCAT(@dynamic_query, '
		SELECT DISTINCT

		spos.close_location_code ,
		slc.description CloseLoc ,
		sr.description [Resort] , /* AS NEW FROM 2/4/2025 */
		st.description TaxDescription,
		spt.tax_code ProductTax ,
		ISNULL(stl.active_ind,''N'') [tax_active/on_close_location] ,
		stl.tax_amount ,
		stl.tax_method_code [Tax Method Code] , 
		stm.description [Tax Method] ,
		stl.apply_order ,
		stl.tax_segment1 ,
		stl.tax_segment2 ,
		stl.tax_segment3 ,
		stl.tax_threshold_amount

			FROM s_tax st ( NOLOCK )

		INNER JOIN	s_product_tax spt ( NOLOCK )
			ON st.tax_code = spt.tax_code
			AND st.active_ind = ''Y''
		RIGHT OUTER JOIN s_display_category sdc ( NOLOCK )

		INNER JOIN s_product_header sph ( NOLOCK )
		on sdc.display_category_code = sph.display_category_code AND sdc.active_ind = ''Y''

		INNER JOIN	s_product_header_location sphl ( NOLOCK )
			ON sph.product_header_code = sphl.product_header_code

		INNER JOIN	s_product sp ( NOLOCK )
			ON sphl.product_code = sp.product_code
			ON spt.product_code = sp.product_code
			AND sp.active_ind = ''Y''
		JOIN s_location sl	( NOLOCK )
			ON sphl.sale_location_code  = sl.location_code
		JOIN s_pos spos ( NOLOCK )
			ON sphl.sale_location_code = spos.sale_location_code AND spos.description NOT LIKE ''%test%''
		JOIN s_pos_pos_component sppc ( NOLOCK )
			ON spos.pos_code = sppc.pos_code AND sppc.pos_component_code != 2005 /* Exclude RPOS LITE/Guest CONNECT POS */
		JOIN s_location slc ( NOLOCK )
			ON spos.close_location_code  = slc.location_code
		LEFT JOIN s_tax_location stl ( NOLOCK )
			ON spt.tax_code = stl.tax_code AND spos.close_location_code = stl.close_location_code
			
			/* AS NEW FROM 2/4/2025 */

		LEFT JOIN s_tax_method stm
			ON stl.tax_method_code = stm.tax_method_code
		LEFT JOIN s_resort sr
			ON sl.resort_code = sr.resort_code


		WHERE
		spt.tax_code IS NOT NULL
		AND sph.display_order BETWEEN ', @dc_from, ' AND ', @dc_to
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
		spos.close_location_code,
		spt.tax_code
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #category_string