import { Router, type IRouter } from "express";
import { db, usersTable, foodLogsTable, weightLogsTable } from "@workspace/db";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

interface GoalsBody {
  calorieGoal?: number | null;
  proteinGoal?: number | null;
  carbsGoal?: number | null;
  fatGoal?: number | null;
  weightGoal?: number | null;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pct(actual: number, target: number | null | undefined): number | null {
  if (!target || target <= 0) return null;
  return Math.round((actual / target) * 1000) / 10;
}

router.post("/goals", requireAuth, async (req, res) => {
  try {
    const body = (req.body ?? {}) as GoalsBody;
    const patch: Record<string, number | null> = {};
    for (const key of [
      "calorieGoal",
      "proteinGoal",
      "carbsGoal",
      "fatGoal",
      "weightGoal",
    ] as const) {
      if (key in body) {
        const v = body[key];
        patch[key] = v == null ? null : Number(v);
      }
    }
    const [updated] = await db
      .update(usersTable)
      .set(patch)
      .where(eq(usersTable.id, req.auth!.userId))
      .returning();
    const { passwordHash: _ph, ...safe } = updated;
    res.json({
      success: true,
      goals: {
        calorieGoal: safe.calorieGoal,
        proteinGoal: safe.proteinGoal,
        carbsGoal: safe.carbsGoal,
        fatGoal: safe.fatGoal,
        weightGoal: safe.weightGoal,
      },
      user: safe,
    });
  } catch (err) {
    req.log.error({ err }, "set goals failed");
    res.status(500).json({ success: false, error: "Failed to save goals" });
  }
});

router.get("/goals", requireAuth, async (req, res) => {
  try {
    const [u] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.auth!.userId))
      .limit(1);
    if (!u) return res.status(404).json({ success: false, error: "User not found" });
    res.json({
      success: true,
      goals: {
        calorieGoal: u.calorieGoal,
        proteinGoal: u.proteinGoal,
        carbsGoal: u.carbsGoal,
        fatGoal: u.fatGoal,
        weightGoal: u.weightGoal,
      },
    });
  } catch (err) {
    req.log.error({ err }, "get goals failed");
    res.status(500).json({ success: false, error: "Failed to fetch goals" });
  }
});

router.get("/goals/progress", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const [u] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!u) return res.status(404).json({ success: false, error: "User not found" });

    const dateParam = req.query["date"];
    const target = dateParam ? new Date(String(dateParam)) : new Date();
    if (Number.isNaN(target.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid date" });
    }
    const start = new Date(target);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const todayLogs = await db
      .select()
      .from(foodLogsTable)
      .where(
        and(
          eq(foodLogsTable.userId, userId),
          gte(foodLogsTable.date, start),
          lte(foodLogsTable.date, end),
        ),
      );

    const today = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    for (const l of todayLogs) {
      const n = (l.nutrients ?? {}) as Record<string, unknown>;
      today.calories += num(l.calories);
      today.protein_g += num(n["protein_g"]);
      today.carbs_g += num(n["carbs_g"]);
      today.fat_g += num(n["fat_g"]);
    }
    (Object.keys(today) as Array<keyof typeof today>).forEach((k) => {
      today[k] = Math.round(today[k] * 10) / 10;
    });

    const nutrition = {
      calories: {
        actual: today.calories,
        goal: u.calorieGoal,
        percent: pct(today.calories, u.calorieGoal),
        remaining: u.calorieGoal != null ? Math.round((u.calorieGoal - today.calories) * 10) / 10 : null,
      },
      protein_g: {
        actual: today.protein_g,
        goal: u.proteinGoal,
        percent: pct(today.protein_g, u.proteinGoal),
        remaining: u.proteinGoal != null ? Math.round((u.proteinGoal - today.protein_g) * 10) / 10 : null,
      },
      carbs_g: {
        actual: today.carbs_g,
        goal: u.carbsGoal,
        percent: pct(today.carbs_g, u.carbsGoal),
        remaining: u.carbsGoal != null ? Math.round((u.carbsGoal - today.carbs_g) * 10) / 10 : null,
      },
      fat_g: {
        actual: today.fat_g,
        goal: u.fatGoal,
        percent: pct(today.fat_g, u.fatGoal),
        remaining: u.fatGoal != null ? Math.round((u.fatGoal - today.fat_g) * 10) / 10 : null,
      },
    };

    const startWeights = await db
      .select()
      .from(weightLogsTable)
      .where(eq(weightLogsTable.userId, userId))
      .orderBy(asc(weightLogsTable.date))
      .limit(1);
    const latestWeights = await db
      .select()
      .from(weightLogsTable)
      .where(eq(weightLogsTable.userId, userId))
      .orderBy(desc(weightLogsTable.date))
      .limit(1);

    const startWeight = startWeights[0]?.weight ?? u.weight ?? null;
    const currentWeight = latestWeights[0]?.weight ?? u.weight ?? null;

    let weight: {
      startWeight: number | null;
      currentWeight: number | null;
      goalWeight: number | null;
      percent: number | null;
      remaining: number | null;
    } = {
      startWeight,
      currentWeight,
      goalWeight: u.weightGoal,
      percent: null,
      remaining: null,
    };
    if (
      u.weightGoal != null &&
      startWeight != null &&
      currentWeight != null &&
      startWeight !== u.weightGoal
    ) {
      const totalChange = u.weightGoal - startWeight;
      const progressed = currentWeight - startWeight;
      const percent = Math.max(
        0,
        Math.min(100, Math.round((progressed / totalChange) * 1000) / 10),
      );
      weight = {
        ...weight,
        percent,
        remaining: Math.round((u.weightGoal - currentWeight) * 10) / 10,
      };
    }

    res.json({
      success: true,
      date: start.toISOString().slice(0, 10),
      nutrition,
      weight,
    });
  } catch (err) {
    req.log.error({ err }, "goal progress failed");
    res.status(500).json({ success: false, error: "Failed to compute progress" });
  }
});

export default router;
