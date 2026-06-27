"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { callAI } from "./shared";

export async function generateCelebration(context: string): Promise<string> {
  const prompt = `You are a fun, enthusiastic family dashboard assistant. Write a short, silly, family-friendly celebratory message or rhyme (1-2 sentences, emojis welcome) to celebrate this event: ${context}. Be creative and specific to the event. Reply with only the celebration message, nothing else.`;
  return await callAI(prompt, {
    systemPrompt: "You are a fun, enthusiastic family dashboard assistant.",
  });
}

export async function getVibeQuote(): Promise<string> {
  const quote = await callAI(
    "Generate an inspirational, family-friendly quote of the day. Keep it short (1-2 sentences). Return only the quote text, nothing else.",
    { systemPrompt: "You are a wise, uplifting quote generator that provides concise, meaningful quotes." }
  );
  return quote || "Every day is a fresh start.";
}

export async function getDinners() {
  return prisma.dinner.findMany({ orderBy: { id: "asc" } });
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
  await prisma.dinner.deleteMany({ where: { dayOfWeek } });
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
        ? prisma.dinner.upsert({ where: { dayOfWeek: e.dayOfWeek }, update: { meal: e.meal }, create: { dayOfWeek: e.dayOfWeek, meal: e.meal } })
        : prisma.dinner.deleteMany({ where: { dayOfWeek: e.dayOfWeek } })
    )
  );
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "reordered the weekly dinners");
  }
  revalidatePath("/");
}

export async function suggestDinnerIdea(): Promise<string> {
  const dinners = await prisma.dinner.findMany({ orderBy: { id: "asc" } });
  const mealList = dinners.length > 0 ? dinners.map((d) => `- ${d.meal}`).join("\n") : "No meals planned yet this week.";
  const prompt = `We are a family planning our weekly dinners. Here are the meals on our plan this week:\n${mealList}\n\nSuggest one dinner idea that would fit our tastes but is not already on the list. Reply with only the dinner name, nothing else.`;
  return await callAI(prompt, {
    systemPrompt: "You are a helpful family dinner planner with an exhaustive knowledge of global cuisines, seasonal ingredients, and creative family cooking.",
  });
}
