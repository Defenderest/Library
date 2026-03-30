CREATE TABLE IF NOT EXISTS ai_user_memory (
  customer_id INT PRIMARY KEY REFERENCES customer(customer_id) ON DELETE CASCADE,
  memory_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_response_cache (
  cache_key VARCHAR(64) PRIMARY KEY,
  response_json JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires_at
  ON ai_response_cache (expires_at);

CREATE TABLE IF NOT EXISTS ai_chat_event (
  ai_chat_event_id BIGSERIAL PRIMARY KEY,
  customer_id INT REFERENCES customer(customer_id) ON DELETE SET NULL,
  session_id VARCHAR(80) NOT NULL,
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  assistant_char_count INT NOT NULL DEFAULT 0,
  useful BOOLEAN,
  added_to_cart BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_event_customer_date
  ON ai_chat_event (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_chat_event_session_date
  ON ai_chat_event (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_chat_event_created_at
  ON ai_chat_event (created_at DESC);
