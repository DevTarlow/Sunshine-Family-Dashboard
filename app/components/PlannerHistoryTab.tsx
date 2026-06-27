"use client";

import { useEffect, useState } from "react";
import { Search, Archive, Calendar, Clock } from "lucide-react";
import { getArchivedMeals } from "@/app/actions";

const MEAL_ICONS: Record<string, string> = { breakfast: "☕", lunch: "🥪", dinner: "🍽" };

export default function PlannerHistoryTab() {
  const [meals, setMeals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  useEffect(() => {
    setLoading(true); setPage(0);
    getArchivedMeals(search || undefined, 0, limit).then(result => {
      setMeals(result.rows); setTotal(result.total); setHasMore(result.hasMore); setLoading(false);
    }).catch(() => setLoading(false));
  }, [search]);

  async function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    const result = await getArchivedMeals(search || undefined, nextPage, limit);
    setMeals(prev => [...prev, ...result.rows]);
    setHasMore(result.hasMore);
  }

  function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Archive className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Planner History</h3>
        {!loading && <span className="text-xs text-gray-400 dark:text-gray-500">({total} archived)</span>}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search archived meals…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-2.5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : meals.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            {search ? "No archived meals match your search." : "No archived meals yet. Use the Cleanup Past button to archive past meals."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {meals.map((meal: any) => (
              <div key={meal.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="text-lg flex-shrink-0">{MEAL_ICONS[meal.mealTime] ?? "🍽"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{meal.mealName}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(meal.mealDate)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {meal.dayOfWeek} · {meal.mealTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <button onClick={loadMore} className="mt-4 w-full py-2 text-sm text-blue-500 hover:text-blue-600 transition-colors">
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}
