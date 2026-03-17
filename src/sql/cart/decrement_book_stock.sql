UPDATE book
SET stock_quantity = stock_quantity - $2
WHERE book_id = $1
  AND COALESCE(stock_quantity, 0) >= $2
RETURNING book_id AS "bookId";
