SELECT
  c.customer_id AS "customerId",
  c.first_name AS "firstName",
  c.last_name AS "lastName",
  c.email,
  c.is_admin AS "isAdmin",
  c.password_hash AS "passwordHash"
FROM customer c
WHERE c.email = $1
LIMIT 1;
