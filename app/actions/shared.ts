import { prisma } from "@/lib/prisma";
import { getCurrentMemberId } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export function unwrapData<T>(result: ActionResult<T>, fallback: T): T {
  return result.success ? (result.data ?? fallback) : fallback;
}

export async function tryAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (e: any) {
    const message =
      typeof e?.message === "string" && e.message
        ? e.message
        : "An unexpected error occurred";
    return { success: false, error: message };
  }
}

// ===== LLM HELPERS =====

async function callLocalLLM(prompt: string, options?: { systemPrompt?: string }): Promise<string> {
  const { getCurrentMember } = await import("@/lib/session");
  const member = await getCurrentMember();
  if (!member) return "";
  const rawUrl = member.llmServerUrl;
  const model = member.llmModel;
  if (!rawUrl || !model) return "";
  const cleaned = rawUrl.replace(/\/+$/, "");
  const apiUrl = cleaned.endsWith("/v1") ? cleaned : `${cleaned}/v1`;
  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: options?.systemPrompt || "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 256,
        temperature: 0.7,
      }),
    });
    if (!response.ok) { console.error(`LLM request failed: ${response.status}`); return ""; }
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Error calling local LLM:", error);
    return "";
  }
}

async function callGemini(prompt: string, options?: { systemPrompt?: string }): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.error("GEMINI_API_KEY not set"); return ""; }
  const { getCurrentMember } = await import("@/lib/session");
  const member = await getCurrentMember();
  const model = member?.llmModel || "gemini-2.5-flash";
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: options?.systemPrompt || "You are a helpful assistant.",
        maxOutputTokens: 256,
        temperature: 0.7,
      },
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "";
  }
}

export async function callAI(prompt: string, options?: { systemPrompt?: string }): Promise<string> {
  const { getCurrentMember } = await import("@/lib/session");
  const member = await getCurrentMember();
  if (!member) return "";
  if (member.aiProvider === "gemini") {
    return callGemini(prompt, options);
  }
  return callLocalLLM(prompt, options);
}

// ===== ACHIEVEMENT DEFINITIONS =====

export const ACHIEVEMENT_DEFINITIONS = [
  { key: "workout_first",      name: "First Rep",           emoji: "💪", description: "Log your first workout ever",              category: "fitness" },
  { key: "workout_three_week", name: "On A Roll",           emoji: "🔥", description: "Log 3 workouts in a single week",           category: "fitness" },
  { key: "workout_full_week",  name: "Iron Will",           emoji: "🏆", description: "Log all 7 days in a single week",           category: "fitness" },
  { key: "todo_first_complete",   name: "Task Tackler",       emoji: "✅", description: "Complete your first to-do",               category: "todo" },
  { key: "todo_five_complete",    name: "Getting Things Done",emoji: "⚡", description: "Complete 5 to-dos",                       category: "todo" },
  { key: "todo_twenty_complete",  name: "Productivity Pro",   emoji: "🎯", description: "Complete 20 to-dos",                      category: "todo" },
  { key: "photo_first",    name: "Shutter Bug",      emoji: "📸", description: "Upload your first family photo",                  category: "photos" },
  { key: "photo_five",     name: "Memory Maker",     emoji: "🖼️", description: "Upload 5 family photos",                         category: "photos" },
  { key: "photo_fifteen",  name: "Family Archivist", emoji: "🎞️", description: "Upload 15 family photos",                        category: "photos" },
  { key: "dining_first",       name: "Foodie",          emoji: "🍽️", description: "Log your first dining out entry",             category: "dining" },
  { key: "dining_budget",      name: "Budget Buddy",    emoji: "💰", description: "Add a single dining out entry under $15",      category: "dining" },
  { key: "dining_five_month",  name: "Regular Patron",  emoji: "🌮", description: "Log 5 dining out entries in a single month",  category: "dining" },
] as const;

export type AchievementContext =
  | { type: "fitness" }
  | { type: "todo" }
  | { type: "photos" }
  | { type: "dining"; amount: number };

export async function ensureAchievementsSeeded() {
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    await prisma.achievement.upsert({
      where: { key: def.key },
      update: { name: def.name, emoji: def.emoji, description: def.description, category: def.category },
      create: def,
    });
  }
}

export async function checkAndAwardAchievements(memberId: number, context: AchievementContext) {
  const allDefs = await prisma.achievement.findMany();
  const defByKey = Object.fromEntries(allDefs.map((a) => [a.key, a]));
  const earned = await prisma.memberAchievement.findMany({
    where: { memberId },
    select: { achievementId: true },
  });
  const earnedIds = new Set(earned.map((e) => e.achievementId));
  const award = async (key: string) => {
    const def = defByKey[key];
    if (!def || earnedIds.has(def.id)) return;
    await prisma.memberAchievement.create({ data: { memberId, achievementId: def.id } });
  };
  if (context.type === "fitness") {
    const allTime = await prisma.fitnessLog.count({ where: { memberId } });
    if (allTime >= 1) await award("workout_first");
    const { weekStart, weekEnd } = getWeekBounds();
    const weekCount = await prisma.fitnessLog.count({ where: { memberId, date: { gte: weekStart, lt: weekEnd } } });
    if (weekCount >= 3) await award("workout_three_week");
    if (weekCount >= 7) await award("workout_full_week");
  }
  if (context.type === "todo") {
    const stats = await prisma.memberStats.findUnique({ where: { memberId } });
    const count = stats?.todosCompleted ?? 0;
    if (count >= 1) await award("todo_first_complete");
    if (count >= 5) await award("todo_five_complete");
    if (count >= 20) await award("todo_twenty_complete");
  }
  if (context.type === "photos") {
    const stats = await prisma.memberStats.findUnique({ where: { memberId } });
    const count = stats?.photosUploaded ?? 0;
    if (count >= 1) await award("photo_first");
    if (count >= 5) await award("photo_five");
    if (count >= 15) await award("photo_fifteen");
  }
  if (context.type === "dining") {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthCount = await prisma.diningOut.count({ where: { memberId, date: { gte: startOfMonth, lt: startOfNextMonth } } });
    if (monthCount >= 1) await award("dining_first");
    if (context.amount < 15) await award("dining_budget");
    if (monthCount >= 5) await award("dining_five_month");
  }
}

// ===== SHARED TYPES =====

export type CommentWithMember = {
  id: number;
  content: string;
  createdAt: Date;
  memberId: number | null;
  member: { id: number; name: string; emoji: string; color: string } | null;
};

export const VALID_SECTIONS = ["notes", "todos", "groceries", "diningOut", "mealPrep", "dinners", "sharedLinks", "recipes"] as const;
export type Section = (typeof VALID_SECTIONS)[number];

export const RECIPE_CATEGORIES = [
  "Uncategorized",
  "Dinner",
  "Breakfast",
  "Lunch",
  "Dessert",
  "Appetizer",
  "Side Dish",
  "Soup",
  "Salad",
  "Baking",
  "Drinks",
  "Grilling",
  "Slow Cooker",
  "Quick & Easy",
  "Healthy",
];

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

export async function fetchFoodEmoji(label: string): Promise<string> {
  const prompt = `Reply with a single food emoji that best represents: "${label}". Only the emoji character, nothing else.`;
  const emoji = await callAI(prompt, {
    systemPrompt: "You are a helpful assistant that responds with exactly one emoji.",
  });
  if (emoji && emoji.length <= 8 && /\P{ASCII}/u.test(emoji)) {
    return emoji.trim();
  }
  return "🍽️";
}

export function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const daysFromMonday = (day + 6) % 7;
  const weekStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday));
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { weekStart, weekEnd };
}
