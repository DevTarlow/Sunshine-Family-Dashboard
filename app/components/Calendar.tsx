"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Save, Trash2, Pencil } from "lucide-react";
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/app/actions";
import CelebrationToast from "./CelebrationToast";
import MemberBadge from "./MemberBadge";

const COLORS = [
  { key: "blue", tw: "bg-blue-500" },
  { key: "red", tw: "bg-red-500" },
  { key: "green", tw: "bg-green-500" },
  { key: "purple", tw: "bg-purple-500" },
  { key: "orange", tw: "bg-orange-500" },
  { key: "pink", tw: "bg-pink-500" },
  { key: "yellow", tw: "bg-yellow-500" },
  { key: "teal", tw: "bg-teal-500" },
  { key: "indigo", tw: "bg-indigo-500" },
  { key: "cyan", tw: "bg-cyan-500" },
  { key: "amber", tw: "bg-amber-500" },
  { key: "rose", tw: "bg-rose-500" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDateLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrev = new Date(year, month - 1, 0).getDate();
  const cells: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    cells.push({ day: d, isCurrentMonth: false, date: new Date(year, month - 2, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isCurrentMonth: true, date: new Date(year, month - 1, d) });
  }
  while (cells.length < 42) {
    const nextDay = cells.length - firstDay - daysInMonth + 1;
    cells.push({ day: nextDay, isCurrentMonth: false, date: new Date(year, month, nextDay) });
  }
  return cells;
}

function eventDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState(toDateInputValue(today));
  const [formTime, setFormTime] = useState("");
  const [formColor, setFormColor] = useState("blue");

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editColor, setEditColor] = useState("");

  useEffect(() => {
    getCalendarEvents(year, month).then(setEvents).catch(() => setEvents([]));
  }, [year, month]);

  function goToPrevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function goToNextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const eventsByDate = new Map<string, any[]>();
  for (const e of events) {
    const d = new Date(e.eventDate);
    const key = eventDateKey(d);
    if (!eventsByDate.has(key)) eventsByDate.set(key, []);
    eventsByDate.get(key)!.push(e);
  }

  const selectedKey = selectedDate ? eventDateKey(selectedDate) : null;
  const selectedEvents = selectedKey ? eventsByDate.get(selectedKey) ?? [] : [];

  function resetForm() {
    setFormTitle(""); setFormDescription(""); setFormDate(toDateInputValue(new Date()));
    setFormTime(""); setFormColor("blue"); setIsAdding(false);
  }

  async function handleAdd() {
    if (!formTitle.trim()) return;
    await createCalendarEvent(formTitle, formDescription, formDate, formTime, formColor);
    setCelebration(`Added "${formTitle}" to the calendar!`);
    resetForm();
    getCalendarEvents(year, month).then(setEvents).catch(() => {});
  }

  function startEdit(e: any) {
    setEditingId(e.id); setEditTitle(e.title); setEditDescription(e.description);
    setEditDate(toDateInputValue(new Date(e.eventDate))); setEditTime(e.eventTime); setEditColor(e.color);
  }

  async function handleSaveEdit(id: number) {
    if (!editTitle.trim()) return;
    await updateCalendarEvent(id, editTitle, editDescription, editDate, editTime, editColor);
    setEditingId(null);
    getCalendarEvents(year, month).then(setEvents).catch(() => {});
  }

  async function handleDelete(id: number) {
    await deleteCalendarEvent(id);
    getCalendarEvents(year, month).then(setEvents).catch(() => {});
  }

  const grid = getMonthGrid(year, month);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={goToPrevMonth} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Previous month">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{MONTH_NAMES[month - 1]} {year}</h2>
          <button onClick={goToNextMonth} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Next month">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, i) => {
            const key = eventDateKey(cell.date);
            const dayEvents = eventsByDate.get(key) ?? [];
            const isToday = cell.date.getFullYear() === today.getFullYear() && cell.date.getMonth() === today.getMonth() && cell.date.getDate() === today.getDate();
            const isSelected = selectedDate && key === eventDateKey(selectedDate);
            return (
              <button key={i} onClick={() => { setSelectedDate(cell.date); setFormDate(toDateInputValue(cell.date)); }}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors ${
                  !cell.isCurrentMonth ? "text-gray-400 dark:text-gray-600"
                  : isSelected ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300"
                  : isToday ? "ring-2 ring-blue-500 text-gray-800 dark:text-gray-100"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span className="text-xs">{cell.day}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((ev: any) => (
                      <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${COLORS.find(c => c.key === ev.color)?.tw ?? "bg-blue-500"}`} />
                    ))}
                    {dayEvents.length > 3 && <span className="text-[8px] text-gray-500">+{dayEvents.length - 3}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {isAdding ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">New Event</h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <input type="text" placeholder="Event title *" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <div className="flex gap-3">
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <textarea placeholder="Description (optional)" value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Color:</span>
                <div className="flex gap-1.5">
                  {COLORS.map((c) => (
                    <button key={c.key} onClick={() => setFormColor(c.key)}
                      className={`w-5 h-5 rounded-full ${c.tw} transition-transform ${formColor === c.key ? "ring-2 ring-gray-400 scale-125" : "hover:scale-110"}`} title={c.key} />
                  ))}
                </div>
              </div>
              <button onClick={handleAdd} disabled={!formTitle.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition">
                <Plus className="w-4 h-4" /> Add Event
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add Event
            </button>
          )}
        </div>
      </div>

      {selectedDate && (
        <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Events for {formatDateLabel(selectedDate)}</h3>
          {selectedEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No events for this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((ev: any) => {
                const isEditing = editingId === ev.id;
                const colorTw = COLORS.find(c => c.key === (isEditing ? editColor : ev.color))?.tw ?? "bg-blue-500";
                if (isEditing) {
                  return (
                    <div key={ev.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      <div className="flex gap-3">
                        <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>
                      <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Color:</span>
                        <div className="flex gap-1.5">
                          {COLORS.map((c) => (
                            <button key={c.key} onClick={() => setEditColor(c.key)}
                              className={`w-5 h-5 rounded-full ${c.tw} transition-transform ${editColor === c.key ? "ring-2 ring-gray-400 scale-125" : "hover:scale-110"}`} title={c.key} />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Cancel</button>
                        <button onClick={() => handleSaveEdit(ev.id)} disabled={!editTitle.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition">
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={ev.id} className="group flex items-start gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600/50 transition-colors">
                    <span className={`w-3 h-3 rounded-full mt-1 shrink-0 ${colorTw}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-gray-100 text-sm">{ev.title}</span>
                        {ev.eventTime && <span className="text-xs text-gray-500">{formatTime(ev.eventTime)}</span>}
                      </div>
                      {ev.description && <p className="text-xs text-gray-500 mt-0.5">{ev.description}</p>}
                      {ev.member && <div className="mt-1.5"><MemberBadge member={ev.member} /></div>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => startEdit(ev)} className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Edit event">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-md text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Delete event">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <CelebrationToast message={celebration} onDismiss={() => setCelebration(null)} />
    </div>
  );
}
