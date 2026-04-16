import { Router } from "express";
import { db } from "@workspace/db";
import { newsArticlesTable, reactionsTable, userPreferencesTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  ListNewsQueryParams,
  GetTodaysUpdatesQueryParams,
  CreateReactionBody,
  SavePreferencesBody,
  GetNewsArticleParams,
  GetReactionsParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/news", async (req, res) => {
  try {
    const parsed = ListNewsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};

    let query = db.select().from(newsArticlesTable).$dynamic();

    if (params.category) {
      query = query.where(eq(newsArticlesTable.category, params.category));
    }
    if (params.timeMode) {
      query = query.where(eq(newsArticlesTable.readingTime, params.timeMode as "2min" | "5min" | "10min"));
    }

    const limit = params.limit ?? 10;
    const articles = await query.orderBy(desc(newsArticlesTable.publishedAt)).limit(limit);
    res.json(articles);
  } catch (err) {
    req.log.error({ err }, "Error fetching news");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch news" });
  }
});

router.get("/news/today", async (req, res) => {
  try {
    const parsed = GetTodaysUpdatesQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};

    let query = db.select().from(newsArticlesTable).$dynamic();

    if (params.timeMode) {
      query = query.where(eq(newsArticlesTable.readingTime, params.timeMode as "2min" | "5min" | "10min"));
    }

    const articles = await query
      .orderBy(desc(newsArticlesTable.isFeatured), desc(newsArticlesTable.publishedAt))
      .limit(params.goal === "exams" ? 6 : params.timeMode === "2min" ? 3 : 5);

    res.json(articles);
  } catch (err) {
    req.log.error({ err }, "Error fetching today's updates");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch today's updates" });
  }
});

router.get("/news/categories", async (req, res) => {
  try {
    const rows = await db
      .select({
        name: newsArticlesTable.category,
        count: sql<number>`count(*)::int`,
      })
      .from(newsArticlesTable)
      .groupBy(newsArticlesTable.category)
      .orderBy(sql`count(*) desc`);

    res.json(rows.map((r) => ({ name: r.name, count: r.count })));
  } catch (err) {
    req.log.error({ err }, "Error fetching categories");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch categories" });
  }
});

router.get("/news/:id", async (req, res) => {
  try {
    const parsed = GetNewsArticleParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      return res.status(400).json({ error: "bad_request", message: "Invalid article id" });
    }

    const articles = await db
      .select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, parsed.data.id))
      .limit(1);

    if (!articles.length) {
      return res.status(404).json({ error: "not_found", message: "Article not found" });
    }

    res.json(articles[0]);
  } catch (err) {
    req.log.error({ err }, "Error fetching article");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch article" });
  }
});

router.post("/reactions", async (req, res) => {
  try {
    const parsed = CreateReactionBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "bad_request", message: "Invalid reaction data" });
    }

    const { articleId, reaction, sessionId } = parsed.data;
    const sid = sessionId ?? "anonymous";

    const existing = await db
      .select()
      .from(reactionsTable)
      .where(and(eq(reactionsTable.articleId, articleId), eq(reactionsTable.sessionId, sid)))
      .limit(1);

    if (existing.length > 0) {
      const oldReaction = existing[0].reaction;
      if (oldReaction !== reaction) {
        await db
          .update(reactionsTable)
          .set({ reaction: reaction as "like" | "dislike" | "none" })
          .where(eq(reactionsTable.id, existing[0].id));

        if (oldReaction === "like") {
          await db.update(newsArticlesTable).set({ likes: sql`${newsArticlesTable.likes} - 1` }).where(eq(newsArticlesTable.id, articleId));
        } else if (oldReaction === "dislike") {
          await db.update(newsArticlesTable).set({ dislikes: sql`${newsArticlesTable.dislikes} - 1` }).where(eq(newsArticlesTable.id, articleId));
        }
        if (reaction === "like") {
          await db.update(newsArticlesTable).set({ likes: sql`${newsArticlesTable.likes} + 1` }).where(eq(newsArticlesTable.id, articleId));
        } else if (reaction === "dislike") {
          await db.update(newsArticlesTable).set({ dislikes: sql`${newsArticlesTable.dislikes} + 1` }).where(eq(newsArticlesTable.id, articleId));
        }
      }
    } else {
      await db.insert(reactionsTable).values({ articleId, sessionId: sid, reaction: reaction as "like" | "dislike" | "none" });
      if (reaction === "like") {
        await db.update(newsArticlesTable).set({ likes: sql`${newsArticlesTable.likes} + 1` }).where(eq(newsArticlesTable.id, articleId));
      } else if (reaction === "dislike") {
        await db.update(newsArticlesTable).set({ dislikes: sql`${newsArticlesTable.dislikes} + 1` }).where(eq(newsArticlesTable.id, articleId));
      }
    }

    const [article] = await db.select({ likes: newsArticlesTable.likes, dislikes: newsArticlesTable.dislikes }).from(newsArticlesTable).where(eq(newsArticlesTable.id, articleId)).limit(1);
    const [updated] = await db.select().from(reactionsTable).where(and(eq(reactionsTable.articleId, articleId), eq(reactionsTable.sessionId, sid))).limit(1);

    res.json({
      articleId,
      likes: article?.likes ?? 0,
      dislikes: article?.dislikes ?? 0,
      userReaction: updated?.reaction ?? "none",
    });
  } catch (err) {
    req.log.error({ err }, "Error creating reaction");
    res.status(500).json({ error: "internal_error", message: "Failed to save reaction" });
  }
});

router.get("/reactions/:articleId", async (req, res) => {
  try {
    const parsed = GetReactionsParams.safeParse({ articleId: Number(req.params.articleId) });
    if (!parsed.success) {
      return res.status(400).json({ error: "bad_request", message: "Invalid article id" });
    }

    const sessionId = (req.query.sessionId as string) ?? "anonymous";
    const [article] = await db.select({ likes: newsArticlesTable.likes, dislikes: newsArticlesTable.dislikes }).from(newsArticlesTable).where(eq(newsArticlesTable.id, parsed.data.articleId)).limit(1);
    const [userReaction] = await db.select().from(reactionsTable).where(and(eq(reactionsTable.articleId, parsed.data.articleId), eq(reactionsTable.sessionId, sessionId))).limit(1);

    res.json({
      articleId: parsed.data.articleId,
      likes: article?.likes ?? 0,
      dislikes: article?.dislikes ?? 0,
      userReaction: userReaction?.reaction ?? "none",
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching reactions");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch reactions" });
  }
});

router.get("/preferences", async (req, res) => {
  try {
    const sessionId = (req.query.sessionId as string) ?? "anonymous";
    const [prefs] = await db.select().from(userPreferencesTable).where(eq(userPreferencesTable.sessionId, sessionId)).limit(1);

    if (!prefs) {
      return res.json({ hasCompletedOnboarding: false, sessionId });
    }

    res.json({
      goal: prefs.goal,
      timeMode: prefs.timeMode,
      hasCompletedOnboarding: prefs.hasCompletedOnboarding,
      sessionId: prefs.sessionId,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching preferences");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch preferences" });
  }
});

router.post("/preferences", async (req, res) => {
  try {
    const parsed = SavePreferencesBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "bad_request", message: "Invalid preference data" });
    }

    const { goal, timeMode, sessionId } = parsed.data;
    const sid = sessionId ?? "anonymous";

    const existing = await db.select().from(userPreferencesTable).where(eq(userPreferencesTable.sessionId, sid)).limit(1);

    if (existing.length > 0) {
      await db
        .update(userPreferencesTable)
        .set({ goal: goal as "stay-updated" | "exams" | "general-knowledge", timeMode: timeMode as "2min" | "5min" | "10min", hasCompletedOnboarding: true, updatedAt: new Date() })
        .where(eq(userPreferencesTable.sessionId, sid));
    } else {
      await db.insert(userPreferencesTable).values({ sessionId: sid, goal: goal as "stay-updated" | "exams" | "general-knowledge", timeMode: timeMode as "2min" | "5min" | "10min", hasCompletedOnboarding: true });
    }

    res.json({ goal, timeMode, hasCompletedOnboarding: true, sessionId: sid });
  } catch (err) {
    req.log.error({ err }, "Error saving preferences");
    res.status(500).json({ error: "internal_error", message: "Failed to save preferences" });
  }
});

export default router;
