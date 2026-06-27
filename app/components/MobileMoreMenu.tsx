"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreVertical, Settings, ExternalLink, LogOut } from "lucide-react";
import { logOut } from "@/app/actions";
import SettingsModal from "./SettingsModal";

interface Member {
  id: number;
  name: string;
  emoji: string;
  color: string;
  theme?: string;
  createdAt: Date | string;
}

export default function MobileMoreMenu({ member }: { member: Member }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <>
      <div ref={menuRef} className="lg:hidden relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="More actions"
        >
          <MoreVertical size={16} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[55]"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-[60]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowSettings(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Switch Profile
              </Link>
              <form action={logOut}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[200]">
          <SettingsModal isOpen={true} onClose={() => setShowSettings(false)} currentTheme="light" notificationsEnabled={true} />
        </div>
      )}
    </>
  );
}
