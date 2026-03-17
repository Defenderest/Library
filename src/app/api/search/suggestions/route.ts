import { NextResponse } from "next/server";

import { getSearchSuggestions } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const limitParam = Number(url.searchParams.get("limit") ?? 8);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 12) : 8;

  const suggestions = await getSearchSuggestions(query, limit);

  return NextResponse.json({ suggestions });
}
