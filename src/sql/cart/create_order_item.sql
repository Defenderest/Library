INSERT INTO order_item (
  order_id,
  book_id,
  quantity,
  price_per_unit
)
VALUES ($1, $2, $3, $4);
