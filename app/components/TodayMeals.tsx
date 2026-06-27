"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UtensilsCrossed, Calendar, ExternalLink } from "lucide-react";
import { getPlannedMeals, createPlannedMeal, updatePlannedMeal, deletePlannedMeal } from "@/app/actions";
import MealSlot from "./MealSlot";

const MEAL_TIMES = ["breakfast", "lunch", "dinner"] as const;

function getTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function formatDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

function dateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function TodayMeals() {
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => getTodayUTC(), []);
  const weekStart = useMemo(() => today, [today]);

  const days = useMemo(() => [
    { date: today, key: dateKey(today), label: "Today", isToday: true },
    { date: addDays(today, 1), key: dateKey(addDays(today, 1)), label: formatDayName(addDays(today, 1)), isToday: false },
    { date: addDays(today, 2), key: dateKey(addDays(today, 2)), label: formatDayName(addDays(today, 2)), isToday: false },
  ], [today]);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    const dayKeys = days.map(d => d.key);
    const result = await getPlannedMeals(weekStart);
    setMeals((result ?? []).filter((m: any) => dayKeys.includes(dateKey(new Date(m.mealDate)))));
    setLoading(false);
  }, [weekStart, days]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  function getMealsForDate(dateKeyStr: string) { return meals.filter((m: any) => dateKey(new Date(m.mealDate)) === dateKeyStr); }
  function getMealForTime(dateKeyStr: string, time: string) { return meals.find((m: any) => dateKey(new Date(m.mealDate)) === dateKeyStr && m.mealTime === time) ?? null; }

  async function handleAdd(mealDate: Date, mealTime: string, mealName: string, recipeLinkId?: number) {
    await createPlannedMeal(mealDate, mealTime, mealName, recipeLinkId);
    fetchMeals();
  }

  async function handleEdit(id: number, mealName: string, recipeLinkId?: number | null) {
    await updatePlannedMeal(id, { mealName, recipeLinkId });
    fetchMeals();
  }

  async function handleDelete(id: number) {
    await deletePlannedMeal(id);
    fetchMeals();
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <UtensilsCrossed className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Upcoming Meals</h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, di) => (
            <div key={di}>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, si) => (
                  <div key={si} className="animate-pulse flex items-center gap-3 p-2 rounded">
                    <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-5 flex-1 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {days.map((day) => {
            const dayMeals = getMealsForDate(day.key);
            return (
              <div key={day.key}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {day.label}, {day.date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                  </span>
                  {day.isToday && <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-medium leading-none">Today</span>}
                </div>
                <div className="space-y-0.5">
                  {MEAL_TIMES.map((mealTime) => (
                    <MealSlot key={mealTime} meal={getMealForTime(day.key, mealTime)} mealDate={day.date} mealTime={mealTime}
                      isToday={day.isToday} isDragging={false}
                      onAdd={(name, recipeId) => handleAdd(day.date, mealTime, name, recipeId)}
                      onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <Link href="/?page=weekly-planner" className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
          View Full Week
        </Link>
      </div>
    </div>
  );
}
