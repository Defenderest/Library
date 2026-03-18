import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/admin/access";
import { incrementAdminBookStock, mapAdminServiceError } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    bookId: string;
  };
};

type IncrementStockPayload = {
  incrementBy?: number;
};

function parseBookId(value: string): number {
  return Number(value);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const bookId = parseBookId(params.bookId);
  const body = (await request.json().catch(() => null)) as IncrementStockPayload | null;

  try {
    await incrementAdminBookStock(bookId, Number(body?.incrementBy ?? 0));
    return NextResponse.json({ message: "Залишок на складі оновлено" });
  } catch (error) {
    const mapped = mapAdminServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
