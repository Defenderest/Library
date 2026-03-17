import { redirect } from "next/navigation";

import { PageScaffold } from "@/components/ui/page-scaffold";
import { getServerSessionUser } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getServerSessionUser();

  if (!session) {
    const message = encodeURIComponent("Щоб відкрити цей розділ, увійдіть у профіль");
    redirect(`/profile?message=${message}`);
  }

  return (
    <PageScaffold
      eyebrow="Історія замовлень"
      description="Сторінка підготовлена як список замовлень із майбутнім правим drawer для деталей і timeline трекінгу на основі order status history."
      zones={[
        {
          title: "Список замовлень",
          description:
            "Зона для ID, дати, суми, статусу та кількості позицій по кожному замовленню користувача.",
        },
        {
          title: "Drawer деталей",
          description:
            "Каркас для правої панелі з метриками, статус-бейджем, адресою доставки і списком куплених товарів.",
        },
        {
          title: "Tracking timeline",
          description:
            "Підготовлені місця для етапів Створено → Підтверджено → Комплектація → В дорозі → Доставлено.",
        },
      ]}
    />
  );
}
