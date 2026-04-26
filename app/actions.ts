"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentMemberId, getCurrentMember } from "@/lib/session";
import { logActivity, touchLastSeen, getActivities, getLastSeen } from "@/lib/activityStore";

// ===== LOCAL LLM =====

async function callLocalLLM(prompt: string, options?: { systemPrompt?: string }): Promise<string> {
  const member = await getCurrentMember();
  if (!member) return "";
  
  const serverUrl = member.llmServerUrl;
  const model = member.llmModel;
  
  if (!serverUrl || !model) {
    // No LLM configured for this member
    return "";
  }
  
  try {
    const response = await fetch(`${serverUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: options?.systemPrompt || "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 100,
        temperature: 0.7,
        reasoning_effort: "low",
      }),
    });
    
    if (!response.ok) {
      console.error(`LLM request failed: ${response.status} ${response.statusText}`);
      return "";
    }
    
    const data = await response.json();
    const msgContent = data.choices?.[0]?.message?.content;
    let raw = (typeof msgContent === "string" && msgContent.trim() ? msgContent.trim() : "");
    
    const lines = raw.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.match(/^(\*\*|\d+\.|[-*]\s)/) && trimmed.length > 10) {
        return trimmed;
      }
    }
    return raw.trim();
  } catch (error) {
    console.error("Error calling local LLM:", error);
    return "";
  }
}

// ===== MEMBERS =====

export async function getMembers() {
  return prisma.member.findMany({ orderBy: { createdAt: "asc" } });
}

export async function createAndSelectMember(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const emoji = (formData.get("emoji") as string) || "😊";
  const color = (formData.get("color") as string) || "blue";

  if (!name) return;

  let member;
  try {
    member = await prisma.member.create({ data: { name, emoji, color } });
  } catch {
    // Name already taken — silently ignore (unique constraint)
    return;
  }

  touchLastSeen(member.id);

  const cookieStore = await cookies();
  cookieStore.set("family-member-id", String(member.id), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  revalidatePath("/");
  redirect("/");
}

export async function selectMember(id: number) {
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) redirect("/login");

  touchLastSeen(member.id);

  const cookieStore = await cookies();
  cookieStore.set("family-member-id", String(id), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  revalidatePath("/");
  redirect("/");
}

export async function deleteMember(id: number) {
  // items stay — onDelete: SetNull handles it
  await prisma.member.delete({ where: { id } });

  // If the deleted member is the current session, clear cookie
  const cookieStore = await cookies();
  const raw = cookieStore.get("family-member-id")?.value;
  if (raw && parseInt(raw, 10) === id) {
    cookieStore.delete("family-member-id");
  }
  revalidatePath("/login");
}

export async function logOut() {
  const cookieStore = await cookies();
  cookieStore.delete("family-member-id");
  redirect("/login");
}

export async function resetDatabase() {
  const cookieStore = await cookies();
  cookieStore.delete("family-member-id");
  await prisma.comment.deleteMany();
  await prisma.photoFavorite.deleteMany();
  await prisma.memberAchievement.deleteMany();
  await prisma.memberStats.deleteMany();
  await prisma.memberReadState.deleteMany();
  await prisma.sharedLink.deleteMany();
  await prisma.mealPrepItem.deleteMany();
  await prisma.fitnessLog.deleteMany();
  await prisma.diningOut.deleteMany();
  await prisma.grocery.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.note.deleteMany();
  await prisma.dinner.deleteMany();
  await prisma.member.deleteMany();
  redirect("/login");
}

export async function updateMemberTheme(formData: FormData) {
  const theme = formData.get("theme") as string;
  if (theme !== "light" && theme !== "dark") return;
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({
    where: { id: memberId },
    data: { theme },
  });
  revalidatePath("/");
}

export async function updateNotificationsEnabled(formData: FormData) {
  const enabled = formData.get("enabled");
  // enabled can be "on" for checkbox, but we'll treat as boolean string
  const notificationsEnabled = enabled === "true" || enabled === "on";
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({
    where: { id: memberId },
    data: { notificationsEnabled },
  });
  revalidatePath("/");
}

// ===== CAM URL =====

export async function getCamUrl() {
  const memberId = await getCurrentMemberId();
  if (!memberId) return null;
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });
  // Type assertion to handle Prisma type caching issue
  return (member as any)?.camUrl ?? null;
}

export async function updateCamUrl(formData: FormData) {
  const camUrl = formData.get("camUrl") as string;
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({
    where: { id: memberId },
    data: { camUrl: camUrl?.trim() || null },
  });
  revalidatePath("/");
}

// ===== REFRESH INTERVALS =====

export async function getMemberRefreshSettings() {
  const memberId = await getCurrentMemberId();
  if (!memberId) return { autoRefreshInterval: 30000, vibeRefreshInterval: 0 };
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });
  return {
    autoRefreshInterval: (member as any)?.autoRefreshInterval ?? 30000,
    vibeRefreshInterval: (member as any)?.vibeRefreshInterval ?? 0,
  };
}

export async function updateAutoRefreshInterval(formData: FormData) {
  const interval = formData.get("interval");
  const autoRefreshInterval = interval ? parseInt(String(interval), 10) : 30000;
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({
    where: { id: memberId },
    data: { autoRefreshInterval },
  });
  revalidatePath("/");
}

export async function updateVibeRefreshInterval(formData: FormData) {
  const interval = formData.get("interval");
  const vibeRefreshInterval = interval ? parseInt(String(interval), 10) : 0;
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({
    where: { id: memberId },
    data: { vibeRefreshInterval },
  });
  revalidatePath("/");
}

// ===== LLM CONFIG =====

export async function getLLMConfig() {
  const memberId = await getCurrentMemberId();
  if (!memberId) return { serverUrl: null, model: null };
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });
  // Type assertion to handle Prisma type caching issue
  return {
    serverUrl: (member as any)?.llmServerUrl ?? null,
    model: (member as any)?.llmModel ?? null,
  };
}

export async function updateLLMConfig(formData: FormData) {
  const serverUrl = formData.get("serverUrl") as string;
  const model = formData.get("model") as string;
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({
    where: { id: memberId },
    data: {
      llmServerUrl: serverUrl?.trim() || null,
      llmModel: model?.trim() || null,
    },
  });
  revalidatePath("/");
}

// ===== WEATHER CONFIG =====

export async function getWeatherSettings() {
  const memberId = await getCurrentMemberId();
  if (!memberId) {
    return { apiKey: null, city: null, units: null };
  }
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });
  return {
    apiKey: (member as any)?.weatherApiKey ?? null,
    city: (member as any)?.weatherCity ?? null,
    units: (member as any)?.weatherUnits ?? null,
  };
}

export async function updateWeatherSettings(formData: FormData) {
  const apiKey = formData.get("apiKey") as string;
  const city = formData.get("city") as string;
  const units = formData.get("units") as string;
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({
    where: { id: memberId },
    data: {
      weatherApiKey: apiKey?.trim() || null,
      weatherCity: city?.trim() || null,
      weatherUnits: units || null,
    },
  });
  revalidatePath("/");
}

// ===== VIBE STATE =====

export async function getVibeState(): Promise<{ message: string | null; generatedAt: Date | null }> {
  const memberId = await getCurrentMemberId();
  if (!memberId) return { message: null, generatedAt: null };
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { vibeMessage: true, vibeGeneratedAt: true },
  });
  return { message: member?.vibeMessage ?? null, generatedAt: member?.vibeGeneratedAt ?? null };
}

export async function saveVibeState(message: string) {
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({
    where: { id: memberId },
    data: { vibeMessage: message, vibeGeneratedAt: new Date() },
  });
}

// ===== DINNERS =====

export async function getDinners() {
  const dinners = await prisma.dinner.findMany({
    orderBy: { id: "asc" },
  });
  return dinners;
}

export async function setDinner(dayOfWeek: string, meal: string) {
  const member = await getCurrentMember();
  await prisma.dinner.upsert({
    where: { dayOfWeek },
    update: { meal },
    create: { dayOfWeek, meal },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `set ${dayOfWeek}'s dinner to "${meal}"`);
  }
  revalidatePath("/");
}

export async function clearDinner(dayOfWeek: string) {
  const member = await getCurrentMember();
  await prisma.dinner.deleteMany({
    where: { dayOfWeek },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `cleared ${dayOfWeek}'s dinner`);
  }
  revalidatePath("/");
}

export async function reorderDinners(entries: { dayOfWeek: string; meal: string | null }[]) {
  const member = await getCurrentMember();
  await prisma.$transaction(
    entries.map((e) =>
      e.meal
        ? prisma.dinner.upsert({
            where: { dayOfWeek: e.dayOfWeek },
            update: { meal: e.meal },
            create: { dayOfWeek: e.dayOfWeek, meal: e.meal },
          })
        : prisma.dinner.deleteMany({ where: { dayOfWeek: e.dayOfWeek } })
    )
  );
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "reordered the weekly dinners");
  }
  revalidatePath("/");
}

export async function generateCelebration(context: string): Promise<string> {
  const prompt = `You are a fun, enthusiastic family dashboard assistant. Write a short, silly, family-friendly celebratory message or rhyme (1-2 sentences, emojis welcome) to celebrate this event: ${context}. Be creative and specific to the event. Reply with only the celebration message, nothing else.`;
  return await callLocalLLM(prompt, {
    systemPrompt: "You are a fun, enthusiastic family dashboard assistant.",
  });
}

export async function generateVibeMessage(): Promise<string> {
  const prompt = `Write a short, uplifting, family-friendly message (1-2 sentences, emojis welcome) to set a positive tone for the day. Be warm, encouraging, and specific to spending quality time with family. Reply with only the message, nothing else.`;
  return await callLocalLLM(prompt, {
    systemPrompt: "You are a cheerful, motivational family dashboard assistant who writes brief, heartwarming messages.",
  });
}

export async function suggestDinnerIdea(): Promise<string> {
  const dinners = await prisma.dinner.findMany({ orderBy: { id: "asc" } });
  const mealList = dinners.length > 0
    ? dinners.map((d) => `- ${d.meal}`).join("\n")
    : "No meals planned yet this week.";

  const prompt = `We are a family planning our weekly dinners. Here are the meals on our plan this week:\n${mealList}\n\nSuggest one dinner idea that would fit our tastes but is not already on the list. Reply with only the dinner name, nothing else.`;
  return await callLocalLLM(prompt, {
    systemPrompt: "You are a helpful family dinner planner with an exhaustive knowledge of global cuisines, seasonal ingredients, and creative family cooking.",
  });
}

// ===== NOTES =====

export async function getNotes() {
  return prisma.note.findMany({
    orderBy: { createdAt: "desc" },
    include: { member: true },
  });
}

export async function createNote(content: string) {
  const member = await getCurrentMember();
  await prisma.note.create({
    data: { content, memberId: member?.id ?? null },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "added a note");
  }
  revalidatePath("/");
}

export async function updateNote(id: number, content: string) {
  const member = await getCurrentMember();
  await prisma.note.update({
    where: { id },
    data: { content },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "updated a note");
  }
  revalidatePath("/");
}

export async function deleteNote(id: number) {
  const member = await getCurrentMember();
  await prisma.note.delete({
    where: { id },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "deleted a note");
  }
  revalidatePath("/");
}

// ===== TODOS =====

export async function getTodos() {
  return prisma.todo.findMany({
    orderBy: { id: "asc" },
    include: { member: true },
  });
}

export async function createTodo(task: string) {
  const member = await getCurrentMember();
  await prisma.todo.create({
    data: { task, memberId: member?.id ?? null },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `added "${task}" to todos`);
  }
  revalidatePath("/");
}

export async function toggleTodo(id: number, isDone: boolean) {
  const member = await getCurrentMember();
  await prisma.todo.update({
    where: { id },
    data: { isDone },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, isDone ? "completed a todo" : "uncompleted a todo");
    if (isDone) {
      await prisma.memberStats.upsert({
        where: { memberId: member.id },
        update: { todosCompleted: { increment: 1 } },
        create: { memberId: member.id, todosCompleted: 1, photosUploaded: 0 },
      });
      await checkAndAwardAchievements(member.id, { type: "todo" });
    }
  }
  revalidatePath("/");
}

export async function deleteTodo(id: number) {
  const member = await getCurrentMember();
  await prisma.todo.delete({
    where: { id },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "removed a todo");
  }
  revalidatePath("/");
}

// ===== GROCERIES =====

export async function getGroceries() {
  return prisma.grocery.findMany({
    orderBy: { id: "asc" },
    include: { member: true },
  });
}

export async function createGrocery(item: string) {
  const member = await getCurrentMember();
  await prisma.grocery.create({
    data: { item, memberId: member?.id ?? null },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `added "${item}" to groceries`);
  }
  revalidatePath("/");
}

export async function toggleGrocery(id: number, isBought: boolean) {
  const member = await getCurrentMember();
  await prisma.grocery.update({
    where: { id },
    data: { isBought },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, isBought ? "checked off a grocery" : "unchecked a grocery");
  }
  revalidatePath("/");
}

export async function deleteGrocery(id: number) {
  const member = await getCurrentMember();
  await prisma.grocery.delete({
    where: { id },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "removed a grocery");
  }
  revalidatePath("/");
}

export async function deleteAllGroceries() {
  const member = await getCurrentMember();
  await prisma.grocery.deleteMany({});
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "cleared the grocery list");
  }
  revalidatePath("/");
}

// ===== WEATHER =====

async function getMemberWeatherSettings() {
  const memberId = await getCurrentMemberId();
  if (!memberId) {
    return { apiKey: null, city: null, units: null };
  }
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });
  return {
    apiKey: (member as any)?.weatherApiKey ?? null,
    city: (member as any)?.weatherCity ?? null,
    units: (member as any)?.weatherUnits ?? null,
  };
}

export async function getWeatherData() {
  const envApiKey = process.env.OPENWEATHERMAP_API_KEY;
  const envCity = process.env.OPENWEATHERMAP_CITY || "gresham";
  const envUnits = process.env.OPENWEATHERMAP_UNITS || "imperial";
  const memberSettings = await getMemberWeatherSettings();

  const apiKey = memberSettings.apiKey || envApiKey;
  const city = memberSettings.city || envCity;
  const units = memberSettings.units || envUnits;

  if (!apiKey || apiKey === "your_api_key_here") {
    return {
      error: "Please set OPENWEATHERMAP_API_KEY in .env file",
    };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
    const response = await fetch(url, { next: { revalidate: 1800 } }); // Cache for 30 minutes
    
    if (!response.ok) {
      throw new Error("Weather API request failed");
    }

    const data = await response.json();
    
    return {
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
      units,
    };
  } catch (error) {
    return {
      error: "Set your OpenWeatherMap API key in Settings to see weather",
    };
  }
}

export async function getWeatherForecast() {
  const envApiKey = process.env.OPENWEATHERMAP_API_KEY;
  const envCity = process.env.OPENWEATHERMAP_CITY || "gresham";
  const envUnits = process.env.OPENWEATHERMAP_UNITS || "imperial";
  const memberSettings = await getMemberWeatherSettings();

  const apiKey = memberSettings.apiKey || envApiKey;
  const city = memberSettings.city || envCity;
  const units = memberSettings.units || envUnits;

  if (!apiKey || apiKey === "your_api_key_here") {
    return { days: [] };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${units}`;
    const response = await fetch(url, { next: { revalidate: 1800 } });

    if (!response.ok) {
      return { days: [] };
    }

    const data = await response.json();
    const list: Array<{
      dt_txt: string;
      main: { temp_max: number; temp_min: number };
      weather: Array<{ description: string }>;
    }> = data.list;

    // Group entries by date (YYYY-MM-DD)
    const byDate = new Map<string, typeof list>();
    for (const entry of list) {
      const date = entry.dt_txt.split(" ")[0];
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(entry);
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const dayAbbrevs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const days = Array.from(byDate.entries())
      .slice(0, 5)
      .map(([date, entries], index) => {
        const high = Math.round(Math.max(...entries.map((e) => e.main.temp_max)));
        const low = Math.round(Math.min(...entries.map((e) => e.main.temp_min)));
        // Pick the entry closest to noon for the description
        const noon = entries.find((e) => e.dt_txt.includes("12:00:00")) ?? entries[Math.floor(entries.length / 2)];
        const description = noon.weather[0].description;

        let label: string;
        if (date === todayStr || index === 0) {
          label = "Today";
        } else {
          const d = new Date(date + "T12:00:00");
          label = dayAbbrevs[d.getDay()];
        }

        return { label, high, low, description };
      });

    return { days };
  } catch {
    return { days: [] };
  }
}

// ===== PHOTOS =====

export async function getPhotos() {
  try {
    const photosDirectory = path.join(process.cwd(), "public/photos");
    const filenames = await fs.readdir(photosDirectory);
    
    // Filter for image files only, sort newest-first (filenames are Date.now()-prefixed)
    const imageFiles = filenames
      .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .sort((a, b) => b.localeCompare(a));

    // Return full paths relative to public
    return imageFiles.map((file) => `/photos/${file}`);
  } catch (error) {
    // If folder doesn't exist or is empty, return empty array
    return [];
  }
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadPhoto(formData: FormData) {
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return;
  if (file.size > MAX_PHOTO_SIZE) return;

  const ext = file.type === "image/jpeg" ? ".jpg"
    : file.type === "image/png" ? ".png"
    : file.type === "image/gif" ? ".gif"
    : ".webp";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const photosDir = path.join(process.cwd(), "public/photos");
  const dest = path.join(photosDir, safeName);

  // Guard against path traversal
  if (!dest.startsWith(photosDir + path.sep) && dest !== photosDir) return;

  await fs.mkdir(photosDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buffer);
  const member = await getCurrentMember();
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "uploaded a photo");
    await prisma.memberStats.upsert({
      where: { memberId: member.id },
      update: { photosUploaded: { increment: 1 } },
      create: { memberId: member.id, photosUploaded: 1, todosCompleted: 0 },
    });
    await checkAndAwardAchievements(member.id, { type: "photos" });
  }
  revalidatePath("/");
}

export async function deletePhoto(filename: string) {
  // Validate: no path separators or traversal sequences
  if (!filename || /[/\\]/.test(filename) || filename.includes("..")) return;
  const photosDir = path.join(process.cwd(), "public/photos");
  const dest = path.join(photosDir, filename);

  // Guard against path traversal
  if (!dest.startsWith(photosDir + path.sep)) return;

  try {
    await fs.unlink(dest);
  } catch {
    // File may already be gone — that's fine
  }
  revalidatePath("/");
}

// ===== PHOTO FAVORITES =====

export async function getFavoritePhotos(): Promise<string[]> {
  const memberId = await getCurrentMemberId();
  if (!memberId) return [];
  const favorites = await prisma.photoFavorite.findMany({
    where: { memberId },
    orderBy: { id: "asc" },
  });
  return favorites.map((f) => f.filename);
}

export async function togglePhotoFavorite(filename: string): Promise<{ favorited: boolean }> {
  const memberId = await getCurrentMemberId();
  if (!memberId) return { favorited: false };
  const existing = await prisma.photoFavorite.findUnique({
    where: { memberId_filename: { memberId, filename } },
  });
  if (existing) {
    await prisma.photoFavorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  } else {
    await prisma.photoFavorite.create({ data: { memberId, filename } });
    return { favorited: true };
  }
}

// ===== BACKGROUNDS =====

export async function getBackgrounds(): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), "public/backgrounds");
    const filenames = await fs.readdir(dir);
    const imageFiles = filenames.filter((file) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );
    return imageFiles.map((file) => `/backgrounds/${file}`);
  } catch {
    return [];
  }
}

export async function uploadBackground(formData: FormData) {
  const file = formData.get("background") as File | null;
  if (!file || file.size === 0) return;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return;
  if (file.size > MAX_PHOTO_SIZE) return;

  const ext = file.type === "image/jpeg" ? ".jpg"
    : file.type === "image/png" ? ".png"
    : file.type === "image/gif" ? ".gif"
    : ".webp";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const bgDir = path.join(process.cwd(), "public/backgrounds");
  const dest = path.join(bgDir, safeName);

  if (!dest.startsWith(bgDir + path.sep) && dest !== bgDir) return;

  await fs.mkdir(bgDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buffer);
  revalidatePath("/");
}

export async function setMemberBackground(filename: string | null) {
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({
    where: { id: memberId },
    data: { backgroundImage: filename },
  });
  revalidatePath("/");
}

export async function getProfileData() {
  const memberId = await getCurrentMemberId();
  if (!memberId) return null;

  const [
    backgrounds,
    favoritePhotos,
    member,
    fitnessCount,
    todosCompleted,
    notesCreated,
    groceriesAdded,
    diningOutCount,
    favoritesCount,
    achievementsCount,
    memberStats,
  ] = await Promise.all([
    getBackgrounds(),
    getFavoritePhotos(),
    prisma.member.findUnique({ where: { id: memberId } }),
    prisma.fitnessLog.count({ where: { memberId } }),
    prisma.todo.count({ where: { memberId, isDone: true } }),
    prisma.note.count({ where: { memberId } }),
    prisma.grocery.count({ where: { memberId } }),
    prisma.diningOut.count({ where: { memberId } }),
    prisma.photoFavorite.count({ where: { memberId } }),
    prisma.memberAchievement.count({ where: { memberId } }),
    prisma.memberStats.findUnique({ where: { memberId } }),
  ]);

  return {
    backgrounds,
    favoritePhotos,
    stats: {
      fitnessLogs: fitnessCount,
      todosCompleted,
      photosUploaded: memberStats?.photosUploaded ?? 0,
      notesCreated,
      groceriesAdded,
      diningOutEntries: diningOutCount,
      favoritePhotos: favoritesCount,
      achievementsEarned: achievementsCount,
      memberSince: member?.createdAt ?? new Date(),
    },
  };
}

// ===== DINING OUT =====

export async function getDiningOutEntries() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return prisma.diningOut.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
    orderBy: { date: "desc" },
    include: { member: true },
  });
}

export async function addDiningOutEntry(amount: number, description: string) {
  const member = await getCurrentMember();
  await prisma.diningOut.create({
    data: { amount, description, memberId: member?.id ?? null },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `logged dining out ($${amount.toFixed(2)})`);
    await checkAndAwardAchievements(member.id, { type: "dining", amount });
  }
  revalidatePath("/");
}

export async function updateDiningOutEntry(id: number, amount: number, description: string) {
  await prisma.diningOut.update({
    where: { id },
    data: { amount, description },
  });
  revalidatePath("/");
}

export async function deleteDiningOutEntry(id: number) {
  const member = await getCurrentMember();
  await prisma.diningOut.delete({
    where: { id },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "removed a dining out entry");
  }
  revalidatePath("/");
}

// ===== FITNESS TRACKER =====

function getWeekBounds() {
  const now = new Date();
  // Use LOCAL day-of-week so the server's week always matches what the client
  // displays. Logs are stored as "UTC midnight of the local date", so weekStart
  // must also be expressed that way to avoid a mismatch on Sunday evenings when
  // getUTCDay() has already rolled over to Monday in non-UTC timezones.
  const day = now.getDay(); // 0=Sun, 1=Mon, ...6=Sat  (local time)
  const daysFromMonday = (day + 6) % 7;
  const weekStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday));
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { weekStart, weekEnd };
}

export async function getFitnessLogs() {
  const { weekStart, weekEnd } = getWeekBounds();
  return prisma.fitnessLog.findMany({
    where: {
      date: { gte: weekStart, lt: weekEnd },
    },
    include: { member: true },
    orderBy: { date: "asc" },
  });
}

export async function toggleFitnessLog(dateStr: string) {
  const member = await getCurrentMember();
  if (!member) return;

  const date = new Date(dateStr);

  const existing = await prisma.fitnessLog.findUnique({
    where: { memberId_date: { memberId: member.id, date } },
  });

  if (existing) {
    await prisma.fitnessLog.delete({ where: { id: existing.id } });
    logActivity(member.id, member.name, member.emoji, member.color, "removed a workout");
  } else {
    await prisma.fitnessLog.create({ data: { memberId: member.id, date } });
    logActivity(member.id, member.name, member.emoji, member.color, "logged a workout");
    await checkAndAwardAchievements(member.id, { type: "fitness" });
  }

  revalidatePath("/");
}

// ===== MEAL PREP FRIDGE =====

async function fetchFoodEmoji(label: string): Promise<string> {
  const prompt = `Reply with a single food emoji that best represents: "${label}". Only the emoji character, nothing else.`;
  const emoji = await callLocalLLM(prompt, {
    systemPrompt: "You are a helpful assistant that responds with exactly one emoji.",
  });
  // Validate it looks like an emoji (non-ASCII, short)
  if (emoji && emoji.length <= 8 && /\P{ASCII}/u.test(emoji)) {
    return emoji.trim();
  }
  return "🍽️";
}

export async function getMealPrepItems() {
  return prisma.mealPrepItem.findMany({
    orderBy: { createdAt: "desc" },
    include: { member: true },
  });
}

export async function createMealPrepItem(label: string) {
  const member = await getCurrentMember();
  const imageUrl = await fetchFoodEmoji(label);
  await prisma.mealPrepItem.create({
    data: { label, imageUrl, memberId: member?.id ?? null },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `added "${label}" to meal prep`);
  }
  revalidatePath("/");
}

export async function updateMealPrepItem(id: number, label: string) {
  await prisma.mealPrepItem.update({
    where: { id },
    data: { label },
  });
  revalidatePath("/");
}

export async function deleteMealPrepItem(id: number) {
  const member = await getCurrentMember();
  await prisma.mealPrepItem.delete({
    where: { id },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "removed a meal prep item");
  }
  revalidatePath("/");
}

// ===== READ STATE =====

const VALID_SECTIONS = ["notes", "todos", "groceries", "diningOut", "mealPrep", "dinners", "sharedLinks"] as const;
type Section = (typeof VALID_SECTIONS)[number];

export async function markSectionRead(section: Section): Promise<void> {
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  if (!VALID_SECTIONS.includes(section)) return;

  await prisma.memberReadState.upsert({
    where: { memberId_section: { memberId, section } },
    update: { lastSeenAt: new Date() },
    create: { memberId, section, lastSeenAt: new Date() },
  });
}

export async function getUnreadCounts(): Promise<{
  notes: number;
  todos: number;
  groceries: number;
  diningOut: number;
  mealPrep: number;
  dinnerComments: number;
  sharedLinks: number;
}> {
  const memberId = await getCurrentMemberId();
  if (!memberId) return { notes: 0, todos: 0, groceries: 0, diningOut: 0, mealPrep: 0, dinnerComments: 0, sharedLinks: 0 };

  const states = await prisma.memberReadState.findMany({
    where: { memberId },
  });
  const lastSeen = (section: Section) =>
    states.find((s) => s.section === section)?.lastSeenAt ?? new Date(0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [notes, todos, groceries, diningOut, mealPrep, sharedLinks, noteComments, diningOutComments, dinnerComments] = await Promise.all([
    prisma.note.count({
      where: {
        createdAt: { gt: lastSeen("notes") },
        NOT: { memberId },
      },
    }),
    prisma.todo.count({
      where: {
        createdAt: { gt: lastSeen("todos") },
        NOT: { memberId },
      },
    }),
    prisma.grocery.count({
      where: {
        createdAt: { gt: lastSeen("groceries") },
        NOT: { memberId },
      },
    }),
    prisma.diningOut.count({
      where: {
        date: { gte: startOfMonth, lt: startOfNextMonth, gt: lastSeen("diningOut") },
        NOT: { memberId },
      },
    }),
    prisma.mealPrepItem.count({
      where: {
        createdAt: { gt: lastSeen("mealPrep") },
        NOT: { memberId },
      },
    }),
    prisma.sharedLink.count({
      where: {
        createdAt: { gt: lastSeen("sharedLinks") },
        NOT: { memberId },
      },
    }),
    // Comments on notes by others since lastSeen("notes")
    prisma.comment.count({
      where: {
        createdAt: { gt: lastSeen("notes") },
        NOT: { memberId },
        noteId: { not: null },
      },
    }),
    // Comments on diningOut entries by others since lastSeen("diningOut")
    prisma.comment.count({
      where: {
        createdAt: { gt: lastSeen("diningOut") },
        NOT: { memberId },
        diningOutId: { not: null },
      },
    }),
    // Comments on dinner entries by others since lastSeen("dinners")
    prisma.comment.count({
      where: {
        createdAt: { gt: lastSeen("dinners") },
        NOT: { memberId },
        dinnerId: { not: null },
      },
    }),
  ]);

  return {
    notes: notes + noteComments,
    todos,
    groceries,
    diningOut: diningOut + diningOutComments,
    mealPrep,
    dinnerComments,
    sharedLinks,
  };
}

// ===== SHARED LINKS =====

export async function getSharedLinks() {
  return prisma.sharedLink.findMany({
    orderBy: { createdAt: "desc" },
    include: { member: true },
  });
}

export async function createSharedLink(url: string, title: string, description: string) {
  const member = await getCurrentMember();
  await prisma.sharedLink.create({
    data: { url, title, description, memberId: member?.id ?? null },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `shared a link: "${title}"`);
  }
  revalidatePath("/");
}

export async function updateSharedLink(id: number, url: string, title: string, description: string) {
  const member = await getCurrentMember();
  await prisma.sharedLink.update({ where: { id }, data: { url, title, description } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `updated a shared link: "${title}"`);
  }
  revalidatePath("/");
}

export async function deleteSharedLink(id: number) {
  const member = await getCurrentMember();
  await prisma.sharedLink.delete({ where: { id } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "removed a shared link");
  }
  revalidatePath("/");
}

// ===== ACTIVITY FEED =====

export async function getActivityFeed() {
  return getActivities();
}

export async function getMembersLastSeen() {
  return getLastSeen();
}

// ===== ACHIEVEMENTS =====

const ACHIEVEMENT_DEFINITIONS = [
  // Fitness
  { key: "workout_first",      name: "First Rep",           emoji: "💪", description: "Log your first workout ever",              category: "fitness" },
  { key: "workout_three_week", name: "On A Roll",           emoji: "🔥", description: "Log 3 workouts in a single week",           category: "fitness" },
  { key: "workout_full_week",  name: "Iron Will",           emoji: "🏆", description: "Log all 7 days in a single week",           category: "fitness" },
  // To-Do
  { key: "todo_first_complete",   name: "Task Tackler",       emoji: "✅", description: "Complete your first to-do",               category: "todo" },
  { key: "todo_five_complete",    name: "Getting Things Done",emoji: "⚡", description: "Complete 5 to-dos",                       category: "todo" },
  { key: "todo_twenty_complete",  name: "Productivity Pro",   emoji: "🎯", description: "Complete 20 to-dos",                      category: "todo" },
  // Photos
  { key: "photo_first",    name: "Shutter Bug",      emoji: "📸", description: "Upload your first family photo",                  category: "photos" },
  { key: "photo_five",     name: "Memory Maker",     emoji: "🖼️", description: "Upload 5 family photos",                         category: "photos" },
  { key: "photo_fifteen",  name: "Family Archivist", emoji: "🎞️", description: "Upload 15 family photos",                        category: "photos" },
  // Dining Out
  { key: "dining_first",       name: "Foodie",          emoji: "🍽️", description: "Log your first dining out entry",             category: "dining" },
  { key: "dining_budget",      name: "Budget Buddy",    emoji: "💰", description: "Add a single dining out entry under $15",      category: "dining" },
  { key: "dining_five_month",  name: "Regular Patron",  emoji: "🌮", description: "Log 5 dining out entries in a single month",  category: "dining" },
] as const;

async function ensureAchievementsSeeded() {
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    await prisma.achievement.upsert({
      where: { key: def.key },
      update: { name: def.name, emoji: def.emoji, description: def.description, category: def.category },
      create: def,
    });
  }
}

type AchievementContext =
  | { type: "fitness" }
  | { type: "todo" }
  | { type: "photos" }
  | { type: "dining"; amount: number };

async function checkAndAwardAchievements(memberId: number, context: AchievementContext) {
  // Load all achievement definitions (keyed for lookup)
  const allDefs = await prisma.achievement.findMany();
  const defByKey = Object.fromEntries(allDefs.map((a) => [a.key, a]));

  // Load already-earned achievement IDs for this member
  const earned = await prisma.memberAchievement.findMany({
    where: { memberId },
    select: { achievementId: true },
  });
  const earnedIds = new Set(earned.map((e) => e.achievementId));

  const award = async (key: string) => {
    const def = defByKey[key];
    if (!def || earnedIds.has(def.id)) return;
    await prisma.memberAchievement.create({
      data: { memberId, achievementId: def.id },
    });
  };

  if (context.type === "fitness") {
    // All-time count
    const allTime = await prisma.fitnessLog.count({ where: { memberId } });
    if (allTime >= 1) await award("workout_first");

    // Current week count
    const day = new Date().getDay();
    const daysFromMonday = (day + 6) % 7;
    const now = new Date();
    const weekStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday));
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekCount = await prisma.fitnessLog.count({
      where: { memberId, date: { gte: weekStart, lt: weekEnd } },
    });
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
    const monthCount = await prisma.diningOut.count({
      where: { memberId, date: { gte: startOfMonth, lt: startOfNextMonth } },
    });
    if (monthCount >= 1) await award("dining_first");
    if (context.amount < 15) await award("dining_budget");
    if (monthCount >= 5) await award("dining_five_month");
  }
}

export async function getAchievementsData() {
  await ensureAchievementsSeeded();

  const memberId = await getCurrentMemberId();

  const allAchievements = await prisma.achievement.findMany({
    orderBy: { id: "asc" },
  });

  if (!memberId) {
    return {
      allAchievements,
      earnedAchievements: [] as { achievementId: number; earnedAt: Date }[],
      progress: { fitnessWeek: 0, fitnessAllTime: 0, todosCompleted: 0, photosUploaded: 0, diningMonthCount: 0 },
    };
  }

  const day = new Date().getDay();
  const daysFromMonday = (day + 6) % 7;
  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday));
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [earnedAchievements, fitnessWeek, fitnessAllTime, stats, diningMonthCount] = await Promise.all([
    prisma.memberAchievement.findMany({
      where: { memberId },
      select: { achievementId: true, earnedAt: true },
    }),
    prisma.fitnessLog.count({ where: { memberId, date: { gte: weekStart, lt: weekEnd } } }),
    prisma.fitnessLog.count({ where: { memberId } }),
    prisma.memberStats.findUnique({ where: { memberId } }),
    prisma.diningOut.count({ where: { memberId, date: { gte: startOfMonth, lt: startOfNextMonth } } }),
  ]);

  return {
    allAchievements,
    earnedAchievements,
    progress: {
      fitnessWeek,
      fitnessAllTime,
      todosCompleted: stats?.todosCompleted ?? 0,
      photosUploaded: stats?.photosUploaded ?? 0,
      diningMonthCount,
    },
  };
}

// ===== COMMENTS =====

type CommentWithMember = {
  id: number;
  content: string;
  createdAt: Date;
  memberId: number | null;
  member: { id: number; name: string; emoji: string; color: string } | null;
};

export async function getCommentsForNote(noteId: number): Promise<CommentWithMember[]> {
  return prisma.comment.findMany({
    where: { noteId },
    include: { member: { select: { id: true, name: true, emoji: true, color: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getCommentsForDiningOut(entryId: number): Promise<CommentWithMember[]> {
  return prisma.comment.findMany({
    where: { diningOutId: entryId },
    include: { member: { select: { id: true, name: true, emoji: true, color: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getCommentsForDinner(dinnerId: number): Promise<CommentWithMember[]> {
  return prisma.comment.findMany({
    where: { dinnerId },
    include: { member: { select: { id: true, name: true, emoji: true, color: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addComment(
  content: string,
  target: { noteId?: number; diningOutId?: number; dinnerId?: number }
): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;
  const member = await getCurrentMember();
  await prisma.comment.create({
    data: {
      content: trimmed,
      memberId: member?.id ?? null,
      noteId: target.noteId ?? null,
      diningOutId: target.diningOutId ?? null,
      dinnerId: target.dinnerId ?? null,
    },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "left a comment");
  }
  revalidatePath("/");
}

export async function deleteComment(id: number): Promise<void> {
  await prisma.comment.delete({ where: { id } });
  revalidatePath("/");
}
