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

  const infoMessage = readStringParam(searchParams?.message).trim();
  const liqPayFlow = readStringParam(searchParams?.liqpay).trim();
  const liqPayProviderOrderId = readStringParam(searchParams?.providerOrderId).trim();
  const requiresAuthRedirect = !session;

  return (
    <CartPageClient
      initialInfoMessage={infoMessage}
      requiresAuthRedirect={requiresAuthRedirect}
      liqPayFlow={liqPayFlow}
      liqPayProviderOrderId={liqPayProviderOrderId}
    />
  );
}
