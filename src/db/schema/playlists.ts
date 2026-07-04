import { relations } from "drizzle-orm";
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { problems } from "./problems";

export const playlists = pgTable("playlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const playlistProblems = pgTable("playlist_problems", {
  playlistId: uuid("playlist_id")
    .notNull()
    .references(() => playlists.id, { onDelete: "cascade" }),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at", { mode: "date" }).defaultNow().notNull(),
});

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, { fields: [playlists.userId], references: [users.id] }),
  problems: many(playlistProblems),
}));

export const playlistProblemsRelations = relations(playlistProblems, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistProblems.playlistId],
    references: [playlists.id],
  }),
  problem: one(problems, {
    fields: [playlistProblems.problemId],
    references: [problems.id],
  }),
}));
