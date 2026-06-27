"use client";

import { useEffect, useRef, useState } from "react";
import { GripVertical, Plus, ExternalLink, MessageSquare, X } from "lucide-react";
import CommentThread from "./CommentThread";
import RecipeAutocomplete from "./RecipeAutocomplete";

interface MealData {
  id: number;
  mealDate: Date;
  dayOfWeek: string;
  mealTime: string;
  mealName: string;
  sortOrder: number;
  recipeLinkId: number | null;
  recipeLink: { id: number; url: string; title: string; imageUrl: string } | null;
  comments: { id: number }[];
}

interface MealSlotProps {
  meal: MealData | null;
  mealDate: Date;
  mealTime: string;
  isToday: boolean;
  isDragging: boolean;
  isPreview?: boolean;
  dragHandleProps?: Record<string, any>;
  onAdd: (mealName: string, recipeLinkId?: number) => void;
  onEdit: (id: number, mealName: string, recipeLinkId?: number | null) => void;
  onDelete: (id: number) => void;
}

const MEAL_ICONS: Record<string, string> = { breakfast: "☕", lunch: "🥪", dinner: "🍽" };
const MEAL_LABELS: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

export default function MealSlot({ meal, mealDate, mealTime, isToday, isDragging, isPreview, dragHandleProps, onAdd, onEdit, onDelete }: MealSlotProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showRecipeSearch, setShowRecipeSearch] = useState(false);
  const [recipeQuery, setRecipeQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);

  function handleStartEdit() {
    setEditValue(meal?.mealName ?? "");
    setIsEditing(true);
    setShowRecipeSearch(false);
    setRecipeQuery("");
  }

  function handleSave() {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    if (meal) onEdit(meal.id, trimmed);
    else onAdd(trimmed);
    setIsEditing(false);
    setEditValue("");
  }

  function handleCancel() { setIsEditing(false); setEditValue(""); setShowRecipeSearch(false); setRecipeQuery(""); }

  function handleInputChange(value: string) {
    setEditValue(value);
    const atIndex = value.lastIndexOf("@");
    if (atIndex !== -1) {
      const afterAt = value.slice(atIndex + 1);
      if (afterAt.length > 0 && !afterAt.includes(" ")) { setShowRecipeSearch(true); setRecipeQuery(afterAt); return; }
    }
    setShowRecipeSearch(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !showRecipeSearch) { e.preventDefault(); handleSave(); }
    else if (e.key === "Escape") handleCancel();
  }

  function handleRecipeSelect(recipe: { id: number; title: string; url: string; imageUrl: string }) {
    const beforeAt = editValue.lastIndexOf("@");
    const newValue = editValue.slice(0, beforeAt) + recipe.title;
    setEditValue(newValue);
    setShowRecipeSearch(false);
    setRecipeQuery("");
    if (meal) onEdit(meal.id, recipe.title, recipe.id);
    else onAdd(recipe.title, recipe.id);
    setIsEditing(false);
  }

  return (
    <div className="group relative">
      {isEditing ? (
        <div className="relative">
          <div className="flex items-center gap-1.5">
            <span className="text-base flex-shrink-0">{MEAL_ICONS[mealTime] ?? "🍽"}</span>
            <input ref={inputRef} type="text" value={editValue} onChange={e => handleInputChange(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={`Add ${MEAL_LABELS[mealTime] ?? mealTime}…`}
              className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            {meal && <button onClick={() => onDelete(meal.id)} className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition">Delete</button>}
            <button onClick={handleSave} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition">Save</button>
            <button onClick={handleCancel} className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded transition">Cancel</button>
          </div>
          {showRecipeSearch && <RecipeAutocomplete query={recipeQuery} onSelect={handleRecipeSelect} onClose={() => setShowRecipeSearch(false)} inputRef={inputRef} />}
        </div>
      ) : (
        <div className={`flex items-center gap-1.5 py-1 px-1 rounded transition ${isToday ? "bg-yellow-50/50 dark:bg-yellow-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"} ${isPreview ? "opacity-50" : ""}`}>
          {dragHandleProps && !isDragging && (
            <button {...dragHandleProps} className="text-gray-300 hover:text-gray-500 dark:text-gray-600 cursor-grab active:cursor-grabbing touch-none flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" tabIndex={-1}>
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-base flex-shrink-0">{MEAL_ICONS[mealTime] ?? "🍽"}</span>
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase w-14 flex-shrink-0 hidden sm:inline">{MEAL_LABELS[mealTime] ?? mealTime}</span>
          <div className="flex-1 min-w-0">
            {meal ? (
              <div className="flex items-center gap-1.5">
                <button onClick={handleStartEdit} className="text-sm text-gray-800 dark:text-gray-200 truncate hover:text-blue-600 transition-colors text-left" title="Click to edit">{meal.mealName}</button>
                {meal.recipeLink && (
                  <a href={meal.recipeLink.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 flex-shrink-0" title={meal.recipeLink.title} onClick={e => e.stopPropagation()}>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ) : (
              <button onClick={handleStartEdit} className="text-xs text-gray-400 dark:text-gray-500 italic hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <Plus className="w-3 h-3 inline mr-0.5" /> Add meal
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {meal && (
              <>
                <button onClick={() => setShowComments(p => !p)} className={`transition p-0.5 ${showComments ? "text-blue-500" : "text-gray-300 dark:text-gray-600 hover:text-blue-400"}`} title="Comments">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {meal.comments.length > 0 && <span className="text-[10px] ml-0.5 text-gray-400">{meal.comments.length}</span>}
                </button>
                <button onClick={() => onDelete(meal.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition p-0.5" title="Delete meal">
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {showComments && meal && (
        <div className="ml-6">
          <CommentThread parentType="plannedMeal" parentId={meal.id} />
        </div>
      )}
    </div>
  );
}
