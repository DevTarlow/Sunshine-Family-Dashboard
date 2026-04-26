"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, Moon, Sun, Bell, Info, Camera, Brain, Sparkles, Cloud } from "lucide-react";
import { updateMemberTheme, updateNotificationsEnabled, updateCamUrl, getLLMConfig, updateLLMConfig, getWeatherSettings, updateWeatherSettings, updateAutoRefreshInterval, updateVibeRefreshInterval, getMemberRefreshSettings, resetDatabase } from "@/app/actions";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: "light" | "dark";
  notificationsEnabled: boolean;
  camUrl: string | null;
  autoRefreshInterval: number;
  vibeRefreshInterval: number;
}

const REFRESH_INTERVALS = [
  { label: "30 seconds", value: 30000 },
  { label: "1 minute", value: 60000 },
  { label: "5 minutes", value: 300000 },
  { label: "15 minutes", value: 900000 },
  { label: "30 minutes", value: 1800000 },
  { label: "Never", value: 0 },
];

const VIBE_INTERVALS = [
  { label: "Every page load", value: 0 },
  { label: "Every 5 minutes", value: 300000 },
  { label: "Every hour", value: 3600000 },
  { label: "Every 6 hours", value: 21600000 },
  { label: "Daily", value: 86400000 },
];

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  currentTheme, 
  notificationsEnabled: initialNotificationsEnabled,
  camUrl: initialCamUrl,
  autoRefreshInterval: initialAutoRefreshInterval,
  vibeRefreshInterval: initialVibeRefreshInterval,
}: SettingsModalProps) {
  const [refreshInterval, setRefreshInterval] = useState(initialAutoRefreshInterval);
  const [vibeRefreshInterval, setVibeRefreshInterval] = useState(initialVibeRefreshInterval);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialNotificationsEnabled);
  const [camUrl, setCamUrl] = useState(initialCamUrl || "");
  const [llmServerUrl, setLlmServerUrl] = useState("");
  const [llmModel, setLlmModel] = useState("");
  const [weatherApiKey, setWeatherApiKey] = useState("");
  const [weatherCity, setWeatherCity] = useState("");
  const [weatherUnits, setWeatherUnits] = useState("imperial");

  useEffect(() => {
    if (!isOpen) return;
    setRefreshInterval(initialAutoRefreshInterval);
    setVibeRefreshInterval(initialVibeRefreshInterval);
    setNotificationsEnabled(initialNotificationsEnabled);
    setCamUrl(initialCamUrl || "");
    const loadLLMConfig = async () => {
      const config = await getLLMConfig();
      setLlmServerUrl(config.serverUrl || "");
      setLlmModel(config.model || "");
    };
    const loadWeatherSettings = async () => {
      const settings = await getWeatherSettings();
      setWeatherApiKey(settings.apiKey || "");
      setWeatherCity(settings.city || "");
      setWeatherUnits(settings.units || "imperial");
    };
    loadLLMConfig();
    loadWeatherSettings();
  }, [isOpen, initialAutoRefreshInterval, initialVibeRefreshInterval, initialNotificationsEnabled, initialCamUrl]);

  const handleRefreshIntervalChange = async (value: number) => {
    setRefreshInterval(value);
    window.dispatchEvent(new CustomEvent("refreshIntervalChanged", { detail: value }));
    const formData = new FormData();
    formData.append("interval", value.toString());
    await updateAutoRefreshInterval(formData);
  };

  const handleVibeRefreshIntervalChange = async (value: number) => {
    setVibeRefreshInterval(value);
    window.dispatchEvent(new CustomEvent("vibeRefreshIntervalChanged", { detail: value }));
    const formData = new FormData();
    formData.append("interval", value.toString());
    await updateVibeRefreshInterval(formData);
  };

  const handleNotificationsToggle = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    const formData = new FormData();
    formData.append("enabled", newValue.toString());
    await updateNotificationsEnabled(formData);
  };

  const handleCamUrlSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get("camUrl") as string;
    window.dispatchEvent(new CustomEvent("camUrlChanged", { detail: { camUrl: url } }));
    await updateCamUrl(formData);
  };

  const handleLLMConfigSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateLLMConfig(formData);
    const config = await getLLMConfig();
    setLlmServerUrl(config.serverUrl || "");
    setLlmModel(config.model || "");
  };

  const handleWeatherSettingsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateWeatherSettings(formData);
    const settings = await getWeatherSettings();
    setWeatherApiKey(settings.apiKey || "");
    setWeatherCity(settings.city || "");
    setWeatherUnits(settings.units || "imperial");
  };

  const handleResetReadStates = () => {
    if (confirm("Reset all read states? This will mark all sections as unread.")) {
      console.log("Reset read states");
    }
  };

  const handleResetDatabase = async () => {
    if (confirm("Are you sure you want to RESET THE DATABASE? This will delete ALL data (dinners, todos, groceries, notes, photos, members, everything) and cannot be undone!")) {
      if (confirm("WARNING: This will delete EVERYTHING. Are you absolutely sure? Type 'yes' to confirm.")) {
        await resetDatabase();
      }
    }
  };

  const handleClearLocalStorage = () => {
    if (confirm("Clear stored refresh settings? This will reset auto-refresh and vibe refresh intervals.")) {
      localStorage.removeItem("autoRefreshInterval");
      localStorage.removeItem("vibeRefreshInterval");
      setRefreshInterval(30000);
      setVibeRefreshInterval(0);
      window.dispatchEvent(new CustomEvent("refreshIntervalChanged", { detail: 30000 }));
      window.dispatchEvent(new CustomEvent("vibeRefreshIntervalChanged", { detail: 0 }));
    }
  };

  if (!isOpen) return null;


  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal panel */}
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Settings</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ── Appearance ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Appearance
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Theme: <span className="font-medium capitalize">{currentTheme}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Theme is set per profile in the profile modal.
                </p>
              </div>
            </section>

            {/* ── Notifications ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </h3>
              <label className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-4 cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">Enable notifications</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={handleNotificationsToggle}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${notificationsEnabled ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notificationsEnabled ? "translate-x-5" : "translate-x-0.5"} mt-0.5`} />
                  </div>
                </div>
              </label>
            </section>

            {/* ── Auto-Refresh ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Auto-Refresh
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Dashboard refresh interval</p>
                <div className="flex flex-wrap gap-2">
                  {REFRESH_INTERVALS.map((interval) => (
                    <button
                      key={interval.value}
                      type="button"
                      onClick={() => handleRefreshIntervalChange(interval.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        refreshInterval === interval.value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {interval.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Vibe Refresh ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Vibe of the Day
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Auto-refresh interval</p>
                <div className="flex flex-wrap gap-2">
                  {VIBE_INTERVALS.map((interval) => (
                    <button
                      key={interval.value}
                      type="button"
                      onClick={() => handleVibeRefreshIntervalChange(interval.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        vibeRefreshInterval === interval.value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {interval.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Camera URL ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Camera URL
              </h3>
              <form onSubmit={handleCamUrlSubmit} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <div>
                  <label htmlFor="camUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Custom Camera URL (optional)
                  </label>
                  <input
                    type="url"
                    id="camUrl"
                    name="camUrl"
                    defaultValue={camUrl}
                    placeholder="https://example.com/cam"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Save Camera URL
                </button>
              </form>
            </section>

            {/* ── AI Configuration ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Configuration
              </h3>
              <form onSubmit={handleLLMConfigSubmit} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <div>
                  <label htmlFor="llmServerUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Local LLM Server URL
                  </label>
                  <input
                    type="url"
                    id="llmServerUrl"
                    name="serverUrl"
                    defaultValue={llmServerUrl}
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="llmModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Model Name
                  </label>
                  <input
                    type="text"
                    id="llmModel"
                    name="model"
                    defaultValue={llmModel}
                    placeholder="llama3.2"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Save AI Config
                </button>
              </form>
            </section>

            {/* ── Weather Configuration ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Weather Configuration
              </h3>
              <form onSubmit={handleWeatherSettingsSubmit} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <div>
                  <label htmlFor="weatherApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    OpenWeatherMap API Key
                  </label>
                  <input
                    type="text"
                    id="weatherApiKey"
                    name="apiKey"
                    defaultValue={weatherApiKey}
                    placeholder="your-api-key"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="weatherCity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      id="weatherCity"
                      name="city"
                      defaultValue={weatherCity}
                      placeholder="gresham"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="weatherUnits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Units
                    </label>
                    <select
                      id="weatherUnits"
                      name="units"
                      defaultValue={weatherUnits}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="imperial">Imperial (°F)</option>
                      <option value="metric">Metric (°C)</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Save Weather Settings
                </button>
              </form>
            </section>

            {/* ── Data & Reset ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Data & Reset
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <button
                  type="button"
                  onClick={handleResetDatabase}
                  className="w-full px-4 py-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-800 dark:text-red-300 rounded-lg font-medium transition-colors text-left"
                >
                  Reset database
                  <p className="text-sm text-red-600 dark:text-red-400/80 mt-0.5">
                    Delete ALL data and start fresh
                  </p>
                </button>
                <button
                  type="button"
                  onClick={handleClearLocalStorage}
                  className="w-full px-4 py-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-800 dark:text-red-300 rounded-lg font-medium transition-colors text-left"
                >
                  Clear stored refresh settings
                  <p className="text-sm text-red-600 dark:text-red-400/80 mt-0.5">
                    Reset auto-refresh and vibe refresh intervals
                  </p>
                </button>
              </div>
            </section>

            {/* ── About ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">About</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Sunshine Family Dashboard</strong> — a local Next.js web app for family sharing.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Version 1.0.0 • Built with Next.js, React, Tailwind CSS, and Prisma.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Weather data provided by OpenWeatherMap. AI features powered by your local LLM.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Close on Escape */}
      <EscapeHandler isOpen={isOpen} onClose={onClose} />
    </>
  );
}

function EscapeHandler({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return null;
}