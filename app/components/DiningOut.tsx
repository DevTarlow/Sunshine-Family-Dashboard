"use client";

import { useState, useEffect, useRef } from "react";
import { Utensils, Plus, Trash2, Pencil, Check, X, MessageSquare } from "lucide-react";
import {
  addDiningOutEntry,
  updateDiningOutEntry,
  deleteDiningOutEntry,
  markSectionRead,
  generateCelebration,
} from "@/app/actions";
import CelebrationToast from "./CelebrationToast";
import MemberBadge from "./MemberBadge";
import CommentThread from "./CommentThread";

interface Member {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

interface DiningOutEntry {
  id: number;
  amount: number;
  description: string;
  date: string | Date;
  member: Member | null;
}

interface DiningOutProps {
  initialEntries: DiningOutEntry[];
  unreadCount: number;
}

export default function DiningOut({ initialEntries, unreadCount }: DiningOutProps) {
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [openCommentEntryId, setOpenCommentEntryId] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [markedRead, setMarkedRead] = useState(false);

  useEffect(() => {
    if (!sectionRef.current || unreadCount === 0 || markedRead) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMarkedRead(true);
          markSectionRead("diningOut");
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [unreadCount, markedRead]);

  const total = initialEntries.reduce((sum, e) => sum + e.amount, 0);

  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysElapsed = now.getDate();
  const avgPerDay = daysElapsed > 0 ? total / daysElapsed : 0;

  const memberTotalsMap = new Map<string, { member: Member | null; subtotal: number }>();
  for (const entry of initialEntries) {
    const key = entry.member ? String(entry.member.id) : "__unattributed__";
    if (!memberTotalsMap.has(key)) {
      memberTotalsMap.set(key, { member: entry.member, subtotal: 0 });
    }
    memberTotalsMap.get(key)!.subtotal += entry.amount;
  }
  const memberTotals = Array.from(memberTotalsMap.values()).sort(
    (a, b) => b.subtotal - a.subtotal
  );

  async function handleAdd() {
    const amount = parseFloat(newAmount);
    if (!newDescription.trim() || isNaN(amount) || amount <= 0) return;
    const description = newDescription.trim();
    setIsAdding(true);
    await addDiningOutEntry(amount, description);
    setNewDescription("");
    setNewAmount("");
    setIsAdding(false);
    generateCelebration(`the family just logged a dining out expense: ${description}`).then((msg) => {
      if (msg) setCelebration(msg);
    });
  }

  async function handleSaveEdit(id: number) {
    const amount = parseFloat(editAmount);
    if (!editDescription.trim() || isNaN(amount) || amount <= 0) return;
    await updateDiningOutEntry(id, amount, editDescription.trim());
    setEditingId(null);
  }

  function startEdit(entry: DiningOutEntry) {
    setEditingId(entry.id);
    setEditDescription(entry.description);
    setEditAmount(String(entry.amount));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDescription("");
    setEditAmount("");
  }

  return (
    <>
      <CelebrationToast message={celebration} onDismiss={() => setCelebration(null)} />
      <div ref={sectionRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Utensils className="text-orange-500" size={22} />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Dining Out</h2>
        {unreadCount > 0 && !markedRead && (
          <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{monthLabel}</p>

      {/* Running Total */}
      <div className="bg-orange-50 dark:bg-gray-700 rounded-lg p-4 mb-5 text-center">
        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wide mb-1">
          Month Total
        </p>
        <p className="text-4xl font-bold text-orange-500">
          ${total.toFixed(2)}
        </p>
        <p className="text-xs text-orange-400 dark:text-orange-500 mt-1">
          ~${avgPerDay.toFixed(2)} / day avg ({daysElapsed} day{daysElapsed !== 1 ? "s" : ""} so far)
        </p>

        {memberTotals.length > 0 && (
          <>
            <div className="border-t border-orange-100 dark:border-gray-600 my-3" />
            <div className="space-y-1.5">
              {memberTotals.map(({ member, subtotal }, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  {member ? (
                    <MemberBadge member={member} />
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">Unattributed</span>
                  )}
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Where / what (e.g. Chipotle)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          className="flex-1 min-w-0 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <input
          type="number"
          placeholder="$0.00"
          value={newAmount}
          min="0"
          step="0.01"
          onChange={(e) => setNewAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          className="w-24 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <button
          onClick={handleAdd}
          disabled={isAdding}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-md px-3 py-2 transition-colors flex-shrink-0"
          aria-label="Add entry"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Entry List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {initialEntries.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 italic text-sm py-4">
            No entries this month
          </p>
        ) : (
          initialEntries.map((entry) =>
            editingId === entry.id ? (
              /* Edit Row */
              <div
                key={entry.id}
                className="flex gap-2 items-center bg-orange-50 dark:bg-gray-700 border border-orange-200 dark:border-gray-600 rounded-md p-2"
              >
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(entry.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="flex-1 min-w-0 border border-orange-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  autoFocus
                />
                <input
                  type="number"
                  value={editAmount}
                  min="0"
                  step="0.01"
                  onChange={(e) => setEditAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(entry.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="w-24 border border-orange-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <button
                  onClick={() => handleSaveEdit(entry.id)}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 flex-shrink-0"
                  aria-label="Save"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex-shrink-0"
                  aria-label="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              /* Display Row */
              <div
                key={entry.id}
                className="border border-gray-100 dark:border-gray-700 rounded-md px-3 py-2 group hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-100 truncate">
                      {entry.description || "—"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <MemberBadge member={entry.member} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 flex-shrink-0">
                    ${entry.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() =>
                      setOpenCommentEntryId((prev) => (prev === entry.id ? null : entry.id))
                    }
                    className="text-gray-300 dark:text-gray-600 hover:text-blue-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    aria-label="Comments"
                    title="Comments"
                  >
                    <MessageSquare size={14} />
                  </button>
                  <button
                    onClick={() => startEdit(entry)}
                    className="text-gray-300 dark:text-gray-600 hover:text-orange-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteDiningOutEntry(entry.id)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {openCommentEntryId === entry.id && (
                  <CommentThread parentType="diningOut" parentId={entry.id} />
                )}
              </div>
            )
          )
        )}
      </div>
      </div>
    </>
  );
}
