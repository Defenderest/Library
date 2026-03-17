SELECT
  br.reservation_id AS "reservationId",
  br.customer_id AS "customerId",
  br.provider_order_id AS "providerOrderId",
  br.order_id AS "orderId",
  br.status,
  br.expires_at AS "expiresAt"
FROM book_reservation br
WHERE br.status = 'pending'
  AND br.expires_at <= now()
FOR UPDATE;
