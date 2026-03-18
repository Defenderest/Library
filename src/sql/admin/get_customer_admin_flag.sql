SELECT
  c.customer_id AS "customerId",
  c.is_admin AS "isAdmin"
FROM customer c
WHERE c.customer_id = $1
LIMIT 1;
