import { XMLParser } from "fast-xml-parser";
import { db } from "@workspace/db";
import { newsArticlesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

// India-specific news RSS feeds from Google News (government, policy, law, economy)
const RSS_FEEDS = [
  "https://news.google.com/rss/search?q=india+supreme+court+constitution+law&hl=en-IN&gl=IN&ceid=IN:en",
  "https://news.google.com/rss/search?q=india+parliament+government+policy+budget&hl=en-IN&gl=IN&ceid=IN:en",
  "https://news.google.com/rss/search?q=india+economy+RBI+international+relations&hl=en-IN&gl=IN&ceid=IN:en",
  "https://news.google.com/rss/search?q=india+environment+science+technology+social&hl=en-IN&gl=IN&ceid=IN:en",
];

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  source?: string;
}

async function fetchRssFeed(url: string): Promise<RssItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Minute Ahead News / 1.0 (student news aggregator)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const text = await res.text();
    const parsed = parser.parse(text);
    const items = parsed?.rss?.channel?.item ?? [];
    const arr = Array.isArray(items) ? items : [items];
    return arr.map((item: Record<string, unknown>) => ({
      title: String(item.title ?? "").replace(/<[^>]*>/g, "").trim(),
      link: String(item.link ?? ""),
      pubDate: String(item.pubDate ?? new Date().toISOString()),
      description: String(item.description ?? "").replace(/<[^>]*>/g, "").trim(),
      source: typeof item.source === "object" ? String((item.source as Record<string, unknown>)["#text"] ?? "") : String(item.source ?? ""),
    }));
  } catch {
    return [];
  }
}

// Canonical category names — must match the welcome flow topic values exactly
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
} | null> {
  try {
    const category = determineCategory(item.title, item.description ?? "");

    const prompt = `You are writing for "Minute Ahead" — a news app for Indian students preparing for CLAT, AILET, and UPSC exams.

Given this news headline and description, generate educational content:

HEADLINE: ${item.title}
SOURCE: ${item.source ?? "news article"}
DATE: ${item.pubDate}
DESCRIPTION: ${item.description ?? "(none)"}

Generate a JSON response with EXACTLY these fields:
{
  "headline": "Rewrite the headline to be curiosity-driving but factually accurate (max 90 chars)",
  "summary": "A one-sentence powerful summary students can understand instantly (max 120 chars)",
  "fullExplanation": "3-4 paragraphs explaining what happened, the background context, and what it means. Write clearly for a 16-year-old. Use proper paragraph breaks (\\n\\n).",
  "whyItMatters": "One sentence: why this matters for India and its citizens (max 150 chars)",
  "examRelevance": "Specific exam relevance: which constitutional articles, government schemes, or concepts does this relate to? (max 200 chars)",
  "category": "Pick the single best category from: Law, Economy, Politics, International Relations, Environment, Science & Technology, National Security, Social",
  "readingTime": "Choose: '2min' for quick updates, '5min' for moderate depth, '10min' for complex multi-layered stories"
}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    if (block?.type !== "text") return null;

    const jsonText = block.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const data = JSON.parse(jsonText);

    // Validate category — must be one of the canonical names
    const rawCategory = String(data.category ?? "").trim();
    const validCategory = (CATEGORIES as readonly string[]).includes(rawCategory) ? rawCategory : category;

    // Validate readingTime
    const rawTime = String(data.readingTime ?? "").trim();
    const validReadingTime: "2min" | "5min" | "10min" =
      rawTime === "5min" ? "5min" : rawTime === "10min" ? "10min" : "2min";

    return {
      headline: String(data.headline ?? item.title).slice(0, 255),
      summary: String(data.summary ?? "").slice(0, 500),
      fullExplanation: String(data.fullExplanation ?? ""),
      whyItMatters: String(data.whyItMatters ?? "").slice(0, 500),
      examRelevance: String(data.examRelevance ?? "").slice(0, 500),
      category: validCategory,
      readingTime: validReadingTime,
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

  for (const feedUrl of RSS_FEEDS) {
    if (added >= maxNew) break;

    const items = await fetchRssFeed(feedUrl);

    for (const item of items.slice(0, 5)) {
      if (added >= maxNew) break;
      if (!item.title || item.title.length < 20) { skipped++; continue; }

      const titleKey = item.title.toLowerCase().trim();
      if (existingHeadlines.has(titleKey)) { skipped++; continue; }

      const enriched = await enrichWithAI(item);
      if (!enriched) { skipped++; continue; }

      // Check again (by enriched headline)
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

      // Small delay between AI calls
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return { added, skipped };
}
