INSERT INTO book_reservation_item (
  reservation_id,
  book_id,
  quantity
)
VALUES ($1, $2, $3);
