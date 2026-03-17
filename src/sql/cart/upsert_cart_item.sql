INSERT INTO cart_item (
  customer_id,
  book_id,
  quantity,
  added_date
)
VALUES ($1, $2, $3, now())
ON CONFLICT (customer_id, book_id)
DO UPDATE
SET
  quantity = EXCLUDED.quantity,
  added_date = now();
