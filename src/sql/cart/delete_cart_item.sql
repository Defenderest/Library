DELETE FROM cart_item
WHERE customer_id = $1
  AND book_id = $2;
