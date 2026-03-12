"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageToggle from "./LanguageToggle";

const links = [
  { href: "/", key: "home" },
  { href: "/takeoffs", key: "takeoffs" },
  { href: "/pilots", key: "pilots" },
  { href: "/wings", key: "wings" },
  { href: "/flights", key: "flights" },
  { href: "/records", key: "records" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

/* Simple inline SVG icons for the bottom bar */
function NavIcon({ iconKey }: { iconKey: string }) {
  const cls = "w-5 h-5";
  switch (iconKey) {
    case "home":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
      );
    case "takeoffs":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "pilots":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "wings":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l6-6m0 0l4 4m-4-4l8-8m-4 12h8m-8 0l4 4m-4-4l4-4" />
        </svg>
      );
    case "flights":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-4 4m4-4l4 4M4 15l4-4m12 4l-4-4" />
        </svg>
      );
    case "records":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Nav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <>
      {/* Top bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="font-bold text-lg text-blue-600 shrink-0">
              XC-RO
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    isActive(pathname, l.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {t(l.key)}
                </Link>
              ))}
              <div className="ml-2">
                <LanguageToggle />
              </div>
            </div>

            {/* Mobile: only language toggle in top bar */}
            <div className="md:hidden">
              <LanguageToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex justify-around items-center h-16 px-1">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1 rounded-lg transition-colors ${
                  active
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <NavIcon iconKey={l.key} />
                <span className={`text-[10px] mt-0.5 truncate leading-tight ${active ? "font-semibold" : "font-medium"}`}>
                  {t(l.key)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
