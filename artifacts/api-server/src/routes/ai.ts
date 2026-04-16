import { Router } from "express";
import { db } from "@workspace/db";
import { newsArticlesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

function validateBody(body: unknown):
  | { ok: true; articleId: number; question: string; sessionId?: string }
  | { ok: false; message: string } {
  if (!body || typeof body !== "object") return { ok: false, message: "Invalid request body." };
  const b = body as Record<string, unknown>;
  const articleId = Number(b.articleId);
  if (!Number.isInteger(articleId) || articleId <= 0) {
    return { ok: false, message: "articleId must be a positive integer." };
  }
  if (typeof b.question !== "string") {
    return { ok: false, message: "question must be a string." };
  }
  const question = b.question.trim();
  if (question.length < 3 || question.length > 500) {
    return { ok: false, message: "question must be 3-500 characters." };
  }
  let sessionId: string | undefined;
  if (typeof b.sessionId === "string" && b.sessionId.length > 0 && b.sessionId.length <= 100) {
    sessionId = b.sessionId;
  }
  return { ok: true, articleId, question, sessionId };
}

// Simple in-memory rate limiter: max 10 requests / 5 minutes per session+IP key.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const buckets = new Map<string, number[]>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (arr.length >= RATE_LIMIT_MAX) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

router.post("/ai/ask", async (req, res) => {
  try {
    const parsed = validateBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ error: "bad_request", message: parsed.message });
    }
    const { articleId, question, sessionId } = parsed;

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
    const key = `${sessionId ?? "anon"}:${ip}`;
    if (!rateLimit(key)) {
      return res.status(429).json({
        error: "rate_limited",
        message: "Too many questions in a short time. Take a breath and try again in a few minutes.",
      });
    }

    const [article] = await db
      .select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, articleId))
      .limit(1);

    if (!article) {
      return res.status(404).json({ error: "not_found", message: "Article not found" });
    }

    const systemPrompt = `You are an expert news explainer for Indian students preparing for competitive exams (CLAT, AILET, UPSC). You answer questions about news articles in a clear, engaging, and educational way.

Rules:
- Keep answers under 150 words
- Use simple language a 16-year-old can understand
- Be factual and avoid speculation
- If the question is not about the article, politely redirect
- Use short paragraphs, no markdown headers
- Be conversational, not robotic`;

    const userPrompt = `News Article:
Headline: ${article.headline}
Category: ${article.category}
Summary: ${article.summary}
Full context: ${article.fullExplanation}
Why it matters: ${article.whyItMatters ?? ""}

Student's Question: ${question}

Answer the question clearly and concisely.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = message.content[0];
    const answer =
      block?.type === "text"
        ? block.text
        : "I couldn't generate an answer right now. Please try again.";

    res.json({ answer });
  } catch (err) {
    req.log.error({ err }, "Error in AI ask");
    res.status(500).json({ error: "internal_error", message: "Failed to get an answer" });
  }
});

export default router;
