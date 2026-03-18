import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/admin/access";
import { getAdminOrdersList, mapAdminServiceError } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const orders = await getAdminOrdersList();
    return NextResponse.json({ orders });
  } catch (error) {
    const mapped = mapAdminServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
