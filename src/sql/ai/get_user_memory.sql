SELECT
  m.customer_id AS "customerId",
  m.memory_json AS "memoryJson",
  m.updated_at AS "updatedAt"
FROM ai_user_memory m
WHERE m.customer_id = $1;
