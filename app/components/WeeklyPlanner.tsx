"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDroppable, useDraggable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, Calendar, ClipboardList, Trash2, LayoutList, LayoutGrid } from "lucide-react";
import { getPlannedMeals, createPlannedMeal, updatePlannedMeal, deletePlannedMeal, reorderPlannedMeals, cleanupPastMeals } from "@/app/actions";
import MealSlot from "./MealSlot";
import PlannerHistoryTab from "./PlannerHistoryTab";

const MEAL_TIMES = ["breakfast", "lunch", "dinner"] as const;
const MEAL_ICONS: Record<string, string> = { breakfast: "☕", lunch: "🥪", dinner: "🍽" };
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDateRange(weekStart: Date): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric", timeZone: "UTC" });
}

function dateToKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function getWeekDays(weekStart: Date) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    days.push({ date: d, dayName: DAY_NAMES[d.getUTCDay()], dateKey: dateToKey(d), dayIndex: d.getUTCDay() });
  }
  return days;
}

function buildMealMap(meals: any[]) {
  const map: Record<string, any[]> = {};
  for (const m of meals) {
    const key = `${dateToKey(new Date(m.mealDate))}-${m.mealTime}`;
    if (!map[key]) map[key] = [];
    map[key].push(m);
  }
  return map;
}

const now = new Date();
const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
const todayKey = dateToKey(todayUTC);

function getWeekStartSync(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(Date.UTC(d.getFullYear(), d.getMonth(), diff));
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}

function DragOverlayContent({ meal }: { meal: any }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-blue-500">
      <span className="text-base">{MEAL_ICONS[meal.mealTime]}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{meal.mealName}</span>
    </div>
  );
}

function DroppableSlot({ slotKey, children }: { slotKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slotKey}` });
  return (
    <div ref={setNodeRef} className={`min-h-[2.5rem] rounded transition-colors ${isOver ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400" : ""}`}>
      {children}
    </div>
  );
}

function DraggableMealWrapper({ meal, children }: { meal: any; children: (props: Record<string, any>) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `meal-${meal.id}`,
    data: { meal },
  });
  const style: React.CSSProperties = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.3 : 1 };
  return <div ref={setNodeRef} style={style}>{children({ ...attributes, ...listeners })}</div>;
}

export default function WeeklyPlanner() {
  const [weekStart, setWeekStart] = useState(() => getWeekStartSync());
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"plan" | "history">("plan");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isPending, setIsPending] = useState(false);
  const [activeDragMeal, setActiveDragMeal] = useState<any | null>(null);
  const [cleanupCount, setCleanupCount] = useState<number | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const mealMap = useMemo(() => buildMealMap(meals), [meals]);

  const fetchMeals = useCallback(() => {
    setLoading(true);
    getPlannedMeals(weekStart).then(result => { setMeals(result ?? []); setLoading(false); });
  }, [weekStart]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  function navigateWeek(direction: -1 | 1) {
    const newStart = new Date(weekStart);
    newStart.setUTCDate(newStart.getUTCDate() + direction * 7);
    setWeekStart(newStart);
  }

  function goToThisWeek() { setWeekStart(getWeekStartSync()); }

  async function handleAdd(dayDate: Date, mealTime: string, mealName: string, recipeLinkId?: number) {
    await createPlannedMeal(dayDate, mealTime, mealName, recipeLinkId);
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

  async function handleCleanup() {
    setIsPending(true);
    const count = await cleanupPastMeals();
    setCleanupCount(count);
    fetchMeals();
    setTimeout(() => setCleanupCount(null), 4000);
    setIsPending(false);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(event: DragStartEvent) {
    const meal = event.active.data.current?.meal;
    if (meal) setActiveDragMeal(meal);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragMeal(null);
    const { active, over } = event;
    if (!over || !active) return;
    const overId = over.id as string;
    if (!overId.startsWith("slot-")) return;
    const targetKey = overId.replace("slot-", "");
    const meal = active.data.current?.meal;
    if (!meal) return;
    const currentKey = `${dateToKey(new Date(meal.mealDate))}-${meal.mealTime}`;
    if (targetKey === currentKey) return;
    const lastDash = targetKey.lastIndexOf("-");
    const targetDateStr = targetKey.substring(0, lastDash);
    const targetMealTime = targetKey.substring(lastDash + 1);
    if (!targetDateStr || !targetMealTime) return;
    const targetDate = new Date(targetDateStr + "T00:00:00Z");
    setIsPending(true);
    const targetMeals = mealMap[targetKey] ?? [];
    const maxOrder = targetMeals.reduce((max, m) => Math.max(max, m.sortOrder), -1);
    reorderPlannedMeals([{ id: meal.id, sortOrder: maxOrder + 1, mealDate: targetDate, mealTime: targetMealTime }]).then(() => {
      fetchMeals();
      setIsPending(false);
    });
  }

  function isToday(date: Date): boolean { return dateToKey(date) === todayKey; }

  function renderSlot(dayDate: Date, mealTime: string) {
    const key = `${dateToKey(dayDate)}-${mealTime}`;
    const slotMeals = mealMap[key] ?? [];
    const meal = slotMeals.length > 0 ? slotMeals[0] : null;
    if (meal) {
      return (
        <DraggableMealWrapper key={meal.id} meal={meal}>
          {(dragHandleProps) => (
            <MealSlot meal={meal} mealDate={dayDate} mealTime={mealTime} isToday={isToday(dayDate)} isDragging={activeDragMeal?.id === meal.id}
              dragHandleProps={dragHandleProps}
              onAdd={(name, recipeId) => handleAdd(dayDate, mealTime, name, recipeId)}
              onEdit={(id, name, recipeId) => handleEdit(id, name, recipeId)} onDelete={handleDelete} />
          )}
        </DraggableMealWrapper>
      );
    }
    return (
      <MealSlot meal={null} mealDate={dayDate} mealTime={mealTime} isToday={isToday(dayDate)} isDragging={false}
        onAdd={(name, recipeId) => handleAdd(dayDate, mealTime, name, recipeId)}
        onEdit={(id, name, recipeId) => handleEdit(id, name, recipeId)} onDelete={handleDelete} />
    );
  }

  if (activeTab === "history") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setActiveTab("plan")} className="text-sm text-gray-400 hover:text-blue-500 transition-colors">← Plan</button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">History</span>
        </div>
        <PlannerHistoryTab />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Weekly Planner</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab("history")} className="text-xs text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1">History</button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button onClick={() => setViewMode("list")}
            className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`} title="List view">
            <LayoutList className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`} title="Grid view">
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
        <button onClick={() => navigateWeek(-1)} className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Previous week">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Week of {formatDateRange(weekStart)}</span>
          <button onClick={goToThisWeek} className="text-xs text-blue-500 hover:text-blue-600 underline transition-colors">This Week</button>
        </div>
        <button onClick={() => navigateWeek(1)} className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Next week">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button onClick={handleCleanup} disabled={isPending}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
          <Trash2 className="w-3.5 h-3.5" /> Cleanup Past
        </button>
        {cleanupCount !== null && <span className="text-xs text-amber-600 dark:text-amber-400">Archived {cleanupCount} meal{cleanupCount !== 1 ? "s" : ""}</span>}
        {isPending && <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">Saving…</span>}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveDragMeal(null)}>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-4">
            {weekDays.map((day) => {
              const isSlotToday = isToday(day.date);
              return (
                <div key={day.dateKey} className={`rounded-lg p-3 transition ${isSlotToday ? "bg-yellow-50 dark:bg-yellow-900/10 ring-1 ring-yellow-200 dark:ring-yellow-700" : "bg-gray-50 dark:bg-gray-800/30"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-semibold text-sm ${isSlotToday ? "text-yellow-800 dark:text-yellow-300" : "text-gray-700 dark:text-gray-300"}`}>{day.dayName}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatShortDate(day.date)}</span>
                    {isSlotToday && <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-medium leading-none">Today</span>}
                  </div>
                  <div className="space-y-0.5">
                    {MEAL_TIMES.map((mealTime) => (
                      <DroppableSlot key={`${day.dateKey}-${mealTime}`} slotKey={`${day.dateKey}-${mealTime}`}>
                        {renderSlot(day.date, mealTime)}
                      </DroppableSlot>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs text-gray-400 dark:text-gray-500 font-medium w-20"></th>
                  {weekDays.map((day) => (
                    <th key={day.dateKey} className={`p-2 text-center font-medium text-xs min-w-[7rem] ${isToday(day.date) ? "text-yellow-700 dark:text-yellow-300" : "text-gray-600 dark:text-gray-400"}`}>
                      <div>{day.dayName.slice(0, 3)}</div>
                      <div className="text-[10px] text-gray-400">{formatShortDate(day.date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEAL_TIMES.map((mealTime) => (
                  <tr key={mealTime}>
                    <td className="p-2 text-xs text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">{MEAL_ICONS[mealTime]} {mealTime.charAt(0).toUpperCase() + mealTime.slice(1)}</td>
                    {weekDays.map((day) => (
                      <td key={`${day.dateKey}-${mealTime}`} className={`p-1 border border-gray-100 dark:border-gray-800 ${isToday(day.date) ? "bg-yellow-50/30 dark:bg-yellow-900/5" : ""}`}>
                        <DroppableSlot slotKey={`${day.dateKey}-${mealTime}`}>{renderSlot(day.date, mealTime)}</DroppableSlot>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DragOverlay>{activeDragMeal ? <DragOverlayContent meal={activeDragMeal} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
