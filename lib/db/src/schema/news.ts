import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const readingTimeEnum = pgEnum("reading_time", ["2min", "5min", "10min"]);
export const reactionTypeEnum = pgEnum("reaction_type", ["like", "dislike", "none"]);
export const goalEnum = pgEnum("goal", ["stay-updated", "exams", "general-knowledge"]);

export const newsArticlesTable = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  headline: text("headline").notNull(),
  summary: text("summary").notNull(),
  fullExplanation: text("full_explanation").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().notNull().default([]),
  readingTime: readingTimeEnum("reading_time").notNull().default("5min"),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  likes: integer("likes").notNull().default(0),
  dislikes: integer("dislikes").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  whyItMatters: text("why_it_matters"),
  examRelevance: text("exam_relevance"),
});

export const reactionsTable = pgTable("reactions", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => newsArticlesTable.id),
  sessionId: text("session_id").notNull(),
  reaction: reactionTypeEnum("reaction").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userPreferencesTable = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  goal: goalEnum("goal"),
  timeMode: readingTimeEnum("time_mode"),
  hasCompletedOnboarding: boolean("has_completed_onboarding").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertArticleSchema = createInsertSchema(newsArticlesTable).omit({ id: true });
export const insertReactionSchema = createInsertSchema(reactionsTable).omit({ id: true, createdAt: true });
export const insertPreferencesSchema = createInsertSchema(userPreferencesTable).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type NewsArticle = typeof newsArticlesTable.$inferSelect;
export type Reaction = typeof reactionsTable.$inferSelect;
export type UserPreference = typeof userPreferencesTable.$inferSelect;
