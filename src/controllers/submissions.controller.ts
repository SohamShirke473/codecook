import type { Request, Response } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { problems, submissions, testCaseResults } from "../db/schema/index.js";
import { createSubmissionSchema, paginationSchema } from "../lib/schemas.js";
import { executionQueue } from "../queues/index.js";

export async function createSubmission(req: Request, res: Response) {
  const parsed = createSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { problemId, sourceCode, language, languageVersion } = parsed.data;

  const [problem] = await db
    .select({ id: problems.id, testCases: problems.testCases })
    .from(problems)
    .where(eq(problems.id, problemId))
    .limit(1);

  if (!problem) {
    res.status(404).json({ error: "Problem not found" });
    return;
  }

  const allTestCases = JSON.parse(problem.testCases) as { input: string; output: string }[];

  const [submission] = await db
    .insert(submissions)
    .values({
      userId: req.user!.id,
      problemId,
      sourceCode,
      language,
      languageVersion,
      status: "PENDING",
      totalTestCases: allTestCases.length,
      passedTestCases: 0,
    })
    .returning();

  await executionQueue.add("execute", {
    submissionId: submission.id,
    sourceCode,
    language,
    languageVersion,
    testCases: allTestCases,
  });

  res.status(201).json({ data: submission });
}

export async function listSubmissions(req: Request, res: Response) {
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
        id: submissions.id,
        problemId: submissions.problemId,
        language: submissions.language,
        status: submissions.status,
        totalTestCases: submissions.totalTestCases,
        passedTestCases: submissions.passedTestCases,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .where(eq(submissions.userId, req.user!.id))
      .orderBy(desc(submissions.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(eq(submissions.userId, req.user!.id)),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);

  res.json({
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getSubmission(req: Request, res: Response) {
  const id = req.params.id as string;

  const [submission] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.id, id), eq(submissions.userId, req.user!.id)))
    .limit(1);

  if (!submission) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  const results = await db
    .select()
    .from(testCaseResults)
    .where(eq(testCaseResults.submissionId, id))
    .orderBy(testCaseResults.testCaseIndex);

  res.json({ data: { ...submission, testCaseResults: results } });
}
