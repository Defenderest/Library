SELECT
  left(trim(user_message), 120) AS query,
  COUNT(*)::int AS count
FROM ai_chat_event
WHERE created_at >= now() - interval '30 days'
  AND length(trim(user_message)) > 0
GROUP BY 1
ORDER BY count DESC, query ASC
LIMIT 8;
