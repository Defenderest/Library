SELECT
  bri.reservation_item_id AS "reservationItemId",
  bri.reservation_id AS "reservationId",
  bri.book_id AS "bookId",
  bri.quantity,
  b.title,
  COALESCE(b.price, 0) AS price
FROM book_reservation_item bri
JOIN book b ON b.book_id = bri.book_id
WHERE bri.reservation_id = $1
ORDER BY bri.reservation_item_id ASC;
