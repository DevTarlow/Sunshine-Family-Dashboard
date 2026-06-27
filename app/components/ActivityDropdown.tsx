"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import type { ActivityEntry } from "@/lib/activityStore";

const colorDotMap: Record<string, string> = {
  blue:   "bg-blue-400",
  red:    "bg-red-400",
  green:  "bg-green-400",
  purple: "bg-purple-400",
  orange: "bg-orange-400",
  pink:   "bg-pink-400",
  yellow: "bg-yellow-400",
  teal:   "bg-teal-400",
};

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const LS_KEY = "activity-last-viewed";

export default function ActivityDropdown({ activities }: { activities: ActivityEntry[] }) {
  const [open, setOpen] = useState(false);
  const [lastViewed, setLastViewed] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);

  // Restore last-viewed timestamp from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) setLastViewed(parseInt(stored, 10));
  }, []);

  // Badge count: entries newer than the last time the feed was opened
  const unreadCount = activities.filter((a) => a.timestamp > lastViewed).length;

  function handleToggle() {
    setOpen((o) => {
      if (!o) {
        // Opening — mark all current entries as seen
        const now = Date.now();
        setLastViewed(now);
        localStorage.setItem(LS_KEY, String(now));
      }
      return !o;
    });
  }

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        title="Activity feed"
        className="relative p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold rounded-full bg-rose-500 text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Recent Activity
            </span>
          </div>
          <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
            {activities.length === 0 ? (
              <li className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 text-center">
                No recent activity
              </li>
            ) : (
              activities.map((entry) => {
                const dotColor = colorDotMap[entry.memberColor] ?? "bg-gray-400";
                return (
                  <li key={entry.id} className="flex items-start gap-2.5 px-3 py-2.5">
                    <span
                      className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                        <span className="font-semibold">{entry.memberEmoji} {entry.memberName}</span>{" "}
                        {entry.action}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {relativeTime(entry.timestamp)}
                      </p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
