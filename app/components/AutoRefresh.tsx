"use client";

import { useRouter } from "next/navigation";
import { useEffect, startTransition } from "react";

const REFRESH_INTERVAL_MS = 30_000;

export default function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) {
        startTransition(() => {
          router.refresh();
        });
      }
    };

    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);

    // Refresh immediately when the tab becomes visible again after being hidden
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        startTransition(() => {
          router.refresh();
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
