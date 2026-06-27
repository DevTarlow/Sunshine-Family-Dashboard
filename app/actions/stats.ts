"use server";

import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import { ActionResult, tryAction } from "./shared";

export interface FamilyStats {
  totalWorkouts: number;
  lastMonthDiningTotal: number;
  totalDining: number;
  photosTaken: number;
  achievementsEarned: number;
  familyMembers: number;
}

export async function getFamilyStats() {
  const now = new Date();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [totalWorkouts, achievementsEarned, familyMembers, lastMonthDining, totalDining] = await Promise.all([
    prisma.fitnessLog.count(),
    prisma.memberAchievement.count(),
    prisma.member.count(),
    prisma.diningOut.aggregate({ _sum: { amount: true }, where: { date: { gte: startOfLastMonth, lt: startOfThisMonth } } }),
    prisma.diningOut.aggregate({ _sum: { amount: true } }),
  ]);
  let photosTaken = 0;
  try {
    const photosDirectory = path.join(process.cwd(), "public/photos");
    const filenames = await fs.readdir(photosDirectory);
    photosTaken = filenames.filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file)).length;
  } catch {}
  return { totalWorkouts, lastMonthDiningTotal: lastMonthDining._sum.amount ?? 0, totalDining: totalDining._sum.amount ?? 0, photosTaken, achievementsEarned, familyMembers };
}
