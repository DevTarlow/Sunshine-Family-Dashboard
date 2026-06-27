"use server";

import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import { ActionResult, tryAction } from "./shared";

const MONTH_ABBREVS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getLast6Months(): string[] {
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function fillMissingMonths(months: string[], rows: { month: string; value: number }[]) {
  const map = new Map(rows.map((r) => [r.month, r.value]));
  return months.map((m) => {
    const [, monthNum] = m.split("-");
    return { month: MONTH_ABBREVS[parseInt(monthNum, 10) - 1], value: map.get(m) ?? 0 };
  });
}

export async function getChartData() {
  const months = getLast6Months();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);
  const cutoffMs = sixMonthsAgo.getTime();
  const [diningRows, workoutRows, todoRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ month: string; value: number }>>(
      `SELECT strftime('%Y-%m', datetime(date / 1000, 'unixepoch')) as month, CAST(SUM(amount) AS REAL) as value FROM DiningOut WHERE date >= ${cutoffMs} GROUP BY month ORDER BY month ASC`
    ),
    prisma.$queryRawUnsafe<Array<{ month: string; value: number }>>(
      `SELECT strftime('%Y-%m', datetime(date / 1000, 'unixepoch')) as month, CAST(COUNT(*) AS REAL) as value FROM FitnessLog WHERE date >= ${cutoffMs} GROUP BY month ORDER BY month ASC`
    ),
    prisma.$queryRawUnsafe<Array<{ month: string; value: number }>>(
      `SELECT strftime('%Y-%m', datetime(createdAt / 1000, 'unixepoch')) as month, CAST(COUNT(*) AS REAL) as value FROM Todo WHERE createdAt >= ${cutoffMs} GROUP BY month ORDER BY month ASC`
    ),
  ]);
  const photoMap = new Map<string, number>();
  try {
    const photosDir = path.join(process.cwd(), "public/photos");
    const entries = await fs.readdir(photosDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(entry.name)) continue;
      let fileDate: Date | null = null;
      const ts = parseInt(entry.name.split("-")[0], 10);
      if (!isNaN(ts) && ts > 1e12) {
        fileDate = new Date(ts);
      } else {
        const stat = await fs.stat(path.join(photosDir, entry.name));
        fileDate = stat.mtime;
      }
      if (fileDate && fileDate >= sixMonthsAgo) {
        const key = `${fileDate.getFullYear()}-${String(fileDate.getMonth() + 1).padStart(2, "0")}`;
        photoMap.set(key, (photoMap.get(key) ?? 0) + 1);
      }
    }
  } catch {}
  const photoRows = Array.from(photoMap.entries()).map(([month, value]) => ({ month, value }));
  return {
    monthlyDining: fillMissingMonths(months, diningRows.map((r) => ({ month: String(r.month), value: Number(r.value) }))),
    monthlyWorkouts: fillMissingMonths(months, workoutRows.map((r) => ({ month: String(r.month), value: Number(r.value) }))),
    monthlyTodos: fillMissingMonths(months, todoRows.map((r) => ({ month: String(r.month), value: Number(r.value) }))),
    monthlyPhotoUploads: fillMissingMonths(months, photoRows),
  };
}
