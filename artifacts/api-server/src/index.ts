import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { newsArticlesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { refreshNews } from "./services/news-fetcher";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Auto-refresh news in background on startup
  try {
    const recent = await db
      .select({ publishedAt: newsArticlesTable.publishedAt })
      .from(newsArticlesTable)
      .orderBy(desc(newsArticlesTable.publishedAt))
      .limit(1);

    const latestDate = recent[0]?.publishedAt;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Refresh if no articles or last article is older than 24h
    if (!latestDate || latestDate < oneDayAgo) {
      logger.info("Auto-refreshing news from verified sources...");
      const result = await refreshNews(6);
      logger.info(result, "News auto-refresh complete");
    } else {
      logger.info("News is up to date, skipping auto-refresh");
    }
  } catch (err) {
    logger.warn({ err }, "News auto-refresh failed (non-fatal)");
  }
});
