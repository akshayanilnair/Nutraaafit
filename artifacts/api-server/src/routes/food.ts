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

router.post("/food/quick-log/:id", optionalAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }
    const [src] = await db
      .select()
      .from(foodLogsTable)
      .where(eq(foodLogsTable.id, id))
      .limit(1);
    if (!src) return res.status(404).json({ success: false, error: "Not found" });

    const effectiveUserId = req.auth?.userId ?? src.userId ?? null;
    if (req.auth && src.userId != null && src.userId !== req.auth.userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const [created] = await db
      .insert(foodLogsTable)
      .values({
        userId: effectiveUserId,
        foodName: src.foodName,
        calories: src.calories,
        nutrients: src.nutrients ?? {},
        date: req.body?.date ? new Date(req.body.date) : new Date(),
      })
      .returning();
    res.status(201).json({ success: true, log: created });
  } catch (err) {
    req.log.error({ err }, "quick-log failed");
    res.status(500).json({ success: false, error: "Failed to quick-log" });
  }
});

router.delete("/food/:id", optionalAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }
    const [log] = await db
      .select()
      .from(foodLogsTable)
      .where(eq(foodLogsTable.id, id))
      .limit(1);
    if (!log) return res.status(404).json({ success: false, error: "Not found" });
    if (req.auth && log.userId != null && log.userId !== req.auth.userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    await db.delete(foodLogsTable).where(eq(foodLogsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "delete food log failed");
    res.status(500).json({ success: false, error: "Failed to delete" });
  }
});

export default router;
