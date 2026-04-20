import { XMLParser } from "fast-xml-parser";
import { db } from "@workspace/db";
import { newsArticlesTable } from "@workspace/db";
import { eq, desc, lt } from "drizzle-orm";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName) => ["item"].includes(tagName),
});

// Trusted Indian news sources with display names
const RSS_FEEDS: Array<{ url: string; sourceName: string; sourceUrl: string }> = [
  { url: "https://www.thehindu.com/news/national/feeder/default.rss",      sourceName: "The Hindu",         sourceUrl: "https://www.thehindu.com" },
  { url: "https://www.thehindu.com/news/international/feeder/default.rss", sourceName: "The Hindu",         sourceUrl: "https://www.thehindu.com" },
  { url: "https://indianexpress.com/feed/",                                 sourceName: "Indian Express",    sourceUrl: "https://indianexpress.com" },
  { url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",     sourceName: "Times of India",    sourceUrl: "https://timesofindia.indiatimes.com" },
  { url: "https://feeds.feedburner.com/ndtvnews-india-news",               sourceName: "NDTV",              sourceUrl: "https://www.ndtv.com" },
  { url: "https://news.google.com/rss/search?q=india+supreme+court+constitution+law&hl=en-IN&gl=IN&ceid=IN:en",           sourceName: "Google News India", sourceUrl: "https://news.google.com" },
  { url: "https://news.google.com/rss/search?q=india+parliament+government+policy+budget&hl=en-IN&gl=IN&ceid=IN:en",     sourceName: "Google News India", sourceUrl: "https://news.google.com" },
  { url: "https://news.google.com/rss/search?q=india+economy+RBI+international+relations&hl=en-IN&gl=IN&ceid=IN:en",    sourceName: "Google News India", sourceUrl: "https://news.google.com" },
];

// Category → reliable Unsplash photo ID for hero images
const CATEGORY_IMAGES: Record<string, string> = {
  Law:                   "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop",
  Economy:               "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80&auto=format&fit=crop",
  Politics:              "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80&auto=format&fit=crop",
  "International Relations": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80&auto=format&fit=crop",
  Environment:           "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80&auto=format&fit=crop",
  "Science & Technology":"https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80&auto=format&fit=crop",
  "National Security":   "https://images.unsplash.com/photo-1547782793-e1f88a4bc2c4?w=800&q=80&auto=format&fit=crop",
  Social:                "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80&auto=format&fit=crop",
};

function getCategoryImage(category: string): string {
  return CATEGORY_IMAGES[category] ?? "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80&auto=format&fit=crop";
}

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  imageUrl?: string;
  sourceName: string;
  sourceUrl: string;
}

function extractImageFromItem(item: Record<string, unknown>): string | undefined {
  // Try <media:content url="...">
  const media = item["media:content"] as Record<string, unknown> | undefined;
  if (media?.["@_url"]) return String(media["@_url"]);

  // Try <enclosure url="..." type="image/...">
  const enc = item["enclosure"] as Record<string, unknown> | undefined;
  if (enc?.["@_url"] && String(enc["@_type"] ?? "").startsWith("image")) {
    return String(enc["@_url"]);
  }

  // Try <media:thumbnail url="...">
  const thumb = item["media:thumbnail"] as Record<string, unknown> | undefined;
  if (thumb?.["@_url"]) return String(thumb["@_url"]);

  return undefined;
}

async function fetchRssFeed(feed: { url: string; sourceName: string; sourceUrl: string }): Promise<RssItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Minute Ahead News / 1.0 (student news aggregator)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const text = await res.text();
    const parsed = parser.parse(text);
    const items = parsed?.rss?.channel?.item ?? [];
    const arr = Array.isArray(items) ? items : [items];

    // Only keep items published within the last 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return arr
      .map((item: Record<string, unknown>) => ({
        title: String(item.title ?? "").replace(/<[^>]*>/g, "").trim(),
        link: String(item.link ?? ""),
        pubDate: String(item.pubDate ?? new Date().toISOString()),
        description: String(item.description ?? "").replace(/<[^>]*>/g, "").trim(),
        imageUrl: extractImageFromItem(item),
        sourceName: feed.sourceName,
        sourceUrl: feed.sourceUrl,
      }))
      .filter((item) => {
        const pub = new Date(item.pubDate);
        return !isNaN(pub.getTime()) && pub >= cutoff;
      });
  } catch {
    return [];
  }
}

// Remove articles older than 24 hours from the DB
export async function deleteOldArticles(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await db.delete(newsArticlesTable).where(lt(newsArticlesTable.publishedAt, cutoff));
  return (result as { rowCount?: number }).rowCount ?? 0;
}

const CATEGORIES = [
  "Law",
  "Economy",
  "Politics",
  "International Relations",
  "Environment",
  "Science & Technology",
  "National Security",
  "Social",
] as const;

function determineCategory(title: string, desc: string): string {
  const text = `${title} ${desc}`.toLowerCase();
  if (/court|law|constitution|judge|verdict|tribunal|legal|section|article \d|high court|supreme court/.test(text)) return "Law";
  if (/rbi|economy|budget|gdp|inflation|rupee|bank|finance|tax|fiscal|trade/.test(text)) return "Economy";
  if (/parliament|minister|government|policy|lok sabha|rajya sabha|bjp|congress|election|modi|governance/.test(text)) return "Politics";
  if (/china|pakistan|usa|america|russia|international|bilateral|treaty|foreign|united nations|global/.test(text)) return "International Relations";
  if (/environment|climate|pollution|forest|wildlife|water|energy|renewable|carbon/.test(text)) return "Environment";
  if (/technology|ai |artificial intelligence|digital|cyber|space|isro|tech|science|research|health/.test(text)) return "Science & Technology";
  if (/military|army|defence|defense|security|terrorism|border|soldier|attack|nuclear/.test(text)) return "National Security";
  return "Social";
}

async function enrichWithAI(item: RssItem): Promise<{
  headline: string;
  summary: string;
  fullExplanation: string;
  whyItMatters: string;
  examRelevance: string;
  category: string;
  readingTime: "2min" | "5min" | "10min";
  imageUrl: string;
  sourceName: string;
  sourceUrl: string;
} | null> {
  try {
    const category = determineCategory(item.title, item.description ?? "");

    const prompt = `You write for "Minute Ahead" — a news app for Indian students (16-22 years old) preparing for CLAT, AILET, and UPSC.

NEWS:
HEADLINE: ${item.title}
DATE: ${item.pubDate}
DESCRIPTION: ${item.description ?? "(none)"}

Your job: make this news feel like a smart friend is explaining it over a quick phone call. Not a textbook. Not a news bulletin.

STRICT WRITING RULES — follow every single one:
1. HOOK FIRST. The very first sentence must make the reader stop and pay attention. It can be a surprising fact, a question, a contrast, or a dramatic statement. NOT "The Supreme Court today..." — that's boring.
2. NO hyphens, no em-dashes (— or -), no bullet points, no numbered lists inside explanations.
3. NO AI filler words. Never use: notably, importantly, furthermore, it is worth noting, essentially, significantly, in conclusion, this means that, it is important to understand.
4. Short sentences. If a sentence has more than 20 words, cut it in two.
5. One idea per paragraph. Max 3 sentences per paragraph. Two blank lines between paragraphs.
6. Use plain active language. "The court banned it" not "The court has issued a ban on".
7. Every sentence should be immediately clear on first read — no re-reading needed.
8. Speak directly. "You need to know this because..." not "This is relevant to students because...".
9. The headline must sound like something you'd click on — make it punchy, not formal.
10. The summary is the one sentence someone texts a friend. Conversational. Clear. Under 120 characters.

Generate a JSON response with EXACTLY these fields:
{
  "headline": "Punchy, curiosity-driving headline. Factually accurate. Max 90 chars.",
  "summary": "One conversational sentence — what happened in plain English. Max 120 chars.",
  "fullExplanation": "3-4 paragraphs following ALL the writing rules above. Start with a hook. Use \\n\\n between paragraphs. No hyphens.",
  "whyItMatters": "One plain sentence: what this actually changes for real people in India. Max 150 chars. No jargon.",
  "examRelevance": "Which exact constitutional articles, landmark cases, or government schemes link to this? Be specific. Max 200 chars.",
  "category": "Pick ONE from: Law, Economy, Politics, International Relations, Environment, Science & Technology, National Security, Social",
  "readingTime": "2min for simple stories, 5min for moderate depth, 10min for complex multi-layered stories"
}

IMPORTANT: Return ONLY valid JSON. No markdown. No explanation outside the JSON.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    if (block?.type !== "text") return null;

    const jsonText = block.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const data = JSON.parse(jsonText);

    const rawCategory = String(data.category ?? "").trim();
    const validCategory = (CATEGORIES as readonly string[]).includes(rawCategory) ? rawCategory : category;

    const rawTime = String(data.readingTime ?? "").trim();
    const validReadingTime: "2min" | "5min" | "10min" =
      rawTime === "5min" ? "5min" : rawTime === "10min" ? "10min" : "2min";

    // Use RSS image if available, else category fallback
    const imageUrl = item.imageUrl && item.imageUrl.startsWith("http")
      ? item.imageUrl
      : getCategoryImage(validCategory);

    return {
      headline: String(data.headline ?? item.title).slice(0, 255),
      summary: String(data.summary ?? "").slice(0, 500),
      fullExplanation: String(data.fullExplanation ?? ""),
      whyItMatters: String(data.whyItMatters ?? "").slice(0, 500),
      examRelevance: String(data.examRelevance ?? "").slice(0, 500),
      category: validCategory,
      readingTime: validReadingTime,
      imageUrl,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
    };
  } catch {
    return null;
  }
}

async function getExistingHeadlines(): Promise<Set<string>> {
  const articles = await db
    .select({ headline: newsArticlesTable.headline })
    .from(newsArticlesTable)
    .orderBy(desc(newsArticlesTable.publishedAt))
    .limit(200);
  return new Set(articles.map((a) => a.headline.toLowerCase().trim()));
}

export async function refreshNews(maxNew = 8): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;

  const existingHeadlines = await getExistingHeadlines();

  for (const feed of RSS_FEEDS) {
    if (added >= maxNew) break;

    const items = await fetchRssFeed(feed);

    for (const item of items.slice(0, 5)) {
      if (added >= maxNew) break;
      if (!item.title || item.title.length < 20) { skipped++; continue; }

      const titleKey = item.title.toLowerCase().trim();
      if (existingHeadlines.has(titleKey)) { skipped++; continue; }

      const enriched = await enrichWithAI(item);
      if (!enriched) { skipped++; continue; }

      const enrichedKey = enriched.headline.toLowerCase().trim();
      if (existingHeadlines.has(enrichedKey)) { skipped++; continue; }

      try {
        await db.insert(newsArticlesTable).values({
          headline: enriched.headline,
          summary: enriched.summary,
          fullExplanation: enriched.fullExplanation,
          whyItMatters: enriched.whyItMatters,
          examRelevance: enriched.examRelevance,
          category: enriched.category,
          readingTime: enriched.readingTime,
          imageUrl: enriched.imageUrl,
          sourceName: enriched.sourceName,
          sourceUrl: enriched.sourceUrl,
          publishedAt: new Date(item.pubDate),
          isFeatured: false,
          likes: 0,
          dislikes: 0,
        });
        existingHeadlines.add(enrichedKey);
        added++;
      } catch {
        skipped++;
      }

      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return { added, skipped };
}
