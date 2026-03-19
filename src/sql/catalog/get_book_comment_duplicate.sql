SELECT c.comment_id AS "commentId"
FROM comment c
WHERE c.book_id = $1
  AND c.customer_id = $2
LIMIT 1;
