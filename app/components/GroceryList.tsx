"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X, Plus, ShoppingCart, Copy } from "lucide-react";
import { createGrocery, toggleGrocery, deleteGrocery, deleteAllGroceries, markSectionRead, getGroceryCategories } from "@/app/actions";
import MemberBadge from "./MemberBadge";

interface Member {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

interface Grocery {
  id: number;
  item: string;
  isBought: boolean;
  category?: string;
  member: Member | null;
}

interface GroceryListProps {
  initialGroceries: Grocery[];
  unreadCount: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Produce: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Dairy: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Meat: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Bakery: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Frozen: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  Beverages: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  Pantry: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Snacks: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  Household: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  Other: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

export default function GroceryList({ initialGroceries, unreadCount }: GroceryListProps) {
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("Other");
  const [categories, setCategories] = useState<{ id: number; name: string; isDefault: boolean }[]>([]);
  const [copied, setCopied] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [markedRead, setMarkedRead] = useState(false);

  useEffect(() => {
    getGroceryCategories().then((cats) => {
      if (Array.isArray(cats)) setCategories(cats);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!sectionRef.current || unreadCount === 0 || markedRead) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMarkedRead(true);
          markSectionRead("groceries");
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [unreadCount, markedRead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    await createGrocery(newItem.trim(), newCategory);
    setNewItem("");
  };

  const handleToggle = async (id: number, isBought: boolean) => {
    await toggleGrocery(id, !isBought);
  };

  const handleDelete = async (id: number) => {
    await deleteGrocery(id);
  };

  const handleRemoveAll = async () => {
    if (!window.confirm("Remove all grocery items?")) return;
    const msg = await generateCelebration("all grocery items were cleared from the family list");
    if (msg) setCelebration(msg);
    await deleteAllGroceries();
  };

  const handleCopy = () => {
    const itemText = initialGroceries
      .map((item) => `${item.item}${item.isBought ? " ✓" : ""}`)
      .join("\n");
    navigator.clipboard.writeText(itemText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const grouped = initialGroceries.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, Grocery[]>);

  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div ref={sectionRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
        <h2 className="text-xl font-bold dark:text-gray-100">Grocery List</h2>
        {unreadCount > 0 && !markedRead && (
          <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add grocery item..."
          className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      <button
        onClick={handleCopy}
        className={`w-full px-4 py-2 rounded-md transition flex items-center justify-center gap-2 mb-4 ${
          copied
            ? "bg-green-500 text-white"
            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
        }`}
      >
        <Copy className="w-4 h-4" />
        {copied ? "Copied!" : "Copy"}
      </button>

      {initialGroceries.length > 0 && (
        <button
          onClick={handleRemoveAll}
          className="w-full px-4 py-2 rounded-md transition flex items-center justify-center gap-2 mb-4 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400"
        >
          <X className="w-4 h-4" />
          Remove All
        </button>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {initialGroceries.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No items yet. Add one above!</p>
        ) : (
          sortedCategories.map((cat) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 px-1">
                {cat} ({grouped[cat].length})
              </h3>
              <div className="space-y-1.5">
                {grouped[cat].map((grocery) => (
                  <div
                    key={grocery.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  >
                    <button
                      onClick={() => handleToggle(grocery.id, grocery.isBought)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition shrink-0 ${
                        grocery.isBought
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 dark:border-gray-500 hover:border-green-500"
                      }`}
                    >
                      {grocery.isBought && <Check className="w-4 h-4 text-white" />}
                    </button>

                    <span className={`flex-1 min-w-0 truncate text-sm ${
                      grocery.isBought
                        ? "line-through text-gray-400 dark:text-gray-500"
                        : "text-gray-900 dark:text-gray-100"
                    }`}>
                      {grocery.item}
                    </span>

                    {grocery.category && grocery.category !== "Other" && (
                      <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${CATEGORY_COLORS[grocery.category] || CATEGORY_COLORS["Other"]}`}>
                        {grocery.category}
                      </span>
                    )}

                    <span className="shrink-0"><MemberBadge member={grocery.member} /></span>

                    <button
                      onClick={() => handleDelete(grocery.id)}
                      className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
