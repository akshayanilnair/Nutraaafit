import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const SECRET = process.env["SESSION_SECRET"] || process.env["JWT_SECRET"];
if (!SECRET) {
  throw new Error("SESSION_SECRET (or JWT_SECRET) must be set");
}

export interface AuthPayload {
  userId: number;
  email: string;
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthPayload;
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, SECRET as string, { expiresIn: "30d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }
  try {
    const decoded = jwt.verify(token, SECRET as string) as AuthPayload;
    req.auth = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      req.auth = jwt.verify(token, SECRET as string) as AuthPayload;
    } catch {
      // ignore — treat as anonymous
    }
  }
  next();
}
