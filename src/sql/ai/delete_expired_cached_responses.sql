DELETE FROM ai_response_cache
WHERE expires_at <= now();
