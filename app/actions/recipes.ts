"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { load } from "cheerio";
import { ActionResult, tryAction, RECIPE_CATEGORIES } from "./shared";

export async function getRecipeLinks(search?: string, rating?: number, category?: string, page: number = 0, limit: number = 20) {
  const where: any = {};
  if (rating && rating > 0) where.rating = rating;
  if (category) where.category = category;
  if (search && search.trim()) {
    where.OR = [
      { title: { contains: search.trim() } },
      { description: { contains: search.trim() } },
    ];
  }
  const [total, rows] = await Promise.all([
    prisma.recipeLink.count({ where }),
    prisma.recipeLink.findMany({
      where,
      include: { member: { select: { id: true, name: true, emoji: true, color: true } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip: page * limit,
      take: limit,
    }),
  ]);
  return { rows, total, page, limit, hasMore: (page + 1) * limit < total };
}

export async function createRecipeLink(url: string, category: string = "Uncategorized") {
  if (!url || !url.trim()) return;
  const member = await getCurrentMember();
  const existing = await prisma.recipeLink.findUnique({ where: { url: url.trim() } });
  if (existing) return;
  const link = await prisma.recipeLink.create({
    data: { url: url.trim(), title: url.trim(), category, memberId: member?.id ?? null },
    include: { member: { select: { id: true, name: true, emoji: true, color: true } } },
  });
  // Fetch OG metadata with timeout so image/title appear immediately
  await Promise.race([
    fetchMetadataBackground(link.id, url.trim()),
    new Promise<void>(resolve => setTimeout(resolve, 5000)),
  ]);
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `added a recipe bookmark: "${url}"`);
  }
  revalidatePath("/");
  return link;
}

async function fetchMetadataBackground(recipeId: number, url: string) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FamilyDashboard/1.0)" },
    });
    if (!response.ok) return;
    const html = await response.text();
    const $ = load(html);
    const title = $('meta[property="og:title"]').attr("content") || $('meta[name="twitter:title"]').attr("content") || $("title").text() || url;
    const description = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || $('meta[name="twitter:description"]').attr("content") || "";
    let imageUrl = $('meta[property="og:image"]').attr("content") || "";
    if (!imageUrl) imageUrl = $('meta[name="twitter:image"]').attr("content") || "";
    if (imageUrl && !imageUrl.startsWith("http")) {
      try { const base = new URL(url); imageUrl = new URL(imageUrl, base.origin).href; } catch {}
    }
    await prisma.recipeLink.update({ where: { id: recipeId }, data: { title: title.slice(0, 500), description: description.slice(0, 2000), imageUrl } });
  } catch (e: any) {
    console.error("Failed to fetch recipe metadata:", e?.message);
  }
}

export async function updateRecipeLink(id: number, data: { rating?: number; featured?: boolean; category?: string }) {
  const member = await getCurrentMember();
  const link = await prisma.recipeLink.update({
    where: { id }, data,
    include: { member: { select: { id: true, name: true, emoji: true, color: true } } },
  });
  if (member) {
    const changes = Object.entries(data).filter(([_, v]) => v !== undefined).map(([k]) => k).join(", ");
    logActivity(member.id, member.name, member.emoji, member.color, `updated a recipe bookmark (#${id}): ${changes}`);
  }
  revalidatePath("/");
  return link;
}

export async function deleteRecipeLink(id: number) {
  const member = await getCurrentMember();
  await prisma.recipeLink.delete({ where: { id } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `removed a recipe bookmark (#${id})`);
  }
  revalidatePath("/");
}

export async function getRecipesCategories() {
  try {
    const results = await prisma.recipeLink.groupBy({ by: ["category"], _count: { id: true }, orderBy: { category: "asc" } });
    const dbCategories = new Set(results.map((r) => r.category));
    const merged = new Set(RECIPE_CATEGORIES);
    for (const cat of dbCategories) merged.add(cat);
    return Array.from(merged);
  } catch {
    return RECIPE_CATEGORIES;
  }
}

export async function exportRecipeLinks() {
  return prisma.recipeLink.findMany({
    include: {
      member: { select: { id: true, name: true, emoji: true, color: true } },
      comments: { include: { member: { select: { id: true, name: true, emoji: true, color: true } } }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function importRecipeLinks(data: Array<{ url: string; title?: string; description?: string; imageUrl?: string; rating?: number; featured?: boolean; category?: string }>) {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  if (data.length === 0) return { imported, skipped, errors };
  const seen = new Set<string>();
  const deduped: typeof data = [];
  for (const item of data) {
    if (seen.has(item.url)) { skipped++; continue; }
    seen.add(item.url);
    deduped.push(item);
  }
  const urls = deduped.map((d) => d.url);
  const existing = await prisma.recipeLink.findMany({ where: { url: { in: urls } }, select: { url: true } });
  const existingUrls = new Set(existing.map((e) => e.url));
  const newItems = deduped.filter((item) => {
    if (existingUrls.has(item.url)) { skipped++; return false; }
    return true;
  });
  if (newItems.length > 0) {
    await prisma.recipeLink.createMany({
      data: newItems.map((item) => ({
        url: item.url, title: item.title || item.url, description: item.description || "",
        imageUrl: item.imageUrl || "", rating: item.rating || 0, featured: item.featured || false,
        category: item.category || "Uncategorized",
      })),
    });
  }
  imported = newItems.length;
  revalidatePath("/");
  return { imported, skipped, errors };
}
