import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const PASSWORD_ITERATIONS = 120_000;
const SALT_LENGTH_BYTES = 16;
const HASH_LENGTH_BYTES = 32;

function isLegacySha256Hex(hash: string): boolean {
  return /^[0-9a-f]{64}$/i.test(hash.trim());
}

export function createPasswordHash(password: string): string {
  if (password.length === 0) {
    return "";
  }

  const salt = randomBytes(SALT_LENGTH_BYTES);
  const derived = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, HASH_LENGTH_BYTES, "sha256");

  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export function verifyPasswordHash(password: string, storedHash: string): boolean {
  const trimmedHash = storedHash.trim();
  if (password.length === 0 || trimmedHash.length === 0) {
    return false;
  }

  if (trimmedHash.startsWith("pbkdf2_sha256$")) {
    const [, iterationsRaw, saltRaw, expectedRaw] = trimmedHash.split("$");

    const iterations = Number(iterationsRaw);
    if (!Number.isFinite(iterations) || iterations <= 0 || !saltRaw || !expectedRaw) {
      return false;
    }

    const salt = Buffer.from(saltRaw, "base64");
    const expected = Buffer.from(expectedRaw, "base64");
    if (salt.length === 0 || expected.length === 0) {
      return false;
    }

    const actual = pbkdf2Sync(password, salt, iterations, expected.length, "sha256");

    if (actual.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(actual, expected);
  }

  if (isLegacySha256Hex(trimmedHash)) {
    const candidate = createHash("sha256").update(password).digest("hex").toLowerCase();
    const expected = trimmedHash.toLowerCase();
    const candidateBuffer = Buffer.from(candidate, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");

    if (candidateBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(candidateBuffer, expectedBuffer);
  }

  return false;
}

export function passwordHashNeedsUpgrade(storedHash: string): boolean {
  return isLegacySha256Hex(storedHash);
}
