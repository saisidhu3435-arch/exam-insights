import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { newsArticlesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { refreshNews, deleteOldArticles } from "./services/news-fetcher";
import cron from "node-cron";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function runNewsRefresh(reason: string) {
  try {
    logger.info({ reason }, "Running scheduled news refresh...");
    // First clean up articles older than 24 hours
    const deleted = await deleteOldArticles();
    if (deleted > 0) logger.info({ deleted }, "Removed expired articles (>24h)");
    // Then fetch fresh news
    const result = await refreshNews(8);
    logger.info(result, "News refresh complete");
  } catch (err) {
    logger.warn({ err }, "News refresh failed (non-fatal)");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // On startup: refresh if stale (older than 2h)
  try {
    const recent = await db
      .select({ publishedAt: newsArticlesTable.publishedAt })
      .from(newsArticlesTable)
      .orderBy(desc(newsArticlesTable.publishedAt))
      .limit(1);

    const latestDate = recent[0]?.publishedAt;
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    if (!latestDate || latestDate < twoHoursAgo) {
      await runNewsRefresh("startup-stale");
    } else {
      logger.info("News is fresh, skipping startup refresh");
    }
  } catch (err) {
    logger.warn({ err }, "Startup news check failed (non-fatal)");
  }

  // Schedule automatic refresh every 2 hours, all day
  // Runs at minute 0 of hours 0,2,4,6,8,10,12,14,16,18,20,22 every day
  cron.schedule("0 */2 * * *", () => {
    runNewsRefresh("cron-2h");
  });

  logger.info("News auto-refresh cron scheduled: every 2 hours");
});
