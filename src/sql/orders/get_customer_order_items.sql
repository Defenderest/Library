SELECT
  oi.order_id AS "orderId",
  oi.order_item_id AS "orderItemId",
  oi.book_id AS "bookId",
  oi.quantity,
  oi.price_per_unit AS "pricePerUnit",
  b.title,
  COALESCE(authors.authors, 'Невідомий автор') AS authors,
  b.cover_image_path AS "coverImagePath"
FROM order_item oi
JOIN "order" o ON o.order_id = oi.order_id
JOIN book b ON b.book_id = oi.book_id
LEFT JOIN LATERAL (
  SELECT
    string_agg(
      trim(a.first_name || ' ' || a.last_name),
      ', '
      ORDER BY a.last_name, a.first_name
    ) AS authors
  FROM book_author ba
  JOIN author a ON a.author_id = ba.author_id
  WHERE ba.book_id = b.book_id
) authors ON true
WHERE o.customer_id = $1
ORDER BY oi.order_id DESC, oi.order_item_id ASC;
