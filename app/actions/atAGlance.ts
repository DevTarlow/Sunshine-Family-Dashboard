"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";
import { getWeatherData, getWeatherForecast } from "./weather";
import { getLastMonthDiningOutTotal } from "./diningOut";

export async function computeAtAGlanceSummary(inputs: {
  weatherResult: any;
  forecastResult: { days: { label: string; high: number; low: number; description: string }[] };
  todos: { isDone: boolean }[];
  groceries: { isBought: boolean }[];
  calendarEvents: { id: number; title: string; description: string; eventDate: Date; eventTime: string; color: string; memberId: number | null }[];
  mealPrepItems: { id: number; label: string; consumptionTime: string | null; createdAt: Date }[];
  diningCurrentTotal: number;
  lastMonthTotal: number;
  memberName: string;
  memberEmoji: string;
}) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const threeDaysFromNow = new Date(startOfToday);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  let todayForecast: any = null;
  if (!("error" in inputs.weatherResult) && inputs.forecastResult.days.length > 0) {
    const today = inputs.forecastResult.days[0];
    todayForecast = { temp: inputs.weatherResult.temp, high: today.high, low: today.low, description: today.description, icon: inputs.weatherResult.icon };
  }
  const undoneTodos = inputs.todos.filter((t) => !t.isDone).length;
  const unboughtGroceries = inputs.groceries.filter((g) => !g.isBought).length;
  const upcomingEvents = inputs.calendarEvents.filter((e) => { const d = new Date(e.eventDate); return d >= startOfToday && d <= threeDaysFromNow; }).slice(0, 3);
  const expiringSoonCutoff = new Date(now);
  expiringSoonCutoff.setDate(expiringSoonCutoff.getDate() + 2);
  expiringSoonCutoff.setHours(23, 59, 59, 999);
  const expiringItems = inputs.mealPrepItems
    .map((item) => {
      if (!item.consumptionTime) return null;
      const match = item.consumptionTime.match(/(\d+)/);
      if (!match) return null;
      const maxDays = parseInt(match[1], 10);
      const expiresAt = new Date(item.createdAt);
      expiresAt.setDate(expiresAt.getDate() + maxDays);
      expiresAt.setHours(23, 59, 59, 999);
      const isExpired = now >= expiresAt;
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const daysLabel = diffDays <= 0 ? "today" : diffDays === 1 ? "tomorrow" : `in ${diffDays} days`;
      return { id: item.id, label: item.label, daysLabel, isExpired, expiresAt };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter((item) => item.isExpired || item.expiresAt <= expiringSoonCutoff)
    .sort((a, b) => { if (a.isExpired && !b.isExpired) return -1; if (!a.isExpired && b.isExpired) return 1; return a.expiresAt.getTime() - b.expiresAt.getTime(); })
    .slice(0, 3);
  const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);
  const dinnerMeal = await prisma.plannedMeal.findFirst({
    where: { mealDate: { gte: todayStart, lt: todayEnd }, mealTime: "dinner" },
    select: { mealName: true },
  });
  const todayDinner = dinnerMeal?.mealName ?? null;
  return { todayForecast, undoneTodos, unboughtGroceries, currentMonthDining: inputs.diningCurrentTotal, lastMonthDining: inputs.lastMonthTotal, upcomingEvents, expiringItems, digest: "", memberName: inputs.memberName, memberEmoji: inputs.memberEmoji, todayDinner };
}

export async function getAtAGlanceData() {
  const member = await getCurrentMember();
  const memberName = member?.name ?? "Family";
  const memberEmoji = member?.emoji ?? "";
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [weatherResult, forecastResult, todos, groceries, events, mealPrepItems, diningCurrentAgg, lastMonthTotal] = await Promise.all([
    getWeatherData(),
    getWeatherForecast(),
    prisma.todo.findMany({ select: { isDone: true } }),
    prisma.grocery.findMany({ select: { isBought: true } }),
    prisma.calendarEvent.findMany({
      where: { eventDate: { gte: startOfMonth, lt: startOfNextMonth } },
      select: { id: true, title: true, description: true, eventDate: true, eventTime: true, color: true, memberId: true },
      orderBy: { eventDate: "asc" },
    }),
    prisma.mealPrepItem.findMany({ where: { consumptionTime: { not: null } }, select: { id: true, label: true, consumptionTime: true, createdAt: true } }),
    prisma.diningOut.aggregate({ _sum: { amount: true }, where: { date: { gte: startOfMonth, lt: startOfNextMonth } } }),
    getLastMonthDiningOutTotal(),
  ]);
  return computeAtAGlanceSummary({
    weatherResult,
    forecastResult,
    todos, groceries, calendarEvents: events, mealPrepItems,
    diningCurrentTotal: diningCurrentAgg._sum.amount ?? 0,
    lastMonthTotal,
    memberName, memberEmoji,
  });
}
