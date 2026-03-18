SELECT o.order_id AS "orderId"
FROM "order" o
WHERE o.order_id = $1
LIMIT 1;
