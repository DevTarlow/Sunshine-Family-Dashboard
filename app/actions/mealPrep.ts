"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { fetchFoodEmoji } from "./shared";
import { ActionResult, tryAction } from "./shared";

export async function getMealPrepItems() {
  return prisma.mealPrepItem.findMany({ orderBy: { createdAt: "desc" }, include: { member: true } });
}

export async function createMealPrepItem(label: string) {
  if (!label || !label.trim()) return;
  const member = await getCurrentMember();
  const imageUrl = await fetchFoodEmoji(label);
  await prisma.mealPrepItem.create({
    data: { label: label.trim(), imageUrl, memberId: member?.id ?? null },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `added "${label}" to meal prep`);
  }
  revalidatePath("/");
}

export async function updateMealPrepItem(id: number, label: string) {
  if (!label || !label.trim()) return;
  await prisma.mealPrepItem.update({ where: { id }, data: { label: label.trim() } });
  revalidatePath("/");
}

export async function deleteMealPrepItem(id: number) {
  const member = await getCurrentMember();
  await prisma.mealPrepItem.delete({ where: { id } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "removed a meal prep item");
  }
  revalidatePath("/");
}
