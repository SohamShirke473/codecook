import { z } from "zod";

// ─── Problem schemas ───────────────────────────────────────

export const testCaseSchema = z.object({
  input: z.string(),
  output: z.string(),
});

export const createProblemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("EASY"),
  tags: z.array(z.string()).default([]),
  examples: z.string().optional(),
  constraints: z.string().optional(),
  hints: z.string().optional(),
  editorial: z.string().optional(),
  testCases: z.array(testCaseSchema).min(1),
  codeSnippets: z.record(z.string()),
  referenceSolutions: z.record(z.string()),
});

export const updateProblemSchema = createProblemSchema.partial();

// ─── Submission schemas ─────────────────────────────────────

export const createSubmissionSchema = z.object({
  problemId: z.string().uuid(),
  sourceCode: z.string().min(1),
  language: z.string().min(1),
  languageVersion: z.string().min(1),
});

// ─── Query schemas ──────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const problemQuerySchema = paginationSchema.extend({
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type ProblemQuery = z.infer<typeof problemQuerySchema>;
