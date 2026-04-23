import { Router, type IRouter } from "express";
import { db, foodLogsTable } from "@workspace/db";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/food/search", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const q = String(req.query["q"] ?? "").trim();
    const limit = Math.max(1, Math.min(100, Number(req.query["limit"] ?? 25)));

    const conditions = [eq(foodLogsTable.userId, userId)];
    if (q) conditions.push(ilike(foodLogsTable.foodName, `%${q}%`));

    const logs = await db
      .select()
      .from(foodLogsTable)
      .where(and(...conditions))
      .orderBy(desc(foodLogsTable.date))
      .limit(limit);

    res.json({ success: true, query: q, count: logs.length, logs });
  } catch (err) {
    req.log.error({ err }, "food search failed");
    res.status(500).json({ success: false, error: "Search failed" });
  }
});

router.get("/food/recent", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const limit = Math.max(1, Math.min(50, Number(req.query["limit"] ?? 10)));

    const rows = await db
      .select({
        foodName: foodLogsTable.foodName,
        avgCalories: sql<number>`AVG(${foodLogsTable.calories})`,
        timesLogged: sql<number>`COUNT(*)`,
        lastLogged: sql<Date>`MAX(${foodLogsTable.date})`,
      })
      .from(foodLogsTable)
      .where(eq(foodLogsTable.userId, userId))
      .groupBy(foodLogsTable.foodName)
      .orderBy(desc(sql`MAX(${foodLogsTable.date})`))
      .limit(limit);

    res.json({ success: true, items: rows });
  } catch (err) {
    req.log.error({ err }, "recent foods failed");
    res.status(500).json({ success: false, error: "Failed to fetch recent foods" });
  }
});

export default router;
