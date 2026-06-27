"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ActionResult, tryAction } from "./shared";

export async function archiveOldNotes() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const oldNotes = await prisma.note.findMany({
    where: { createdAt: { lt: thirtyDaysAgo } },
    include: { member: { select: { name: true, emoji: true, color: true } } },
  });
  if (oldNotes.length === 0) return 0;
  await prisma.$transaction(async (tx) => {
    await tx.archivedNote.createMany({
      data: oldNotes.map((n) => ({
        originalId: n.id,
        content: n.content,
        createdAt: n.createdAt,
        memberId: n.memberId,
        memberName: n.member?.name ?? null,
        memberEmoji: n.member?.emoji ?? null,
        memberColor: n.member?.color ?? null,
      })),
    });
    await tx.note.deleteMany({ where: { id: { in: oldNotes.map((n) => n.id) } } });
  });
  return oldNotes.length;
}

export async function getArchivedNotes(search?: string, page: number = 0, limit: number = 50) {
  const where: any = {};
  if (search?.trim()) where.content = { contains: search.trim() };
  const [rows, total] = await Promise.all([
    prisma.archivedNote.findMany({ where, orderBy: { archivedAt: "desc" }, skip: page * limit, take: limit }),
    prisma.archivedNote.count({ where }),
  ]);
  return { rows, total, hasMore: (page + 1) * limit < total };
}

export async function getDeletedTodos(search?: string, page: number = 0, limit: number = 50) {
  const where: any = {};
  if (search?.trim()) where.task = { contains: search.trim() };
  const [rows, total] = await Promise.all([
    prisma.deletedTodo.findMany({ where, orderBy: { deletedAt: "desc" }, skip: page * limit, take: limit }),
    prisma.deletedTodo.count({ where }),
  ]);
  return { rows, total, hasMore: (page + 1) * limit < total };
}

export async function getDeletedMealPrepItems(search?: string, page: number = 0, limit: number = 50) {
  const where: any = {};
  if (search?.trim()) where.label = { contains: search.trim() };
  const [rows, total] = await Promise.all([
    prisma.deletedMealPrepItem.findMany({ where, orderBy: { deletedAt: "desc" }, skip: page * limit, take: limit }),
    prisma.deletedMealPrepItem.count({ where }),
  ]);
  return { rows, total, hasMore: (page + 1) * limit < total };
}
