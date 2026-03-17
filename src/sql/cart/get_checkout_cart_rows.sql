SELECT
  ci.book_id AS "bookId",
  ci.quantity,
  b.title,
  COALESCE(b.price, 0) AS price,
  COALESCE(b.stock_quantity, 0) AS "stockQuantity"
FROM cart_item ci
JOIN book b ON b.book_id = ci.book_id
WHERE ci.customer_id = $1
ORDER BY ci.added_date DESC;
