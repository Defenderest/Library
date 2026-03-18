SELECT
  COUNT(*)::int AS "totalCount"
FROM book b
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
  AND (NOT $6::boolean OR COALESCE(b.stock_quantity, 0) > 0);
