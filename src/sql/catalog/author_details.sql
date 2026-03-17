SELECT
  a.author_id AS "authorId",
  a.first_name AS "firstName",
  a.last_name AS "lastName",
  COALESCE(a.nationality, '') AS nationality,
  COALESCE(a.image_path, '') AS "imagePath",
  COALESCE(a.biography, '') AS biography,
  a.birth_date AS "birthDate"
FROM author a
WHERE a.author_id = $1
LIMIT 1;
