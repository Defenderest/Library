import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth/server-session";
import type { ProfileData } from "@/lib/auth/types";
import { validateProfileUpdatePayload } from "@/lib/auth/validation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function mapProfile(record: {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  joinDate: Date;
  loyaltyProgram: boolean;
  loyaltyPoints: number;
}): ProfileData {
  return {
    customerId: record.customerId,
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    phone: record.phone ?? "",
    address: record.address ?? "",
    joinDate: record.joinDate.toISOString(),
    loyaltyProgram: record.loyaltyProgram,
    loyaltyPoints: record.loyaltyPoints,
  };
}

export async function GET() {
  const session = await getServerSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Спочатку увійдіть у профіль" }, { status: 401 });
  }

  const profile = await prisma.customer.findUnique({
    where: {
      customerId: session.customerId,
    },
    select: {
      customerId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      joinDate: true,
      loyaltyProgram: true,
      loyaltyPoints: true,
    },
  });

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

  const updated = await prisma.customer.update({
    where: {
      customerId: session.customerId,
    },
    data: {
      firstName: validated.data.firstName,
      lastName: validated.data.lastName,
      phone: validated.data.phone,
    },
    select: {
      customerId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      joinDate: true,
      loyaltyProgram: true,
      loyaltyPoints: true,
    },
  });

  return NextResponse.json({ profile: mapProfile(updated), message: "Збережено" });
}
