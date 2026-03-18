UPDATE customer
SET is_admin = $2
WHERE customer_id = $1
RETURNING
  customer_id AS "customerId",
  is_admin AS "isAdmin";
