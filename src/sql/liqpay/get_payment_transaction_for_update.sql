SELECT
  pt.payment_transaction_id AS "paymentTransactionId",
  pt.provider,
  pt.provider_order_id AS "providerOrderId",
  pt.customer_id AS "customerId",
  pt.order_id AS "orderId",
  pt.amount,
  pt.currency,
  pt.status,
  pt.checkout_url AS "checkoutUrl",
  pt.request_data_base64 AS "requestDataBase64",
  pt.request_signature AS "requestSignature",
  pt.response_data_base64 AS "responseDataBase64",
  pt.response_signature AS "responseSignature",
  pt.provider_payment_id AS "providerPaymentId",
  pt.created_at AS "createdAt",
  pt.updated_at AS "updatedAt",
  pt.verified_at AS "verifiedAt"
FROM payment_transaction pt
WHERE pt.provider_order_id = $1
FOR UPDATE
LIMIT 1;
