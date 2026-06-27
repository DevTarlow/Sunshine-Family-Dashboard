"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { CommentWithMember } from "./shared";
import { ActionResult, tryAction } from "./shared";

type CommentTarget = { noteId?: number; diningOutId?: number; dinnerId?: number; plannedMealId?: number };

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

export async function getCommentsForPlannedMeal(plannedMealId: number): Promise<CommentWithMember[]> {
  return prisma.comment.findMany({
    where: { plannedMealId },
    include: { member: { select: { id: true, name: true, emoji: true, color: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addComment(content: string, target: CommentTarget) {
  const trimmed = content.trim();
  if (!trimmed) return;
  const parentCount = [target.noteId, target.diningOutId, target.dinnerId, target.plannedMealId]
    .filter((id) => id !== undefined).length;
  if (parentCount !== 1) return;
  const member = await getCurrentMember();
  await prisma.comment.create({
    data: {
      content: trimmed,
      memberId: member?.id ?? null,
      noteId: target.noteId ?? null,
      diningOutId: target.diningOutId ?? null,
      dinnerId: target.dinnerId ?? null,
      plannedMealId: target.plannedMealId ?? null,
    },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "left a comment");
  }
  revalidatePath("/");
}

export async function deleteComment(id: number) {
  await prisma.comment.delete({ where: { id } });
  revalidatePath("/");
}
