SELECT
  c.comment_id AS "commentId",
  c.book_id AS "bookId",
  b.title AS "bookTitle",
  c.customer_id AS "customerId",
  trim(cu.first_name || ' ' || cu.last_name) AS "customerName",
  cu.email AS "customerEmail",
  c.comment_text AS "commentText",
  c.comment_date AS "commentDate",
  COALESCE(c.rating, 0) AS rating
FROM comment c
JOIN book b ON b.book_id = c.book_id
JOIN customer cu ON cu.customer_id = c.customer_id
ORDER BY c.comment_date DESC, c.comment_id DESC;
