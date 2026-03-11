import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Nav from "@/components/Nav";
import { getBaseUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    template: "%s | XC-RO",
    default: "XC-RO - Paragliding Flight Analytics Romania",
  },
  description:
    "Explore paragliding flight data from Romania. Takeoff sites, pilot statistics, wing performance, flight records, and XC analytics since 2007.",
  openGraph: {
    type: "website",
    siteName: "XC-RO",
    locale: "ro_RO",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary",
  },
  alternates: {
    canonical: "/",
  },
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
