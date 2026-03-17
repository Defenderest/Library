import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { createPasswordHash } from "@/lib/auth/password";
import { AUTH_COOKIE_NAME, createSessionToken, getSessionCookieOptions } from "@/lib/auth/session";
import { validateRegistrationPayload } from "@/lib/auth/validation";
import { queryFirst } from "@/lib/db/raw";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CreatedCustomerRow = {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
};

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code === "P2002") {
    return true;
  }

  if (error.code === "P2010") {
    const meta = (error.meta ?? {}) as { code?: string; message?: string };
    if (meta.code === "23505") {
      return true;
    }

    const message = String(meta.message ?? "").toLowerCase();
    return message.includes("duplicate") || message.includes("unique");
  }

  return false;
}

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
    const created = await queryFirst<CreatedCustomerRow>(prisma, "auth/create_customer", [
      validated.data.firstName,
      validated.data.lastName,
      validated.data.email,
      validated.data.phone,
      passwordHash,
    ]);

    if (!created) {
      throw new Error("Customer create query returned no rows");
    }

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
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "Користувач з таким email вже існує" }, { status: 409 });
    }

    console.error("Registration failed:", error);
    return NextResponse.json(
      { error: "Не вдалося зареєструватися. Спробуйте пізніше" },
      { status: 500 },
    );
  }
}
