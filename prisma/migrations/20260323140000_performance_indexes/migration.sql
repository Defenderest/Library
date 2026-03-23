CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_book_title_trgm
  ON book USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_author_first_name_trgm
  ON author USING GIN (first_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_author_last_name_trgm
  ON author USING GIN (last_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_author_full_name_trgm
  ON author USING GIN ((btrim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_book_author_author_book
  ON book_author (author_id, book_id);

CREATE INDEX IF NOT EXISTS idx_cart_item_customer_added
  ON cart_item (customer_id, added_date);
