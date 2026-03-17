UPDATE payment_transaction
SET
  status = $2,
  response_data_base64 = COALESCE($3, response_data_base64),
  response_signature = COALESCE($4, response_signature),
  provider_payment_id = COALESCE($5, provider_payment_id),
  verified_at = CASE WHEN $6::boolean THEN now() ELSE verified_at END,
  updated_at = now()
WHERE provider_order_id = $1
RETURNING payment_transaction_id AS "paymentTransactionId";
