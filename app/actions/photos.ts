"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import { getCurrentMember, getCurrentMemberId } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { checkAndAwardAchievements, ALLOWED_IMAGE_TYPES, MAX_PHOTO_SIZE } from "./shared";
import { ActionResult, tryAction } from "./shared";

export async function getPhotos() {
  try {
    const photosDirectory = path.join(process.cwd(), "public/photos");
    const filenames = await fs.readdir(photosDirectory);
    const imageFiles = filenames.filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file)).sort((a, b) => b.localeCompare(a));
    return imageFiles.map((file) => `/photos/${file}`);
  } catch {
    return [];
  }
}

export async function uploadPhoto(formData: FormData) {
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return;
  if (file.size > MAX_PHOTO_SIZE) return;
  const ext = file.type === "image/jpeg" ? ".jpg" : file.type === "image/png" ? ".png" : file.type === "image/gif" ? ".gif" : ".webp";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const photosDir = path.join(process.cwd(), "public/photos");
  const dest = path.join(photosDir, safeName);
  if (!dest.startsWith(photosDir + path.sep) && dest !== photosDir) return;
  await fs.mkdir(photosDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buffer);
  const member = await getCurrentMember();
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, "uploaded a photo");
    await prisma.memberStats.upsert({
      where: { memberId: member.id },
      update: { photosUploaded: { increment: 1 } },
      create: { memberId: member.id, photosUploaded: 1, todosCompleted: 0 },
    });
    await checkAndAwardAchievements(member.id, { type: "photos" });
  }
  revalidatePath("/");
}

export async function deletePhoto(filename: string) {
  if (!filename || /[/\\]/.test(filename) || filename.includes("..")) return;
  const photosDir = path.join(process.cwd(), "public/photos");
  const dest = path.join(photosDir, filename);
  if (!dest.startsWith(photosDir + path.sep)) return;
  try {
    await fs.unlink(dest);
  } catch {}
  revalidatePath("/");
}

export async function getFavoritePhotos(): Promise<string[]> {
  const memberId = await getCurrentMemberId();
  if (!memberId) return [];
  const favorites = await prisma.photoFavorite.findMany({
    where: { memberId },
    orderBy: { id: "asc" },
  });
  return favorites.map((f) => f.filename);
}

export async function togglePhotoFavorite(filename: string): Promise<{ favorited: boolean }> {
  const memberId = await getCurrentMemberId();
  if (!memberId) return { favorited: false };
  const existing = await prisma.photoFavorite.findUnique({
    where: { memberId_filename: { memberId, filename } },
  });
  if (existing) {
    await prisma.photoFavorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  } else {
    await prisma.photoFavorite.create({ data: { memberId, filename } });
    return { favorited: true };
  }
}
