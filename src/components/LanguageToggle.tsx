"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { setLocale } from "@/app/actions";

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();

  const toggle = async () => {
    const next = locale === "ro" ? "en" : "ro";
    await setLocale(next);
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      className="px-2 py-1 text-sm font-medium rounded border border-gray-300 hover:bg-gray-100 transition-colors"
      title={locale === "ro" ? "Switch to English" : "Schimbă în Română"}
    >
      {locale === "ro" ? "EN" : "RO"}
    </button>
  );
}
