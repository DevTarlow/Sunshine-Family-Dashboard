"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { checkAndAwardAchievements } from "./shared";
import { ActionResult, tryAction } from "./shared";

export async function getDiningOutEntries() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return prisma.diningOut.findMany({
    where: { date: { gte: startOfMonth, lt: startOfNextMonth } },
    orderBy: { date: "desc" },
    include: { member: true },
  });
}

export async function getLastMonthDiningOutTotal() {
  const now = new Date();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await prisma.diningOut.aggregate({
    _sum: { amount: true },
    where: { date: { gte: startOfLastMonth, lt: startOfThisMonth } },
  });
  return result._sum.amount ?? 0;
}

export async function addDiningOutEntry(amount: number, description: string) {
  if (typeof amount !== "number" || !isFinite(amount) || amount <= 0) return;
  const member = await getCurrentMember();
  await prisma.diningOut.create({ data: { amount, description, memberId: member?.id ?? null } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `logged dining out ($${amount.toFixed(2)})`);
    await checkAndAwardAchievements(member.id, { type: "dining", amount });
  }
  revalidatePath("/");
}

export async function updateDiningOutEntry(id: number, amount: number, description: string) {
  if (typeof amount !== "number" || !isFinite(amount) || amount <= 0) return;
  await prisma.diningOut.update({ where: { id }, data: { amount, description } });
  revalidatePath("/");
}

export async function deleteDiningOutEntry(id: number) {
  const member = await getCurrentMember();
  await prisma.diningOut.delete({ where: { id } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "removed a dining out entry");
  }
  revalidatePath("/");
}
