import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/admin/access";
import { mapAdminServiceError, updateCustomerAdminRole } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    customerId: string;
  };
};

type UpdateAdminRolePayload = {
  isAdmin?: boolean;
};

function parseCustomerId(value: string): number {
  return Number(value);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const customerId = parseCustomerId(params.customerId);
  const body = (await request.json().catch(() => null)) as UpdateAdminRolePayload | null;

  try {
    await updateCustomerAdminRole(customerId, Boolean(body?.isAdmin), auth.session.customerId);
    return NextResponse.json({ message: "Роль користувача оновлено" });
  } catch (error) {
    const mapped = mapAdminServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
