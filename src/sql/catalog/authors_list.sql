SELECT
  a.author_id AS "authorId",
  a.first_name AS "firstName",
  a.last_name AS "lastName",
  COALESCE(a.nationality, '') AS nationality,
  COALESCE(a.image_path, '') AS "imagePath"
FROM author a
ORDER BY a.last_name ASC, a.first_name ASC;
