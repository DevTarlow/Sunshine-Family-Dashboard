"use client";

import { useState, useEffect, useRef } from "react";
import { createNote, updateNote, deleteNote, markSectionRead, generateCelebration } from "@/app/actions";
import { StickyNote, Plus, X, Save, MessageSquare } from "lucide-react";
import MemberBadge from "./MemberBadge";
import CelebrationToast from "./CelebrationToast";
import CommentThread from "./CommentThread";

interface Member {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

interface Note {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  member: Member | null;
}

interface NotesProps {
  initialNotes: Note[];
  unreadCount: number;
}

export default function Notes({ initialNotes, unreadCount }: NotesProps) {
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [celebration, setCelebration] = useState<string | null>(null);
  const [openCommentNoteId, setOpenCommentNoteId] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [markedRead, setMarkedRead] = useState(false);

  useEffect(() => {
    if (!sectionRef.current || unreadCount === 0 || markedRead) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMarkedRead(true);
          markSectionRead("notes");
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
    if (!newNote.trim()) return;
    
    await createNote(newNote);
    setNewNote("");
    generateCelebration("a new note was added to the family dashboard").then((msg) => {
      if (msg) setCelebration(msg);
    });
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleUpdate = async (id: number) => {
    if (!editContent.trim()) return;
    
    await updateNote(id, editContent);
    setEditingId(null);
    setEditContent("");
  };

  const handleDelete = async (id: number) => {
    await deleteNote(id);
    generateCelebration("a note was swept away from the family dashboard").then((msg) => {
      if (msg) setCelebration(msg);
    });
  };

  return (
    <>
      <CelebrationToast message={celebration} onDismiss={() => setCelebration(null)} />
      <div ref={sectionRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <StickyNote className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        <h2 className="text-xl font-bold dark:text-gray-100">Shared Notes</h2>
        {unreadCount > 0 && !markedRead && (
          <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
      
      <form onSubmit={handleCreate} className="mb-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a new note..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
          rows={3}
        />
        <button
          type="submit"
          className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </form>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {initialNotes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No notes yet. Create one above!</p>
        ) : (
          initialNotes.map((note) => (
            <div key={note.id} className="bg-yellow-50 dark:bg-gray-700 border-l-4 border-yellow-400 p-4 rounded-md">
              {editingId === note.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdate(note.id)}
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
                  <p className="whitespace-pre-wrap mb-2 dark:text-gray-100">{note.content}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(note.updatedAt).toLocaleString()}
                    </span>
                    <MemberBadge member={note.member} />
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() =>
                          setOpenCommentNoteId((prev) => (prev === note.id ? null : note.id))
                        }
                        className="text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition"
                        title="Comments"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startEdit(note)}
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {openCommentNoteId === note.id && (
                    <CommentThread parentType="note" parentId={note.id} />
                  )}
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
