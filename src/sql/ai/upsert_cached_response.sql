INSERT INTO ai_response_cache (
  cache_key,
  response_json,
  expires_at,
  updated_at
)
VALUES (
  $1,
  $2::jsonb,
  now() + ($3::int * interval '1 second'),
  now()
)
ON CONFLICT (cache_key)
DO UPDATE SET
  response_json = EXCLUDED.response_json,
  expires_at = EXCLUDED.expires_at,
  updated_at = now();
