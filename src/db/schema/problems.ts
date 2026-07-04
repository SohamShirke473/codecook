import { relations } from "drizzle-orm";
import { pgTable, uuid, text, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { submissions } from "./submissions";

export const difficultyEnum = pgEnum("difficulty", ["EASY", "MEDIUM", "HARD"]);

export const problems = pgTable("problems", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: difficultyEnum("difficulty").notNull().default("EASY"),
  tags: text("tags").array().notNull().default([]),
  examples: text("examples"),
  constraints: text("constraints"),
  hints: text("hints"),
  editorial: text("editorial"),
  testCases: text("test_cases").notNull(),
  codeSnippets: text("code_snippets").notNull(),
  referenceSolutions: text("reference_solutions").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const problemsRelations = relations(problems, ({ one, many }) => ({
  user: one(users, { fields: [problems.userId], references: [users.id] }),
  submissions: many(submissions),
}));
