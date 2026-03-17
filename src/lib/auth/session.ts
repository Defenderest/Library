import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE_NAME = "library_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionTokenPayload = {
  sub: number;
  iat: number;
  exp: number;
};

function resolveSessionSecret(): string {
  return process.env.SESSION_SECRET || "dev-insecure-session-secret-change-me";
}

function sign(value: string): string {
  return createHmac("sha256", resolveSessionSecret()).update(value).digest("base64url");
}

function decodePayload(raw: string): SessionTokenPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as SessionTokenPayload;

    if (
      !parsed ||
      typeof parsed.sub !== "number" ||
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function createSessionToken(customerId: number): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionTokenPayload = {
    sub: customerId,
    iat: issuedAt,
    exp: issuedAt + SESSION_MAX_AGE_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): { customerId: number } | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const actualBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");

  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  const payload = decodePayload(encodedPayload);
  if (!payload) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return null;
  }

  return {
    customerId: payload.sub,
  };
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
