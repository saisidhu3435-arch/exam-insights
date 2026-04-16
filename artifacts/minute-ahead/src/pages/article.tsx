import { useParams, Link } from "wouter";
import {
  useGetNewsArticle,
  useGetReactions,
  useCreateReaction,
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
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSessionId } from "@/hooks/use-session";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useStreak } from "@/hooks/use-streak";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function ArticlePage() {
  const params = useParams();
  const id = Number(params.id);
  const sessionId = useSessionId();
  const queryClient = useQueryClient();
  const { toggle, isBookmarked } = useBookmarks();
  const { markRead } = useStreak();
  const [shared, setShared] = useState(false);

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
    }
  }, [article, markRead]);

  const handleReaction = (reactionType: "like" | "dislike") => {
    const current = reactions?.userReaction;
    const next = current === reactionType ? "none" : reactionType;
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

  const bookmarked = isBookmarked(id);
  const liked = reactions?.userReaction === "like";
  const disliked = reactions?.userReaction === "dislike";

  if (isLoading) {
    return (
      <div className="p-5 space-y-6 animate-in fade-in">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-8 w-3/4 rounded-xl" />
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
      <div className="p-8 text-center text-muted-foreground">
        Article not found.
      </div>
    );
  }

  return (
    <article className="pb-24 animate-in slide-in-from-bottom-2 duration-400">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => toggle(id)}
            className={`p-2 rounded-full transition-all ${
              bookmarked
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            title={bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Bookmark
              className={`w-5 h-5 ${bookmarked ? "fill-primary" : ""}`}
            />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative"
            title="Share"
          >
            {shared ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Share2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      <div className="p-5 sm:p-6">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-5">
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
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-4 tracking-tight">
          {article.headline}
        </h1>

        {/* Date */}
        <p className="text-xs text-muted-foreground font-medium mb-8 pb-6 border-b border-border">
          {new Date(article.publishedAt).toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        {/* Summary lead */}
        <p className="text-lg font-semibold leading-relaxed mb-6 text-foreground">
          {article.summary}
        </p>

        {/* Full explanation */}
        <div
          className="text-base font-medium leading-relaxed text-foreground/90 space-y-4"
          dangerouslySetInnerHTML={{
            __html: article.fullExplanation.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>"),
          }}
        />

        {/* Why it matters */}
        {article.whyItMatters && (
          <div className="mt-10 bg-secondary/60 border border-border p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-foreground text-background text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                TL;DR
              </span>
              <h3 className="font-bold text-base">Why This Matters</h3>
            </div>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed">
              {article.whyItMatters}
            </p>
          </div>
        )}

        {/* Exam relevance */}
        {article.examRelevance && (
          <div className="mt-4 bg-primary/5 border border-primary/20 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-base text-primary">Exam Angle</h3>
            </div>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed">
              {article.examRelevance}
            </p>
          </div>
        )}

        {/* Reactions */}
        <div className="mt-12 pt-8 border-t border-border">
          <h4 className="text-center text-base font-bold mb-2">
            What do you think?
          </h4>
          <p className="text-center text-xs text-muted-foreground mb-6">
            Your reaction helps us surface better stories.
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
              <ThumbsUp
                className={`w-8 h-8 transition-transform ${liked ? "fill-primary -rotate-12" : ""}`}
              />
              <span className="font-bold text-sm">
                {reactions?.likes ?? article.likes}
              </span>
            </button>

            <button
              onClick={() => handleReaction("dislike")}
              className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-200 ${
                disliked
                  ? "bg-muted/80 text-foreground scale-110 shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:scale-105"
              }`}
            >
              <ThumbsDown
                className={`w-8 h-8 transition-transform ${disliked ? "fill-current rotate-12" : ""}`}
              />
              <span className="font-bold text-sm">
                {reactions?.dislikes ?? article.dislikes}
              </span>
            </button>
          </div>

          {shared && (
            <p className="text-center text-green-600 font-medium text-sm mt-6 animate-in fade-in">
              Link copied to clipboard!
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
