import { Router, type IRouter } from "express";
import { db, foodLogsTable } from "@workspace/db";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { optionalAuth } from "../lib/auth";

const router: IRouter = Router();

interface Totals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  entries: number;
}

const emptyTotals = (): Totals => ({
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  sugar_g: 0,
  entries: 0,
});

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

router.get("/summary/daily", optionalAuth, async (req, res) => {
  try {
    const userIdParam = req.query["userId"];
    const effectiveUserId = req.auth?.userId
      ?? (userIdParam != null ? Number(userIdParam) : null);

    const dateParam = req.query["date"];
    const target = dateParam ? new Date(String(dateParam)) : new Date();
    if (Number.isNaN(target.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid date" });
    }
    const start = new Date(target);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const conditions = [
      gte(foodLogsTable.date, start),
      lte(foodLogsTable.date, end),
    ];
    if (effectiveUserId != null) {
      conditions.push(eq(foodLogsTable.userId, effectiveUserId));
    }

    const logs = await db
      .select()
      .from(foodLogsTable)
      .where(and(...conditions))
      .orderBy(desc(foodLogsTable.date));

    const totals = emptyTotals();
    for (const l of logs) {
      const n = (l.nutrients ?? {}) as Record<string, unknown>;
      totals.calories += num(l.calories);
      totals.protein_g += num(n["protein_g"]);
      totals.carbs_g += num(n["carbs_g"]);
      totals.fat_g += num(n["fat_g"]);
      totals.fiber_g += num(n["fiber_g"]);
      totals.sugar_g += num(n["sugar_g"]);
      totals.entries += 1;
    }
    Object.keys(totals).forEach((k) => {
      const key = k as keyof Totals;
      if (key !== "entries") totals[key] = Math.round(totals[key] * 10) / 10;
    });

    res.json({
      success: true,
      date: dayKey(start),
      totals,
      logs,
    });
  } catch (err) {
    req.log.error({ err }, "daily summary failed");
    res.status(500).json({ success: false, error: "Failed to compute summary" });
  }
});

router.get("/summary/range", optionalAuth, async (req, res) => {
  try {
    const userIdParam = req.query["userId"];
    const effectiveUserId = req.auth?.userId
      ?? (userIdParam != null ? Number(userIdParam) : null);

    const days = Math.max(1, Math.min(90, Number(req.query["days"] ?? 7)));
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0, 0, 0, 0);

    const conditions = [
      gte(foodLogsTable.date, start),
      lte(foodLogsTable.date, end),
    ];
    if (effectiveUserId != null) {
      conditions.push(eq(foodLogsTable.userId, effectiveUserId));
    }

    const logs = await db
      .select()
      .from(foodLogsTable)
      .where(and(...conditions))
      .orderBy(desc(foodLogsTable.date));

    const byDay = new Map<string, Totals>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      byDay.set(dayKey(d), emptyTotals());
    }
    for (const l of logs) {
      const key = dayKey(new Date(l.date));
      const t = byDay.get(key) ?? emptyTotals();
      const n = (l.nutrients ?? {}) as Record<string, unknown>;
      t.calories += num(l.calories);
      t.protein_g += num(n["protein_g"]);
      t.carbs_g += num(n["carbs_g"]);
      t.fat_g += num(n["fat_g"]);
      t.fiber_g += num(n["fiber_g"]);
      t.sugar_g += num(n["sugar_g"]);
      t.entries += 1;
      byDay.set(key, t);
    }

    const grand = emptyTotals();
    const series = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, t]) => {
        grand.calories += t.calories;
        grand.protein_g += t.protein_g;
        grand.carbs_g += t.carbs_g;
        grand.fat_g += t.fat_g;
        grand.fiber_g += t.fiber_g;
        grand.sugar_g += t.sugar_g;
        grand.entries += t.entries;
        const rounded: Totals = { ...t };
        (Object.keys(rounded) as Array<keyof Totals>).forEach((k) => {
          if (k !== "entries") rounded[k] = Math.round(rounded[k] * 10) / 10;
        });
        return { date, totals: rounded };
      });

    const daysWithEntries = series.filter((s) => s.totals.entries > 0).length || 1;
    const averages: Totals = {
      calories: Math.round((grand.calories / daysWithEntries) * 10) / 10,
      protein_g: Math.round((grand.protein_g / daysWithEntries) * 10) / 10,
      carbs_g: Math.round((grand.carbs_g / daysWithEntries) * 10) / 10,
      fat_g: Math.round((grand.fat_g / daysWithEntries) * 10) / 10,
      fiber_g: Math.round((grand.fiber_g / daysWithEntries) * 10) / 10,
      sugar_g: Math.round((grand.sugar_g / daysWithEntries) * 10) / 10,
      entries: Math.round((grand.entries / daysWithEntries) * 10) / 10,
    };

    res.json({
      success: true,
      startDate: dayKey(start),
      endDate: dayKey(end),
      days,
      series,
      averages,
    });
  } catch (err) {
    req.log.error({ err }, "range summary failed");
    res.status(500).json({ success: false, error: "Failed to compute summary" });
  }
});

export default router;
