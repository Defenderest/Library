UPDATE payment_transaction
SET
  order_id = $2,
  updated_at = now()
WHERE provider_order_id = $1;
