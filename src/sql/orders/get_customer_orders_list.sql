SELECT
  o.order_id AS "orderId",
  o.order_date AS "orderDate",
  COALESCE(o.total_amount, 0) AS "totalAmount",
  COALESCE(o.payment_method, '') AS "paymentMethod",
  o.shipping_address AS "shippingAddress",
  COALESCE(items.item_count, 0) AS "itemCount",
  COALESCE(statuses.status_count, 0) AS "statusCount",
  COALESCE(latest.status, 'Нове') AS "currentStatus",
  latest.status_date AS "currentStatusDate"
FROM "order" o
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS item_count
  FROM order_item oi
  WHERE oi.order_id = o.order_id
) items ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS status_count
  FROM order_status os
  WHERE os.order_id = o.order_id
) statuses ON true
LEFT JOIN LATERAL (
  SELECT
    os.status,
    os.status_date
  FROM order_status os
  WHERE os.order_id = o.order_id
  ORDER BY os.status_date DESC, os.order_status_id DESC
  LIMIT 1
) latest ON true
WHERE o.customer_id = $1
ORDER BY o.order_date DESC, o.order_id DESC;
