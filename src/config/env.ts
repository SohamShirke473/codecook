import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().default("postgresql://admin@localhost:5433/codecook"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  PISTON_API_URL: z.string().default("https://piston.shirkesoham.tech"),
  JWT_SECRET: z.string().default("dev-secret-change-in-production"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
