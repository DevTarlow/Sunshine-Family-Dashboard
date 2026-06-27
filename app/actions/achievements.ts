"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMemberId } from "@/lib/session";
import { ensureAchievementsSeeded, getWeekBounds } from "./shared";
import { ActionResult, tryAction } from "./shared";

export async function getAchievementsData() {
  await ensureAchievementsSeeded();
  const memberId = await getCurrentMemberId();
  const allAchievements = await prisma.achievement.findMany({ orderBy: { id: "asc" } });
  if (!memberId) {
    return {
      allAchievements,
      earnedAchievements: [] as { achievementId: number; earnedAt: Date }[],
      progress: { fitnessWeek: 0, fitnessAllTime: 0, todosCompleted: 0, photosUploaded: 0, diningMonthCount: 0 },
    };
  }
  const { weekStart, weekEnd } = getWeekBounds();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [earnedAchievements, fitnessWeek, fitnessAllTime, stats, diningMonthCount] = await Promise.all([
    prisma.memberAchievement.findMany({ where: { memberId }, select: { achievementId: true, earnedAt: true } }),
    prisma.fitnessLog.count({ where: { memberId, date: { gte: weekStart, lt: weekEnd } } }),
    prisma.fitnessLog.count({ where: { memberId } }),
    prisma.memberStats.findUnique({ where: { memberId } }),
    prisma.diningOut.count({ where: { memberId, date: { gte: startOfMonth, lt: startOfNextMonth } } }),
  ]);
  return {
    allAchievements,
    earnedAchievements,
    progress: {
      fitnessWeek, fitnessAllTime,
      todosCompleted: stats?.todosCompleted ?? 0,
      photosUploaded: stats?.photosUploaded ?? 0,
      diningMonthCount,
    },
  };
}
