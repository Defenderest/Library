import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth/server-session";
import {
  mapCartServiceError,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/cart/service";

export const dynamic = "force-dynamic";

type UpdateCartItemPayload = {
  action?: "increase" | "decrease" | "set";
  quantity?: number;
};

type RouteContext = {
  params: {
    bookId: string;
  };
};

function parseBookId(params: RouteContext["params"]): number {
  return Number(params.bookId);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getServerSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Щоб працювати з кошиком, увійдіть у профіль" },
      { status: 401 },
    );
  }

  const bookId = parseBookId(params);
  const body = (await request.json().catch(() => null)) as UpdateCartItemPayload | null;

  const action = body?.action ?? "set";
  const quantity = typeof body?.quantity === "number" ? body.quantity : undefined;

  try {
    const cart = await updateCartItemQuantity(session.customerId, bookId, action, quantity);
    return NextResponse.json({ cart });
  } catch (error) {
    const mapped = mapCartServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getServerSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Щоб працювати з кошиком, увійдіть у профіль" },
      { status: 401 },
    );
  }

  const bookId = parseBookId(params);

  try {
    const cart = await removeCartItem(session.customerId, bookId);
    return NextResponse.json({ cart });
  } catch (error) {
    const mapped = mapCartServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
