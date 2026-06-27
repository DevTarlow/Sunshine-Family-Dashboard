"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";

interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
}

export default function ErrorToast({ message, onDismiss, duration = 5000 }: ErrorToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }} className="ml-2 hover:text-red-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
