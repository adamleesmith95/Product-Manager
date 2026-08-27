/*
MY RPOS VERSION OF RTP'S HEADER TAB ON THE WB QA REPORT... TO QA YOU NEED TO CHANGE THE FOLLOWING:
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

--SET @str = '108351'
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
	SELECT
		sph.product_header_code PHC,
		sph.Description,
		sph.active_ind AS Active,
		sph.display_ind AS Display,

		--sph.max_quantity AS MaxQty,
		--sph.customer_min_age,
		--sph.customer_max_age,

		spr.prompt_code,
		spr.description PROMPT,
		spr.prompt_text,
		spr.active_ind,
		spha.min_advance_days,
		spha.max_advance_days,
		sphi.internet_authorization_code WaiverCode,
		sia.description Waiver,

		/* AS NEW FROM 2/4/2025 START */

		siast.description [Waiver Start Type] ,
		siaet.description [Waiver End Type] ,
		sia.expire_day [Expire Day] ,
		sia.expire_month [Expire Month] ,
		sias.description [Waiver Season] ,

			/* AS NEW FROM 2/4/2025 END */

		sphi.shipping_category_code,
		ssc.description ShippingCategory ,
		CASE WHEN sph.unit_of_measure_code = 1 THEN ''Days'' WHEN sph.unit_of_measure_code = 2 THEN ''Season'' END AS UnitOM,
		sab.business_segment ,
		sphmf.mm_function_code , 
		sf.description MM_Property

		

				
	FROM s_display_category sdc ( NOLOCK )
		JOIN s_product_header sph ( NOLOCK )
			ON sph.display_category_code = sdc.display_category_code
		LEFT JOIN s_audit_category sac ( NOLOCK )
			ON sac.audit_category_code = sph.audit_category_code
		LEFT JOIN s_product_prompt spp ( NOLOCK )
			ON sph.product_header_code = spp.product_header_code

			-- AS 1/24/2019 Recently added, AS need TO confirm that ALL PHC''s that require AutoLoad TO SmartAccess will need the ''AutoLoad Product'' checked... this works IN conjunction WITH Batch Pass PRINT/Media Delivery
			-- Also added advance booking days & the internet authorisation / waiver requirement details
		LEFT JOIN s_product_header_advance_days spha WITH (NOLOCK)
			ON spha.product_header_code = sph.product_header_code
		LEFT JOIN s_product_header_internet sphi WITH (NOLOCK)
			ON sphi.product_header_code = sph.product_header_code
		LEFT JOIN s_shipping_category ssc WITH (NOLOCK)
			ON ssc.shipping_category_code = sphi.shipping_category_code
		LEFT JOIN s_internet_authorization sia WITH (NOLOCK)
			ON sia.internet_authorization_code = sphi.internet_authorization_code

		LEFT JOIN s_attribute_busnsegment_prodheader sabp WITH (NOLOCK)
			ON sph.product_header_code = sabp.product_header_code
		LEFT JOIN s_attribute_busnsegment sab WITH (NOLOCK)
			ON sabp.business_segment_code = sab.business_segment_code

	
		LEFT JOIN s_prompt spr ( NOLOCK )
			ON spp.prompt_code = spr.prompt_code

		LEFT JOIN s_product_header_mm_function sphmf WITH (NOLOCK)
			ON sph.product_header_code = sphmf.product_header_code

		LEFT JOIN s_system_function sf WITH (NOLOCK)
			ON sf.system_function_code = sphmf.mm_function_code

			/* AS NEW FROM 2/4/2025 START */

		LEFT JOIN s_internet_authorization_season sias
			ON sia.season_id = sias.season_id
		LEFT JOIN s_internet_authorization_end_type siaet
			ON sia.end_type_id = siaet.end_type_id
		LEFT JOIN s_internet_authorization_start_type siast
			ON sia.start_type_id = siast.start_type_id

			/* AS NEW FROM 2/4/2025 END */


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
		sdc.display_order,
		sph.display_order
')
--PRINT @dynamic_query
--Execute dynamic query
EXEC (@dynamic_query)

DROP TABLE #category_string