import { readFile } from "fs/promises";
import path from "path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error"],
});

const sqlDir = path.resolve(process.cwd(), "src", "sql", "catalog");
const queryTerm = (process.env.EXPLAIN_QUERY_TERM || "a").trim() || "a";

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatMs(value) {
  return `${value.toFixed(2)} ms`;
}

function formatNum(value) {
  return Number.isFinite(value) ? String(value) : "0";
}

function extractPlanPayload(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const knownKey = ["QUERY PLAN", "QUERY_PLAN", "query_plan"].find((key) => key in row);
  const rawValue = knownKey ? row[knownKey] : row[Object.keys(row)[0]];

  if (typeof rawValue === "string") {
    try {
      const parsed = JSON.parse(rawValue);
      return Array.isArray(parsed) ? parsed[0] ?? null : parsed;
    } catch {
      return null;
    }
  }

  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

async function loadSql(name) {
  const filePath = path.join(sqlDir, `${name}.sql`);
  return (await readFile(filePath, "utf8")).trim();
}

async function explainSql(sqlName, params) {
  const sql = await loadSql(sqlName);
  const explainStatement = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`;
  const rows = await prisma.$queryRawUnsafe(explainStatement, ...params);
  const payload = extractPlanPayload(rows?.[0]);

  const planRoot = payload?.Plan ?? {};

  return {
    planningMs: asNumber(payload?.["Planning Time"]),
    executionMs: asNumber(payload?.["Execution Time"]),
    nodeType: String(planRoot["Node Type"] ?? "unknown"),
    actualRows: asNumber(planRoot["Actual Rows"]),
    sharedHitBlocks: asNumber(planRoot["Shared Hit Blocks"]),
    sharedReadBlocks: asNumber(planRoot["Shared Read Blocks"]),
    sharedDirtiedBlocks: asNumber(planRoot["Shared Dirtied Blocks"]),
    tempReadBlocks: asNumber(planRoot["Temp Read Blocks"]),
    tempWrittenBlocks: asNumber(planRoot["Temp Written Blocks"]),
  };
}

async function getSampleBook() {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT b.book_id AS "bookId", COALESCE(b.genre, '') AS genre FROM book b ORDER BY b.book_id ASC LIMIT 1`,
  );

  const row = rows?.[0] ?? null;
  return {
    bookId: asNumber(row?.bookId, 1),
    genre: typeof row?.genre === "string" && row.genre.trim().length > 0 ? row.genre.trim() : null,
  };
}

async function main() {
  const sampleBook = await getSampleBook();

  const checks = [
    {
      endpoint: "/books",
      query: "books_catalog_count (no filters)",
      sqlName: "books_catalog_count",
      params: [null, null, null, null, null, false],
    },
    {
      endpoint: "/books",
      query: "books_catalog_count (search)",
      sqlName: "books_catalog_count",
      params: [queryTerm, null, null, null, null, false],
    },
    {
      endpoint: "/books",
      query: "books_catalog (no filters)",
      sqlName: "books_catalog",
      params: [null, null, null, null, null, false, 12, 0],
    },
    {
      endpoint: "/books",
      query: "books_catalog (search)",
      sqlName: "books_catalog",
      params: [queryTerm, null, null, null, null, false, 12, 0],
    },
    {
      endpoint: "/books",
      query: "books_genres",
      sqlName: "books_genres",
      params: [],
    },
    {
      endpoint: "/books",
      query: "books_languages",
      sqlName: "books_languages",
      params: [],
    },
    {
      endpoint: "/authors",
      query: "authors_list",
      sqlName: "authors_list",
      params: [],
    },
    {
      endpoint: "/api/search/suggestions",
      query: "search_books",
      sqlName: "search_books",
      params: [queryTerm, 8],
    },
    {
      endpoint: "/api/search/suggestions",
      query: "search_authors",
      sqlName: "search_authors",
      params: [queryTerm, 8],
    },
    {
      endpoint: "/books/[bookId]",
      query: "book_details",
      sqlName: "book_details",
      params: [sampleBook.bookId],
    },
    {
      endpoint: "/books/[bookId]",
      query: "book_comments",
      sqlName: "book_comments",
      params: [sampleBook.bookId, 40],
    },
    {
      endpoint: "/books/[bookId]",
      query: "similar_books",
      sqlName: "similar_books",
      params: [sampleBook.bookId, sampleBook.genre, 5],
    },
  ];

  const results = [];

  for (const check of checks) {
    const plan = await explainSql(check.sqlName, check.params);
    results.push({
      ...check,
      ...plan,
    });
  }

  const sortedByExecution = [...results].sort((a, b) => b.executionMs - a.executionMs);

  console.log("Catalog SQL endpoint metrics (EXPLAIN ANALYZE)");
  console.log(`query term: '${queryTerm}', sample bookId: ${sampleBook.bookId}`);
  console.log("");

  for (const result of sortedByExecution) {
    console.log(`[${result.endpoint}] ${result.query}`);
    console.log(
      `  planning=${formatMs(result.planningMs)} execution=${formatMs(result.executionMs)} node=${result.nodeType} rows=${formatNum(result.actualRows)}`,
    );
    console.log(
      `  buffers hit=${formatNum(result.sharedHitBlocks)} read=${formatNum(result.sharedReadBlocks)} dirtied=${formatNum(result.sharedDirtiedBlocks)} tempRead=${formatNum(result.tempReadBlocks)} tempWritten=${formatNum(result.tempWrittenBlocks)}`,
    );
  }
}

main()
  .catch((error) => {
    console.error("Failed to collect catalog explain metrics:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
