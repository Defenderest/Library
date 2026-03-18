SELECT
  cu.customer_id AS "customerId",
  cu.first_name AS "firstName",
  cu.last_name AS "lastName",
  cu.email,
  cu.phone,
  cu.address,
  cu.join_date AS "joinDate",
  COALESCE(cu.loyalty_points, 0) AS "loyaltyPoints",
  COALESCE(cu.loyalty_program, false) AS "loyaltyProgram",
  COALESCE(cu.is_admin, false) AS "isAdmin",
  COALESCE(order_stats.orders_count, 0) AS "ordersCount",
  COALESCE(comment_stats.comments_count, 0) AS "commentsCount"
FROM customer cu
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS orders_count
  FROM "order" o
  WHERE o.customer_id = cu.customer_id
) order_stats ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS comments_count
  FROM comment c
  WHERE c.customer_id = cu.customer_id
) comment_stats ON true
ORDER BY cu.join_date DESC, cu.customer_id DESC;
