import { redirect } from "next/navigation";

import { OrdersPageClient } from "@/components/orders/orders-page-client";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getCustomerOrderHistory } from "@/lib/orders/queries";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getServerSessionUser();

  if (!session) {
    const message = encodeURIComponent("Щоб відкрити цей розділ, увійдіть у профіль");
    redirect(`/profile?message=${message}`);
  }

  const orders = await getCustomerOrderHistory(session.customerId);

  return <OrdersPageClient orders={orders} />;
}
