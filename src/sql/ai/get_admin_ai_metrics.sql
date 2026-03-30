WITH last_30_days AS (
  SELECT *
  FROM ai_chat_event
  WHERE created_at >= now() - interval '30 days'
),
session_stats AS (
  SELECT
    session_id,
    COUNT(*)::int AS turns
  FROM last_30_days
  GROUP BY session_id
)
SELECT
  COUNT(*)::int AS "totalDialogs",
  COUNT(*) FILTER (WHERE useful = true)::int AS "usefulDialogs",
  COUNT(*) FILTER (WHERE added_to_cart = true)::int AS "convertedDialogs",
  COALESCE(AVG(assistant_char_count), 0)::float8 AS "avgAssistantChars",
  COALESCE((SELECT AVG(turns)::float8 FROM session_stats), 0) AS "avgSessionTurns"
FROM last_30_days;
