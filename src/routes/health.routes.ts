import { Router } from "express";
import { db } from "../db/index.js";
import { cache } from "../redis/index.js";
import { getRuntimes } from "../lib/piston.js";

const router = Router();

router.get("/", async (_req, res) => {
  const checks: Record<string, { status: string; latency_ms?: number; error?: string; runtimes?: number }> = {};

  // Database check
  {
    const start = Date.now();
    try {
      await db.execute("SELECT 1");
      checks.database = { status: "ok", latency_ms: Date.now() - start };
    } catch (err) {
      checks.database = {
        status: "error",
        latency_ms: Date.now() - start,
        error: (err as Error).message,
      };
    }
  }

  // Redis check
  {
    const start = Date.now();
    try {
      await cache.ping();
      checks.redis = { status: "ok", latency_ms: Date.now() - start };
    } catch (err) {
      checks.redis = {
        status: "error",
        latency_ms: Date.now() - start,
        error: (err as Error).message,
      };
    }
  }

  // Piston check
  {
    const start = Date.now();
    try {
      const runtimes = await getRuntimes();
      checks.piston = {
        status: "ok",
        latency_ms: Date.now() - start,
        runtimes: runtimes.length,
      };
    } catch (err) {
      checks.piston = {
        status: "error",
        latency_ms: Date.now() - start,
        error: (err as Error).message,
      };
    }
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
});

export default router;
