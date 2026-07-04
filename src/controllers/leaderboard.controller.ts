import type { Request, Response } from "express";
import { z } from "zod";
import { getTop, getUserRank, getUserScore } from "../lib/leaderboard.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { inArray } from "drizzle-orm";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function leaderboard(req: Request, res: Response) {
  const query = querySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.flatten().fieldErrors });
    return;
  }

  const { limit } = query.data;
  const entries = await getTop(limit);

  if (entries.length === 0) {
    res.json({ data: [] });
    return;
  }

  const userIds = entries.map((e) => e.userId);
  const userRows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, userIds));

  const userMap = new Map(userRows.map((u) => [u.id, u]));

  const data = entries.map((e, i) => ({
    rank: i + 1,
    score: e.score,
    user: userMap.get(e.userId) ?? null,
  }));

  res.json({ data });
}

export async function myRank(req: Request, res: Response) {
  const [rank, score] = await Promise.all([
    getUserRank(req.user!.id),
    getUserScore(req.user!.id),
  ]);

  res.json({ data: { rank, score } });
}
