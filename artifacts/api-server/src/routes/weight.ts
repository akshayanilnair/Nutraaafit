import { Router, type IRouter } from "express";
import { db, weightLogsTable, usersTable } from "@workspace/db";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { optionalAuth } from "../lib/auth";

const router: IRouter = Router();

function calcBmi(heightCm?: number | null, weightKg?: number | null): number | null {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  if (m <= 0) return null;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

router.post("/weight", optionalAuth, async (req, res) => {
  try {
    const { userId, weight, note, date } = req.body ?? {};
    if (weight == null || Number.isNaN(Number(weight))) {
      return res.status(400).json({ success: false, error: "weight is required" });
    }
    const effectiveUserId = req.auth?.userId ?? (userId != null ? Number(userId) : null);
    const w = Number(weight);

    let bmi: number | null = null;
    if (effectiveUserId != null) {
      const [u] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, effectiveUserId))
        .limit(1);
      if (u?.height) bmi = calcBmi(u.height, w);
      if (u) {
        await db
          .update(usersTable)
          .set({ weight: w, bmi: bmi ?? u.bmi })
          .where(eq(usersTable.id, effectiveUserId));
      }
    }

    const [created] = await db
      .insert(weightLogsTable)
      .values({
        userId: effectiveUserId,
        weight: w,
        bmi,
        note: note ?? null,
        date: date ? new Date(date) : new Date(),
      })
      .returning();

    res.status(201).json({ success: true, log: created });
  } catch (err) {
    req.log.error({ err }, "create weight log failed");
    res.status(500).json({ success: false, error: "Failed to create weight log" });
  }
});

router.get("/weight", optionalAuth, async (req, res) => {
  try {
    const userIdParam = req.query["userId"];
    const effectiveUserId = req.auth?.userId
      ?? (userIdParam != null ? Number(userIdParam) : null);
    const days = req.query["days"] != null ? Number(req.query["days"]) : null;

    const conditions = [];
    if (effectiveUserId != null) conditions.push(eq(weightLogsTable.userId, effectiveUserId));
    if (days && days > 0) {
      const since = new Date();
      since.setUTCDate(since.getUTCDate() - days);
      conditions.push(gte(weightLogsTable.date, since));
    }

    const logs = conditions.length
      ? await db
          .select()
          .from(weightLogsTable)
          .where(and(...conditions))
          .orderBy(asc(weightLogsTable.date))
      : await db.select().from(weightLogsTable).orderBy(asc(weightLogsTable.date));

    let trend: { delta: number; direction: "up" | "down" | "flat" } | null = null;
    if (logs.length >= 2) {
      const delta = Math.round((logs[logs.length - 1].weight - logs[0].weight) * 10) / 10;
      trend = {
        delta,
        direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
      };
    }

    let currentBmi: number | null = null;
    let goalWeight: number | null = null;
    if (effectiveUserId != null && logs.length > 0) {
      const [u] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, effectiveUserId))
        .limit(1);
      if (u?.height) currentBmi = calcBmi(u.height, logs[logs.length - 1].weight);
      if (u?.height) {
        const m = u.height / 100;
        goalWeight = Math.round(22 * m * m * 10) / 10;
      }
    }

    res.json({
      success: true,
      logs,
      latest: logs[logs.length - 1] ?? null,
      first: logs[0] ?? null,
      trend,
      currentBmi,
      goalWeight,
    });
  } catch (err) {
    req.log.error({ err }, "list weight logs failed");
    res.status(500).json({ success: false, error: "Failed to fetch weight logs" });
  }
});

router.delete("/weight/:id", optionalAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }
    const [log] = await db
      .select()
      .from(weightLogsTable)
      .where(eq(weightLogsTable.id, id))
      .limit(1);
    if (!log) return res.status(404).json({ success: false, error: "Not found" });
    if (req.auth && log.userId != null && log.userId !== req.auth.userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    await db.delete(weightLogsTable).where(eq(weightLogsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "delete weight log failed");
    res.status(500).json({ success: false, error: "Failed to delete" });
  }
});

export default router;
