"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { checkAndAwardAchievements } from "./shared";
import { ActionResult, tryAction } from "./shared";

export async function getTodos() {
  return prisma.todo.findMany({ orderBy: { id: "asc" }, include: { member: true } });
}

export async function createTodo(task: string, reminderInterval?: number | null) {
  if (!task || !task.trim()) return;
  const member = await getCurrentMember();
  await prisma.todo.create({ data: { task: task.trim(), memberId: member?.id ?? null, reminderInterval: reminderInterval ?? null } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `added "${task}" to todos`);
  }
  revalidatePath("/");
}

export async function toggleTodo(id: number, isDone: boolean) {
  const member = await getCurrentMember();
  await prisma.todo.update({ where: { id }, data: { isDone } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, isDone ? "completed a todo" : "uncompleted a todo");
    if (isDone) {
      await prisma.memberStats.upsert({
        where: { memberId: member.id },
        update: { todosCompleted: { increment: 1 } },
        create: { memberId: member.id, todosCompleted: 1, photosUploaded: 0 },
      });
      await checkAndAwardAchievements(member.id, { type: "todo" });
    }
  }
  revalidatePath("/");
}

export async function deleteTodo(id: number) {
  const member = await getCurrentMember();
  await prisma.todo.delete({ where: { id } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "removed a todo");
  }
  revalidatePath("/");
}
