SELECT
  b.book_id AS "bookId",
  b.title,
  COALESCE(b.cover_image_path, '') AS "coverImagePath",
  COALESCE(b.price, 0) AS price
FROM book b
WHERE
  b.title ILIKE ('%' || $1 || '%')
  OR EXISTS (
    SELECT 1
    FROM book_author ba
    JOIN author a ON a.author_id = ba.author_id
    WHERE ba.book_id = b.book_id
      AND (
        a.first_name ILIKE ('%' || $1 || '%')
        OR a.last_name ILIKE ('%' || $1 || '%')
      )
  )
ORDER BY b.title ASC
LIMIT $2;
