import { Router, type IRouter } from "express";
import { db, foodLogsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { optionalAuth } from "../lib/auth";

const router: IRouter = Router();

// If authenticated, scope log to that user. Otherwise accept userId in body for compat.
router.post("/food", optionalAuth, async (req, res) => {
  try {
    const { userId, foodName, calories, nutrients, date } = req.body ?? {};
    if (!foodName) {
      return res.status(400).json({ success: false, error: "foodName is required" });
    }
    const effectiveUserId = req.auth?.userId ?? (userId != null ? Number(userId) : null);
    const [created] = await db
      .insert(foodLogsTable)
      .values({
        userId: effectiveUserId,
        foodName: String(foodName),
        calories: calories != null ? Number(calories) : null,
        nutrients: nutrients ?? {},
        date: date ? new Date(date) : new Date(),
      })
      .returning();
    res.status(201).json({ success: true, log: created });
  } catch (err) {
    req.log.error({ err }, "create food log failed");
    res.status(500).json({ success: false, error: "Failed to create food log" });
  }
});

// If authenticated, only that user's logs. Otherwise filter by ?userId= or all.
router.get("/food", optionalAuth, async (req, res) => {
  try {
    const userIdParam = req.query["userId"];
    const effectiveUserId = req.auth?.userId
      ?? (userIdParam != null ? Number(userIdParam) : null);

    const logs = effectiveUserId != null
      ? await db
          .select()
          .from(foodLogsTable)
          .where(eq(foodLogsTable.userId, effectiveUserId))
          .orderBy(desc(foodLogsTable.date))
      : await db.select().from(foodLogsTable).orderBy(desc(foodLogsTable.date));
    res.json({ success: true, logs });
  } catch (err) {
    req.log.error({ err }, "list food logs failed");
    res.status(500).json({ success: false, error: "Failed to fetch logs" });
  }
});

export default router;
