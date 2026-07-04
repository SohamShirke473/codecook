import { cache } from "../redis/index.js";

const KEY = "leaderboard";

export async function incrementScore(userId: string): Promise<void> {
  await cache.zincrby(KEY, 1, userId);
}

export async function getTop(n: number): Promise<{ userId: string; score: number }[]> {
  const raw = await cache.zrevrange(KEY, 0, n - 1, "WITHSCORES");
  const entries: { userId: string; score: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    entries.push({ userId: String(raw[i]), score: Number(raw[i + 1]) });
  }
  return entries;
}

export async function getUserRank(userId: string): Promise<number | null> {
  const rank = await cache.zrevrank(KEY, userId);
  return rank !== null ? rank + 1 : null;
}

export async function getUserScore(userId: string): Promise<number> {
  const score = await cache.zscore(KEY, userId);
  return score !== null ? Number(score) : 0;
}
