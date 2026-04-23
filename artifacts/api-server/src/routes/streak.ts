import { Router, type IRouter } from "express";
import { db, foodLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

router.get("/streak", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const logs = await db
      .select({ date: foodLogsTable.date })
      .from(foodLogsTable)
      .where(eq(foodLogsTable.userId, userId));

    const days = new Set<string>();
    for (const l of logs) days.add(dayKey(new Date(l.date)));

    const today = dayKey(new Date());
    const yesterday = dayKey(new Date(Date.now() - 86400000));

    let current = 0;
    let cursor = days.has(today) ? new Date() : days.has(yesterday) ? new Date(Date.now() - 86400000) : null;
    while (cursor && days.has(dayKey(cursor))) {
      current += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    const sorted = Array.from(days).sort();
    let longest = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const k of sorted) {
      const d = new Date(k + "T00:00:00Z");
      if (prev && (d.getTime() - prev.getTime()) === 86400000) {
        run += 1;
      } else {
        run = 1;
      }
      if (run > longest) longest = run;
      prev = d;
    }

    res.json({
      success: true,
      currentStreak: current,
      longestStreak: longest,
      totalDaysLogged: days.size,
      loggedToday: days.has(today),
    });
  } catch (err) {
    req.log.error({ err }, "streak failed");
    res.status(500).json({ success: false, error: "Failed to compute streak" });
  }
});

export default router;
