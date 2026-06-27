"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { setDinner, clearDinner, suggestDinnerIdea, reorderDinners, markSectionRead } from "@/app/actions";
import { GripVertical, Utensils, Plus, X, Sparkles, Copy, Check, MessageSquare } from "lucide-react";
import CommentThread from "./CommentThread";

interface Dinner {
  id: number;
  dayOfWeek: string;
  meal: string;
}

interface WeeklyDinnersProps {
  initialDinners: Dinner[];
  unreadCount: number;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── Sortable row sub-component ───────────────────────────────────────────────

interface SortableDinnerRowProps {
  day: string;
  meal: string | null;
  dinnerId: number | null;
  isEditing: boolean;
  mealInput: string;
  isDragging: boolean;
  isCommentOpen: boolean;
  isToday: boolean;
  onEdit: () => void;
  onClear: () => void;
  onSave: () => void;
  onCancel: () => void;
  onMealInputChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onToggleComments: () => void;
}

function SortableDinnerRow({
  day,
  meal,
  dinnerId,
  isEditing,
  mealInput,
  isDragging,
  isCommentOpen,
  isToday,
  onEdit,
  onClear,
  onSave,
  onCancel,
  onMealInputChange,
  onKeyDown,
  onToggleComments,
}: SortableDinnerRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: day, disabled: isEditing });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
    zIndex: isSortableDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-md transition ${
        isToday
          ? "bg-purple-50 dark:bg-purple-900/30 ring-1 ring-purple-300 dark:ring-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/40"
          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Drag handle — hidden while this row is in edit mode */}
        {!isEditing ? (
          <button
            {...listeners}
            {...attributes}
            className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
            aria-label={`Drag ${day}`}
            tabIndex={-1}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <div className="font-semibold text-gray-700 dark:text-gray-300 w-36 flex-shrink-0 flex items-center gap-1.5">
          {day}
          {isToday && (
            <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded font-medium leading-none">
              Today
            </span>
          )}
        </div>

        {isEditing ? (
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={mealInput}
              onChange={(e) => onMealInputChange(e.target.value)}
              placeholder="Enter dinner plan..."
              className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
              onKeyDown={onKeyDown}
            />
            <button
              onClick={onSave}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md transition text-sm"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white px-3 py-1 rounded-md transition text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1">
              {meal ? (
                <span className="text-gray-800 dark:text-gray-100">{meal}</span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 italic">No plan yet</span>
              )}
            </div>

            <div className="flex gap-2 items-center">
              {dinnerId !== null && (
                <button
                  onClick={onToggleComments}
                  className={`transition flex-shrink-0 ${
                    isCommentOpen
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-gray-300 dark:text-gray-600 hover:text-blue-400"
                  }`}
                  title="Comments"
                  aria-label="Toggle comments"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onEdit}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md transition flex items-center gap-1 text-sm"
              >
                {meal ? "Edit" : <><Plus className="w-4 h-4" />Add</>}
              </button>
              {meal && (
                <button
                  onClick={onClear}
                  className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {isCommentOpen && dinnerId !== null && (
        <CommentThread parentType="dinner" parentId={dinnerId} />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WeeklyDinners({ initialDinners, unreadCount }: WeeklyDinnersProps) {
  const [localMeals, setLocalMeals] = useState<(string | null)[]>(() =>
    DAYS_OF_WEEK.map((day) => initialDinners.find((d) => d.dayOfWeek === day)?.meal ?? null)
  );
  const [localDinnerIds, setLocalDinnerIds] = useState<(number | null)[]>(() =>
    DAYS_OF_WEEK.map((day) => initialDinners.find((d) => d.dayOfWeek === day)?.id ?? null)
  );

  // Sync when server revalidation delivers fresh initialDinners
  useEffect(() => {
    setLocalMeals(
      DAYS_OF_WEEK.map((day) => initialDinners.find((d) => d.dayOfWeek === day)?.meal ?? null)
    );
    setLocalDinnerIds(
      DAYS_OF_WEEK.map((day) => initialDinners.find((d) => d.dayOfWeek === day)?.id ?? null)
    );
  }, [initialDinners]);

  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [mealInput, setMealInput] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [openCommentDinnerId, setOpenCommentDinnerId] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [markedRead, setMarkedRead] = useState(false);

  useEffect(() => {
    if (!sectionRef.current || unreadCount === 0 || markedRead) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMarkedRead(true);
          markSectionRead("dinners");
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [unreadCount, markedRead]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = (_event: DragStartEvent) => {
    setIsDragging(true);
    // Close any open edit form when a drag begins
    setEditingDay(null);
    setMealInput("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = DAYS_OF_WEEK.indexOf(active.id as string);
    const newIndex = DAYS_OF_WEEK.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newMeals = arrayMove(localMeals, oldIndex, newIndex);
    setLocalMeals(newMeals); // optimistic update

    startTransition(() => {
      reorderDinners(
        DAYS_OF_WEEK.map((day, i) => ({ dayOfWeek: day, meal: newMeals[i] ?? null }))
      );
    });
  };

  const handleSetDinner = async (day: string) => {
    if (!mealInput.trim()) return;
    await setDinner(day, mealInput);
    setEditingDay(null);
    setMealInput("");
  };

  const handleClearDinner = async (day: string) => {
    await clearDinner(day);
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    setSuggestion(null);
    const result = await suggestDinnerIdea();
    if (result) setSuggestion(result);
    setIsSuggesting(false);
  };

  const handleCopy = () => {
    if (!suggestion) return;
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={sectionRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Utensils className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        <h2 className="text-xl font-bold dark:text-gray-100">Weekly Dinners</h2>
        {unreadCount > 0 && !markedRead && (
          <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        {isPending && (
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 animate-pulse">Saving…</span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={DAYS_OF_WEEK} strategy={verticalListSortingStrategy}>
          <div className={`space-y-2 ${isPending ? "opacity-75" : ""} transition-opacity`}>
            {DAYS_OF_WEEK.map((day, index) => {
              const meal = localMeals[index] ?? null;
              const dinnerId = localDinnerIds[index] ?? null;
              const isEditing = editingDay === day;
              const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

              return (
                <SortableDinnerRow
                  key={day}
                  day={day}
                  meal={meal}
                  dinnerId={dinnerId}
                  isEditing={isEditing}
                  isToday={day === todayName}
                  mealInput={mealInput}
                  isDragging={isDragging}
                  isCommentOpen={openCommentDinnerId === dinnerId && dinnerId !== null}
                  onEdit={() => {
                    setEditingDay(day);
                    setMealInput(meal ?? "");
                  }}
                  onClear={() => handleClearDinner(day)}
                  onSave={() => handleSetDinner(day)}
                  onCancel={() => {
                    setEditingDay(null);
                    setMealInput("");
                  }}
                  onMealInputChange={setMealInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSetDinner(day);
                    else if (e.key === "Escape") {
                      setEditingDay(null);
                      setMealInput("");
                    }
                  }}
                  onToggleComments={() =>
                    setOpenCommentDinnerId((prev) => (prev === dinnerId ? null : dinnerId))
                  }
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleSuggest}
          disabled={isSuggesting}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-purple-400 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          {isSuggesting ? "Generating…" : "Generate AI Suggestion"}
        </button>

        {suggestion && (
          <div className="mt-3 flex items-center gap-3 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
            <span className="flex-1 text-gray-800 dark:text-gray-100 text-sm">{suggestion}</span>
            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              className="text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSuggestion(null)}
              title="Dismiss"
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
