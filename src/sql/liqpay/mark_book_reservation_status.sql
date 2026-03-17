UPDATE book_reservation
SET
  status = $2,
  updated_at = now()
WHERE provider_order_id = $1;
