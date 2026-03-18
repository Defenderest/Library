SELECT
  b.book_id AS "bookId",
  b.title,
  COALESCE(b.price, 0) AS price,
  COALESCE(b.stock_quantity, 0) AS "stockQuantity",
  COALESCE(b.genre, '') AS genre,
  COALESCE(b.language, '') AS language,
  COALESCE(b.cover_image_path, '') AS "coverImagePath",
  COALESCE(b.description, '') AS description,
  COALESCE(b.isbn, '') AS isbn,
  b.page_count AS "pageCount",
  b.publication_date AS "publicationDate",
  b.publisher_id AS "publisherId",
  COALESCE(p.name, '') AS "publisherName",
  COALESCE(authors.authors, 'Невідомий автор') AS authors,
  COALESCE(comment_stats.comment_count, 0) AS "commentCount"
FROM book b
LEFT JOIN publisher p ON p.publisher_id = b.publisher_id
LEFT JOIN LATERAL (
  SELECT
    string_agg(
      trim(a.first_name || ' ' || a.last_name),
      ', '
      ORDER BY a.last_name, a.first_name
    ) AS authors
  FROM book_author ba
  JOIN author a ON a.author_id = ba.author_id
  WHERE ba.book_id = b.book_id
) authors ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS comment_count
  FROM comment c
  WHERE c.book_id = b.book_id
) comment_stats ON true
ORDER BY b.title ASC, b.book_id ASC;
