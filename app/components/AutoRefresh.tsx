"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useCallback } from "react";

interface AutoRefreshProps {
  autoRefreshInterval: number;
}

const REFRESH_EVENT = "refreshIntervalChanged";

export default function AutoRefresh({ autoRefreshInterval }: AutoRefreshProps) {
  const router = useRouter();
  const intervalRef = useRef(autoRefreshInterval);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRefreshTimer = useCallback((interval: number) => {
    clearRefreshTimer();
    if (interval > 0) {
      timerRef.current = setInterval(() => {
        if (!document.hidden) {
          router.refresh();
        }
      }, interval);
    }
  }, [clearRefreshTimer, router]);

  useEffect(() => {
    intervalRef.current = autoRefreshInterval;
    startRefreshTimer(autoRefreshInterval);
  }, [autoRefreshInterval, startRefreshTimer]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        router.refresh();
      }
    };

    const handleIntervalChange = (e: Event) => {
      const custom = e as CustomEvent;
      const newInterval = custom.detail;
      intervalRef.current = newInterval;
      startRefreshTimer(newInterval);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener(REFRESH_EVENT, handleIntervalChange);

    return () => {
      clearRefreshTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener(REFRESH_EVENT, handleIntervalChange);
    };
  }, [router, clearRefreshTimer, startRefreshTimer]);

  return null;
}