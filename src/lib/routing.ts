export function resolvePageTitle(pathname: string): string {
  if (pathname === "/") return "Головна";
  if (pathname === "/books") return "Колекція";
  if (pathname.startsWith("/books/")) return "Книга";
  if (pathname === "/authors") return "Автори";
  if (pathname.startsWith("/authors/")) return "Автор";
  if (pathname === "/cart") return "Кошик";
  if (pathname === "/orders") return "Історія";
  if (pathname === "/profile") return "Профіль";
  if (pathname === "/admin") return "Адмін панель";
  return "Library";
}
