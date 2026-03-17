import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { QueryProvider } from "@/components/providers/query-provider";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className="font-body antialiased">
        <QueryProvider>
          <AuthSessionProvider>
            <CartProvider>
              <AppShell>{children}</AppShell>
            </CartProvider>
          </AuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
