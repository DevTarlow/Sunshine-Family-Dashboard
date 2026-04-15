"use client";

import { useState, useEffect, useRef } from "react";
import { createTodo, deleteTodo, markSectionRead, generateCelebration } from "@/app/actions";
import { X, Plus } from "lucide-react";
import MemberBadge from "./MemberBadge";
import CelebrationToast from "./CelebrationToast";

interface Member {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

interface Todo {
  id: number;
  task: string;
  isDone: boolean;
  member: Member | null;
}

interface TodoListProps {
  initialTodos: Todo[];
  unreadCount: number;
}

export default function TodoList({ initialTodos, unreadCount }: TodoListProps) {
  const [newTask, setNewTask] = useState("");
  const [celebration, setCelebration] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [markedRead, setMarkedRead] = useState(false);

  useEffect(() => {
    if (!sectionRef.current || unreadCount === 0 || markedRead) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMarkedRead(true);
          markSectionRead("todos");
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [unreadCount, markedRead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const task = newTask.trim();
    await createTodo(task);
    setNewTask("");
    generateCelebration(`a new to-do task was added: "${task}"`).then((msg) => {
      if (msg) setCelebration(msg);
    });
  };

  const handleDelete = async (id: number) => {
    await deleteTodo(id);
    generateCelebration("a to-do task was crossed off and removed from the list").then((msg) => {
      if (msg) setCelebration(msg);
    });
  };

  return (
    <>
      <CelebrationToast message={celebration} onDismiss={() => setCelebration(null)} />
      <div ref={sectionRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold dark:text-gray-100">To-Do List</h2>
        {unreadCount > 0 && !markedRead && (
          <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {initialTodos.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tasks yet. Add one above!</p>
        ) : (
          initialTodos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition"
            >
              <div className="flex-1 min-w-0">
                <span className="block truncate dark:text-gray-100">
                  {todo.task}
                </span>
                <div className="mt-0.5">
                  <MemberBadge member={todo.member} />
                </div>
              </div>
              
              <button
                onClick={() => handleDelete(todo.id)}
                className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
      </div>
    </>
  );
}
