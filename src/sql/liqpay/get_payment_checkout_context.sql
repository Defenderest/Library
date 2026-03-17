SELECT
  psh.details
FROM payment_status_history psh
WHERE psh.payment_transaction_id = $1
  AND psh.status = 'checkout_started'
ORDER BY psh.status_date ASC
LIMIT 1;
