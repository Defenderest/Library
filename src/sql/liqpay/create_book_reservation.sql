INSERT INTO book_reservation (
  customer_id,
  provider_order_id,
  order_id,
  status,
  expires_at,
  created_at,
  updated_at
)
VALUES ($1, $2, NULL, $3, $4, now(), now())
RETURNING reservation_id AS "reservationId";
