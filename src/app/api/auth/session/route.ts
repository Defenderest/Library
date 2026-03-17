import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth/session";
import { getSessionUserByToken } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = await getSessionUserByToken(token);

  const response = NextResponse.json({ session });

  if (!session && token) {
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      ...getSessionCookieOptions(),
      maxAge: 0,
    });
  }

  return response;
}
