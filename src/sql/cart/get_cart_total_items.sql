SELECT COALESCE(SUM(ci.quantity), 0)::int AS "totalItems"
FROM cart_item ci
WHERE ci.customer_id = $1;
