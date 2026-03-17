import type { Prisma, PrismaClient } from "@prisma/client";

import { getSql } from "@/lib/db/sql-loader";

type RawExecutor = PrismaClient | Prisma.TransactionClient;

export async function queryRows<T>(
  executor: RawExecutor,
  sqlName: string,
  params: unknown[] = [],
): Promise<T[]> {
  const sql = getSql(sqlName);
  const rows = await executor.$queryRawUnsafe<T[]>(sql, ...params);
  return rows;
}

export async function queryFirst<T>(
  executor: RawExecutor,
  sqlName: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await queryRows<T>(executor, sqlName, params);
  return rows[0] ?? null;
}

export async function execute(
  executor: RawExecutor,
  sqlName: string,
  params: unknown[] = [],
): Promise<number> {
  const sql = getSql(sqlName);
  return executor.$executeRawUnsafe(sql, ...params);
}
