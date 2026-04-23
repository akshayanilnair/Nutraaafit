import { Router, type IRouter } from "express";
import { db, foodLogsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/food", async (req, res) => {
  try {
    const { userId, foodName, calories, nutrients, date } = req.body ?? {};
    if (!foodName) {
      return res.status(400).json({ success: false, error: "foodName is required" });
    }
    const [created] = await db
      .insert(foodLogsTable)
      .values({
        userId: userId != null ? Number(userId) : null,
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

router.get("/food", async (req, res) => {
  try {
    const userIdParam = req.query["userId"];
    const query = db.select().from(foodLogsTable).orderBy(desc(foodLogsTable.date));
    const logs = userIdParam
      ? await db
          .select()
          .from(foodLogsTable)
          .where(eq(foodLogsTable.userId, Number(userIdParam)))
          .orderBy(desc(foodLogsTable.date))
      : await query;
    res.json({ success: true, logs });
  } catch (err) {
    req.log.error({ err }, "list food logs failed");
    res.status(500).json({ success: false, error: "Failed to fetch logs" });
  }
});

export default router;
