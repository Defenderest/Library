SELECT
  o.order_id AS "orderId",
  o.order_date AS "orderDate",
  COALESCE(o.total_amount, 0) AS "totalAmount",
  o.shipping_address AS "shippingAddress",
  COALESCE(o.payment_method, '') AS "paymentMethod",
  o.customer_id AS "customerId",
  COALESCE(trim(c.first_name || ' ' || c.last_name), 'Невідомий користувач') AS "customerName",
  COALESCE(c.email, '') AS "customerEmail",
  COALESCE(items.item_count, 0) AS "itemCount",
  COALESCE(statuses.status_count, 0) AS "statusCount",
  COALESCE(latest.status, 'Нове') AS "currentStatus",
  latest.status_date AS "currentStatusDate",
  COALESCE(latest.tracking_number, '') AS "trackingNumber"
FROM "order" o
LEFT JOIN customer c ON c.customer_id = o.customer_id
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
    os.status_date,
    os.tracking_number
  FROM order_status os
  WHERE os.order_id = o.order_id
  ORDER BY os.status_date DESC, os.order_status_id DESC
  LIMIT 1
) latest ON true
ORDER BY o.order_date DESC, o.order_id DESC;
