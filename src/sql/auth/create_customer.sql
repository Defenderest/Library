INSERT INTO customer (
  first_name,
  last_name,
  email,
  phone,
  password_hash,
  loyalty_program,
  join_date,
  loyalty_points,
  is_admin
)
VALUES ($1, $2, $3, $4, $5, false, CURRENT_DATE, 0, false)
RETURNING
  customer_id AS "customerId",
  first_name AS "firstName",
  last_name AS "lastName",
  email,
  is_admin AS "isAdmin";
