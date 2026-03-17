INSERT INTO payment_status_history (
  payment_transaction_id,
  status,
  status_date,
  details
)
VALUES ($1, $2, now(), $3);
