"use client";

import { useState, useEffect, useRef } from "react";
import { createMealPrepItem, updateMealPrepItem, deleteMealPrepItem, markSectionRead, generateCelebration } from "@/app/actions";
import { Refrigerator, Plus, X, Save, Pencil, Loader2, ImageOff } from "lucide-react";
import MemberBadge from "./MemberBadge";
import CelebrationToast from "./CelebrationToast";

interface Member {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

interface MealPrepItem {
  id: number;
  label: string;
  imageUrl: string;
  consumptionTime?: string | null;
  createdAt: Date;
  updatedAt: Date;
  member: Member | null;
}

interface MealPrepFridgeProps {
  initialItems: MealPrepItem[];
  unreadCount: number;
}

function ItemThumbnail({ src, alt }: { src: string; alt: string }) {
  if (!src) return <ImageOff className="w-6 h-6 text-gray-400 dark:text-gray-500" />;
  if (src.startsWith("data:")) {
    return <img src={src} alt={alt} className="w-full h-full object-cover" />;
  }
  // Emoji stored as text
  return <span className="text-3xl leading-none select-none" role="img" aria-label={alt}>{src}</span>;
}

export default function MealPrepFridge({ initialItems, unreadCount }: MealPrepFridgeProps) {
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [celebration, setCelebration] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [markedRead, setMarkedRead] = useState(false);

  useEffect(() => {
    if (!sectionRef.current || unreadCount === 0 || markedRead) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMarkedRead(true);
          markSectionRead("mealPrep");
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [unreadCount, markedRead]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const label = newLabel.trim();
    setLoading(true);
    try {
      await createMealPrepItem(label);
      setNewLabel("");
      generateCelebration(`a new meal prep item was added to the fridge: "${label}"`).then((msg) => {
        if (msg) setCelebration(msg);
      }).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: MealPrepItem) => {
    setEditingId(item.id);
    setEditLabel(item.label);
  };

  const handleUpdate = async (id: number) => {
    if (!editLabel.trim()) return;
    await updateMealPrepItem(id, editLabel.trim());
    setEditingId(null);
    setEditLabel("");
  };

  const handleDelete = async (id: number) => {
    await deleteMealPrepItem(id);
  };

  return (
    <>
      <CelebrationToast message={celebration} onDismiss={() => setCelebration(null)} />
      <div ref={sectionRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Refrigerator className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
        <h2 className="text-xl font-bold dark:text-gray-100">Meal Prep Fridge</h2>
        {unreadCount > 0 && !markedRead && (
          <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      <form onSubmit={handleCreate} className="mb-4">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="What did you prep? e.g. Chicken Stir Fry"
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !newLabel.trim()}
          className="mt-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white px-4 py-2 rounded-md transition flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add to Fridge
            </>
          )}
        </button>
      </form>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {initialItems.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Nothing prepped yet. Add something above!
          </p>
        ) : (
          initialItems.map((item) => (
            <div
              key={item.id}
              className="bg-cyan-50 dark:bg-gray-700 border-l-4 border-cyan-400 p-3 rounded-md flex gap-3"
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                <ItemThumbnail src={item.imageUrl} alt={item.label} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {editingId === item.id ? (
                  <div>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleUpdate(item.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-md transition flex items-center gap-1 text-xs"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white px-2 py-1 rounded-md transition text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full justify-between">
                    <p className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">{item.label}</p>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        {item.consumptionTime && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded-full">
                            Best by: {item.consumptionTime}
                          </span>
                        )}
                      </div>
                      <MemberBadge member={item.member} />
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition"
                          title="Edit label"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition"
                          title="Delete item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </>
  );
}
