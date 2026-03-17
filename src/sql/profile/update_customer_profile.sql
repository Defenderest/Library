UPDATE customer
SET
  first_name = $2,
  last_name = $3,
  phone = $4
WHERE customer_id = $1
RETURNING
  customer_id AS "customerId",
  first_name AS "firstName",
  last_name AS "lastName",
  email,
  phone,
  address,
  join_date AS "joinDate",
  COALESCE(loyalty_program, false) AS "loyaltyProgram",
  COALESCE(loyalty_points, 0) AS "loyaltyPoints";
