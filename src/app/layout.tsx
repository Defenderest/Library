import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider, THEME_STORAGE_KEY } from "@/components/providers/theme-provider";

import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Library",
  description: "Website rebuild with parity to the Qt/QML desktop app",
};

const themeInitScript = `(() => {
  try {
    const stored = window.localStorage.getItem('${THEME_STORAGE_KEY}');
    const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  }
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk" data-theme="dark" suppressHydrationWarning className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className="font-body antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>

        <ThemeProvider>
          <QueryProvider>
            <AuthSessionProvider>
              <CartProvider>
                <AppShell>{children}</AppShell>
              </CartProvider>
            </AuthSessionProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
