import { Redis } from "ioredis";
import { env } from "../config/env.js";

const url = new URL(env.REDIS_URL);

export const bullConnection = {
  host: url.hostname || "localhost",
  port: Number(url.port) || 6379,
  ...(url.password && { password: url.password }),
  ...(url.username && { username: url.username }),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
} as const;

export const cache = new Redis(env.REDIS_URL);
