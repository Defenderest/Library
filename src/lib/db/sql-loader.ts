import { readFileSync } from "fs";
import path from "path";

const SQL_CACHE = new Map<string, string>();

function resolveSqlPath(name: string): string {
  return path.join(process.cwd(), "src", "sql", `${name}.sql`);
}

export function getSql(name: string): string {
  const cached = SQL_CACHE.get(name);
  if (cached) {
    return cached;
  }

  const sql = readFileSync(resolveSqlPath(name), "utf8").trim();
  SQL_CACHE.set(name, sql);
  return sql;
}
