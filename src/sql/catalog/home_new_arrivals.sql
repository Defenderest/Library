SELECT
  b.book_id AS "bookId",
  b.title,
  COALESCE(b.price, 0) AS price,
  COALESCE(b.cover_image_path, '') AS "coverImagePath",
  COALESCE(b.stock_quantity, 0) AS "stockQuantity",
  COALESCE(b.genre, '') AS genre,
  COALESCE(
    string_agg(
      NULLIF(trim(concat(a.first_name, ' ', a.last_name)), ''),
      ', ' ORDER BY a.last_name, a.first_name
    ) FILTER (WHERE a.author_id IS NOT NULL),
    'Невідомий автор'
  ) AS authors
FROM book b
LEFT JOIN book_author ba ON ba.book_id = b.book_id
LEFT JOIN author a ON a.author_id = ba.author_id
GROUP BY b.book_id, b.title, b.price, b.cover_image_path, b.stock_quantity, b.genre, b.publication_date
ORDER BY b.publication_date DESC NULLS LAST, b.book_id DESC
LIMIT $1;
