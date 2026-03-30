UPDATE ai_chat_event
SET useful = $2::boolean
WHERE ai_chat_event_id = $1;
