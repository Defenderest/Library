import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { createPasswordHash } from "@/lib/auth/password";
import { AUTH_COOKIE_NAME, createSessionToken, getSessionCookieOptions } from "@/lib/auth/session";
import { validateRegistrationPayload } from "@/lib/auth/validation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validated = validateRegistrationPayload(body);

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const passwordHash = createPasswordHash(validated.data.password);
  if (passwordHash.length === 0) {
    return NextResponse.json(
      { error: "Не вдалося зареєструватися. Спробуйте пізніше" },
      { status: 500 },
    );
  }

  try {
    const created = await prisma.customer.create({
      data: {
        firstName: validated.data.firstName,
        lastName: validated.data.lastName,
        email: validated.data.email,
        phone: validated.data.phone,
        passwordHash,
      },
      select: {
        customerId: true,
        firstName: true,
        lastName: true,
        email: true,
        isAdmin: true,
      },
    });

    const token = createSessionToken(created.customerId);

    const response = NextResponse.json({
      session: {
        customerId: created.customerId,
        firstName: created.firstName,
        lastName: created.lastName,
        email: created.email,
        isAdmin: created.isAdmin,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Користувач з таким email вже існує" }, { status: 409 });
    }

    console.error("Registration failed:", error);
    return NextResponse.json(
      { error: "Не вдалося зареєструватися. Спробуйте пізніше" },
      { status: 500 },
    );
  }
}
