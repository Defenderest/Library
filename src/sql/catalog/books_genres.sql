SELECT DISTINCT
  b.genre
FROM book b
WHERE b.genre IS NOT NULL
  AND length(trim(b.genre)) > 0
ORDER BY b.genre ASC;
