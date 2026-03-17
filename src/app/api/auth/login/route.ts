import { NextResponse } from "next/server";

import { createPasswordHash, passwordHashNeedsUpgrade, verifyPasswordHash } from "@/lib/auth/password";
import { AUTH_COOKIE_NAME, createSessionToken, getSessionCookieOptions } from "@/lib/auth/session";
import { validateLoginPayload } from "@/lib/auth/validation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validated = validateLoginPayload(body);

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { email, password } = validated.data;

  const customer = await prisma.customer.findUnique({
    where: {
      email,
    },
    select: {
      customerId: true,
      firstName: true,
      lastName: true,
      email: true,
      isAdmin: true,
      passwordHash: true,
    },
  });

  if (!customer || !verifyPasswordHash(password, customer.passwordHash)) {
    return NextResponse.json({ error: "Невірний email або пароль" }, { status: 401 });
  }

  if (passwordHashNeedsUpgrade(customer.passwordHash)) {
    const upgradedHash = createPasswordHash(password);
    if (upgradedHash.length > 0) {
      await prisma.customer.update({
        where: {
          customerId: customer.customerId,
        },
        data: {
          passwordHash: upgradedHash,
        },
      });
    }
  }

  const token = createSessionToken(customer.customerId);

  const response = NextResponse.json({
    session: {
      customerId: customer.customerId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      isAdmin: customer.isAdmin,
    },
  });

  response.cookies.set(AUTH_COOKIE_NAME, token, getSessionCookieOptions());
  return response;
}
