import { redirect } from "next/navigation";

import { AdminPageClient } from "@/components/admin/admin-page-client";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getAdminDashboardData } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSessionUser();

  if (!session) {
    const message = encodeURIComponent("Адмін-панель доступна лише адміністраторам");
    redirect(`/profile?message=${message}`);
  }

  if (!session.isAdmin) {
    const message = encodeURIComponent("Адмін-панель доступна лише адміністраторам");
    redirect(`/profile?message=${message}`);
  }

  const dashboardData = await getAdminDashboardData();

  return <AdminPageClient initialData={dashboardData} currentAdminId={session.customerId} />;
}
