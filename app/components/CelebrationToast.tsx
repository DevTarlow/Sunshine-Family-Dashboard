"use client";

import { useEffect } from "react";

interface CelebrationToastProps {
  message: string | null;
  onDismiss: () => void;
}

export default function CelebrationToast({ message, onDismiss }: CelebrationToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      onClick={onDismiss}
      className="fixed bottom-6 left-1/2 z-50 max-w-sm w-[90vw] cursor-pointer animate-slide-up"
    >
      <div className="bg-gradient-to-r from-yellow-400 to-amber-400 dark:from-yellow-500 dark:to-amber-500 text-gray-900 rounded-2xl shadow-xl px-5 py-4 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 leading-none mt-0.5">🎉</span>
        <p className="text-sm font-medium leading-snug">{message}</p>
      </div>
    </div>
  );
}
