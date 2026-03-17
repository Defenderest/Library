SELECT
  os.order_id AS "orderId",
  os.order_status_id AS "orderStatusId",
  os.status,
  os.status_date AS "statusDate",
  os.tracking_number AS "trackingNumber"
FROM order_status os
JOIN "order" o ON o.order_id = os.order_id
WHERE o.customer_id = $1
ORDER BY os.order_id DESC, os.status_date ASC, os.order_status_id ASC;
