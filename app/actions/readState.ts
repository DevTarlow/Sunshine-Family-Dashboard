"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMemberId } from "@/lib/session";
import { VALID_SECTIONS, Section } from "./shared";
import { ActionResult, tryAction } from "./shared";

export async function markSectionRead(section: Section) {
  if (!VALID_SECTIONS.includes(section)) return;
  const memberId = await getCurrentMemberId();
  if (!memberId) return;
  await prisma.memberReadState.upsert({
    where: { memberId_section: { memberId, section } },
    update: { lastSeenAt: new Date() },
    create: { memberId, section, lastSeenAt: new Date() },
  });
}

export async function getUnreadCounts() {
  const memberId = await getCurrentMemberId();
  if (!memberId) return { notes: 0, todos: 0, groceries: 0, diningOut: 0, mealPrep: 0, dinnerComments: 0, sharedLinks: 0, recipes: 0 };
  const states = await prisma.memberReadState.findMany({ where: { memberId } });
  const lastSeen = (section: Section) => states.find((s) => s.section === section)?.lastSeenAt ?? new Date(0);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [notes, todos, groceries, diningOut, mealPrep, sharedLinks, noteComments, diningOutComments, dinnerComments, recipes] = await Promise.all([
    prisma.note.count({ where: { createdAt: { gt: lastSeen("notes") }, NOT: { memberId } } }),
    prisma.todo.count({ where: { createdAt: { gt: lastSeen("todos") }, NOT: { memberId } } }),
    prisma.grocery.count({ where: { createdAt: { gt: lastSeen("groceries") }, NOT: { memberId } } }),
    prisma.diningOut.count({ where: { date: { gte: startOfMonth, lt: startOfNextMonth, gt: lastSeen("diningOut") }, NOT: { memberId } } }),
    prisma.mealPrepItem.count({ where: { createdAt: { gt: lastSeen("mealPrep") }, NOT: { memberId } } }),
    prisma.sharedLink.count({ where: { createdAt: { gt: lastSeen("sharedLinks") }, NOT: { memberId } } }),
    prisma.comment.count({ where: { createdAt: { gt: lastSeen("notes") }, NOT: { memberId }, noteId: { not: null } } }),
    prisma.comment.count({ where: { createdAt: { gt: lastSeen("diningOut") }, NOT: { memberId }, diningOutId: { not: null } } }),
    prisma.comment.count({ where: { createdAt: { gt: lastSeen("dinners") }, NOT: { memberId }, dinnerId: { not: null } } }),
    prisma.recipeLink.count({ where: { createdAt: { gt: lastSeen("recipes") }, NOT: { memberId } } }),
  ]);
  return {
    notes: notes + noteComments, todos, groceries, diningOut: diningOut + diningOutComments,
    mealPrep, dinnerComments, sharedLinks, recipes,
  };
}
