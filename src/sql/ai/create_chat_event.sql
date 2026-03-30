INSERT INTO ai_chat_event (
  customer_id,
  session_id,
  user_message,
  assistant_message,
  assistant_char_count,
  created_at
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  now()
)
RETURNING ai_chat_event_id AS "aiChatEventId";
