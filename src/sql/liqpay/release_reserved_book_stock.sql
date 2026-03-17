UPDATE book
SET stock_quantity = stock_quantity + $2
WHERE book_id = $1;
