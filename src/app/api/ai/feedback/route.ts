import { NextResponse } from "next/server";

import { markAiChatEventAddToCart, setAiChatEventUseful } from "@/lib/ai/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FeedbackPayload = {
  eventId?: number;
  useful?: boolean;
  action?: "add_to_cart";
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as FeedbackPayload | null;
  const eventId = Number(body?.eventId ?? 0);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Некоректний eventId" }, { status: 400 });
  }

  try {
    if (body?.action === "add_to_cart") {
      await markAiChatEventAddToCart(eventId);
      return NextResponse.json({ ok: true });
    }

    if (typeof body?.useful === "boolean") {
      await setAiChatEventUseful(eventId, body.useful);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Невідома дія зворотного зв'язку" }, { status: 400 });
  } catch (error) {
    console.error("AI feedback route error:", error);
    return NextResponse.json({ error: "Не вдалося зберегти зворотний зв'язок" }, { status: 500 });
  }
}
