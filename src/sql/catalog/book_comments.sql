SELECT
  c.comment_text AS "commentText",
  c.comment_date AS "commentDate",
  COALESCE(c.rating, 0) AS rating,
  cu.first_name AS "firstName",
  cu.last_name AS "lastName"
FROM comment c
JOIN customer cu ON cu.customer_id = c.customer_id
WHERE c.book_id = $1
ORDER BY c.comment_date DESC
LIMIT $2;
