"use client";

import { useState } from "react";
import {
  selectMember,
  createAndSelectMember,
  deleteMember,
} from "@/app/actions";
import { UserPlus, X, LogIn } from "lucide-react";

interface Member {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

interface LoginPageProps {
  members: Member[];
}

const EMOJIS = [
  "😊", "😄", "🌟", "🦋", "🌙", "🐶", "🐱", "🎨",
  "🎵", "🌸", "🌊", "🦁", "🐻", "🦊", "🐸", "🌺",
  "⭐", "🎯", "🍕", "🌈", "🦄", "🏆", "🎭", "🧡",
];

const COLOR_OPTIONS = [
  { key: "blue",   bg: "bg-blue-400",   ring: "ring-blue-400",   label: "Blue"   },
  { key: "red",    bg: "bg-red-400",    ring: "ring-red-400",    label: "Red"    },
  { key: "green",  bg: "bg-green-400",  ring: "ring-green-400",  label: "Green"  },
  { key: "purple", bg: "bg-purple-400", ring: "ring-purple-400", label: "Purple" },
  { key: "orange", bg: "bg-orange-400", ring: "ring-orange-400", label: "Orange" },
  { key: "pink",   bg: "bg-pink-400",   ring: "ring-pink-400",   label: "Pink"   },
  { key: "yellow", bg: "bg-yellow-400", ring: "ring-yellow-400", label: "Yellow" },
  { key: "teal",   bg: "bg-teal-400",   ring: "ring-teal-400",   label: "Teal"   },
];

const MEMBER_CARD_COLORS: Record<string, string> = {
  blue:   "ring-blue-400   bg-blue-50   hover:bg-blue-100",
  red:    "ring-red-400    bg-red-50    hover:bg-red-100",
  green:  "ring-green-400  bg-green-50  hover:bg-green-100",
  purple: "ring-purple-400 bg-purple-50 hover:bg-purple-100",
  orange: "ring-orange-400 bg-orange-50 hover:bg-orange-100",
  pink:   "ring-pink-400   bg-pink-50   hover:bg-pink-100",
  yellow: "ring-yellow-400 bg-yellow-50 hover:bg-yellow-100",
  teal:   "ring-teal-400   bg-teal-50   hover:bg-teal-100",
};

export default function LoginPage({ members }: LoginPageProps) {
  const [showAddForm, setShowAddForm] = useState(members.length === 0);
  const [selectedEmoji, setSelectedEmoji] = useState("😊");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleSelect(id: number) {
    setPending(true);
    await selectMember(id);
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setDeletingId(id);
    await deleteMember(id);
    setDeletingId(null);
    // Refresh handled by revalidatePath — page will re-render
    window.location.reload();
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("emoji", selectedEmoji);
    formData.set("color", selectedColor);
    await createAndSelectMember(formData);
    // redirect happens in action — no need to reset state
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            🌟 Sunshine Family
          </h1>
          <p className="text-gray-500">Who&apos;s using the dashboard?</p>
        </div>

        {/* Member Grid */}
        {members.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {members.map((member) => {
              const cardColors =
                MEMBER_CARD_COLORS[member.color] ??
                "ring-gray-300 bg-gray-50 hover:bg-gray-100";
              return (
                <div key={member.id} className="relative group">
                  <button
                    onClick={() => handleSelect(member.id)}
                    disabled={pending}
                    className={`w-full flex flex-col items-center gap-2 p-4 rounded-xl border-2 ring-2 ${cardColors} transition-all duration-150 disabled:opacity-50 cursor-pointer`}
                  >
                    <span className="text-4xl">{member.emoji}</span>
                    <span className="text-sm font-semibold text-gray-700 text-center leading-tight">
                      {member.name}
                    </span>
                    <LogIn className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, member.id)}
                    disabled={deletingId === member.id}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md disabled:opacity-50"
                    title={`Remove ${member.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Divider / Add toggle */}
        {members.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 border-t border-gray-200" />
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {showAddForm ? "Cancel" : "Add a new member"}
            </button>
            <div className="flex-1 border-t border-gray-200" />
          </div>
        )}

        {/* Add Member Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                maxLength={30}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                autoFocus
              />
            </div>

            {/* Emoji Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pick an emoji{" "}
                <span className="text-xl ml-1">{selectedEmoji}</span>
              </label>
              <div className="grid grid-cols-8 gap-1">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`text-xl p-1.5 rounded-lg transition-all ${
                      selectedEmoji === emoji
                        ? "bg-blue-100 ring-2 ring-blue-400 scale-110"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pick a color
              </label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setSelectedColor(c.key)}
                    title={c.label}
                    className={`w-8 h-8 rounded-full ${c.bg} transition-all ${
                      selectedColor === c.key
                        ? `ring-2 ring-offset-2 ${c.ring} scale-110`
                        : "hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={pending || !name.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {pending ? "Joining…" : "Add Member & Enter"}
            </button>
          </form>
        )}

        {members.length === 0 && !showAddForm && (
          <p className="text-center text-gray-400 text-sm">
            No family members yet. Add one above to get started!
          </p>
        )}
      </div>
    </div>
  );
}
