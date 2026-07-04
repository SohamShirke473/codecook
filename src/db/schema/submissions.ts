import { relations } from "drizzle-orm";
import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { problems } from "./problems";
import { testCaseResults } from "./test-case-results";

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  sourceCode: text("source_code").notNull(),
  language: text("language").notNull(),
  languageVersion: text("language_version").notNull(),
  status: text("status").notNull().default("PENDING"),
  totalTestCases: integer("total_test_cases").notNull().default(0),
  passedTestCases: integer("passed_test_cases").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
  problem: one(problems, { fields: [submissions.problemId], references: [problems.id] }),
  testCaseResults: many(testCaseResults),
}));
