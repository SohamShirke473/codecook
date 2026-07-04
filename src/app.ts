import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { apiReference } from "@scalar/express-api-reference";
import { env } from "./config/env.js";
import healthRouter from "./routes/health.routes.js";
import authRouter from "./routes/auth.routes.js";
import problemRouter from "./routes/problems.routes.js";
import submissionRouter from "./routes/submissions.routes.js";
import playlistRouter from "./routes/playlists.routes.js";
import leaderboardRouter from "./routes/leaderboard.routes.js";
import adminRouter from "./routes/admin.routes.js";
import { openApiSpec } from "./lib/openapi.js";

const app = express();

app.use(cors({
  origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN,
  credentials: env.CORS_ORIGIN !== "*",
}));
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({ service: "codecook", version: "0.1.0" });
});

app.use("/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/problems", problemRouter);
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/leaderboard", leaderboardRouter);
app.use("/api/v1/admin", adminRouter);

app.use(
  "/docs",
  apiReference({
    spec: { content: openApiSpec },
  }),
);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
