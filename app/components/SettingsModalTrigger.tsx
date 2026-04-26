"use client";

import { useState } from "react";
import SettingsModal from "./SettingsModal";
import { Settings } from "lucide-react";

interface SettingsModalTriggerProps {
  currentTheme: "light" | "dark";
  notificationsEnabled: boolean;
  camUrl: string | null;
  autoRefreshInterval: number;
  vibeRefreshInterval: number;
}

export default function SettingsModalTrigger({ 
  currentTheme, 
  notificationsEnabled,
  camUrl,
  autoRefreshInterval,
  vibeRefreshInterval,
}: SettingsModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Open settings"
        aria-label="Settings"
      >
        <Settings size={16} />
      </button>
      <SettingsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentTheme={currentTheme}
        notificationsEnabled={notificationsEnabled}
        camUrl={camUrl}
        autoRefreshInterval={autoRefreshInterval}
        vibeRefreshInterval={vibeRefreshInterval}
      />
    </>
  );
}