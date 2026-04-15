"use client";

import { useState, useEffect, useRef } from "react";
import { Trophy, Lock } from "lucide-react";

interface Achievement {
  id: number;
  key: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
}

interface EarnedAchievement {
  achievementId: number;
  earnedAt: string; // ISO string (serialized from Date in layout)
}

interface Progress {
  fitnessWeek: number;
  fitnessAllTime: number;
  todosCompleted: number;
  photosUploaded: number;
  diningMonthCount: number;
}

interface Props {
  allAchievements: Achievement[];
  earnedAchievements: EarnedAchievement[];
  progress: Progress;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: "fitness", label: "🏋️ Fitness" },
  { key: "todo",    label: "✅ To-Do" },
  { key: "photos",  label: "📷 Photos" },
  { key: "dining",  label: "🍴 Dining Out" },
];

// Progress label shown under unearned achievements
function progressLabel(key: string, progress: Progress): string | null {
  switch (key) {
    case "workout_first":      return `${progress.fitnessAllTime}/1 workout logged`;
    case "workout_three_week": return `${progress.fitnessWeek}/3 workouts this week`;
    case "workout_full_week":  return `${progress.fitnessWeek}/7 days this week`;
    case "todo_first_complete":   return `${progress.todosCompleted}/1 to-do completed`;
    case "todo_five_complete":    return `${progress.todosCompleted}/5 to-dos completed`;
    case "todo_twenty_complete":  return `${progress.todosCompleted}/20 to-dos completed`;
    case "photo_first":    return `${progress.photosUploaded}/1 photo uploaded`;
    case "photo_five":     return `${progress.photosUploaded}/5 photos uploaded`;
    case "photo_fifteen":  return `${progress.photosUploaded}/15 photos uploaded`;
    case "dining_first":      return `${progress.diningMonthCount}/1 entry logged`;
    case "dining_budget":     return "Log a dining entry under $15";
    case "dining_five_month": return `${progress.diningMonthCount}/5 entries this month`;
    default: return null;
  }
}

// Progress fraction (0-1) for the progress bar on unearned achievements
function progressFraction(key: string, progress: Progress): number {
  switch (key) {
    case "workout_first":      return Math.min(progress.fitnessAllTime / 1, 1);
    case "workout_three_week": return Math.min(progress.fitnessWeek / 3, 1);
    case "workout_full_week":  return Math.min(progress.fitnessWeek / 7, 1);
    case "todo_first_complete":   return Math.min(progress.todosCompleted / 1, 1);
    case "todo_five_complete":    return Math.min(progress.todosCompleted / 5, 1);
    case "todo_twenty_complete":  return Math.min(progress.todosCompleted / 20, 1);
    case "photo_first":    return Math.min(progress.photosUploaded / 1, 1);
    case "photo_five":     return Math.min(progress.photosUploaded / 5, 1);
    case "photo_fifteen":  return Math.min(progress.photosUploaded / 15, 1);
    case "dining_first":      return Math.min(progress.diningMonthCount / 1, 1);
    case "dining_budget":     return 0;
    case "dining_five_month": return Math.min(progress.diningMonthCount / 5, 1);
    default: return 0;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const LS_KEY = "achievements-last-seen-count";

export default function AchievementsDropdown({ allAchievements, earnedAchievements, progress }: Props) {
  const [open, setOpen] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const earnedSet = new Set(earnedAchievements.map((e) => e.achievementId));
  const earnedMap = new Map(earnedAchievements.map((e) => [e.achievementId, e.earnedAt]));
  const totalEarned = earnedSet.size;
  const totalAchievements = allAchievements.length;

  // Restore last-seen count from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    setLastSeenCount(stored !== null ? parseInt(stored, 10) : 0);
  }, []);

  // Badge = achievements earned since the user last opened the dropdown
  const newCount = lastSeenCount !== null ? Math.max(0, totalEarned - lastSeenCount) : 0;

  function handleToggle() {
    setOpen((o) => {
      if (!o) {
        // Opening — mark current count as seen
        setLastSeenCount(totalEarned);
        localStorage.setItem(LS_KEY, String(totalEarned));
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
        title="Your achievements"
        className="relative p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Trophy size={16} />
        {newCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold rounded-full bg-amber-500 text-white leading-none">
            {newCount > 9 ? "9+" : newCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-500" />
              Your Achievements
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              {totalEarned}/{totalAchievements} earned
            </span>
          </div>

          {/* Categories */}
          <div className="max-h-[70vh] overflow-y-auto">
            {CATEGORIES.map((cat) => {
              const catAchievements = allAchievements.filter((a) => a.category === cat.key);
              return (
                <div key={cat.key}>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {cat.label}
                    </span>
                  </div>
                  <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                    {catAchievements.map((achievement) => {
                      const isEarned = earnedSet.has(achievement.id);
                      const earnedAt = earnedMap.get(achievement.id);
                      const fraction = progressFraction(achievement.key, progress);
                      const label = progressLabel(achievement.key, progress);

                      return (
                        <li key={achievement.id} className="flex items-start gap-3 px-4 py-3">
                          {/* Emoji / Lock */}
                          <div className={`text-2xl leading-none mt-0.5 flex-shrink-0 ${isEarned ? "" : "grayscale opacity-40"}`}>
                            {achievement.emoji}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-sm font-semibold leading-tight ${isEarned ? "text-gray-800 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
                                {achievement.name}
                              </p>
                              {!isEarned && <Lock size={10} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                            </div>

                            {isEarned ? (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                                Earned {earnedAt ? formatDate(earnedAt) : ""}
                              </p>
                            ) : (
                              <>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                                  {achievement.description}
                                </p>
                                {label && (
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                    {label}
                                  </p>
                                )}
                                {fraction > 0 && (
                                  <div className="mt-1.5 w-full h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-amber-400 dark:bg-amber-500 transition-all"
                                      style={{ width: `${Math.round(fraction * 100)}%` }}
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
