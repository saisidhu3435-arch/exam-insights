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
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 220)
    .slice(0, 5);
}

// Category color map for the article header
const categoryColors: Record<string, string> = {
  Politics:              "from-blue-600 to-blue-800",
  Economy:               "from-emerald-600 to-teal-700",
  International:         "from-indigo-600 to-purple-700",
  "International Relations": "from-indigo-600 to-purple-700",
  Science:               "from-cyan-500 to-blue-600",
  "Science & Technology":"from-cyan-500 to-blue-600",
  Technology:            "from-violet-600 to-purple-700",
  Environment:           "from-green-600 to-lime-700",
  Law:                   "from-red-700 to-rose-800",
  Social:                "from-orange-500 to-amber-600",
  "National Security":   "from-slate-700 to-slate-900",
  Security:              "from-slate-700 to-slate-900",
  Defense:               "from-slate-600 to-gray-800",
};

function getCategoryGradient(category: string): string {
  return categoryColors[category] ?? "from-primary to-red-800";
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
      { onSuccess: (data) => queryClient.setQueryData(getGetReactionsQueryKey(id), data) }
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = article?.headline ?? "Minute Ahead";
    const text = article?.summary ?? "";
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  const keyFacts = useMemo(() => (article ? extractKeyFacts(article.fullExplanation) : []), [article]);
  const bookmarked = isBookmarked(id);
  const liked = reactions?.userReaction === "like";
  const disliked = reactions?.userReaction === "dislike";

  const catGradient = article ? getCategoryGradient(article.category) : "from-primary to-red-800";

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
      {/* Coloured hero header */}
      <div className={`bg-gradient-to-br ${catGradient} px-5 sm:px-8 pt-6 pb-8 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />

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
            <button
              onClick={handleShare}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors"
            >
              {shared ? <CheckCircle2 className="w-5 h-5 text-green-300" /> : <Share2 className="w-5 h-5" />}
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
          {new Date(article.publishedAt).toLocaleDateString("en-IN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
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
          {shared && (
            <p className="text-center text-green-600 font-medium text-sm mt-6 animate-in fade-in">Link copied!</p>
          )}
        </div>
      </div>
    </article>
  );
}
