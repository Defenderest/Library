INSERT INTO book (
  title,
  isbn,
  publication_date,
  publisher_id,
  price,
  stock_quantity,
  description,
  language,
  page_count,
  cover_image_path,
  genre
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING book_id AS "bookId";
