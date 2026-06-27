"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, CalendarDays } from "lucide-react";
import Link from "next/link";
import { getCalendarEvents } from "@/app/actions";

const COLORS = [
  { key: "blue", tw: "bg-blue-500" }, { key: "red", tw: "bg-red-500" },
  { key: "green", tw: "bg-green-500" }, { key: "purple", tw: "bg-purple-500" },
  { key: "orange", tw: "bg-orange-500" }, { key: "pink", tw: "bg-pink-500" },
  { key: "yellow", tw: "bg-yellow-500" }, { key: "teal", tw: "bg-teal-500" },
  { key: "indigo", tw: "bg-indigo-500" }, { key: "cyan", tw: "bg-cyan-500" },
  { key: "amber", tw: "bg-amber-500" }, { key: "rose", tw: "bg-rose-500" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function eventDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrev = new Date(year, month - 1, 0).getDate();
  const cells: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, isCurrentMonth: false, date: new Date(year, month - 2, daysInPrev - i) });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, isCurrentMonth: true, date: new Date(year, month - 1, d) });
  let next = 1;
  while (cells.length < 42) { cells.push({ day: next, isCurrentMonth: false, date: new Date(year, month, next) }); next++; }
  return cells;
}

export default function CalendarWidget() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    getCalendarEvents(year, month).then(setEvents).catch(() => setEvents([]));
  }, [year, month]);

  function goToPrevMonth() { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); }
  function goToNextMonth() { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); }

  const eventsByDate = new Map<string, any[]>();
  for (const e of events) { const key = eventDateKey(new Date(e.eventDate)); if (!eventsByDate.has(key)) eventsByDate.set(key, []); eventsByDate.get(key)!.push(e); }
  const grid = getMonthGrid(year, month);
  const todayKey = eventDateKey(today);
  const upcoming = events.filter(e => eventDateKey(new Date(e.eventDate)) >= todayKey)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Calendar</h2>
        </div>
        <Link href="/?page=calendar" className="text-xs text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1">
          <span>View All</span> <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={goToPrevMonth} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{MONTH_NAMES[month - 1]} {year}</h3>
        <button onClick={goToNextMonth} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0 mb-1">
        {DAY_NAMES.map((d) => <div key={d} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {grid.map((cell, i) => {
          const key = eventDateKey(cell.date);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isToday = cell.date.getFullYear() === today.getFullYear() && cell.date.getMonth() === today.getMonth() && cell.date.getDate() === today.getDate();
          return (
            <div key={i} className={`text-center py-1 text-xs rounded-sm ${!cell.isCurrentMonth ? "text-gray-400 dark:text-gray-600" : isToday ? "text-blue-500 font-bold" : "text-gray-600 dark:text-gray-400"}`}>
              <span className="inline-block w-6 py-0.5 rounded-full">{cell.day}</span>
              {dayEvents.length > 0 && (
                <div className="flex justify-center gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((ev: any) => <span key={ev.id} className={`w-1 h-1 rounded-full ${COLORS.find(c => c.key === ev.color)?.tw ?? "bg-blue-500"}`} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {upcoming.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Upcoming</h4>
          <div className="space-y-2">
            {upcoming.map((ev: any) => {
              const evDate = new Date(ev.eventDate);
              return (
                <div key={ev.id} className="flex items-start gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${COLORS.find(c => c.key === ev.color)?.tw ?? "bg-blue-500"}`} />
                  <div className="min-w-0">
                    <span className="text-gray-500 dark:text-gray-400">{evDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}{ev.eventTime && ` • ${formatTime(ev.eventTime)}`}</span>
                    <span className="text-gray-700 dark:text-gray-300 ml-1">{ev.title}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
