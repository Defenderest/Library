INSERT INTO payment_transaction (
  provider,
  provider_order_id,
  customer_id,
  order_id,
  amount,
  currency,
  status,
  checkout_url,
  request_data_base64,
  request_signature,
  created_at,
  updated_at
)
VALUES (
  $1,
  $2,
  $3,
  NULL,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  now(),
  now()
)
RETURNING payment_transaction_id AS "paymentTransactionId";
