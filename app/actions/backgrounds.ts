"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import { getCurrentMemberId } from "@/lib/session";
import { getFavoritePhotos } from "./photos";
import { ALLOWED_IMAGE_TYPES, MAX_PHOTO_SIZE } from "./shared";
import { ActionResult, tryAction } from "./shared";

export async function getBackgrounds(): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), "public/backgrounds");
    const filenames = await fs.readdir(dir);
    const imageFiles = filenames.filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    return imageFiles.map((file) => `/backgrounds/${file}`);
  } catch {
    return [];
  }
}

export async function uploadBackground(formData: FormData) {
  const file = formData.get("background") as File | null;
  if (!file || file.size === 0) return;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return;
  if (file.size > MAX_PHOTO_SIZE) return;
  const ext = file.type === "image/jpeg" ? ".jpg" : file.type === "image/png" ? ".png" : file.type === "image/gif" ? ".gif" : ".webp";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const bgDir = path.join(process.cwd(), "public/backgrounds");
  const dest = path.join(bgDir, safeName);
  if (!dest.startsWith(bgDir + path.sep) && dest !== bgDir) return;
  await fs.mkdir(bgDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buffer);
  revalidatePath("/");
}

export async function setMemberBackground(filename: string | null) {
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({ where: { id: memberId }, data: { backgroundImage: filename } });
  revalidatePath("/");
}

export async function updateMemberPanelVisibility(visibility: string[]) {
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.member.update({
    where: { id: memberId },
    data: { panelVisibility: JSON.stringify(visibility) },
  });
  revalidatePath("/");
}

export async function getProfileData() {
  const memberId = await getCurrentMemberId();
  if (!memberId) return null;
  const [backgrounds, favoritePhotos, member, fitnessCount, todosCompleted, notesCreated, groceriesAdded, diningOutCount, favoritesCount, achievementsCount, memberStats] = await Promise.all([
    getBackgrounds(),
    getFavoritePhotos(),
    prisma.member.findUnique({ where: { id: memberId } }),
    prisma.fitnessLog.count({ where: { memberId } }),
    prisma.todo.count({ where: { memberId, isDone: true } }),
    prisma.note.count({ where: { memberId } }),
    prisma.grocery.count({ where: { memberId } }),
    prisma.diningOut.count({ where: { memberId } }),
    prisma.photoFavorite.count({ where: { memberId } }),
    prisma.memberAchievement.count({ where: { memberId } }),
    prisma.memberStats.findUnique({ where: { memberId } }),
  ]);
  return {
    backgrounds,
    favoritePhotos,
    panelVisibility: member?.panelVisibility ? JSON.parse(member.panelVisibility) as string[] : null,
    stats: {
      fitnessLogs: fitnessCount,
      todosCompleted,
      photosUploaded: memberStats?.photosUploaded ?? 0,
      notesCreated,
      groceriesAdded,
      diningOutEntries: diningOutCount,
      favoritePhotos: favoritesCount,
      achievementsEarned: achievementsCount,
      memberSince: member?.createdAt ?? new Date(),
    },
  };
}
