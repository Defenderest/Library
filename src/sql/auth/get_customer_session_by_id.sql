SELECT
  c.customer_id AS "customerId",
  c.first_name AS "firstName",
  c.last_name AS "lastName",
  c.email,
  c.is_admin AS "isAdmin"
FROM customer c
WHERE c.customer_id = $1
LIMIT 1;
