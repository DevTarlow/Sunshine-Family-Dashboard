"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { ActionResult, tryAction } from "./shared";

export async function getNotes() {
  return prisma.note.findMany({ orderBy: { createdAt: "desc" }, include: { member: true } });
}

export async function createNote(content: string) {
  if (!content || !content.trim()) return;
  const member = await getCurrentMember();
  await prisma.note.create({ data: { content: content.trim(), memberId: member?.id ?? null } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "added a note");
  }
  revalidatePath("/");
}

export async function updateNote(id: number, content: string) {
  if (!content || !content.trim()) return;
  const member = await getCurrentMember();
  await prisma.note.update({ where: { id }, data: { content: content.trim() } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "updated a note");
  }
  revalidatePath("/");
}

export async function deleteNote(id: number) {
  const member = await getCurrentMember();
  await prisma.note.delete({ where: { id } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "deleted a note");
  }
  revalidatePath("/");
}
