SELECT
  c.response_json AS "responseJson"
FROM ai_response_cache c
WHERE c.cache_key = $1
  AND c.expires_at > now();
