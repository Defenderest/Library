INSERT INTO order_status (
  order_id,
  status,
  status_date,
  tracking_number
)
VALUES ($1, $2, now(), $3)
RETURNING order_status_id AS "orderStatusId";
