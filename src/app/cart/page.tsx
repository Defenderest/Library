import { redirect } from "next/navigation";

import { CartPageClient } from "@/components/cart/cart-page-client";
import { getServerSessionUser } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

type CartPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function readStringParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const session = await getServerSessionUser();

  if (!session) {
    const message = encodeURIComponent("Щоб відкрити цей розділ, увійдіть у профіль");
    redirect(`/profile?message=${message}`);
  }

  const infoMessage = readStringParam(searchParams?.message).trim();

  return <CartPageClient initialInfoMessage={infoMessage} />;
}
