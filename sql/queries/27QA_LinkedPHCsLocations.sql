-- =============================================
-- Author:		Nick Morusiewicz
-- Create date: ??/??/????
-- Description:	Pulls list of pass PHCs and products linked ot those pass PHCs to ensure the linked products are available everywhere that the base PHC is available
-- ChangeLog:
-- --??/??/????: Created.
-- --10/10/2019 nmorusiewicz: Added parameter and check in the WHERE clause to remove inactive PHCs from the result set if the user so desires
-- --05/19/2020 nmorusiewicz: Changed query to be dynamic and enbaled user to choose whether to search by display_category_code, product_header_code, or primary_lob_code. Changed cats field
-- --                         in temp table from INT to VARCHAR(50) to enable.
-- --08/21/2020 nmorusiewicz: Wrapped y.i.value() in LTRIM(RTRIM()) to ensure PHC parameters are read correctly whether or not the user includes a space.
-- --10/30/2020 nmorusiewicz: Added DISTINCT keyword to the subquery determining linked_product_at_location to avoid "Subquery returned more than one value..." in the event that an add-on has multiple components.
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

/*
SET @str = '1671'
SET @dc_from = '0'
SET @dc_to = '9000'
SET @active_ind = 'Y'
SET @search_type = '0'
*/

CREATE TABLE #category_string
(
	cats VARCHAR(MAX)
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

		sdc.description AS ''Display Category'',
		sph.product_header_code AS PHC , 
		sph.description AS ''PHC Description'' , 
		sl.location_code ''Sale Location Code'' ,
		sl.description ''Sale Location'' ,
		sphlink.link_product_header_code ''Linked PHC'',
		sph1.description ''Linked PHC Desc'' ,
		sphlink.product_link_type_code ''Link Code'' ,
		splt.description ''Link Type'' ,

		CASE
		 WHEN
			   ISNULL((
					SELECT DISTINCT LPHL.sale_location_code FROM s_product_header_location LPHL
					WHERE LPHL.sale_location_code = SL.location_code
					AND LPHL.product_header_code = SPHLINK.link_product_header_code
			   ), -1) != -1
		 THEN ''Y''
		 ELSE ''N''
	END AS linked_product_at_location


	
	FROM s_product_header sph ( NOLOCK )
	
	JOIN s_product_header_link sphlink WITH (NOLOCK)
		ON sphlink.product_header_code = sph.product_header_code
	JOIN s_product_header sph1 WITH (NOLOCK)
		ON sphlink.link_product_header_code = sph1.product_header_code
	JOIN s_product_header_location sphl ( NOLOCK )
		ON sph.product_header_code = sphl.product_header_code
	JOIN s_location sl ( NOLOCK )
		ON sl.location_code = sphl.sale_location_code

	JOIN s_product_link_type splt WITH (NOLOCK)
		ON splt.product_link_type_code = sphlink.product_link_type_code

	JOIN s_display_category sdc WITH (NOLOCK)
		ON sdc.display_category_code = sph.display_category_code

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
	ORDER BY
		sph.product_header_code ASC ,
		sphlink.product_link_type_code ,
		--linked_product_at_location ,
		sl.location_code
       --LinkType ASC,
        --5 ASC,
        --sl.location_code ASC
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #category_string