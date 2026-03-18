DELETE FROM comment
WHERE comment_id = $1
RETURNING comment_id AS "commentId";
