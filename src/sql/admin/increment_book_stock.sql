UPDATE book
SET stock_quantity = COALESCE(stock_quantity, 0) + $2
WHERE book_id = $1
RETURNING
  book_id AS "bookId",
  stock_quantity AS "stockQuantity";
