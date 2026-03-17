import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth/server-session";
import { cancelLiqPayPayment, mapLiqPayServiceError } from "@/lib/liqpay/service";

export const dynamic = "force-dynamic";

type CancelPayload = {
  providerOrderId?: string;
};

export async function POST(request: Request) {
  const session = await getServerSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Щоб скасувати платіж, увійдіть у профіль" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as CancelPayload | null;

  try {
    const result = await cancelLiqPayPayment(session.customerId, body?.providerOrderId);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapLiqPayServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
