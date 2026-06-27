"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { ActionResult, tryAction } from "./shared";

const MEAL_TIMES = ["breakfast", "lunch", "dinner"] as const;

export async function getWeekStart(date: Date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(Date.UTC(d.getFullYear(), d.getMonth(), diff));
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}

async function getWeekEnd(weekStart: Date): Promise<Date> {
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  return weekEnd;
}

function getDayOfWeek(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

export async function getPlannedMeals(weekStart: Date) {
  const weekEnd = await getWeekEnd(weekStart);
  return prisma.plannedMeal.findMany({
    where: { mealDate: { gte: weekStart, lt: weekEnd } },
    include: {
      member: { select: { id: true, name: true, emoji: true, color: true } },
      recipeLink: { select: { id: true, url: true, title: true, imageUrl: true } },
      comments: { select: { id: true } },
    },
    orderBy: [{ mealDate: "asc" }, { mealTime: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });
}

export async function createPlannedMeal(mealDate: Date, mealTime: string, mealName: string, recipeLinkId?: number) {
  if (!mealName || !mealName.trim()) return;
  const member = await getCurrentMember();
  const dayOfWeek = getDayOfWeek(new Date(mealDate));
  const maxSort = await prisma.plannedMeal.findFirst({
    where: { mealDate, mealTime },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const meal = await prisma.plannedMeal.create({
    data: {
      mealDate, dayOfWeek, mealTime, mealName: mealName.trim(),
      sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      recipeLinkId: recipeLinkId ?? null, memberId: member?.id ?? null,
    },
    include: {
      member: { select: { id: true, name: true, emoji: true, color: true } },
      recipeLink: { select: { id: true, url: true, title: true, imageUrl: true } },
      comments: { select: { id: true } },
    },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `planned "${mealName}" for ${dayOfWeek} ${mealTime}`);
  }
  revalidatePath("/");
  return meal;
}

export async function updatePlannedMeal(id: number, data: { mealName?: string; recipeLinkId?: number | null; mealDate?: Date; mealTime?: string }) {
  const member = await getCurrentMember();
  const updateData: any = {};
  if (data.mealName !== undefined) updateData.mealName = data.mealName;
  if (data.recipeLinkId !== undefined) updateData.recipeLinkId = data.recipeLinkId;
  if (data.mealDate !== undefined) { updateData.mealDate = data.mealDate; updateData.dayOfWeek = getDayOfWeek(new Date(data.mealDate)); }
  if (data.mealTime !== undefined) updateData.mealTime = data.mealTime;
  await prisma.plannedMeal.update({ where: { id }, data: updateData });
  if (member) logActivity(member.id, member.name, member.emoji, member.color, "updated a planned meal");
  revalidatePath("/");
}

export async function deletePlannedMeal(id: number) {
  const member = await getCurrentMember();
  await prisma.plannedMeal.delete({ where: { id } });
  if (member) logActivity(member.id, member.name, member.emoji, member.color, "removed a planned meal");
  revalidatePath("/");
}

export async function reorderPlannedMeals(entries: { id: number; sortOrder: number; mealDate?: Date; mealTime?: string }[]) {
  const member = await getCurrentMember();
  await prisma.$transaction(
    entries.map((entry) => {
      const updateData: any = { sortOrder: entry.sortOrder };
      if (entry.mealDate !== undefined) { updateData.mealDate = entry.mealDate; updateData.dayOfWeek = getDayOfWeek(new Date(entry.mealDate)); }
      if (entry.mealTime !== undefined) updateData.mealTime = entry.mealTime;
      return prisma.plannedMeal.update({ where: { id: entry.id }, data: updateData });
    })
  );
  if (member) logActivity(member.id, member.name, member.emoji, member.color, "reordered planned meals");
  revalidatePath("/");
}

export async function cleanupPastMeals() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const pastMeals = await prisma.plannedMeal.findMany({
    where: { mealDate: { lt: today } },
    include: { recipeLink: { select: { url: true } } },
  });
  if (pastMeals.length === 0) return 0;
  await prisma.$transaction(async (tx) => {
    await tx.archivedMeal.createMany({
      data: pastMeals.map((m) => ({
        originalId: m.id, mealDate: m.mealDate, dayOfWeek: m.dayOfWeek, mealTime: m.mealTime,
        mealName: m.mealName, recipeLink: m.recipeLink?.url ?? null,
      })),
    });
    await tx.plannedMeal.deleteMany({ where: { id: { in: pastMeals.map((m) => m.id) } } });
  });
  const member = await getCurrentMember();
  if (member) logActivity(member.id, member.name, member.emoji, member.color, `archived ${pastMeals.length} past meals`);
  revalidatePath("/");
  return pastMeals.length;
}

export async function getArchivedMeals(search?: string, page: number = 0, limit: number = 50) {
  const where: any = {};
  if (search?.trim()) where.mealName = { contains: search.trim() };
  const [rows, total] = await Promise.all([
    prisma.archivedMeal.findMany({ where, orderBy: { archivedAt: "desc" }, skip: page * limit, take: limit }),
    prisma.archivedMeal.count({ where }),
  ]);
  return { rows, total, hasMore: (page + 1) * limit < total };
}
