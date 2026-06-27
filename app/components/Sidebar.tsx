"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NAV_ITEMS, isNavItemActive } from "@/lib/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[55]"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700 z-[60] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-700">
          <span className="text-sm font-semibold text-gray-200">Navigation</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isNavItemActive(item, pathname, searchParams)
                  ? "bg-gray-800 text-blue-400"
                  : "text-gray-300 hover:bg-gray-800 hover:text-gray-100"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
