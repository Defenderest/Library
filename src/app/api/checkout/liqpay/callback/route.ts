import { NextResponse } from "next/server";

import { mapLiqPayServiceError, processLiqPayCallback } from "@/lib/liqpay/service";

export const dynamic = "force-dynamic";

type CallbackPayload = {
  data?: string;
  signature?: string;
};

export async function POST(request: Request) {
  let data: string | undefined;
  let signature: string | undefined;

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as CallbackPayload | null;
    data = body?.data;
    signature = body?.signature;
  } else {
    const form = await request.formData().catch(() => null);
    data = typeof form?.get("data") === "string" ? String(form?.get("data")) : undefined;
    signature =
      typeof form?.get("signature") === "string" ? String(form?.get("signature")) : undefined;
  }

  try {
    await processLiqPayCallback(data, signature);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const mapped = mapLiqPayServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
