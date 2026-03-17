import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth/server-session";
import { createStandardOrderFromCart, mapCartServiceError } from "@/lib/cart/service";
import { validateCheckoutPayload } from "@/lib/cart/validation";

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

  if (validated.data.paymentMethod === "LiqPay Sandbox") {
    return NextResponse.json(
      { error: "LiqPay Sandbox буде доступний у наступній фазі" },
      { status: 400 },
    );
  }

  try {
    const result = await createStandardOrderFromCart(
      session.customerId,
      validated.data.shippingAddress,
      validated.data.paymentMethod,
    );

    return NextResponse.json({
      orderId: result.orderId,
      totalAmount: result.totalAmount,
      message: `Замовлення #${result.orderId} успішно оформлено`,
    });
  } catch (error) {
    const mapped = mapCartServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
