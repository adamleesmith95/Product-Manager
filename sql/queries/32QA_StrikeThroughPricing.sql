/*
Inventory Pool QA – Dynamic (RUH/RUD only; no TAX/LOB joins)

PARAMETERS TO SET:
  @str           -- comma-separated list of codes per @search_type
  @dc_from       -- display_order start (as text)
  @dc_to         -- display_order end   (as text)
  @active_ind    -- 'Y' or 'N' to force PHC active filter, anything else = ignore
  @search_type   -- '0' = by display_category_code
                  -- '1' = by product_header_code
                  -- '2' = by primary_lob_code (no LOB join; uses sph.primary_lob_code)
*/

SET NOCOUNT ON;

-- Cleanup (idempotent)
IF OBJECT_ID('tempdb..#category_string','U') IS NOT NULL DROP TABLE #category_string;
IF OBJECT_ID('tempdb..#RUH','U')              IS NOT NULL DROP TABLE #RUH;
IF OBJECT_ID('tempdb..#RUD','U')              IS NOT NULL DROP TABLE #RUD;

DECLARE @str          varchar(MAX) = 'disp_cat_code_here';
DECLARE @dc_from      varchar(50)  = 'header_order_from';
DECLARE @dc_to        varchar(50)  = 'header_order_to';
DECLARE @active_ind   varchar(50)  = 'header_active_ind';
DECLARE @search_type  varchar(50)  = 'search_type_here';

-- 1) CSV -> #category_string
CREATE TABLE #category_string (cats varchar(50));
INSERT INTO #category_string(cats)
SELECT LTRIM(RTRIM(y.i.value('(./text())[1]','nvarchar(1000)')))
FROM (SELECT n = CONVERT(XML,'<i>'+REPLACE(@str,',','</i><i>')+'</i>')) a
CROSS APPLY n.nodes('i') AS y(i);

-- 2) Stage RUH/RUD as temp tables (visible to EXEC)
SELECT DISTINCT
    ruh.product_header_code,
    ruh.relation_id,
    sph.description                    AS [Product Header],
    sph.active_ind,
    sph.display_ind,
    sph.display_order,
    sph.display_category_code,
    sph.primary_lob_code,
    sdc.description                    AS [Display Category],
    sph.units,
    suom.description                   AS [Unit Of Measure]
INTO #RUH
FROM s_product_header_resort_units_header ruh
JOIN s_product_header sph
  ON ruh.product_header_code = sph.product_header_code
 AND (sph.active_ind <> 'N' OR sph.display_ind <> 'N')
 AND sph.CurrencyCode = '1'
JOIN s_display_category sdc
  ON sph.display_category_code = sdc.display_category_code
 AND sdc.active_ind = 'Y'
 AND sdc.description NOT LIKE 'parking lot%'
JOIN s_unit_of_measure suom
  ON sph.unit_of_measure_code = suom.unit_of_measure_code;

SELECT DISTINCT
    rud.product_header_code,
    rud.relation_id,
    sph.description                    AS [Product Header],
    sph.active_ind,
    sph.display_ind,
    sph.display_order,
    sph.display_category_code,
    sph.primary_lob_code,
    sdc.description                    AS [Display Category],
    sph.units,
    suom.description                   AS [Unit Of Measure]
INTO #RUD
FROM s_product_header_resort_units_detail rud
JOIN s_product_header sph
  ON rud.product_header_code = sph.product_header_code
 AND (sph.active_ind <> 'N' OR sph.display_ind <> 'N')
 AND sph.CurrencyCode = '1'
JOIN s_display_category sdc
  ON sph.display_category_code = sdc.display_category_code
 AND sdc.active_ind = 'Y'
 AND sdc.description NOT LIKE 'parking lot%'
JOIN s_unit_of_measure suom
  ON sph.unit_of_measure_code = suom.unit_of_measure_code;

-- 3) Dynamic portion (filters & output)
DECLARE @dynamic_query nvarchar(max) = N'
SELECT TOP 100
    h.product_header_code                    AS [PRIMARY PHC],
    h.[Product Header]                       AS [PRIMARY PHC Description],
    h.[Display Category],
    h.units,
    h.[Unit Of Measure],
    d.product_header_code                    AS [Strikethrough PHC],
    d.[Product Header]                       AS [Strikethrough PHC Description],
    d.[Display Category]                     AS [Strikethrough Display Category],
    d.units                                  AS [Strikethrough Units],
    d.[Unit Of Measure]                      AS [Strikethrough UOM],
    CASE WHEN h.units = d.units THEN ''Y'' ELSE ''N'' END AS [Units MATCH?],
    CASE WHEN h.[Unit Of Measure] = d.[Unit Of Measure] THEN ''Y'' ELSE ''N'' END AS [UOM MATCH?]
FROM #RUH h
JOIN #RUD d
  ON h.relation_id = d.relation_id
WHERE
  h.display_order BETWEEN ' + @dc_from + N' AND ' + @dc_to + N'
';

-- Optional active flag
IF @active_ind IN ('Y','N')
    SET @dynamic_query += N' AND h.active_ind = ''' + @active_ind + N'''';

-- Search type gating
IF @search_type = '1'   -- by product_header_code
    SET @dynamic_query += N' AND h.product_header_code IN (SELECT cats FROM #category_string)';
ELSE IF @search_type = '2' -- by primary_lob_code
    SET @dynamic_query += N' AND h.primary_lob_code IN (SELECT TRY_CAST(cats AS INT) FROM #category_string)';
ELSE                       -- default: by display_category_code
    SET @dynamic_query += N' AND h.display_category_code IN (SELECT TRY_CAST(cats AS INT) FROM #category_string)';

SET @dynamic_query += N'
ORDER BY h.display_order, h.product_header_code;';

--PRINT @dynamic_query; -- for debugging
EXEC (@dynamic_query);

-- 4) Cleanup
DROP TABLE #RUH;
DROP TABLE #RUD;
DROP TABLE #category_string;
