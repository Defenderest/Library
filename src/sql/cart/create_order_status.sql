INSERT INTO order_status (
  order_id,
  status,
  status_date
)
VALUES ($1, $2, now());
