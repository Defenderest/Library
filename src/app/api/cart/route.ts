import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth/server-session";
import { clearCart, getCartSummary, mapCartServiceError } from "@/lib/cart/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Щоб працювати з кошиком, увійдіть у профіль" },
      { status: 401 },
    );
  }

  try {
    const cart = await getCartSummary(session.customerId);
    return NextResponse.json({ cart });
  } catch (error) {
    const mapped = mapCartServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

export async function DELETE() {
  const session = await getServerSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Щоб працювати з кошиком, увійдіть у профіль" },
      { status: 401 },
    );
  }

  try {
    const cart = await clearCart(session.customerId);
    return NextResponse.json({ cart });
  } catch (error) {
    const mapped = mapCartServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
