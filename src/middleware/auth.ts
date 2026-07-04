import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { env } from "../config/env.js";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.jwt;

  if (!token) {
    res.status(401).json({ message: "Unauthorized - No Token Provided" });
    return;
  }

  let decoded: { id: string };
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
  } catch (err) {
    const message =
      err instanceof jwt.TokenExpiredError
        ? "Unauthorized - Token Expired"
        : "Unauthorized - Invalid Token";
    res.status(401).json({ message });
    return;
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, decoded.id))
    .limit(1);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  req.user = user;
  next();
}

export async function checkAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Access denied. User is not an admin." });
    return;
  }
  next();
}
