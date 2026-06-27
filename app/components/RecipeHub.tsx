"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, ExternalLink, Search, Star, Download, Upload, Loader2 } from "lucide-react";
import { getRecipeLinks, createRecipeLink, deleteRecipeLink, updateRecipeLink, getRecipesCategories, exportRecipeLinks, importRecipeLinks } from "@/app/actions";
import CelebrationToast from "./CelebrationToast";
import ErrorToast from "./ErrorToast";

export default function RecipeHub() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addCategory, setAddCategory] = useState("Uncategorized");
  const [adding, setAdding] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadRecipes() {
    getRecipeLinks(search || undefined, ratingFilter || undefined, categoryFilter || undefined)
      .then(r => setRecipes(r.rows ?? [])).catch(() => {});
  }

  useEffect(() => { loadRecipes(); getRecipesCategories().then(setCategories).catch(() => {}); }, []);
  useEffect(() => { loadRecipes(); }, [search, ratingFilter, categoryFilter]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addUrl.trim() || adding) return;
    setAdding(true);
    try {
      await createRecipeLink(addUrl.trim(), addCategory);
      setCelebration("Recipe bookmark added!");
      setAddUrl("");
      loadRecipes();
      getRecipesCategories().then(setCategories).catch(() => {});
    } catch {
      setError("Failed to add recipe bookmark");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteRecipeLink(id);
      loadRecipes();
    } catch {
      setError("Failed to delete recipe bookmark");
    }
  }

  async function toggleFeatured(id: number, featured: boolean) {
    try {
      await updateRecipeLink(id, { featured: !featured });
      loadRecipes();
    } catch {
      setError("Failed to update featured");
    }
  }

  async function setRating(id: number, rating: number) {
    try {
      await updateRecipeLink(id, { rating });
      loadRecipes();
    } catch {
      setError("Failed to update rating");
    }
  }

  async function handleExport() {
    try {
      const data = await exportRecipeLinks();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recipe-bookmarks-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export recipes");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const arr = Array.isArray(json) ? json : json.rows || [];
      const result = await importRecipeLinks(arr);
      const msg = `Import complete: ${result.imported} added, ${result.skipped} skipped` + (result.errors?.length ? `, ${result.errors.length} errors` : "");
      setCelebration(msg);
      loadRecipes();
      getRecipesCategories().then(setCategories).catch(() => {});
    } catch {
      setError("Invalid import file");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <CelebrationToast message={celebration} onDismiss={() => setCelebration(null)} />
      <ErrorToast message={error} onDismiss={() => setError(null)} />

      {/* Inline Add Form */}
      <form onSubmit={handleAdd} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="url" value={addUrl} onChange={e => setAddUrl(e.target.value)} placeholder="Paste a recipe URL..."
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required />
          <select value={addCategory} onChange={e => setAddCategory(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="Uncategorized">Uncategorized</option>
            {categories.filter(c => c !== "Uncategorized").map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" disabled={adding || !addUrl.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
      </form>

      {/* Search + Filters + Export/Import */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <select value={ratingFilter} onChange={e => { setRatingFilter(Number(e.target.value)); }}
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value={0}>Any Rating</option>
          <option value={1}>★</option>
          <option value={2}>★★</option>
          <option value={3}>★★★</option>
          <option value={4}>★★★★</option>
          <option value={5}>★★★★★</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap">
            <Upload className="w-4 h-4" /> Import
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((r) => (
          <div key={r.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
            {r.imageUrl && (
              <div className="h-32 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">{r.title}</h3>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 shrink-0"><ExternalLink className="w-4 h-4" /></a>
              </div>
              {r.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</p>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{r.category}</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(r.id, s === r.rating ? 0 : s)}
                      className={`${s <= r.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"} hover:text-yellow-400 transition-colors`}>
                      <Star className="w-3 h-3 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => toggleFeatured(r.id, r.featured)}
                  className={`text-xs font-medium ${r.featured ? "text-blue-500" : "text-gray-400"} hover:text-blue-600 transition-colors`}>
                  {r.featured ? "Featured" : "Set Featured"}
                </button>
                <button onClick={() => handleDelete(r.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Remove</button>
              </div>
            </div>
          </div>
        ))}
        {recipes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No recipes yet. Add your first recipe bookmark!</p>
          </div>
        )}
      </div>
    </div>
  );
}
