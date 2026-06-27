"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, Moon, Sun, Bell, Info, Camera, Brain, Eye, EyeOff, Palette } from "lucide-react";
import { updateMemberTheme, updateNotificationsEnabled, updateCamUrl, getLLMConfig, updateLLMConfig, getProfileData, updateMemberPanelVisibility, updateMemberAccentColor } from "@/app/actions";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: "light" | "dark";
  notificationsEnabled: boolean;
}

const REFRESH_INTERVALS = [
  { label: "30 seconds", value: 30000 },
  { label: "1 minute", value: 60000 },
  { label: "5 minutes", value: 300000 },
  { label: "15 minutes", value: 900000 },
  { label: "30 minutes", value: 1800000 },
  { label: "Never", value: 0 },
];

const ACCENT_COLORS = [
  { key: "blue", label: "Blue", tw: "bg-blue-500" },
  { key: "red", label: "Red", tw: "bg-red-500" },
  { key: "green", label: "Green", tw: "bg-green-500" },
  { key: "purple", label: "Purple", tw: "bg-purple-500" },
  { key: "orange", label: "Orange", tw: "bg-orange-500" },
  { key: "pink", label: "Pink", tw: "bg-pink-500" },
  { key: "yellow", label: "Yellow", tw: "bg-yellow-500" },
  { key: "teal", label: "Teal", tw: "bg-teal-500" },
  { key: "indigo", label: "Indigo", tw: "bg-indigo-500" },
  { key: "cyan", label: "Cyan", tw: "bg-cyan-500" },
  { key: "amber", label: "Amber", tw: "bg-amber-500" },
  { key: "rose", label: "Rose", tw: "bg-rose-500" },
];

const ALL_PANELS = [
  { key: "vibeOfTheDay", label: "Vibe of the Day", icon: <Sun className="w-4 h-4" /> },
  { key: "weather", label: "Weather", icon: <CloudIcon /> },
  { key: "cannonBeachCam", label: "Cannon Beach Cam", icon: <Camera className="w-4 h-4" /> },
  { key: "carousel", label: "Photo Carousel", icon: <ImageIcon /> },
  { key: "calendarWidget", label: "Calendar", icon: <CalendarIcon /> },
  { key: "fitnessTracker", label: "Fitness Tracker", icon: <DumbbellIcon /> },
  { key: "diningOut", label: "Dining Out", icon: <UtensilsIcon /> },
  { key: "todoList", label: "Todo List", icon: <CheckSquareIcon /> },
  { key: "groceryList", label: "Grocery List", icon: <ShoppingBagIcon /> },
  { key: "notes", label: "Notes", icon: <MessageSquareIcon /> },
  { key: "mealPrepFridge", label: "Meal Prep Fridge", icon: <SoupIcon /> },
  { key: "linkBoard", label: "Shared Links", icon: <LinkIcon /> },
];

function CloudIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>; }
function ImageIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function CalendarIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function DumbbellIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>; }
function UtensilsIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>; }
function CheckSquareIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>; }
function ShoppingBagIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>; }
function MessageSquareIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>; }
function SoupIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>; }
function LinkIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>; }

export default function SettingsModal({ isOpen, onClose, currentTheme, notificationsEnabled: initialNotificationsEnabled }: SettingsModalProps) {
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialNotificationsEnabled);
  const [camUrl, setCamUrl] = useState("");
  const [llmServerUrl, setLlmServerUrl] = useState("");
  const [llmModel, setLlmModel] = useState("");
  const [aiProvider, setAiProvider] = useState<"local" | "gemini">("local");
  const [currentAccent, setCurrentAccent] = useState("blue");
  const [visiblePanels, setVisiblePanels] = useState<Set<string>>(new Set(ALL_PANELS.map(p => p.key)));

  useEffect(() => {
    if (!isOpen) return;
    const savedInterval = localStorage.getItem("autoRefreshInterval");
    if (savedInterval) setRefreshInterval(parseInt(savedInterval, 10));
    const savedCamUrl = localStorage.getItem("camUrl");
    if (savedCamUrl) setCamUrl(savedCamUrl);
    const loadLLMConfig = async () => {
      const config = await getLLMConfig();
      setLlmServerUrl(config.serverUrl || "");
      setLlmModel(config.model || "");
      setAiProvider(config.aiProvider || "local");
    };
    loadLLMConfig();
    getProfileData().then((data: any) => {
      if (data?.panelVisibility) {
        setVisiblePanels(new Set(data.panelVisibility));
      }
      if (data?.stats) {
        // accent color comes from the member in profileData
      }
    }).catch(() => {});
  }, [isOpen]);

  const handleRefreshIntervalChange = (value: number) => {
    setRefreshInterval(value);
    localStorage.setItem("autoRefreshInterval", value.toString());
    window.dispatchEvent(new CustomEvent("refreshIntervalChanged", { detail: value }));
  };

  const handleNotificationsToggle = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem("notificationsEnabled", newValue.toString());
    const formData = new FormData();
    formData.append("enabled", newValue.toString());
    await updateNotificationsEnabled(formData);
  };

  const handleCamUrlSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get("camUrl") as string;
    localStorage.setItem("camUrl", url);
    window.dispatchEvent(new CustomEvent("camUrlChanged", { detail: { camUrl: url } }));
    await updateCamUrl(formData);
  };

  const handleLLMConfigSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("aiProvider", aiProvider);
    await updateLLMConfig(formData);
    const config = await getLLMConfig();
    setLlmServerUrl(config.serverUrl || "");
    setLlmModel(config.model || "");
    setAiProvider(config.aiProvider || "local");
  };

  const handleAccentColorChange = async (accentColor: string) => {
    setCurrentAccent(accentColor);
    const formData = new FormData();
    formData.append("accentColor", accentColor);
    await updateMemberAccentColor(formData);
  };

  const handleTogglePanel = async (key: string) => {
    const next = new Set(visiblePanels);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setVisiblePanels(next);
    await updateMemberPanelVisibility(Array.from(next));
  };

  const handleClearLocalStorage = () => {
    if (confirm("Clear all local settings? This will reset your preferences.")) {
      localStorage.removeItem("autoRefreshInterval");
      localStorage.removeItem("notificationsEnabled");
      localStorage.removeItem("camUrl");
      setRefreshInterval(30000);
      setNotificationsEnabled(true);
      setCamUrl("");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full p-1.5 transition" aria-label="Close settings">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-6 space-y-8">
            {/* ── Appearance ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                {currentTheme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                Appearance
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-4">
                <form action={updateMemberTheme} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Theme</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark mode</p>
                  </div>
                  <input type="hidden" name="theme" value={currentTheme === "dark" ? "light" : "dark"} />
                  <button type="submit" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors">
                    Switch to {currentTheme === "dark" ? "Light" : "Dark"}
                  </button>
                </form>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-gray-500" />
                    <p className="font-medium text-gray-700 dark:text-gray-300">Accent Color</p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Choose your preferred accent color for the dashboard</p>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map((c) => (
                      <button key={c.key} onClick={() => handleAccentColorChange(c.key)}
                        className={`w-8 h-8 rounded-full ${c.tw} transition-transform ${currentAccent === c.key ? "ring-2 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-800 ring-gray-400 scale-110" : "hover:scale-110"}`}
                        title={c.label} aria-label={c.label} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Panel Visibility ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Widget Visibility
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Show or hide dashboard widgets</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_PANELS.map((panel) => {
                    const visible = visiblePanels.has(panel.key);
                    return (
                      <button key={panel.key} onClick={() => handleTogglePanel(panel.key)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          visible ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                        }`}>
                        <span className={visible ? "text-blue-500" : "text-gray-400"}>{visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</span>
                        {panel.icon}
                        {panel.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── Auto‑Refresh ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Auto‑Refresh
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Refresh interval</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">How often the dashboard automatically updates</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REFRESH_INTERVALS.map((interval) => (
                    <button key={interval.value} type="button" onClick={() => handleRefreshIntervalChange(interval.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        refreshInterval === interval.value ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}>
                      {interval.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Notifications ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4" /> Notifications
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Browser notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Show desktop notifications for new items</p>
                  </div>
                  <button type="button" onClick={handleNotificationsToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationsEnabled ? "bg-green-600" : "bg-gray-300 dark:bg-gray-600"}`}
                    aria-label={notificationsEnabled ? "Disable notifications" : "Enable notifications"}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            </section>

            {/* ── CAM URL ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4" /> Camera URL
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <form onSubmit={handleCamUrlSubmit} className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Camera URL</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Set a custom URL for the Cannon Beach Cam widget. Leave empty to use default.</p>
                    <input type="url" name="camUrl" value={camUrl} onChange={(e) => setCamUrl(e.target.value)}
                      placeholder="https://camera.example.com/latest.jpg"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Save URL</button>
                    <button type="button" onClick={async () => { setCamUrl(""); localStorage.removeItem("camUrl"); window.dispatchEvent(new CustomEvent("camUrlChanged", { detail: { camUrl: "" } })); const formData = new FormData(); formData.append("camUrl", ""); await updateCamUrl(formData); }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors">Reset to Default</button>
                  </div>
                </form>
              </div>
            </section>

            {/* ── AI Configuration ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4" /> AI Configuration
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <form onSubmit={handleLLMConfigSubmit} className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">AI Provider</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Choose between a local LLM server or Google Gemini for AI features.</p>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setAiProvider("local")}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors border-2 ${
                          aiProvider === "local"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}>
                        <div className="font-semibold">🧠 Local LLM</div>
                        <div className="text-xs mt-1 opacity-70">Ollama, LM Studio, etc.</div>
                      </button>
                      <button type="button" onClick={() => setAiProvider("gemini")}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors border-2 ${
                          aiProvider === "gemini"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}>
                        <div className="font-semibold">✨ Gemini AI</div>
                        <div className="text-xs mt-1 opacity-70">Google Gemini 2.5 Flash</div>
                      </button>
                    </div>
                    <input type="hidden" name="aiProvider" value={aiProvider} />
                  </div>

                  {aiProvider === "local" ? (
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Local LLM Server</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Configure your local LLM server for AI features.</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Server URL</label>
                          <input type="url" name="serverUrl" value={llmServerUrl} onChange={(e) => setLlmServerUrl(e.target.value)} placeholder="http://localhost:11434"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model Name</label>
                          <input type="text" name="model" value={llmModel} onChange={(e) => setLlmModel(e.target.value)} placeholder="llama3.2"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Gemini Configuration</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Uses the <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">GEMINI_API_KEY</code> environment variable.
                        Model: <strong>gemini-2.5-flash</strong>.
                      </p>
                      <input type="hidden" name="serverUrl" value="" />
                      <input type="hidden" name="model" value={llmModel} />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Save AI Configuration</button>
                    <button type="button" onClick={async () => { setLlmServerUrl(""); setLlmModel(""); setAiProvider("local"); const formData = new FormData(); formData.append("serverUrl", ""); formData.append("model", ""); formData.append("aiProvider", "local"); await updateLLMConfig(formData); }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors">Clear Configuration</button>
                  </div>
                </form>
              </div>
            </section>

            {/* ── Data & Reset ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" /> Data & Reset
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <button type="button" onClick={handleClearLocalStorage}
                  className="w-full px-4 py-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-800 dark:text-red-300 rounded-lg font-medium transition-colors text-left">
                  Clear local settings
                  <p className="text-sm text-red-600 dark:text-red-400/80 mt-0.5">Reset all preferences stored in your browser</p>
                </button>
              </div>
            </section>

            {/* ── About ── */}
            <section>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">About</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-gray-700 dark:text-gray-300"><strong>Sunshine Family Dashboard</strong> — a local Next.js web app for family sharing.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Version 1.0.0 • Built with Next.js, React, Tailwind CSS, and Prisma.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Weather data provided by OpenWeatherMap. AI features powered by your local LLM or Google Gemini.</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <EscapeHandler isOpen={isOpen} onClose={onClose} />
    </>
  );
}

function EscapeHandler({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);
  return null;
}
