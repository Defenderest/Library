SELECT
  a.author_id AS "authorId",
  a.first_name AS "firstName",
  a.last_name AS "lastName",
  COALESCE(a.image_path, '') AS "imagePath"
FROM author a
WHERE
  a.first_name ILIKE ('%' || $1 || '%')
  OR a.last_name ILIKE ('%' || $1 || '%')
ORDER BY a.last_name ASC, a.first_name ASC
LIMIT $2;
