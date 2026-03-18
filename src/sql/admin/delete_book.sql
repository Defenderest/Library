DELETE FROM book
WHERE book_id = $1
RETURNING book_id AS "bookId";
