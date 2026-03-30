UPDATE ai_chat_event
SET added_to_cart = true
WHERE ai_chat_event_id = $1;
