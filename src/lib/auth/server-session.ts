import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";

type CustomerSessionRecord = {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
};

function mapCustomerToSession(customer: CustomerSessionRecord): SessionUser {
  return {
    customerId: customer.customerId,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    isAdmin: customer.isAdmin,
  };
}

async function findSessionCustomer(customerId: number): Promise<SessionUser | null> {
  const customer = await prisma.customer.findUnique({
    where: {
      customerId,
    },
    select: {
      customerId: true,
      firstName: true,
      lastName: true,
      email: true,
      isAdmin: true,
    },
  });

  if (!customer) {
    return null;
  }

  return mapCustomerToSession(customer);
}

export async function getSessionUserByToken(token: string | null | undefined): Promise<SessionUser | null> {
  if (!token) {
    return null;
  }

  const verified = verifySessionToken(token);
  if (!verified) {
    return null;
  }

  return findSessionCustomer(verified.customerId);
}

export async function getServerSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return getSessionUserByToken(token);
}
