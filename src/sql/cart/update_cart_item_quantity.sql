UPDATE cart_item
SET quantity = $3
WHERE customer_id = $1
  AND book_id = $2;
