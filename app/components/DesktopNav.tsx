"use client";

import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { NAV_ITEMS, isNavItemActive } from "@/lib/navigation";

export default function DesktopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            isNavItemActive(item, pathname, searchParams)
              ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
