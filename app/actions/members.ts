"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { touchLastSeen } from "@/lib/activityStore";
import { getCurrentMemberId } from "@/lib/session";
import { ActionResult, tryAction } from "./shared";

export async function getMembers() {
  return prisma.member.findMany({ orderBy: { createdAt: "asc" } });
}

export async function createAndSelectMember(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const emoji = (formData.get("emoji") as string) || "😊";
  const color = (formData.get("color") as string) || "blue";
  if (!name) return;
  let member;
  try {
    member = await prisma.member.create({ data: { name, emoji, color } });
  } catch {
    return;
  }
  touchLastSeen(member.id);
  const cookieStore = await cookies();
  cookieStore.set("family-member-id", String(member.id), { path: "/", httpOnly: true, sameSite: "lax" });
  revalidatePath("/");
  redirect("/");
}

export async function selectMember(id: number) {
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) redirect("/login");
  touchLastSeen(member.id);
  const cookieStore = await cookies();
  cookieStore.set("family-member-id", String(id), { path: "/", httpOnly: true, sameSite: "lax" });
  revalidatePath("/");
  redirect("/");
}

export async function deleteMember(id: number) {
  await prisma.member.delete({ where: { id } });
  const cookieStore = await cookies();
  const raw = cookieStore.get("family-member-id")?.value;
  if (raw && parseInt(raw, 10) === id) {
    cookieStore.delete("family-member-id");
  }
  revalidatePath("/login");
}

export async function logOut() {
  const cookieStore = await cookies();
  cookieStore.delete("family-member-id");
  redirect("/login");
}

export async function updateMemberTheme(formData: FormData) {
  const theme = formData.get("theme") as string;
  if (theme !== "light" && theme !== "dark") return;
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({ where: { id: memberId }, data: { theme } });
  revalidatePath("/");
}

export async function updateNotificationsEnabled(formData: FormData) {
  const enabled = formData.get("enabled");
  const notificationsEnabled = enabled === "true" || enabled === "on";
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({ where: { id: memberId }, data: { notificationsEnabled } });
  revalidatePath("/");
}

export async function getCamUrl() {
  const memberId = await getCurrentMemberId();
  if (!memberId) return null;
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  return (member as any)?.camUrl ?? null;
}

export async function updateCamUrl(formData: FormData) {
  const camUrl = formData.get("camUrl") as string;
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({ where: { id: memberId }, data: { camUrl: camUrl?.trim() || null } });
  revalidatePath("/");
}

export async function getLLMConfig() {
  const memberId = await getCurrentMemberId();
  if (!memberId) return { serverUrl: null, model: null, aiProvider: "local" };
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  return {
    serverUrl: (member as any)?.llmServerUrl ?? null,
    model: (member as any)?.llmModel ?? null,
    aiProvider: (member as any)?.aiProvider ?? "local",
  };
}

export async function updateLLMConfig(formData: FormData) {
  const serverUrl = formData.get("serverUrl") as string;
  const model = formData.get("model") as string;
  const aiProvider = formData.get("aiProvider") as string;
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  const data: any = {};
  if (aiProvider === "local" || aiProvider === "gemini") {
    data.aiProvider = aiProvider;
  }
  if (serverUrl !== null) data.llmServerUrl = serverUrl?.trim() || null;
  if (model !== null) data.llmModel = model?.trim() || null;
  await prisma.member.update({
    where: { id: memberId },
    data,
  });
  revalidatePath("/");
}

export async function updateMemberAccentColor(formData: FormData) {
  const accentColor = formData.get("accentColor") as string;
  const validColors = ["blue", "red", "green", "purple", "orange", "pink", "yellow", "teal", "indigo", "cyan", "amber", "rose"];
  if (!validColors.includes(accentColor)) return;
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({ where: { id: memberId }, data: { accentColor } });
  revalidatePath("/");
}
