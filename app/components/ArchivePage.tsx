"use client";

import { useState, useEffect } from "react";
import { Archive, Search, Trash2, Calendar, ClipboardList, UtensilsCrossed } from "lucide-react";
import { getArchivedNotes, getDeletedTodos, getDeletedMealPrepItems } from "@/app/actions";

type Tab = "notes" | "todos" | "mealprep";

export default function ArchivePage() {
  const [tab, setTab] = useState<Tab>("notes");
  const [data, setData] = useState<any>({ rows: [], total: 0, hasMore: false });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  async function load(t: Tab, s: string, p: number) {
    let result;
    if (t === "notes") result = await getArchivedNotes(s || undefined, p);
    else if (t === "todos") result = await getDeletedTodos(s || undefined, p);
    else result = await getDeletedMealPrepItems(s || undefined, p);
    setData(result);
  }

  useEffect(() => { load(tab, search, 0); }, []);

  function switchTab(t: Tab) {
    setTab(t); setPage(0); setSearch(""); load(t, "", 0);
  }

  function handleSearch(val: string) {
    setSearch(val); setPage(0); load(tab, val, 0);
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "notes", label: "Archived Notes", icon: <Archive className="w-4 h-4" /> },
    { key: "todos", label: "Deleted Todos", icon: <ClipboardList className="w-4 h-4" /> },
    { key: "mealprep", label: "Deleted Meal Prep", icon: <UtensilsCrossed className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search..."
          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        {data?.rows?.length > 0 ? data.rows.map((item: any) => (
          <div key={item.id} className="p-4">
            <p className="text-sm text-gray-800 dark:text-gray-100">
              {item.content || item.task || item.label}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              {item.archivedAt && <span>Archived: {new Date(item.archivedAt).toLocaleDateString()}</span>}
              {item.deletedAt && <span>Deleted: {new Date(item.deletedAt).toLocaleDateString()}</span>}
              {item.createdAt && <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>}
              {(item.memberName || item.memberEmoji) && <span>{item.memberEmoji} {item.memberName}</span>}
            </div>
          </div>
        )) : (
          <div className="p-8 text-center text-gray-500 text-sm">No archived items found.</div>
        )}
      </div>

      {data?.hasMore && (
        <button onClick={() => { const np = page + 1; setPage(np); load(tab, search, np); }}
          className="mt-4 w-full py-2 text-sm text-blue-500 hover:text-blue-600 transition-colors">
          Load More
        </button>
      )}
    </div>
  );
}
