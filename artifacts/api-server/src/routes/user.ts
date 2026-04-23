import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

function calcBmi(heightCm?: number | null, weightKg?: number | null): number | null {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  if (m <= 0) return null;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

router.post("/user", async (req, res) => {
  try {
    const {
      name,
      age,
      height,
      weight,
      preferences,
      allergies,
      dislikes,
      cuisinePreference,
      healthCondition,
    } = req.body ?? {};

    const bmi = calcBmi(Number(height), Number(weight));

    const [created] = await db
      .insert(usersTable)
      .values({
        name: name ?? null,
        age: age != null ? Number(age) : null,
        height: height != null ? Number(height) : null,
        weight: weight != null ? Number(weight) : null,
        bmi,
        preferences: preferences ?? null,
        allergies: Array.isArray(allergies) ? allergies : [],
        dislikes: Array.isArray(dislikes) ? dislikes : [],
        cuisinePreference: cuisinePreference ?? null,
        healthCondition: healthCondition ?? null,
      })
      .returning();

    res.status(201).json({ success: true, user: created });
  } catch (err) {
    req.log.error({ err }, "create user failed");
    res.status(500).json({ success: false, error: "Failed to create user" });
  }
});

router.get("/user", async (req, res) => {
  try {
    const idParam = req.query["id"];
    if (idParam) {
      const id = Number(idParam);
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
      if (!user) return res.status(404).json({ success: false, error: "User not found" });
      return res.json({ success: true, user });
    }
    const [user] = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(1);
    if (!user) return res.status(404).json({ success: false, error: "No user found" });
    return res.json({ success: true, user });
  } catch (err) {
    req.log.error({ err }, "get user failed");
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

export default router;
