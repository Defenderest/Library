SELECT COUNT(*)::int AS "adminCount"
FROM customer
WHERE is_admin = true;
