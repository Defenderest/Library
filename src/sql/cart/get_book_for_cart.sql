SELECT
  b.book_id AS "bookId",
  b.title,
  COALESCE(b.stock_quantity, 0) AS "stockQuantity",
  COALESCE(b.price, 0) AS price
FROM book b
WHERE b.book_id = $1
LIMIT 1;
