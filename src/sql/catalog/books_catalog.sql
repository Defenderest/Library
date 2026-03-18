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
WHERE
  ($1::text IS NULL OR
    b.title ILIKE ('%' || $1 || '%') OR
    EXISTS (
      SELECT 1
      FROM book_author ba2
      JOIN author a2 ON a2.author_id = ba2.author_id
      WHERE ba2.book_id = b.book_id
        AND (
          a2.first_name ILIKE ('%' || $1 || '%') OR
          a2.last_name ILIKE ('%' || $1 || '%')
        )
    )
  )
  AND ($2::text IS NULL OR b.genre = $2)
  AND ($3::text IS NULL OR b.language = $3)
  AND ($4::numeric IS NULL OR b.price >= $4)
  AND ($5::numeric IS NULL OR b.price <= $5)
  AND (NOT $6::boolean OR COALESCE(b.stock_quantity, 0) > 0)
GROUP BY b.book_id, b.title, b.price, b.cover_image_path, b.stock_quantity, b.genre
ORDER BY b.title ASC
LIMIT $7
OFFSET $8;
