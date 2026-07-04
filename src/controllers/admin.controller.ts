import type { Request, Response } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, problems, submissions } from "../db/schema/index.js";
import { paginationSchema } from "../lib/schemas.js";
import { z } from "zod";

export async function stats(_req: Request, res: Response) {
  const [[totalUsers], [totalProblems], [totalSubmissions], [submissionsToday], [accepted]] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(problems),
      db.select({ count: sql<number>`count(*)` }).from(submissions),
      db
        .select({ count: sql<number>`count(*)` })
        .from(submissions)
        .where(sql`created_at >= now() - interval '1 day'`),
      db
        .select({ count: sql<number>`count(*)` })
        .from(submissions)
        .where(sql`status = 'ACCEPTED'`),
    ]);

  const difficultyBreakdown = await db
    .select({
      difficulty: problems.difficulty,
      count: sql<number>`count(*)`,
    })
    .from(problems)
    .groupBy(problems.difficulty);

  res.json({
    data: {
      totalUsers: Number(totalUsers?.count ?? 0),
      totalProblems: Number(totalProblems?.count ?? 0),
      totalSubmissions: Number(totalSubmissions?.count ?? 0),
      submissionsToday: Number(submissionsToday?.count ?? 0),
      totalAccepted: Number(accepted?.count ?? 0),
      problemsByDifficulty: Object.fromEntries(
        difficultyBreakdown.map((r) => [r.difficulty, Number(r.count)])
      ),
    },
  });
}

export async function listUsers(req: Request, res: Response) {
  const query = paginationSchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.flatten().fieldErrors });
    return;
  }

  const { page, limit } = query.data;
  const offset = (page - 1) * limit;

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(users),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);

  res.json({
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
