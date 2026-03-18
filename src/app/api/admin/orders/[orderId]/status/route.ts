import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/admin/access";
import { createAdminOrderStatus, mapAdminServiceError } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    orderId: string;
  };
};

type CreateOrderStatusPayload = {
  status?: string;
  trackingNumber?: string;
};

function parseOrderId(value: string): number {
  return Number(value);
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const orderId = parseOrderId(params.orderId);
  const body = (await request.json().catch(() => null)) as CreateOrderStatusPayload | null;

  try {
    await createAdminOrderStatus(orderId, body?.status ?? "", body?.trackingNumber ?? "");
    return NextResponse.json({ message: "Новий статус додано" });
  } catch (error) {
    const mapped = mapAdminServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
