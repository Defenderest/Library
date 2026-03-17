SELECT
  ci.quantity
FROM cart_item ci
WHERE ci.customer_id = $1
  AND ci.book_id = $2
LIMIT 1;
