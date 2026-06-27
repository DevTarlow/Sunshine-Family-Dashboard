"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { toggleFitnessLog, generateCelebration } from "@/app/actions";
import CelebrationToast from "./CelebrationToast";

type Member = {
  name: string;
  emoji: string;
  color: string;
};

type FitnessLog = {
  id: number;
  date: string; // ISO string after Next.js serialization
  memberId: number;
  member: Member;
};

type Props = {
  initialLogs: FitnessLog[];
  currentMemberId: number | null;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getWeekDays(): Date[] {
  const now = new Date();
  // Day index: 0=Sun…6=Sat → convert to Mon=0…Sun=6
  const day = now.getDay();
  const daysFromMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - daysFromMonday);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toUTCMidnightISO(localDate: Date): string {
  return new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())).toISOString();
}

function isSameLocalDay(localDate: Date, isoString: string): boolean {
  const logDate = new Date(isoString);
  // Compare local date values since the db date is stored as UTC midnight
  return (
    localDate.getFullYear() === logDate.getUTCFullYear() &&
    localDate.getMonth() === logDate.getUTCMonth() &&
    localDate.getDate() === logDate.getUTCDate()
  );
}

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatDateRange(days: Date[]): string {
  const first = days[0];
  const last = days[6];
  const firstStr = `${MONTH_NAMES[first.getMonth()]} ${first.getDate()}`;
  const lastStr = `${MONTH_NAMES[last.getMonth()]} ${last.getDate()}`;
  return `${firstStr} – ${lastStr}`;
}

export default function FitnessTracker({ initialLogs, currentMemberId }: Props) {
  const weekDays = getWeekDays();
  const [celebration, setCelebration] = useState<string | null>(null);

  function getLogsForDay(day: Date): FitnessLog[] {
    return initialLogs.filter((log) => isSameLocalDay(day, log.date));
  }

  function currentMemberLoggedDay(day: Date): boolean {
    if (!currentMemberId) return false;
    return initialLogs.some(
      (log) => log.memberId === currentMemberId && isSameLocalDay(day, log.date)
    );
  }

  async function handleToggle(day: Date) {
    if (!currentMemberId) return;
    const wasLogged = currentMemberLoggedDay(day);
    await toggleFitnessLog(toUTCMidnightISO(day));
    if (!wasLogged) {
      generateCelebration("a family member just logged their workout for the day").then((msg) => {
        if (msg) setCelebration(msg);
      });
    }
  }

  return (
    <>
      <CelebrationToast message={celebration} onDismiss={() => setCelebration(null)} />
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-green-500" size={22} />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Weekly Fitness</h2>
        </div>
        <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">{formatDateRange(weekDays)}</span>
      </div>

      {/* Guest notice */}
      {!currentMemberId && (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-3">
          Select a family member to log exercise.
        </p>
      )}

      {/* 7-column day grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, i) => {
          const logs = getLogsForDay(day);
          const meLogged = currentMemberLoggedDay(day);
          const today = isToday(day);

          return (
            <button
              key={i}
              onClick={() => handleToggle(day)}
              disabled={!currentMemberId}
              className={[
                "flex flex-col items-center gap-1 rounded-xl p-2 transition-all",
                currentMemberId
                  ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95"
                  : "cursor-default",
                today
                  ? "ring-2 ring-green-400 bg-green-50 dark:bg-green-900/20"
                  : meLogged
                  ? "bg-emerald-50 dark:bg-emerald-900/20"
                  : "bg-gray-50 dark:bg-gray-700",
              ].join(" ")}
            >
              {/* Day name */}
              <span
                className={[
                  "text-xs font-semibold uppercase tracking-wide",
                  today ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500",
                ].join(" ")}
              >
                {DAY_NAMES[i]}
              </span>

              {/* Date number */}
              <span
                className={[
                  "text-sm font-bold",
                  today ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-300",
                ].join(" ")}
              >
                {day.getDate()}
              </span>

              {/* Emoji stack */}
              <div className="flex flex-col items-center gap-0.5 min-h-[2rem]">
                {logs.map((log) => (
                  <span
                    key={log.id}
                    title={log.member.name}
                    className="text-lg leading-none"
                  >
                    {log.member.emoji}
                  </span>
                ))}
              </div>

              {/* "+" indicator if logged-in member hasn't checked in */}
              {currentMemberId && !meLogged && (
                <span className="text-xs text-gray-300 dark:text-gray-600 font-bold mt-auto">+</span>
              )}

              {/* Checkmark if logged-in member has checked in */}
              {meLogged && (
                <span className="text-xs text-green-500 font-bold mt-auto">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
        Tap a day to log your exercise for that day
      </p>
    </div>
    </>
  );
}
