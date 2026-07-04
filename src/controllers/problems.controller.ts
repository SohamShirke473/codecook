import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { problems } from "../db/schema/index.js";
import { eq, desc, like, and, sql } from "drizzle-orm";
import {
  createProblemSchema,
  updateProblemSchema,
  problemQuerySchema,
} from "../lib/schemas.js";

export async function listProblems(req: Request, res: Response) {
  const query = problemQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.flatten().fieldErrors });
    return;
  }

  const { page, limit, difficulty, tag, search } = query.data;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [];
  if (difficulty) conditions.push(eq(problems.difficulty, difficulty));
  if (tag) conditions.push(sql`${problems.tags} @> ARRAY[${tag}]`);
  if (search) {
    conditions.push(
      sql`to_tsvector('english', ${problems.title} || ' ' || coalesce(${problems.description}, '')) @@ plainto_tsquery('english', ${search})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: problems.id,
        title: problems.title,
        difficulty: problems.difficulty,
        tags: problems.tags,
        createdAt: problems.createdAt,
      })
      .from(problems)
      .where(where)
      .orderBy(desc(problems.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(problems)
      .where(where),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);

  res.json({
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getProblem(req: Request, res: Response) {
  const id = req.params.id as string;

  const [problem] = await db
    .select({
      id: problems.id,
      title: problems.title,
      description: problems.description,
      difficulty: problems.difficulty,
      tags: problems.tags,
      examples: problems.examples,
      constraints: problems.constraints,
      hints: problems.hints,
      editorial: problems.editorial,
      testCases: problems.testCases,
      codeSnippets: problems.codeSnippets,
      userId: problems.userId,
      createdAt: problems.createdAt,
      updatedAt: problems.updatedAt,
    })
    .from(problems)
    .where(eq(problems.id, id))
    .limit(1);

  if (!problem) {
    res.status(404).json({ error: "Problem not found" });
    return;
  }

  res.json({ data: problem });
}

export async function createProblem(req: Request, res: Response) {
  const parsed = createProblemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const data = parsed.data;

  const [problem] = await db
    .insert(problems)
    .values({
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      tags: data.tags,
      examples: data.examples ?? null,
      constraints: data.constraints ?? null,
      hints: data.hints ?? null,
      editorial: data.editorial ?? null,
      testCases: JSON.stringify(data.testCases),
      codeSnippets: JSON.stringify(data.codeSnippets),
      referenceSolutions: JSON.stringify(data.referenceSolutions),
      userId: req.user!.id,
    })
    .returning();

  res.status(201).json({ data: problem });
}

export async function updateProblem(req: Request, res: Response) {
  const id = req.params.id as string;
  const parsed = updateProblemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const data = parsed.data;
  const patch: Record<string, unknown> = {};

  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.difficulty !== undefined) patch.difficulty = data.difficulty;
  if (data.tags !== undefined) patch.tags = data.tags;
  if (data.examples !== undefined) patch.examples = data.examples;
  if (data.constraints !== undefined) patch.constraints = data.constraints;
  if (data.hints !== undefined) patch.hints = data.hints;
  if (data.editorial !== undefined) patch.editorial = data.editorial;
  if (data.testCases !== undefined) patch.testCases = JSON.stringify(data.testCases);
  if (data.codeSnippets !== undefined) patch.codeSnippets = JSON.stringify(data.codeSnippets);
  if (data.referenceSolutions !== undefined) patch.referenceSolutions = JSON.stringify(data.referenceSolutions);

  const [problem] = await db
    .update(problems)
    .set(patch)
    .where(eq(problems.id, id))
    .returning();

  if (!problem) {
    res.status(404).json({ error: "Problem not found" });
    return;
  }

  res.json({ data: problem });
}

export async function deleteProblem(req: Request, res: Response) {
  const id = req.params.id as string;

  const [problem] = await db
    .delete(problems)
    .where(eq(problems.id, id))
    .returning({ id: problems.id });

  if (!problem) {
    res.status(404).json({ error: "Problem not found" });
    return;
  }

  res.json({ message: "Problem deleted" });
}
