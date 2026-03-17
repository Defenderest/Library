INSERT INTO "order" (
  customer_id,
  order_date,
  total_amount,
  shipping_address,
  payment_method
)
VALUES ($1, now(), $2, $3, $4)
RETURNING order_id AS "orderId";
