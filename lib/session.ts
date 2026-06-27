import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getCurrentMemberId(): Promise<number | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("family-member-id")?.value;
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return isNaN(id) || id <= 0 ? null : id;
}

export async function getCurrentMember() {
  const id = await getCurrentMemberId();
  if (!id) return null;
  return prisma.member.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      emoji: true,
      color: true,
      theme: true,
      notificationsEnabled: true,
      backgroundImage: true,
      camUrl: true,
      llmServerUrl: true,
      llmModel: true,
      aiProvider: true,
      createdAt: true,
    }
  });
}

export async function getCurrentMemberTheme(): Promise<"light" | "dark"> {
  const member = await getCurrentMember();
  return member?.theme === "dark" ? "dark" : "light";
}

export async function getCurrentMemberNotificationsEnabled(): Promise<boolean> {
  const member = await getCurrentMember();
  return member?.notificationsEnabled ?? true;
}
