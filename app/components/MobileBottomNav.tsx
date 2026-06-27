"use client";

import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { NAV_ITEMS, isNavItemActive } from "@/lib/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item, pathname, searchParams);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full rounded-lg transition-colors ${
                active
                  ? "text-blue-500"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <span className={active ? "scale-110 transition-transform" : ""}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium leading-tight truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
