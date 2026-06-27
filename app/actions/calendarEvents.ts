"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/session";
import { logActivity } from "@/lib/activityStore";
import { ActionResult, tryAction } from "./shared";

const VALID_COLORS = ["blue", "red", "green", "purple", "orange", "pink", "yellow", "teal", "indigo", "cyan", "amber", "rose"];

function validateColor(color: string): string {
  return VALID_COLORS.includes(color) ? color : "blue";
}

function validateTime(time: string): string {
  if (!time) return "";
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "";
}

export async function getCalendarEvents(year: number, month: number) {
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startOfNextMonth = new Date(Date.UTC(year, month, 1));
  const events = await prisma.calendarEvent.findMany({
    where: { eventDate: { gte: startOfMonth, lt: startOfNextMonth } },
    include: { member: { select: { id: true, name: true, emoji: true, color: true } } },
    orderBy: [{ eventTime: "asc" }, { createdAt: "asc" }],
  });
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    eventDate: e.eventDate.toISOString(),
    eventTime: e.eventTime,
    color: e.color,
    member: e.member,
  }));
}

export async function createCalendarEvent(title: string, description: string, eventDate: string, eventTime: string, color: string) {
  if (!title || !title.trim()) return;
  const member = await getCurrentMember();
  const date = new Date(eventDate + "T00:00:00");
  await prisma.calendarEvent.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      eventDate: date,
      eventTime: validateTime(eventTime),
      color: validateColor(color),
      memberId: member?.id ?? null,
    },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `added calendar event: ${title.trim()}`);
  }
  revalidatePath("/");
}

export async function updateCalendarEvent(id: number, title: string, description: string, eventDate: string, eventTime: string, color: string) {
  if (!title || !title.trim()) return;
  const member = await getCurrentMember();
  const date = new Date(eventDate + "T00:00:00");
  await prisma.calendarEvent.update({
    where: { id },
    data: { title: title.trim(), description: description.trim(), eventDate: date, eventTime: validateTime(eventTime), color: validateColor(color) },
  });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `updated calendar event: ${title.trim()}`);
  }
  revalidatePath("/");
}

export async function deleteCalendarEvent(id: number) {
  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event) return;
  const member = await getCurrentMember();
  await prisma.calendarEvent.delete({ where: { id } });
  if (member) {
    logActivity(member.id, member.name, member.emoji, member.color, `removed calendar event: ${event.title}`);
  }
  revalidatePath("/");
}
