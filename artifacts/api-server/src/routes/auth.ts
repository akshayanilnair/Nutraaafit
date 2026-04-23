import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body ?? {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "email and password are required" });
    }
    const normalized = String(email).trim().toLowerCase();
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalized))
      .limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    const [created] = await db
      .insert(usersTable)
      .values({
        email: normalized,
        passwordHash,
        name: name ?? null,
        allergies: [],
        dislikes: [],
      })
      .returning();
    const token = signToken({ userId: created.id, email: normalized });
    const { passwordHash: _ph, ...safe } = created;
    res.status(201).json({ success: true, token, user: safe });
  } catch (err) {
    req.log.error({ err }, "register failed");
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "email and password are required" });
    }
    const normalized = String(email).trim().toLowerCase();
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalized))
      .limit(1);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }
    const token = signToken({ userId: user.id, email: normalized });
    const { passwordHash: _ph, ...safe } = user;
    res.json({ success: true, token, user: safe });
  } catch (err) {
    req.log.error({ err }, "login failed");
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

export default router;
