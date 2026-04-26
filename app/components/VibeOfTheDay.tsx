"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { generateVibeMessage, getVibeState, saveVibeState } from "@/app/actions";

const VIBE_EVENT = "vibeRefreshIntervalChanged";

interface VibeOfTheDayProps {
  vibeRefreshInterval: number;
}

function isCacheValid(generatedAt: Date | null, intervalMs: number): boolean {
  if (intervalMs === 0) return false;
  if (!generatedAt) return false;
  return Date.now() - generatedAt.getTime() < intervalMs;
}

export default function VibeOfTheDay({ vibeRefreshInterval: initialInterval }: VibeOfTheDayProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [vibeInterval, setVibeInterval] = useState(initialInterval);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAndSave = useCallback(async () => {
    setLoading(true);
    const result = await generateVibeMessage();
    await saveVibeState(result);
    setMessage(result);
    setLoading(false);
  }, []);

  const clearScheduledRefresh = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback((intervalMs: number) => {
    clearScheduledRefresh();
    if (intervalMs > 0) {
      timerRef.current = setInterval(() => {
        fetchAndSave();
      }, intervalMs);
    }
  }, [clearScheduledRefresh, fetchAndSave]);

  useEffect(() => {
    setVibeInterval(initialInterval);
  }, [initialInterval]);

  useEffect(() => {
    const intervalMs = vibeInterval;
    const init = async () => {
      const state = await getVibeState();
      if (isCacheValid(state.generatedAt, intervalMs) && state.message) {
        setMessage(state.message);
        setLoading(false);
      } else {
        fetchAndSave();
      }
    };
    init();

    scheduleRefresh(intervalMs);

    const handler = (e: CustomEvent) => {
      clearScheduledRefresh();
      const ms = (e as CustomEvent<number>).detail;
      setVibeInterval(ms);
      if (ms > 0) {
        timerRef.current = setInterval(() => {
          fetchAndSave();
        }, ms);
      }
    };

    document.addEventListener(VIBE_EVENT, handler as EventListener);
    return () => {
      clearScheduledRefresh();
      document.removeEventListener(VIBE_EVENT, handler as EventListener);
    };
  }, [fetchAndSave, scheduleRefresh, clearScheduledRefresh, vibeInterval]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <span className="text-xl">✨</span>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">Current Vibe</h2>
        <button
          onClick={fetchAndSave}
          disabled={loading}
          className="ml-auto text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-full transition disabled:opacity-50"
          aria-label="Refresh vibe message"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {loading && message === null ? (
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm">Setting the vibe...</span>
          </div>
        ) : message ? (
          <p className="text-center text-gray-700 dark:text-gray-200 text-lg leading-relaxed">
            {message}
          </p>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center">
            Configure your local AI in Settings to get uplifting vibes! ✨
          </p>
        )}
      </div>
    </div>
  );
}