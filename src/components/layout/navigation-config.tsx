import {
  BookOpen,
  House,
  ScrollText,
  Shield,
  ShoppingCart,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  showCartBadge?: boolean;
  mobilePrimary?: boolean;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: "/", label: "Головна", icon: House, mobilePrimary: true },
  { href: "/books", label: "Колекція", icon: BookOpen, mobilePrimary: true },
  { href: "/authors", label: "Автори", icon: Users, mobilePrimary: true },
  { href: "/orders", label: "Історія", icon: ScrollText, mobilePrimary: true },
  { href: "/admin", label: "Адмін", icon: Shield, adminOnly: true },
  { href: "/profile", label: "Профіль", icon: UserRound },
  { href: "/cart", label: "Кошик", icon: ShoppingCart, showCartBadge: true },
];

export function isNavPathActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/books") {
    return pathname === "/books" || pathname.startsWith("/books/");
  }

  if (href === "/authors") {
    return pathname === "/authors" || pathname.startsWith("/authors/");
  }

  if (href === "/orders") {
    return pathname === "/orders" || pathname.startsWith("/orders/");
  }

  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }

  if (href === "/profile") {
    return pathname === "/profile";
  }

  if (href === "/cart") {
    return pathname === "/cart";
  }

  return pathname === href;
}
