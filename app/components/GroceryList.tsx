"use client";

import { useState, useEffect, useRef } from "react";
import { createGrocery, toggleGrocery, deleteGrocery, deleteAllGroceries, markSectionRead, generateCelebration } from "@/app/actions";
import { Check, X, Plus, ShoppingCart, Copy } from "lucide-react";
import MemberBadge from "./MemberBadge";
import CelebrationToast from "./CelebrationToast";

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
  member: Member | null;
}

interface GroceryListProps {
  initialGroceries: Grocery[];
  unreadCount: number;
}

export default function GroceryList({ initialGroceries, unreadCount }: GroceryListProps) {
  const [newItem, setNewItem] = useState("");
  const [copied, setCopied] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [markedRead, setMarkedRead] = useState(false);

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
    const item = newItem.trim();
    const [, msg] = await Promise.all([
      createGrocery(item),
      generateCelebration(`a new grocery item was added: "${item}"`),
    ]);
    setNewItem("");
    if (msg) setCelebration(msg);
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

  return (
    <>
      <CelebrationToast message={celebration} onDismiss={() => setCelebration(null)} />
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
      
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add grocery item..."
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition flex items-center gap-2"
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

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {initialGroceries.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No items yet. Add one above!</p>
        ) : (
          initialGroceries.map((grocery) => (
            <div
              key={grocery.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition"
            >
              <button
                onClick={() => handleToggle(grocery.id, grocery.isBought)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                  grocery.isBought
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 dark:border-gray-500 hover:border-green-500"
                }`}
              >
                {grocery.isBought && <Check className="w-4 h-4 text-white" />}
              </button>
              
              <span className={`flex-1 ${
                grocery.isBought
                  ? "line-through text-gray-400 dark:text-gray-500"
                  : "text-gray-900 dark:text-gray-100"
              }`}>
                {grocery.item}
              </span>
              
              <MemberBadge member={grocery.member} />
              
              <button
                onClick={() => handleDelete(grocery.id)}
                className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
      </div>
    </>
  );
}
