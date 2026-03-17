UPDATE customer
SET password_hash = $2
WHERE customer_id = $1;
