UPDATE book
SET price = $2
WHERE book_id = $1
RETURNING
  book_id AS "bookId",
  COALESCE(price, 0) AS price;
