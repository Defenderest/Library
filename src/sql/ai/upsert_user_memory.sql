INSERT INTO ai_user_memory (
  customer_id,
  memory_json,
  updated_at
)
VALUES (
  $1,
  $2::jsonb,
  now()
)
ON CONFLICT (customer_id)
DO UPDATE SET
  memory_json = EXCLUDED.memory_json,
  updated_at = now();
