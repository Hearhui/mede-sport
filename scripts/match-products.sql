-- Script จับคู่ document_items กับ products
-- ใช้ 3 ระดับ: exact match → model code match → similarity match
-- ทำเป็น transaction เพื่อความปลอดภัย

BEGIN;

-- Step 1: Exact match (ชื่อตรงกัน 100%)
UPDATE document_items di
SET product_id = matched.pid
FROM (
  SELECT DISTINCT ON (di.id) di.id as did, p.id as pid
  FROM document_items di
  JOIN products p ON LOWER(TRIM(di.description)) = LOWER(TRIM(p.name))
  WHERE di.product_id IS NULL
) matched
WHERE di.id = matched.did;

-- Step 2: High similarity match (>= 0.55) with model code validation
-- ใช้ similarity สูง และกรองสินค้าที่มี price modifier ออก
UPDATE document_items di
SET product_id = matched.pid
FROM (
  SELECT DISTINCT ON (di.id) di.id as did, p.id as pid, p.name, di.description,
    similarity(LOWER(di.description), LOWER(p.name)) as sim
  FROM document_items di
  CROSS JOIN LATERAL (
    SELECT id, name FROM products
    WHERE name NOT LIKE '%newprice%'
      AND name NOT LIKE '%ลด %ท้ายบิล%'
      AND name NOT LIKE '%(หญิง)%'
    ORDER BY similarity(LOWER(di.description), LOWER(products.name)) DESC
    LIMIT 1
  ) p
  WHERE di.product_id IS NULL
  AND similarity(LOWER(di.description), LOWER(p.name)) >= 0.55
) matched
WHERE di.id = matched.did;

-- Show results
SELECT 'Matched' as status, COUNT(*) as count FROM document_items WHERE product_id IS NOT NULL
UNION ALL
SELECT 'Unmatched', COUNT(*) FROM document_items WHERE product_id IS NULL;

COMMIT;
