import { Router } from "express";
import { db } from "@workspace/db";
import { newsArticlesTable, reactionsTable, userPreferencesTable } from "@workspace/db";
import { eq, desc, and, sql, gte, inArray } from "drizzle-orm";
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
    const favTopic = (req.query.favTopic as string) ?? null;

    // Strict: only TODAY's news (UTC). Cap is generous so the user sees the full daily feed.
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    let todays = await db
      .select()
      .from(newsArticlesTable)
      .where(gte(newsArticlesTable.publishedAt, startOfToday))
      .orderBy(desc(newsArticlesTable.publishedAt))
      .limit(50);

    // Fallback: if today has fewer than 3 stories yet, fall back to last 24 hours.
    if (todays.length < 3) {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      todays = await db
        .select()
        .from(newsArticlesTable)
        .where(gte(newsArticlesTable.publishedAt, last24h))
        .orderBy(desc(newsArticlesTable.publishedAt))
        .limit(50);
    }

    // Boost favTopic articles to the top (interests are comma-separated)
    if (favTopic) {
      const favList = favTopic.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
      const isFav = (cat: string) => favList.some((f) => cat.toLowerCase().includes(f));
      const topicMatches = todays.filter((a) => isFav(a.category));
      const rest = todays.filter((a) => !isFav(a.category));
      todays = [...topicMatches, ...rest];
    }

    res.json(todays);
  } catch (err) {
    req.log.error({ err }, "Error fetching today's updates");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch today's updates" });
  }
});

router.get("/news/monthly-summary", async (req, res) => {
  try {
    const goal = String(req.query.goal ?? "stay-updated");
    const favTopic = String(req.query.favTopic ?? "");

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const articles = await db
      .select()
      .from(newsArticlesTable)
      .where(gte(newsArticlesTable.publishedAt, monthAgo))
      .orderBy(desc(newsArticlesTable.publishedAt))
      .limit(80);

    const now = new Date();
    const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (articles.length === 0) {
      return res.json({
        month: monthLabel,
        intro: "Not enough news yet to build a monthly digest. Check back after you've read more stories.",
        sections: [],
        articleCount: 0,
        ...(goal === "exams" ? { questions: [] } : {}),
      });
    }

    // Build a compact corpus for the AI
    const corpus = articles.map((a, i) =>
      `[${i + 1}] (${a.category}) ${a.headline} — ${a.summary}`
    ).join("\n");

    const { anthropic } = await import("@workspace/integrations-anthropic-ai");

    const tonePrompt =
      goal === "exams"
        ? "Tone: exam-focused. Each section should highlight the constitutional articles, key facts, schemes, or landmark cases an Indian student preparing for CLAT/AILET/UPSC must remember."
        : goal === "general-knowledge"
        ? "Tone: friendly storytelling. Explain the bigger picture and connections like a smart friend would."
        : "Tone: clear, journalistic, no fluff. Just the news that mattered.";

    const includeQuestions = goal === "exams";

    const prompt = `You are writing the monthly news digest for "Minute Ahead", an app for Indian students.

MONTH: ${monthLabel}
USER GOAL: ${goal}
USER INTERESTS: ${favTopic || "(none)"}
${tonePrompt}

NEWS FROM THE LAST 30 DAYS:
${corpus}

Generate a JSON response with these EXACT fields:
{
  "intro": "2-3 sentence overview of what defined this month. Punchy. Conversational. No filler.",
  "sections": [
    {
      "category": "One of the categories that appeared this month",
      "headline": "The single biggest story or theme in this category, in <80 chars",
      "points": ["3 to 5 short bullet points capturing the key developments. Each <140 chars."]
    }
  ]${includeQuestions ? `,
  "questions": [
    {
      "question": "Crisp factual question based on the month's news. Like a CLAT/UPSC MCQ.",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "1-2 sentence explanation of why this is correct."
    }
  ]` : ""}
}

RULES:
- 4 to 6 sections, one per major category that appeared this month.
- Prioritise the user's interests if listed.
${includeQuestions ? "- EXACTLY 5 multiple choice questions covering different stories. correctIndex must be 0-3." : ""}
- No hyphens, no em-dashes, no markdown.
- Return ONLY valid JSON. No prose around it.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    if (block?.type !== "text") {
      return res.status(500).json({ error: "ai_error", message: "Could not generate summary" });
    }

    const jsonText = block.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(jsonText);

    res.json({
      month: monthLabel,
      intro: String(parsed.intro ?? ""),
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      ...(includeQuestions
        ? { questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 5) : [] }
        : {}),
      articleCount: articles.length,
    });
  } catch (err) {
    req.log.error({ err }, "Error generating monthly summary");
    res.status(500).json({ error: "internal_error", message: "Failed to generate monthly summary" });
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
      favTopic: prefs.favTopic,
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
    const favTopic = (parsed.data as { favTopic?: string }).favTopic ?? null;
    const sid = sessionId ?? "anonymous";

    const existing = await db.select().from(userPreferencesTable).where(eq(userPreferencesTable.sessionId, sid)).limit(1);

    if (existing.length > 0) {
      await db
        .update(userPreferencesTable)
        .set({
          goal: goal as "stay-updated" | "exams" | "general-knowledge",
          timeMode: timeMode as "2min" | "5min" | "10min",
          favTopic,
          hasCompletedOnboarding: true,
          updatedAt: new Date(),
        })
        .where(eq(userPreferencesTable.sessionId, sid));
    } else {
      await db.insert(userPreferencesTable).values({
        sessionId: sid,
        goal: goal as "stay-updated" | "exams" | "general-knowledge",
        timeMode: timeMode as "2min" | "5min" | "10min",
        favTopic,
        hasCompletedOnboarding: true,
      });
    }

    res.json({ goal, timeMode, favTopic, hasCompletedOnboarding: true, sessionId: sid });
  } catch (err) {
    req.log.error({ err }, "Error saving preferences");
    res.status(500).json({ error: "internal_error", message: "Failed to save preferences" });
  }
});

export default router;
