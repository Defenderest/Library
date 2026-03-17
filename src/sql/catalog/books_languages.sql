SELECT DISTINCT
  b.language
FROM book b
WHERE b.language IS NOT NULL
  AND length(trim(b.language)) > 0
ORDER BY b.language ASC;
