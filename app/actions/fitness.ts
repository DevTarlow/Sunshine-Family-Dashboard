"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { checkAndAwardAchievements, getWeekBounds } from "./shared";
import { ActionResult, tryAction } from "./shared";

export async function getFitnessLogs() {
  const { weekStart, weekEnd } = getWeekBounds();
  const logs = await prisma.fitnessLog.findMany({
    where: { date: { gte: weekStart, lt: weekEnd } },
    include: { member: true },
    orderBy: { date: "asc" },
  });
  return logs.map((log) => ({
    id: log.id,
    memberId: log.memberId,
    date: log.date.toISOString(),
    member: { name: log.member.name, emoji: log.member.emoji, color: log.member.color },
  }));
}

export async function toggleFitnessLog(dateStr: string) {
  if (!dateStr) return;
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
