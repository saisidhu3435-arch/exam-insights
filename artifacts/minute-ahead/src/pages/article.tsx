import { useParams, Link } from "wouter";
import {
  useGetNewsArticle,
  useGetReactions,
  useCreateReaction,
  useGetPreferences,
  getGetReactionsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Vote,
} from "lucide-react";
import { useSessionId } from "@/hooks/use-session";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useStreak } from "@/hooks/use-streak";
import { useReadArticles } from "@/hooks/use-read-articles";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { AskAI } from "@/components/ask-ai";
import { getArticleImage } from "@/lib/article-image";

const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
function formatLocalDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: USER_TZ,
  });
}

function extractKeyFacts(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 220)
    .slice(0, 5);
}

// Polls are only shown for "main" articles — featured or 10-minute reads
const MAIN_CATEGORIES = ["Law", "Economy", "Politics", "International Relations", "National Security"];

function isMainArticle(article: { isFeatured: boolean; readingTime: string; category: string }): boolean {
  return article.isFeatured || article.readingTime === "10min" || MAIN_CATEGORIES.includes(article.category);
}

// Generate an article-specific poll from the headline and category
function buildPoll(headline: string, category: string): { prompt: string; options: string[] } {
  const h = headline.length > 65 ? headline.slice(0, 62) + "…" : headline;

  const prompts: Record<string, (hl: string) => string> = {
    Law: (hl) => `You're on the bench for: "${hl}" — how do you rule?`,
    Politics: (hl) => `On the decision about "${hl}" — what's the right move?`,
    Economy: (hl) => `Facing "${hl}" — what's your call as Finance Minister?`,
    "International Relations": (hl) => `On this — "${hl}" — what's India's best response?`,
    "National Security": (hl) => `Responding to "${hl}" — what do you prioritise?`,
    Environment: (hl) => `On the issue of "${hl}" — what would you do first?`,
    "Science & Technology": (hl) => `Regarding "${hl}" — what's your verdict?`,
    Social: (hl) => `On "${hl}" — what policy would you back?`,
  };

  const options: Record<string, string[]> = {
    Law: ["Rule in favour of the petitioner", "Dismiss on procedural grounds", "Refer to a larger constitutional bench"],
    Politics: ["Push it through with immediate effect", "Send it back for wider consultation", "Reject it and start fresh"],
    Economy: ["Raise rates to control inflation", "Cut taxes to stimulate growth", "Hold steady — no change"],
    "International Relations": ["Pursue dialogue and de-escalate", "Take firm unilateral action", "Work through multilateral forums"],
    "National Security": ["Escalate response immediately", "Strengthen intelligence networks", "Boost domestic security infrastructure"],
    Environment: ["Impose strict penalties on violators", "Offer incentives for green behaviour", "Seek international climate funding"],
    "Science & Technology": ["Approve with strict oversight", "Pause and commission independent review", "Reject — the risks outweigh benefits"],
    Social: ["Direct government-led welfare", "Community-driven grassroots solutions", "Public-private co-funding model"],
  };

  const promptFn = prompts[category] ?? ((hl: string) => `Your take on "${hl}"?`);
  const opts = options[category] ?? ["Take strong action now", "Wait for more information", "Seek expert advice"];

  return { prompt: promptFn(h), options: opts };
}

function QuickPoll({ articleId, headline, category }: { articleId: number; headline: string; category: string }) {
  const poll = buildPoll(headline, category);
  const storageKey = `ma_poll_${articleId}`;

  const [votes, setVotes] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.votes as number[];
      }
    } catch {}
    return poll.options.map(() => Math.floor(Math.random() * 40 + 10));
  });
  const [userVote, setUserVote] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.userVote ?? null;
      }
    } catch {}
    return null;
  });

  const total = votes.reduce((a, b) => a + b, 0);

  function vote(idx: number) {
    if (userVote !== null) return;
    const newVotes = votes.map((v, i) => (i === idx ? v + 1 : v));
    setVotes(newVotes);
    setUserVote(idx);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ votes: newVotes, userVote: idx }));
    } catch {}
  }

  const hasVoted = userVote !== null;

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Vote className="w-5 h-5 text-primary shrink-0" />
        <h3 className="font-extrabold text-base text-foreground">{poll.prompt}</h3>
      </div>

      <div className="space-y-2.5">
        {poll.options.map((option, idx) => {
          const pct = total > 0 ? Math.round((votes[idx] / total) * 100) : 0;
          const isChosen = userVote === idx;

          return (
            <button
              key={idx}
              onClick={() => vote(idx)}
              disabled={hasVoted}
              className={`w-full text-left rounded-xl overflow-hidden relative transition-all duration-200 ${
                hasVoted ? "cursor-default" : "hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              <div className="relative z-10 flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-2.5">
                  {hasVoted && (
                    <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      isChosen ? "border-primary bg-primary" : "border-border"
                    }`}>
                      {isChosen && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </span>
                  )}
                  <span className={`text-sm font-semibold ${isChosen ? "text-primary" : "text-foreground"}`}>{option}</span>
                </div>
                {hasVoted && (
                  <span className={`text-sm font-extrabold shrink-0 ${isChosen ? "text-primary" : "text-muted-foreground"}`}>{pct}%</span>
                )}
              </div>
              <div className={`absolute inset-0 rounded-xl border transition-all duration-500 ${
                isChosen ? "border-primary/40 bg-primary/10" : "border-border bg-secondary/60"
              }`} />
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ease-out ${
                    isChosen ? "bg-primary/20" : "bg-border/40"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <p className="text-xs text-muted-foreground text-center font-medium">{total} readers voted</p>
      )}
      {!hasVoted && (
        <p className="text-xs text-muted-foreground text-center font-medium">Tap to vote · see how others think</p>
      )}
    </div>
  );
}

export function ArticlePage() {
  const params = useParams();
  const id = Number(params.id);
  const sessionId = useSessionId();
  const queryClient = useQueryClient();
  const { toggle, isBookmarked } = useBookmarks();
  const { markRead } = useStreak();
  const { markRead: markArticleRead } = useReadArticles();

  const { data: preferences } = useGetPreferences(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: ["preferences", sessionId] } }
  );
  const goal = preferences?.goal ?? "stay-updated";

  const { data: article, isLoading } = useGetNewsArticle(id, {
    query: { enabled: !!id, queryKey: ["article", id] },
  });
  const { data: reactions } = useGetReactions(id, {
    query: { enabled: !!id, queryKey: getGetReactionsQueryKey(id) },
  });
  const createReaction = useCreateReaction();

  useEffect(() => {
    if (article) {
      markRead();
      markArticleRead(article.id);
    }
  }, [article, markRead, markArticleRead]);

  const handleReaction = (type: "like" | "dislike") => {
    const current = reactions?.userReaction;
    const next = current === type ? "none" : type;
    createReaction.mutate(
      { data: { articleId: id, reaction: next, sessionId } },
      { onSuccess: (data) => queryClient.setQueryData(getGetReactionsQueryKey(id), data) }
    );
  };

  const keyFacts = useMemo(() => (article ? extractKeyFacts(article.fullExplanation) : []), [article]);
  const bookmarked = isBookmarked(id);
  const liked = reactions?.userReaction === "like";
  const disliked = reactions?.userReaction === "dislike";

  const heroImage = article ? getArticleImage(article.id, article.category, article.headline, article.imageUrl) : "";
  const showPoll = article ? isMainArticle(article) : false;

  if (isLoading) {
    return (
      <div className="p-5 sm:p-8 space-y-6 animate-in fade-in">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="space-y-3 mt-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4 w-full rounded" />)}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Article not found.{" "}
        <Link href="/" className="text-primary font-semibold underline">Go back</Link>
      </div>
    );
  }

  return (
    <article className="pb-24 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Hero with image background */}
      <div
        className="relative px-5 sm:px-8 pt-6 pb-10 overflow-hidden min-h-[280px] flex flex-col justify-end"
        style={heroImage ? {
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        } : {}}
      >
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/85 pointer-events-none" />

        {/* Back + actions */}
        <div className="flex items-center justify-between mb-6 relative">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex gap-1">
            <button
              onClick={() => toggle(id)}
              className={`p-2 rounded-full transition-all ${bookmarked ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/15"}`}
              title={bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-white" : ""}`} />
            </button>
          </div>
        </div>

        {/* Category + meta */}
        <div className="flex items-center gap-3 mb-4 flex-wrap relative">
          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
            {article.category}
          </span>
          <div className="flex items-center text-white/70 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 mr-1" />
            {article.readingTime} read
          </div>
          {goal === "exams" && (
            <span className="flex items-center gap-1 text-xs font-bold bg-amber-400/20 text-amber-100 px-2.5 py-1 rounded-full border border-amber-400/30">
              <GraduationCap className="w-3 h-3" /> Exam Mode
            </span>
          )}
          {goal === "general-knowledge" && (
            <span className="flex items-center gap-1 text-xs font-bold bg-purple-400/20 text-purple-100 px-2.5 py-1 rounded-full border border-purple-400/30">
              <Sparkles className="w-3 h-3" /> Deep Dive
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white relative">
          {article.headline}
        </h1>

        <p className="text-white/60 text-xs font-medium mt-3 relative">
          {formatLocalDate(article.publishedAt)}
        </p>
      </div>

      {/* Body */}
      <div className="px-5 sm:px-8 pt-6 space-y-6">
        {/* Summary lead */}
        <p className="text-lg sm:text-xl font-semibold leading-relaxed text-foreground border-l-4 border-primary pl-4">
          {article.summary}
        </p>

        {/* MODE: STAY UPDATED */}
        {goal === "stay-updated" && (
          <>
            <div
              className="text-base font-medium leading-relaxed text-foreground/90"
              dangerouslySetInnerHTML={{
                __html: `<p class="mb-4">${article.fullExplanation.replace(/\n\n/g, '</p><p class="mb-4">').replace(/\n/g, "<br/>")}</p>`,
              }}
            />
            {article.whyItMatters && (
              <div className="bg-secondary/60 border border-border p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-foreground text-background text-[10px] font-bold uppercase px-2 py-0.5 rounded">TL;DR</span>
                  <h3 className="font-bold text-base">Why this matters</h3>
                </div>
                <p className="text-muted-foreground font-medium text-sm leading-relaxed">{article.whyItMatters}</p>
              </div>
            )}
            {showPoll && <QuickPoll articleId={id} headline={article.headline} category={article.category} />}
          </>
        )}

        {/* MODE: EXAMS */}
        {goal === "exams" && (
          <>
            {keyFacts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-700" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wide text-amber-900">Key Facts</h3>
                </div>
                <ul className="space-y-2.5">
                  {keyFacts.map((fact, i) => (
                    <li key={i} className="flex gap-3 text-sm font-medium text-amber-950 leading-relaxed">
                      <span className="font-bold text-amber-600 shrink-0">{i + 1}.</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <h3 className="font-extrabold text-lg mb-2 flex items-start gap-2">
                  <span className="text-primary">Q.</span> What happened, exactly?
                </h3>
                <div
                  className="text-base font-medium leading-relaxed text-foreground/90 pl-5"
                  dangerouslySetInnerHTML={{
                    __html: `<p class="mb-4">${article.fullExplanation.replace(/\n\n/g, '</p><p class="mb-4">').replace(/\n/g, "<br/>")}</p>`,
                  }}
                />
              </div>
              {article.whyItMatters && (
                <div>
                  <h3 className="font-extrabold text-lg mb-2 flex items-start gap-2">
                    <span className="text-primary">Q.</span> Why does it matter?
                  </h3>
                  <p className="text-base font-medium leading-relaxed text-foreground/90 pl-5">{article.whyItMatters}</p>
                </div>
              )}
            </div>

            {article.examRelevance && (
              <div className="bg-primary text-white p-5 sm:p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5" />
                  <h3 className="font-extrabold text-base uppercase tracking-wide">Why this matters for your exam</h3>
                </div>
                <p className="text-sm sm:text-base font-medium leading-relaxed text-white/95">{article.examRelevance}</p>
              </div>
            )}

            {showPoll && <QuickPoll articleId={id} headline={article.headline} category={article.category} />}
            <AskAI articleId={id} />
          </>
        )}

        {/* MODE: GENERAL KNOWLEDGE */}
        {goal === "general-knowledge" && (
          <>
            <div
              className="text-base sm:text-lg font-medium leading-loose text-foreground/90"
              dangerouslySetInnerHTML={{
                __html: `<p class="mb-5">${article.fullExplanation.replace(/\n\n/g, '</p><p class="mb-5">').replace(/\n/g, "<br/>")}</p>`,
              }}
            />
            {article.whyItMatters && (
              <div className="border-l-4 border-primary bg-primary/5 p-5 rounded-r-2xl italic">
                <p className="text-base font-medium leading-relaxed text-foreground/90">"{article.whyItMatters}"</p>
              </div>
            )}
            {showPoll && <QuickPoll articleId={id} headline={article.headline} category={article.category} />}
            <AskAI articleId={id} />
          </>
        )}

        {/* Reactions */}
        <div className="pt-8 border-t border-border">
          <h4 className="text-center text-base font-bold mb-1">Was this useful?</h4>
          <p className="text-center text-xs text-muted-foreground mb-6">Your reaction helps us pick better stories.</p>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => handleReaction("like")}
              className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-200 ${
                liked ? "bg-primary/10 text-primary scale-110 shadow-md" : "text-muted-foreground hover:bg-muted hover:scale-105"
              }`}
            >
              <ThumbsUp className={`w-7 h-7 ${liked ? "fill-primary -rotate-12" : ""}`} />
              <span className="font-bold text-sm">{reactions?.likes ?? article.likes}</span>
            </button>
            <button
              onClick={() => handleReaction("dislike")}
              className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-200 ${
                disliked ? "bg-muted/80 text-foreground scale-110 shadow-md" : "text-muted-foreground hover:bg-muted hover:scale-105"
              }`}
            >
              <ThumbsDown className={`w-7 h-7 ${disliked ? "fill-current rotate-12" : ""}`} />
              <span className="font-bold text-sm">{reactions?.dislikes ?? article.dislikes}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
