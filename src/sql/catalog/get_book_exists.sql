SELECT b.book_id AS "bookId"
FROM book b
WHERE b.book_id = $1
LIMIT 1;
