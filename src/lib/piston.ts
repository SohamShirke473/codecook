import { z } from "zod";
import { env } from "../config/env.js";

export const pistonExecuteRequestSchema = z.object({
  language: z.string(),
  version: z.string(),
  files: z.array(z.object({ name: z.string().optional(), content: z.string() })),
  stdin: z.string().optional(),
  args: z.array(z.string()).optional(),
  compile_timeout: z.number().optional(),
  run_timeout: z.number().optional(),
  compile_memory_limit: z.number().optional(),
  run_memory_limit: z.number().optional(),
});

export const pistonExecuteResponseSchema = z.object({
  language: z.string(),
  version: z.string(),
  run: z.object({
    stdout: z.string(),
    stderr: z.string(),
    output: z.string(),
    code: z.number(),
    signal: z.string().nullable(),
  }),
  compile: z
    .object({
      stdout: z.string(),
      stderr: z.string(),
      output: z.string(),
      code: z.number(),
      signal: z.string().nullable(),
    })
    .optional(),
});

export const pistonRuntimeSchema = z.object({
  language: z.string(),
  version: z.string(),
  aliases: z.array(z.string()),
  runtime: z.string(),
});

export type PistonExecuteRequest = z.infer<typeof pistonExecuteRequestSchema>;
export type PistonExecuteResponse = z.infer<typeof pistonExecuteResponseSchema>;
export type PistonRuntime = z.infer<typeof pistonRuntimeSchema>;

const url = new URL(env.PISTON_API_URL);
const BASE = url.origin; // protocol + host + port, stripped of any credentials
const headers: Record<string, string> = { "Content-Type": "application/json" };

// In dev, the Piston URL may include user:pass for a remote/protected instance.
// In prod, Piston runs on the same VPS so no credentials are needed.
if (env.NODE_ENV !== "production" && url.username) {
  const decoded = `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`;
  headers["Authorization"] = `Basic ${btoa(decoded)}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Piston API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function getRuntimes(): Promise<PistonRuntime[]> {
  return request<PistonRuntime[]>("/api/v2/runtimes");
}

export async function executeCode(
  params: PistonExecuteRequest
): Promise<PistonExecuteResponse> {
  return request<PistonExecuteResponse>("/api/v2/execute", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
