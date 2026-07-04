import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { env } from "../config/env.js";
import { registerSchema, loginSchema } from "../lib/auth.js";
import {
  createRefreshToken,
  validateRefreshToken,
  deleteRefreshToken,
  deleteUserRefreshTokens,
} from "../lib/refresh-token.js";

const ACCESS_EXPIRY_MS = 15 * 60 * 1000; // 15 min
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const ACCESS_COOKIE = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: env.NODE_ENV !== "development",
  maxAge: ACCESS_EXPIRY_MS,
};

const REFRESH_COOKIE = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: env.NODE_ENV !== "development",
  maxAge: REFRESH_EXPIRY_MS,
  path: "/api/v1/auth",
};

function signAccessToken(id: string) {
  return jwt.sign({ id }, env.JWT_SECRET, { expiresIn: "15m" });
}

function setAuthCookies(res: Response, access: string, refresh: string) {
  res.cookie("jwt", access, ACCESS_COOKIE);
  res.cookie("refresh", refresh, REFRESH_COOKIE);
}

function clearAuthCookies(res: Response) {
  res.clearCookie("jwt", { httpOnly: true, sameSite: "strict", secure: env.NODE_ENV !== "development" });
  res.clearCookie("refresh", { httpOnly: true, sameSite: "strict", secure: env.NODE_ENV !== "development", path: "/api/v1/auth" });
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email, password, name } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    res.status(400).json({ error: "User already exists" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({ email, password: hashedPassword, name })
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

  const [accessToken, refreshToken] = await Promise.all([
    Promise.resolve(signAccessToken(user.id)),
    createRefreshToken(user.id),
  ]);

  setAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({ message: "User registered successfully", user });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const [accessToken, refreshToken] = await Promise.all([
    Promise.resolve(signAccessToken(user.id)),
    createRefreshToken(user.id),
  ]);

  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    message: "Login successful",
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}

export async function logout(req: Request, res: Response) {
  const refresh = req.cookies?.refresh;
  if (refresh) {
    await deleteRefreshToken(refresh);
  }
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: "Logout successful" });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refresh;

  if (!token) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  const userId = await validateRefreshToken(token);
  if (!userId) {
    clearAuthCookies(res);
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  await deleteRefreshToken(token);

  const [accessToken, newRefresh] = await Promise.all([
    Promise.resolve(signAccessToken(userId)),
    createRefreshToken(userId),
  ]);

  setAuthCookies(res, accessToken, newRefresh);

  res.status(200).json({ message: "Tokens refreshed" });
}

export async function checkAuth(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: "User authenticated successfully",
    user: req.user,
  });
}
