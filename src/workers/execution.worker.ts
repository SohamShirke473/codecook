import { Worker } from "bullmq";
import { eq, and, ne } from "drizzle-orm";
import { bullConnection } from "../redis/index.js";
import { db } from "../db/index.js";
import { submissions, testCaseResults } from "../db/schema/index.js";
import { executeCode } from "../lib/piston.js";
import { incrementScore } from "../lib/leaderboard.js";

function normalize(s: string): string {
  return s.trimEnd().replace(/\r\n/g, "\n");
}

function compareOutput(actual: string, expected: string): boolean {
  return normalize(actual) === normalize(expected);
}

export const executionWorker = new Worker(
  "code-execution",
  async (job) => {
    const { submissionId, sourceCode, language, languageVersion, testCases } = job.data as {
      submissionId: string;
      sourceCode: string;
      language: string;
      languageVersion: string;
      testCases: { input: string; output: string }[];
    };

    const [sub] = await db
      .select({ userId: submissions.userId, problemId: submissions.problemId })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (!sub) throw new Error("Submission not found");

    await db
      .update(submissions)
      .set({ status: "PROCESSING" })
      .where(eq(submissions.id, submissionId));

    let passed = 0;
    const results: (typeof testCaseResults.$inferInsert)[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      let tcPassed = false;
      let stdout = "";
      let stderr = "";
      let compileOutput = "";
      let status = "ERROR";
      let memory: string | null = null;
      let time: string | null = null;

      try {
        const response = await executeCode({
          language,
          version: languageVersion,
          files: [{ content: sourceCode }],
          stdin: tc.input,
          run_timeout: 5000,
        });

        stdout = response.run.stdout ?? "";
        stderr = response.run.stderr ?? "";
        compileOutput = response.compile?.stdout ?? "";
        status = String(response.run.code);
        time = null;
        memory = null;

        tcPassed = compareOutput(stdout, tc.output);
      } catch (err) {
        status = "ERROR";
        stderr = (err as Error).message;
      }

      if (tcPassed) passed++;

      results.push({
        submissionId,
        testCaseIndex: i,
        passed: tcPassed,
        stdout,
        expected: tc.output,
        stderr,
        compileOutput,
        status,
        memory,
        time,
      });
    }

    const finalStatus = passed === testCases.length ? "ACCEPTED" : "WRONG_ANSWER";

    await Promise.all([
      db.insert(testCaseResults).values(results),
      db
        .update(submissions)
        .set({ status: finalStatus, passedTestCases: passed })
        .where(eq(submissions.id, submissionId)),
    ]);

    if (finalStatus === "ACCEPTED") {
      const [prev] = await db
        .select({ id: submissions.id })
        .from(submissions)
        .where(
          and(
            eq(submissions.userId, sub.userId),
            eq(submissions.problemId, sub.problemId),
            eq(submissions.status, "ACCEPTED"),
            ne(submissions.id, submissionId),
          )
        )
        .limit(1);

      if (!prev) {
        await incrementScore(sub.userId);
      }
    }
  },
  { connection: bullConnection, concurrency: 5 }
);

executionWorker.on("completed", (job) => {
  console.log(`[execution-worker] Job ${job.id} completed`);
});

executionWorker.on("failed", (job, err) => {
  console.error(`[execution-worker] Job ${job?.id} failed:`, err.message);
});
