import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { optionalAuth, requireAuth } from "../lib/auth";

const router: IRouter = Router();

function calcBmi(heightCm?: number | null, weightKg?: number | null): number | null {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  if (m <= 0) return null;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

function stripPassword<T extends { passwordHash?: string | null }>(u: T) {
  const { passwordHash: _ph, ...safe } = u;
  return safe;
}

// Create or update profile. If authenticated, updates the auth user.
// Otherwise creates a new anonymous record (back-compat).
router.post("/user", optionalAuth, async (req, res) => {
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
    const values = {
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
    };

    if (req.auth) {
      const [updated] = await db
        .update(usersTable)
        .set(values)
        .where(eq(usersTable.id, req.auth.userId))
        .returning();
      return res.json({ success: true, user: stripPassword(updated) });
    }

    const [created] = await db.insert(usersTable).values(values).returning();
    res.status(201).json({ success: true, user: stripPassword(created) });
  } catch (err) {
    req.log.error({ err }, "create/update user failed");
    res.status(500).json({ success: false, error: "Failed to save user" });
  }
});

// Returns the authenticated user; falls back to ?id= or most recent for compat.
router.get("/user", optionalAuth, async (req, res) => {
  try {
    if (req.auth) {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, req.auth.userId))
        .limit(1);
      if (!user) return res.status(404).json({ success: false, error: "User not found" });
      return res.json({ success: true, user: stripPassword(user) });
    }
    const idParam = req.query["id"];
    if (idParam) {
      const id = Number(idParam);
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
      if (!user) return res.status(404).json({ success: false, error: "User not found" });
      return res.json({ success: true, user: stripPassword(user) });
    }
    const [user] = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(1);
    if (!user) return res.status(404).json({ success: false, error: "No user found" });
    return res.json({ success: true, user: stripPassword(user) });
  } catch (err) {
    req.log.error({ err }, "get user failed");
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

// Auth-only "me" endpoint
router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.auth!.userId))
    .limit(1);
  if (!user) return res.status(404).json({ success: false, error: "User not found" });
  res.json({ success: true, user: stripPassword(user) });
});

export default router;
