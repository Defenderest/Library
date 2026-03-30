SELECT
  COUNT(*)::int AS "dailyCount"
FROM ai_chat_event e
WHERE e.created_at >= now() - interval '1 day'
  AND (
    ($1::int IS NOT NULL AND e.customer_id = $1)
    OR ($1::int IS NULL AND e.session_id = $2)
  );
