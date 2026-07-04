import { relations } from "drizzle-orm";
import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { submissions } from "./submissions";

export const testCaseResults = pgTable("test_case_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  testCaseIndex: integer("test_case_index").notNull(),
  passed: boolean("passed").notNull().default(false),
  stdout: text("stdout"),
  expected: text("expected"),
  stderr: text("stderr"),
  compileOutput: text("compile_output"),
  status: text("status"),
  memory: text("memory"),
  time: text("time"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const testCaseResultsRelations = relations(testCaseResults, ({ one }) => ({
  submission: one(submissions, {
    fields: [testCaseResults.submissionId],
    references: [submissions.id],
  }),
}));
