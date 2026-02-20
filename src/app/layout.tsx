import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "XC-RO - Flight Analytics",
  description: "Analitică pentru zboruri de parapantă și deltaplan din România",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased min-h-screen bg-gray-50">
        <NextIntlClientProvider messages={messages}>
          <Nav />
          <main className="max-w-7xl mx-auto px-4 py-6">
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
