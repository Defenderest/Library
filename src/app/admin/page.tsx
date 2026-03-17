import { redirect } from "next/navigation";

import { PageScaffold } from "@/components/ui/page-scaffold";
import { getServerSessionUser } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSessionUser();

  if (!session) {
    const message = encodeURIComponent("Адмін-панель доступна лише адміністраторам");
    redirect(`/profile?message=${message}`);
  }

  if (!session.isAdmin) {
    const message = encodeURIComponent("Адмін-панель доступна лише адміністраторам");
    redirect(`/?message=${message}`);
  }

  return (
    <PageScaffold
      eyebrow="Адмін панель"
      description="Підготовлено єдиний багатосекційний адмін-контейнер з місцем під керування книгами, коментарями, замовленнями та ролями користувачів."
      zones={[
        {
          title: "Books management",
          description:
            "Каркас для CRUD, пошуку, фільтрації, inline оновлення ціни та збільшення залишків на складі.",
        },
        {
          title: "Comments moderation",
          description: "Підготовлено таблицю/листинг для пошуку коментарів і модерації з видаленням.",
        },
        {
          title: "Orders management",
          description:
            "Зона для перегляду замовлень, додавання статусів і трек-номерів на основі історії статусів.",
        },
        {
          title: "Users and roles",
          description:
            "Каркас для списку користувачів, loyalty points та server-verified перемикання admin-ролі.",
        },
      ]}
    />
  );
}
