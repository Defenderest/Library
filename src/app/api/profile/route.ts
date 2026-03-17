import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth/server-session";
import type { ProfileData } from "@/lib/auth/types";
import { validateProfileUpdatePayload } from "@/lib/auth/validation";
import { queryFirst } from "@/lib/db/raw";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function mapProfile(record: {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  joinDate: Date | string;
  loyaltyProgram: boolean | null;
  loyaltyPoints: number | null;
}): ProfileData {
  const joinDate = record.joinDate instanceof Date ? record.joinDate : new Date(record.joinDate);

  return {
    customerId: record.customerId,
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    phone: record.phone ?? "",
    address: record.address ?? "",
    joinDate: Number.isNaN(joinDate.getTime()) ? new Date().toISOString() : joinDate.toISOString(),
    loyaltyProgram: Boolean(record.loyaltyProgram),
    loyaltyPoints: Number(record.loyaltyPoints ?? 0),
  };
}

export async function GET() {
  const session = await getServerSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Спочатку увійдіть у профіль" }, { status: 401 });
  }

  const profile = await queryFirst<{
    customerId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: string | null;
    joinDate: Date | string;
    loyaltyProgram: boolean | null;
    loyaltyPoints: number | null;
  }>(prisma, "profile/get_customer_profile", [session.customerId]);

  if (!profile) {
    return NextResponse.json({ error: "Профіль не знайдено" }, { status: 404 });
  }

  return NextResponse.json({ profile: mapProfile(profile) });
}

export async function PATCH(request: Request) {
  const session = await getServerSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Спочатку увійдіть у профіль" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const validated = validateProfileUpdatePayload(body);

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const updated = await queryFirst<{
    customerId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: string | null;
    joinDate: Date | string;
    loyaltyProgram: boolean | null;
    loyaltyPoints: number | null;
  }>(prisma, "profile/update_customer_profile", [
    session.customerId,
    validated.data.firstName,
    validated.data.lastName,
    validated.data.phone,
  ]);

  if (!updated) {
    return NextResponse.json({ error: "Профіль не знайдено" }, { status: 404 });
  }

  return NextResponse.json({ profile: mapProfile(updated), message: "Збережено" });
}
