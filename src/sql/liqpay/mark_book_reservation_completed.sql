UPDATE book_reservation
SET
  status = $2,
  order_id = $3,
  updated_at = now()
WHERE provider_order_id = $1;
