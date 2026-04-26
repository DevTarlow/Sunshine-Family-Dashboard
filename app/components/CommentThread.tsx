"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, Trash2 } from "lucide-react";
import MemberBadge from "./MemberBadge";
import {
  getCommentsForNote,
  getCommentsForDiningOut,
  getCommentsForDinner,
  addComment,
  deleteComment,
} from "@/app/actions";

type CommentMember = { id: number; name: string; emoji: string; color: string } | null;

type Comment = {
  id: number;
  content: string;
  createdAt: Date;
  memberId: number | null;
  member: CommentMember;
};

interface CommentThreadProps {
  parentType: "note" | "diningOut" | "dinner";
  parentId: number;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommentThread({ parentType, parentId }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchFn =
      parentType === "note"
        ? () => getCommentsForNote(parentId)
        : parentType === "diningOut"
        ? () => getCommentsForDiningOut(parentId)
        : () => getCommentsForDinner(parentId);

fetchFn().then((data) => {
      if (!cancelled) {
        setComments(data as Comment[]);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [parentType, parentId]);

  function handleDelete(id: number) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    startTransition(async () => {
      await deleteComment(id);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setText("");

    const target =
      parentType === "note"
        ? { noteId: parentId }
        : parentType === "diningOut"
        ? { diningOutId: parentId }
        : { dinnerId: parentId };

    startTransition(async () => {
      await addComment(trimmed, target);
      // Re-fetch to get the new comment with member data
      const fetchFn =
        parentType === "note"
          ? () => getCommentsForNote(parentId)
          : parentType === "diningOut"
          ? () => getCommentsForDiningOut(parentId)
          : () => getCommentsForDinner(parentId);
      const fresh = await fetchFn();
      setComments(fresh as Comment[]);
    });
  }

  return (
    <div className="mt-2 border-t border-gray-200 dark:border-gray-600 pt-2">
      {/* Comment list */}
      {loading ? (
        <div className="text-xs text-gray-400 dark:text-gray-500 py-2 px-1">Loading…</div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-gray-400 dark:text-gray-500 py-1 px-1 italic">
          No comments yet. Be the first!
        </div>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto mb-2">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="flex items-start gap-2 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <MemberBadge member={comment.member} />
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 break-words">
                  {comment.content}
                </p>
              </div>
              <button
                onClick={() => handleDelete(comment.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 shrink-0 mt-0.5"
                title="Delete comment"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          disabled={isPending}
          className="flex-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-30 transition-colors"
          title="Send comment"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
