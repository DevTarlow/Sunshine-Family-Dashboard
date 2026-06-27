"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { ActionResult, tryAction } from "./shared";

export async function getGroceries() {
  return prisma.grocery.findMany({ orderBy: [{ category: "asc" }, { id: "asc" }], include: { member: true } });
}

export async function getGroceryCategories() {
  try {
    const categories = await prisma.groceryCategory.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
    if (categories.length === 0) {
      await seedDefaultCategories();
      return prisma.groceryCategory.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
    }
    return categories;
  } catch {
    return [];
  }
}

export async function createGrocery(item: string, category = "Other") {
  if (!item || !item.trim()) return;
  const member = await getCurrentMember();
  await prisma.grocery.create({ data: { item: item.trim(), category, memberId: member?.id ?? null } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `added "${item}" to groceries`);
  }
  revalidatePath("/");
}

export async function updateGroceryCategory(id: number, category: string) {
  const member = await getCurrentMember();
  await prisma.grocery.update({ where: { id }, data: { category } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `moved a grocery item to "${category}"`);
  }
  revalidatePath("/");
}

export async function toggleGrocery(id: number, isBought: boolean) {
  const member = await getCurrentMember();
  await prisma.grocery.update({ where: { id }, data: { isBought } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, isBought ? "checked off a grocery" : "unchecked a grocery");
  }
  revalidatePath("/");
}

export async function deleteGrocery(id: number) {
  const member = await getCurrentMember();
  await prisma.grocery.delete({ where: { id } });
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

export async function createGroceryCategory(name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) return;
  const member = await getCurrentMember();
  await prisma.groceryCategory.create({ data: { name: trimmedName, isDefault: false } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `created grocery category "${trimmedName}"`);
  }
  revalidatePath("/");
}

export async function deleteGroceryCategory(id: number) {
  const member = await getCurrentMember();
  const category = await prisma.groceryCategory.findUnique({ where: { id } });
  if (!category || category.isDefault) return;
  await prisma.$transaction(async (tx) => {
    await tx.grocery.updateMany({ where: { category: category.name }, data: { category: "Other" } });
    await tx.groceryCategory.delete({ where: { id } });
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `deleted grocery category "${category.name}"`);
  }
  revalidatePath("/");
}

async function seedDefaultCategories() {
  const DEFAULT_CATEGORIES = ["Produce", "Dairy", "Meat", "Bakery", "Frozen", "Beverages", "Pantry", "Snacks", "Household", "Other"];
  for (const name of DEFAULT_CATEGORIES) {
    await prisma.groceryCategory.upsert({ where: { name }, update: {}, create: { name, isDefault: true } });
  }
}
