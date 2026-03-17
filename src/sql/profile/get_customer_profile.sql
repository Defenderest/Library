SELECT
  c.customer_id AS "customerId",
  c.first_name AS "firstName",
  c.last_name AS "lastName",
  c.email,
  c.phone,
  c.address,
  c.join_date AS "joinDate",
  COALESCE(c.loyalty_program, false) AS "loyaltyProgram",
  COALESCE(c.loyalty_points, 0) AS "loyaltyPoints"
FROM customer c
WHERE c.customer_id = $1
LIMIT 1;
