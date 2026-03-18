UPDATE book
SET
  title = $2,
  isbn = $3,
  publication_date = $4,
  publisher_id = $5,
  description = $6,
  language = $7,
  page_count = $8,
  cover_image_path = $9,
  genre = $10
WHERE book_id = $1
RETURNING book_id AS "bookId";
