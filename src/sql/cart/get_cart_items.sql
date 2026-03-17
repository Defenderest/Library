SELECT
  ci.book_id AS "bookId",
  ci.quantity,
  b.title,
  COALESCE(b.price, 0) AS price,
  COALESCE(b.cover_image_path, '') AS "coverImagePath",
  COALESCE(b.stock_quantity, 0) AS "stockQuantity",
  COALESCE(
    string_agg(
      NULLIF(trim(concat(a.first_name, ' ', a.last_name)), ''),
      ', ' ORDER BY a.last_name, a.first_name
    ) FILTER (WHERE a.author_id IS NOT NULL),
    'Невідомий автор'
  ) AS authors
FROM cart_item ci
JOIN book b ON b.book_id = ci.book_id
LEFT JOIN book_author ba ON ba.book_id = b.book_id
LEFT JOIN author a ON a.author_id = ba.author_id
WHERE ci.customer_id = $1
GROUP BY ci.book_id, ci.quantity, ci.added_date, b.title, b.price, b.cover_image_path, b.stock_quantity
ORDER BY ci.added_date DESC;
