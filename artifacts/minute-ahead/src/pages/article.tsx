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
  Share2,
  GraduationCap,
  CheckCircle2,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSessionId } from "@/hooks/use-session";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useStreak } from "@/hooks/use-streak";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AskAI } from "@/components/ask-ai";

function extractKeyFacts(text: string): string[] {
  const sentences = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 200);
  return sentences.slice(0, 5);
}

export function ArticlePage() {
  const params = useParams();
  const id = Number(params.id);
  const sessionId = useSessionId();
  const queryClient = useQueryClient();
  const { toggle, isBookmarked } = useBookmarks();
  const { markRead } = useStreak();
  const [shared, setShared] = useState(false);

  const { data: preferences } = useGetPreferences();
  const goal = preferences?.goal ?? "stay-updated";

  const { data: article, isLoading } = useGetNewsArticle(id, {
    query: { enabled: !!id, queryKey: ["article", id] },
  });

  const { data: reactions } = useGetReactions(id, {
    query: { enabled: !!id, queryKey: getGetReactionsQueryKey(id) },
  });

  const createReaction = useCreateReaction();

  useEffect(() => {
    if (article) markRead();
  }, [article, markRead]);

  const handleReaction = (type: "like" | "dislike") => {
    const current = reactions?.userReaction;
    const next = current === type ? "none" : type;
    createReaction.mutate(
      { data: { articleId: id, reaction: next, sessionId } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetReactionsQueryKey(id), data);
        },
      }
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = article?.headline ?? "Minute Ahead";
    const text = article?.summary ?? "";
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  const keyFacts = useMemo(
    () => (article ? extractKeyFacts(article.fullExplanation) : []),
    [article]
  );

  const bookmarked = isBookmarked(id);
  const liked = reactions?.userReaction === "like";
  const disliked = reactions?.userReaction === "dislike";

  if (isLoading) {
    return (
      <div className="p-5 sm:p-8 space-y-6 animate-in fade-in">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="space-y-3 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Article not found.{" "}
        <Link href="/" className="text-primary font-semibold underline">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <article className="px-5 sm:px-8 py-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to today's brief
        </Link>
        <div className="flex gap-1">
          <button
            onClick={() => toggle(id)}
            className={`p-2 rounded-full transition-all ${
              bookmarked
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            title={bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-primary" : ""}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Share"
          >
            {shared ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-none font-semibold px-3 rounded-full"
        >
          {article.category}
        </Badge>
        <div className="flex items-center text-muted-foreground text-xs font-medium">
          <Clock className="w-3.5 h-3.5 mr-1" />
          {article.readingTime} read
        </div>
        {goal === "exams" && (
          <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
            <GraduationCap className="w-3 h-3" /> Exam Mode
          </span>
        )}
        {goal === "general-knowledge" && (
          <span className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3 h-3" /> Deep Dive
          </span>
        )}
      </div>

      {/* Headline */}
      <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3 tracking-tight">
        {article.headline}
      </h1>

      <p className="text-xs text-muted-foreground font-medium mb-6 pb-6 border-b border-border">
        {new Date(article.publishedAt).toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {/* Summary lead */}
      <p className="text-lg sm:text-xl font-semibold leading-relaxed mb-8 text-foreground">
        {article.summary}
      </p>

      {/* MODE: STAY UPDATED — clean, simple read */}
      {goal === "stay-updated" && (
        <>
          <div
            className="text-base font-medium leading-relaxed text-foreground/90 space-y-4"
            dangerouslySetInnerHTML={{
              __html: `<p>${article.fullExplanation.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`,
            }}
          />
          {article.whyItMatters && (
            <div className="mt-10 bg-secondary/60 border border-border p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-foreground text-background text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                  TL;DR
                </span>
                <h3 className="font-bold text-base">Why this matters</h3>
              </div>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                {article.whyItMatters}
              </p>
            </div>
          )}
        </>
      )}

      {/* MODE: EXAMS — facts, exam angle, structured */}
      {goal === "exams" && (
        <>
          {/* Quick Facts */}
          {keyFacts.length > 0 && (
            <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-700" />
                <h3 className="font-extrabold text-sm uppercase tracking-wide text-amber-900">
                  Key Facts
                </h3>
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

          {/* Q&A format */}
          <div className="space-y-5 mb-8">
            <div>
              <h3 className="font-extrabold text-lg mb-2 flex items-start gap-2">
                <span className="text-primary">Q.</span> What happened, exactly?
              </h3>
              <div
                className="text-base font-medium leading-relaxed text-foreground/90 space-y-3 pl-5"
                dangerouslySetInnerHTML={{
                  __html: `<p>${article.fullExplanation.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`,
                }}
              />
            </div>

            {article.whyItMatters && (
              <div>
                <h3 className="font-extrabold text-lg mb-2 flex items-start gap-2">
                  <span className="text-primary">Q.</span> Why does it matter?
                </h3>
                <p className="text-base font-medium leading-relaxed text-foreground/90 pl-5">
                  {article.whyItMatters}
                </p>
              </div>
            )}
          </div>

          {/* Exam angle - ONLY in exams mode */}
          {article.examRelevance && (
            <div className="bg-primary text-white p-5 sm:p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5" />
                <h3 className="font-extrabold text-base uppercase tracking-wide">
                  Why this matters for your exam
                </h3>
              </div>
              <p className="text-sm sm:text-base font-medium leading-relaxed text-white/95">
                {article.examRelevance}
              </p>
            </div>
          )}
        </>
      )}

      {/* MODE: GENERAL KNOWLEDGE — story + AI */}
      {goal === "general-knowledge" && (
        <>
          <div
            className="text-base sm:text-lg font-medium leading-loose text-foreground/90 space-y-5 prose-style"
            dangerouslySetInnerHTML={{
              __html: `<p>${article.fullExplanation.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`,
            }}
          />

          {article.whyItMatters && (
            <div className="mt-10 bg-secondary/60 border-l-4 border-primary p-5 rounded-r-2xl italic">
              <p className="text-base font-medium leading-relaxed text-foreground/90">
                "{article.whyItMatters}"
              </p>
            </div>
          )}

          {/* AI Q&A — ONLY in general-knowledge mode */}
          <AskAI articleId={id} />
        </>
      )}

      {/* Reactions */}
      <div className="mt-12 pt-8 border-t border-border">
        <h4 className="text-center text-base font-bold mb-2">Was this useful?</h4>
        <p className="text-center text-xs text-muted-foreground mb-6">
          Your reaction helps us pick better stories for you.
        </p>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => handleReaction("like")}
            className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-200 ${
              liked
                ? "bg-primary/10 text-primary scale-110 shadow-md"
                : "text-muted-foreground hover:bg-muted hover:scale-105"
            }`}
          >
            <ThumbsUp className={`w-7 h-7 ${liked ? "fill-primary -rotate-12" : ""}`} />
            <span className="font-bold text-sm">{reactions?.likes ?? article.likes}</span>
          </button>
          <button
            onClick={() => handleReaction("dislike")}
            className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-200 ${
              disliked
                ? "bg-muted/80 text-foreground scale-110 shadow-md"
                : "text-muted-foreground hover:bg-muted hover:scale-105"
            }`}
          >
            <ThumbsDown className={`w-7 h-7 ${disliked ? "fill-current rotate-12" : ""}`} />
            <span className="font-bold text-sm">{reactions?.dislikes ?? article.dislikes}</span>
          </button>
        </div>

        {shared && (
          <p className="text-center text-green-600 font-medium text-sm mt-6 animate-in fade-in">
            Link copied to clipboard!
          </p>
        )}
      </div>
    </article>
  );
}
