import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth/server-session";
import { mapLiqPayServiceError, verifyLiqPayPayment } from "@/lib/liqpay/service";

export const dynamic = "force-dynamic";

type VerifyPayload = {
  providerOrderId?: string;
};

export async function POST(request: Request) {
  const session = await getServerSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Щоб підтвердити оплату, увійдіть у профіль" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as VerifyPayload | null;

  try {
    const result = await verifyLiqPayPayment(session.customerId, body?.providerOrderId);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapLiqPayServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
