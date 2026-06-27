"use client";

import { useState, useEffect, useRef } from "react";
import { createSharedLink, updateSharedLink, deleteSharedLink, markSectionRead, generateCelebration } from "@/app/actions";
import { Link, Plus, X, Save, ExternalLink } from "lucide-react";
import MemberBadge from "./MemberBadge";
import CelebrationToast from "./CelebrationToast";

interface Member {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

interface SharedLink {
  id: number;
  url: string;
  title: string;
  description: string;
  createdAt: Date;
  member: Member | null;
}

interface LinkBoardProps {
  initialLinks: SharedLink[];
  unreadCount: number;
}

export default function LinkBoard({ initialLinks, unreadCount }: LinkBoardProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [celebration, setCelebration] = useState<string | null>(null);
  const [markedRead, setMarkedRead] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || unreadCount === 0 || markedRead) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMarkedRead(true);
          markSectionRead("sharedLinks");
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [unreadCount, markedRead]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newTitle.trim()) return;

    await createSharedLink(newUrl.trim(), newTitle.trim(), newDescription.trim());
    setNewUrl("");
    setNewTitle("");
    setNewDescription("");
    generateCelebration("a new link was shared on the family dashboard").then((msg) => {
      if (msg) setCelebration(msg);
    }).catch(() => {});
  };

  const startEdit = (link: SharedLink) => {
    setEditingId(link.id);
    setEditUrl(link.url);
    setEditTitle(link.title);
    setEditDescription(link.description);
  };

  const handleUpdate = async (id: number) => {
    if (!editUrl.trim() || !editTitle.trim()) return;
    await updateSharedLink(id, editUrl.trim(), editTitle.trim(), editDescription.trim());
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    const msg = await generateCelebration("a shared link was removed from the family dashboard");
    if (msg) setCelebration(msg);
    await deleteSharedLink(id);
  };

  return (
    <>
      <CelebrationToast message={celebration} onDismiss={() => setCelebration(null)} />
      <div ref={sectionRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold dark:text-gray-100">Shared Links</h2>
          {unreadCount > 0 && !markedRead && (
            <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        {/* Add form */}
        <form onSubmit={handleCreate} className="mb-4 space-y-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>
        </form>

        {/* Links list */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {initialLinks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No links yet. Share one above!</p>
          ) : (
            initialLinks.map((link) => (
              <div
                key={link.id}
                className="bg-blue-50 dark:bg-gray-700 border-l-4 border-blue-400 p-4 rounded-md"
              >
                {editingId === link.id ? (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(link.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition flex items-center gap-1 text-sm"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white px-3 py-1 rounded-md transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 break-all"
                      >
                        {link.title}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                      <div className="flex gap-2 items-center flex-shrink-0">
                        <button
                          onClick={() => startEdit(link)}
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {link.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                        {link.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </span>
                      <MemberBadge member={link.member} />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
