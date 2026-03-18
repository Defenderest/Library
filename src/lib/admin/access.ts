import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth/server-session";
import type { SessionUser } from "@/lib/auth/types";

type AdminApiSessionResult =
  | {
      ok: true;
      session: SessionUser;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireAdminApiSession(): Promise<AdminApiSessionResult> {
  const session = await getServerSessionUser();

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Увійдіть у профіль адміністратора" }, { status: 401 }),
    };
  }

  if (!session.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Недостатньо прав для адмін-дій" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    session,
  };
}
