import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth/server-session";
import { addCartItem, mapCartServiceError } from "@/lib/cart/service";

export const dynamic = "force-dynamic";

type AddCartItemPayload = {
  bookId?: number;
  quantity?: number;
};

export async function POST(request: Request) {
  const session = await getServerSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Щоб додавати книги в кошик, увійдіть у профіль" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as AddCartItemPayload | null;
  const bookId = Number(body?.bookId ?? 0);
  const quantity = Number(body?.quantity ?? 1);

  try {
    const cart = await addCartItem(session.customerId, bookId, quantity);
    return NextResponse.json({ cart });
  } catch (error) {
    const mapped = mapCartServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
