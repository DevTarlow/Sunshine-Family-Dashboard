"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { ActionResult, tryAction } from "./shared";

export async function getSharedLinks() {
  return prisma.sharedLink.findMany({ orderBy: { createdAt: "desc" }, include: { member: true } });
}

export async function createSharedLink(url: string, title: string, description: string) {
  if (!url || !url.trim()) return;
  if (!title || !title.trim()) return;
  const member = await getCurrentMember();
  await prisma.sharedLink.create({
    data: { url: url.trim(), title: title.trim(), description: description.trim(), memberId: member?.id ?? null },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `shared a link: "${title}"`);
  }
  revalidatePath("/");
}

export async function updateSharedLink(id: number, url: string, title: string, description: string) {
  if (!url || !url.trim()) return;
  if (!title || !title.trim()) return;
  const member = await getCurrentMember();
  await prisma.sharedLink.update({ where: { id }, data: { url: url.trim(), title: title.trim(), description: description.trim() } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `updated a shared link: "${title}"`);
  }
  revalidatePath("/");
}

export async function deleteSharedLink(id: number) {
  const member = await getCurrentMember();
  await prisma.sharedLink.delete({ where: { id } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "removed a shared link");
  }
  revalidatePath("/");
}
