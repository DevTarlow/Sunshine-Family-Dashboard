"use client";

import { useState, useEffect, useRef } from "react";
import { createTodo, deleteTodo, toggleTodo, markSectionRead, generateCelebration } from "@/app/actions";
import { X, Plus, Check } from "lucide-react";
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
    await createTodo(task, null);
    setNewTask("");
    generateCelebration(`a new to-do task was added: "${task}"`).then((msg) => {
      if (msg) setCelebration(msg);
    }).catch(() => {});
  };

  const handleToggle = async (id: number, isDone: boolean) => {
    await toggleTodo(id, !isDone);
  };

  const handleDelete = async (id: number) => {
    const msg = await generateCelebration("a to-do task was crossed off and removed from the list");
    if (msg) setCelebration(msg);
    await deleteTodo(id);
  };

  const activeTodos = initialTodos.filter((t) => !t.isDone);
  const doneTodos = initialTodos.filter((t) => t.isDone);
  const sortedTodos = [...activeTodos, ...doneTodos];

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

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </form>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedTodos.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tasks yet. Add one above!</p>
        ) : (
          sortedTodos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-2 p-2 rounded-md transition ${
                todo.isDone
                  ? "bg-gray-100 dark:bg-gray-700/50 opacity-60"
                  : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              <button
                onClick={() => handleToggle(todo.id, todo.isDone)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition shrink-0 ${
                  todo.isDone
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 dark:border-gray-500 hover:border-green-500"
                }`}
              >
                {todo.isDone && <Check className="w-4 h-4 text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                <span className={`block truncate ${todo.isDone ? "line-through text-gray-400 dark:text-gray-500" : "dark:text-gray-100"}`}>
                  {todo.task}
                </span>
                <div className="flex items-center gap-2 mt-0.5 min-w-0">
                  <span className="shrink-0"><MemberBadge member={todo.member} /></span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(todo.id)}
                className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition shrink-0"
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
