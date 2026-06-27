"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMemberId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { ActionResult, tryAction } from "./shared";

const SAFETY_FILE_PATH = path.join("/tmp", "family-dashboard-safety-latest.json");

export async function exportData() {
  try {
    const memberId = await getCurrentMemberId();
    if (!memberId) return { success: false, error: "Not authenticated" };
    const [
      members, fitnessLogs, dinners, notes, todos, groceries, groceryCategories,
      diningOut, mealPrepItems, achievements, memberAchievements, memberStats,
      photoFavorites, comments, sharedLinks, recipeLinks, calendarEvents,
      plannedMeals, archivedMeals, archivedNotes, deletedTodos, deletedMealPrepItems, familySettings,
    ] = await Promise.all([
      prisma.member.findMany({ include: { todos: true, groceries: true, notes: true, diningOut: true, fitnessLogs: true, mealPrepItems: true, readStates: true, achievements: true, memberStats: true, photoFavorites: true, comments: true, sharedLinks: true, recipeLinks: true } }),
      prisma.fitnessLog.findMany(),
      prisma.dinner.findMany(),
      prisma.note.findMany({ include: { comments: true } }),
      prisma.todo.findMany(),
      prisma.grocery.findMany(),
      prisma.groceryCategory.findMany(),
      prisma.diningOut.findMany({ include: { comments: true } }),
      prisma.mealPrepItem.findMany(),
      prisma.achievement.findMany(),
      prisma.memberAchievement.findMany(),
      prisma.memberStats.findMany(),
      prisma.photoFavorite.findMany(),
      prisma.comment.findMany(),
      prisma.sharedLink.findMany(),
      prisma.recipeLink.findMany({ include: { comments: true } }),
      prisma.calendarEvent.findMany(),
      prisma.plannedMeal.findMany(),
      prisma.archivedMeal.findMany(),
      prisma.archivedNote.findMany(),
      prisma.deletedTodo.findMany(),
      prisma.deletedMealPrepItem.findMany(),
      prisma.familySetting.findMany(),
    ]);
    const counts = {
      members: members.length, fitnessLogs: fitnessLogs.length, dinners: dinners.length,
      notes: notes.length, todos: todos.length, groceries: groceries.length,
      groceryCategories: groceryCategories.length, diningOut: diningOut.length,
      mealPrepItems: mealPrepItems.length, achievements: achievements.length,
      memberAchievements: memberAchievements.length, memberStats: memberStats.length,
      photoFavorites: photoFavorites.length, comments: comments.length, sharedLinks: sharedLinks.length,
      recipeLinks: recipeLinks.length, calendarEvents: calendarEvents.length,
      plannedMeals: plannedMeals.length, archivedMeals: archivedMeals.length,
      archivedNotes: archivedNotes.length, deletedTodos: deletedTodos.length,
      deletedMealPrepItems: deletedMealPrepItems.length, familySettings: familySettings.length,
    };
    const backupData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      data: {
        members, fitnessLogs, dinners, notes, todos, groceries, groceryCategories,
        diningOut, mealPrepItems, achievements, memberAchievements, memberStats,
        photoFavorites, comments, sharedLinks, recipeLinks, calendarEvents,
        plannedMeals, archivedMeals, archivedNotes, deletedTodos, deletedMealPrepItems, familySettings,
      },
    };
    return { success: true, data: backupData, counts };
  } catch (error) {
    console.error("Export failed:", error);
    return { success: false, error: "Failed to export data" };
  }
}

export async function importData(formData: FormData) {
  try {
    const memberId = await getCurrentMemberId();
    if (!memberId) return { success: false, error: "Not authenticated" };
    const file = formData.get("backupFile") as File;
    if (!file) return { success: false, error: "No file provided" };
    const text = await file.text();
    let backup;
    try { backup = JSON.parse(text); } catch { return { success: false, error: "Invalid JSON format" }; }
    if (!backup.version || !backup.data) return { success: false, error: "Invalid backup file structure" };
    const { data } = backup;
    if (!data.members || !Array.isArray(data.members)) return { success: false, error: "Backup missing required data: members" };
    await prisma.$transaction(async (tx) => {
      await tx.memberReadState.deleteMany();
      await tx.memberAchievement.deleteMany();
      await tx.photoFavorite.deleteMany();
      await tx.plannedMeal.deleteMany();
      await tx.comment.deleteMany();
      await tx.recipeLink.deleteMany();
      await tx.mealPrepItem.deleteMany();
      await tx.diningOut.deleteMany();
      await tx.grocery.deleteMany();
      await tx.groceryCategory.deleteMany();
      await tx.todo.deleteMany();
      await tx.note.deleteMany();
      await tx.fitnessLog.deleteMany();
      await tx.dinner.deleteMany();
      await tx.calendarEvent.deleteMany();
      await tx.archivedMeal.deleteMany();
      await tx.archivedNote.deleteMany();
      await tx.deletedTodo.deleteMany();
      await tx.deletedMealPrepItem.deleteMany();
      await tx.familySetting.deleteMany();
      await tx.memberStats.deleteMany();
      await tx.member.deleteMany();
      if (data.achievements?.length) await tx.achievement.createMany({ data: data.achievements });
      if (data.members?.length) await tx.member.createMany({ data: data.members.map((m: any) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color, theme: m.theme, panelVisibility: m.panelVisibility, createdAt: new Date(m.createdAt) })) });
      if (data.memberStats?.length) await tx.memberStats.createMany({ data: data.memberStats });
      if (data.dinners?.length) await tx.dinner.createMany({ data: data.dinners });
      if (data.fitnessLogs?.length) await tx.fitnessLog.createMany({ data: data.fitnessLogs.map((f: any) => ({ id: f.id, memberId: f.memberId, date: new Date(f.date) })) });
      if (data.notes?.length) await tx.note.createMany({ data: data.notes.map((n: any) => ({ id: n.id, content: n.content, createdAt: new Date(n.createdAt), updatedAt: new Date(n.updatedAt), memberId: n.memberId })) });
      if (data.todos?.length) await tx.todo.createMany({ data: data.todos.map((t: any) => ({ id: t.id, task: t.task, isDone: t.isDone, createdAt: new Date(t.createdAt), memberId: t.memberId })) });
      if (data.groceries?.length) await tx.grocery.createMany({ data: data.groceries.map((g: any) => ({ id: g.id, item: g.item, isBought: g.isBought, category: g.category, createdAt: new Date(g.createdAt), memberId: g.memberId })) });
      if (data.groceryCategories?.length) await tx.groceryCategory.createMany({ data: data.groceryCategories });
      if (data.diningOut?.length) await tx.diningOut.createMany({ data: data.diningOut.map((d: any) => ({ id: d.id, amount: d.amount, description: d.description, date: new Date(d.date), memberId: d.memberId })) });
      if (data.mealPrepItems?.length) await tx.mealPrepItem.createMany({ data: data.mealPrepItems });
      if (data.photoFavorites?.length) await tx.photoFavorite.createMany({ data: data.photoFavorites });
      if (data.memberAchievements?.length) await tx.memberAchievement.createMany({ data: data.memberAchievements.map((m: any) => ({ id: m.id, memberId: m.memberId, achievementId: m.achievementId, earnedAt: new Date(m.earnedAt) })) });
      if (data.comments?.length) await tx.comment.createMany({ data: data.comments.map((c: any) => ({ id: c.id, content: c.content, createdAt: new Date(c.createdAt), memberId: c.memberId, noteId: c.noteId, diningOutId: c.diningOutId, dinnerId: c.dinnerId, recipeLinkId: c.recipeLinkId, plannedMealId: c.plannedMealId })) });
      if (data.sharedLinks?.length) await tx.sharedLink.createMany({ data: data.sharedLinks.map((s: any) => ({ id: s.id, url: s.url, title: s.title, description: s.description, createdAt: new Date(s.createdAt), memberId: s.memberId })) });
      if (data.recipeLinks?.length) await tx.recipeLink.createMany({ data: data.recipeLinks });
      if (data.calendarEvents?.length) await tx.calendarEvent.createMany({ data: data.calendarEvents });
      if (data.plannedMeals?.length) await tx.plannedMeal.createMany({ data: data.plannedMeals.map((m: any) => ({ id: m.id, mealDate: new Date(m.mealDate), dayOfWeek: m.dayOfWeek, mealTime: m.mealTime, mealName: m.mealName, sortOrder: m.sortOrder, recipeLinkId: m.recipeLinkId, memberId: m.memberId, createdAt: new Date(m.createdAt), updatedAt: new Date(m.updatedAt) })) });
      if (data.archivedMeals?.length) await tx.archivedMeal.createMany({ data: data.archivedMeals });
      if (data.archivedNotes?.length) await tx.archivedNote.createMany({ data: data.archivedNotes });
      if (data.deletedTodos?.length) await tx.deletedTodo.createMany({ data: data.deletedTodos });
      if (data.deletedMealPrepItems?.length) await tx.deletedMealPrepItem.createMany({ data: data.deletedMealPrepItems });
      if (data.familySettings?.length) await tx.familySetting.createMany({ data: data.familySettings });
    });
    revalidatePath("/");
    return { success: true, counts: { members: data.members?.length || 0 } };
  } catch (error) {
    console.error("Import failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to import data" };
  }
}
