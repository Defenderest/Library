SELECT
  br.reservation_id AS "reservationId",
  br.customer_id AS "customerId",
  br.provider_order_id AS "providerOrderId",
  br.order_id AS "orderId",
  br.status,
  br.expires_at AS "expiresAt",
  br.created_at AS "createdAt",
  br.updated_at AS "updatedAt"
FROM book_reservation br
WHERE br.provider_order_id = $1
FOR UPDATE
LIMIT 1;
