"use client";

import { useEffect, useRef, useState } from "react";

interface RecipeResult {
  id: number;
  title: string;
  url: string;
  imageUrl: string;
}

interface RecipeAutocompleteProps {
  query: string;
  onSelect: (recipe: RecipeResult) => void;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function RecipeAutocomplete({ query, onSelect, onClose, inputRef }: RecipeAutocompleteProps) {
  const [results, setResults] = useState<RecipeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/recipes?search=${encodeURIComponent(query)}&limit=8`, { signal: controller.signal });
        const data = await res.json();
        setResults(data.rows ?? []);
        setSelectedIndex(0);
      } catch { if (!controller.signal.aborted) setResults([]); }
      setLoading(false);
    }, 200);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (results.length === 0) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && results[selectedIndex]) { e.preventDefault(); onSelect(results[selectedIndex]); }
      else if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [results, selectedIndex, onSelect, onClose]);

  if (!query.trim() || (results.length === 0 && !loading)) return null;

  return (
    <div ref={dropdownRef} className="absolute z-50 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
      {loading ? (
        <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">Searching recipes…</div>
      ) : results.length === 0 ? (
        <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 italic">No recipes found</div>
      ) : (
        results.map((recipe, i) => (
          <button key={recipe.id} onClick={() => onSelect(recipe)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
              i === selectedIndex ? "bg-blue-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}>
            {recipe.imageUrl && <img src={recipe.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{recipe.title}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{recipe.url}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
