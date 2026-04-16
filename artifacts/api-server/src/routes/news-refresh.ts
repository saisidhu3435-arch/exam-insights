import { Router } from "express";
import { refreshNews } from "../services/news-fetcher";

const router = Router();

// POST /api/news/refresh — fetch fresh news from government/verified sources
router.post("/news/refresh", async (req, res) => {
  try {
    const maxNew = Math.min(Number(req.body?.maxNew ?? 8), 20);
    const result = await refreshNews(maxNew);
    res.json({ ok: true, ...result, message: `Fetched ${result.added} new articles from verified news sources.` });
  } catch (err) {
    req.log.error({ err }, "Error refreshing news");
    res.status(500).json({ error: "internal_error", message: "Failed to refresh news" });
  }
});

export default router;
