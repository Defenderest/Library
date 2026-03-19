INSERT INTO comment (
  book_id,
  customer_id,
  comment_text,
  rating,
  comment_date
)
VALUES ($1, $2, $3, $4, now())
RETURNING comment_id AS "commentId";
