"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { getVibeQuote } from "@/app/actions";

const FALLBACK_QUOTE = "Every day is a fresh start.";

function todayKey(): string {
  const d = new Date();
  return `vibe-quote-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function VibeOfTheDay() {
  const [quote, setQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchQuote() {
    setLoading(true);
    const cached = localStorage.getItem(todayKey());
    if (cached) {
      setQuote(cached);
      setLoading(false);
      return;
    }
    const result = await getVibeQuote();
    const q = result || FALLBACK_QUOTE;
    setQuote(q);
    localStorage.setItem(todayKey(), q);
    setLoading(false);
  }

  useEffect(() => {
    fetchQuote();
  }, []);

  async function handleRefresh() {
    localStorage.removeItem(todayKey());
    await fetchQuote();
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">Vibe of the Day</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="New quote"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {loading && !quote ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Finding today&apos;s vibe...</p>
          </div>
        ) : (
          <blockquote className="text-center">
            <p className="text-xl md:text-2xl font-serif font-medium text-gray-800 dark:text-gray-100 leading-relaxed italic">
              &ldquo;{quote}&rdquo;
            </p>
          </blockquote>
        )}
      </div>
    </div>
  );
}
