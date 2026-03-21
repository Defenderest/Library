import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth/server-session";
import { validateCheckoutPayload } from "@/lib/cart/validation";
import { mapLiqPayServiceError, startLiqPayCheckoutFromCart } from "@/lib/liqpay/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Щоб оформити замовлення, увійдіть у профіль" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const validated = validateCheckoutPayload(body);

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  if (validated.data.paymentMethod !== "LiqPay") {
    return NextResponse.json({ error: "Оберіть LiqPay для цього кроку" }, { status: 400 });
  }

  try {
    const result = await startLiqPayCheckoutFromCart(
      session.customerId,
      validated.data.shippingAddress,
    );

    return NextResponse.json({
      providerOrderId: result.providerOrderId,
      totalAmount: result.totalAmount,
      expiresAt: result.expiresAt,
      checkoutUrl: result.checkoutUrl,
      data: result.data,
      signature: result.signature,
    });
  } catch (error) {
    const mapped = mapLiqPayServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
