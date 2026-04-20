import { Link } from "wouter";
import { Clock, ThumbsUp, ThumbsDown, ArrowRight, Sparkles, GraduationCap, Zap, ImageOff, CheckCircle2 } from "lucide-react";
import type { NewsArticle } from "@workspace/api-client-react";
import { useCreateReaction, useGetReactions, getGetReactionsQueryKey } from "@workspace/api-client-react";
import { Badge } from "./ui/badge";
import { useSessionId } from "@/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import { useReadArticles } from "@/hooks/use-read-articles";
import { useState } from "react";
import { getArticleImage } from "@/lib/article-image";

interface Props {
  article: NewsArticle;
  mode?: "stay-updated" | "exams" | "general-knowledge";
}

// Source icon/label mapping
const SOURCE_ICONS: Record<string, string> = {
  "The Hindu":         "🔵",
  "Times of India":    "🟠",
  "Indian Express":    "🔴",
  "NDTV":              "🟣",
  "Google News India": "🔍",
};

function Thumbnail({ src, fallbackSrc, alt }: { src: string; fallbackSrc?: string; alt: string }) {
  const [triedFallback, setTriedFallback] = useState(false);
  const [errored, setErrored] = useState(false);

  const activeSrc = triedFallback && fallbackSrc ? fallbackSrc : src;

  if (errored) {
    return (
      <div className="w-24 h-20 sm:w-28 sm:h-24 shrink-0 rounded-xl bg-muted flex items-center justify-center">
        <ImageOff className="w-5 h-5 text-muted-foreground/40" />
      </div>
    );
  }
  return (
    <img
      src={activeSrc}
      alt={alt}
      className="w-24 h-20 sm:w-28 sm:h-24 shrink-0 rounded-xl object-cover"
      onError={() => {
        if (!triedFallback && fallbackSrc && fallbackSrc !== src) {
          setTriedFallback(true);
        } else {
          setErrored(true);
        }
      }}
    />
  );
}

export function ArticleCard({ article, mode = "stay-updated" }: Props) {
  const sessionId = useSessionId();
  const queryClient = useQueryClient();
  const { isRead } = useReadArticles();
  const { data: reactions } = useGetReactions(article.id, {
    query: { queryKey: getGetReactionsQueryKey(article.id) },
  });
  const createReaction = useCreateReaction();
  const alreadyRead = isRead(article.id);

  const handleReaction = (e: React.MouseEvent, type: "like" | "dislike") => {
    e.preventDefault();
    e.stopPropagation();
    const current = reactions?.userReaction;
    const next = current === type ? "none" : type;
    createReaction.mutate(
      { data: { articleId: article.id, reaction: next, sessionId } },
      { onSuccess: (data) => { queryClient.setQueryData(getGetReactionsQueryKey(article.id), data); } }
    );
  };

  const liked = reactions?.userReaction === "like";
  const disliked = reactions?.userReaction === "dislike";

  const modeBadge = {
    "stay-updated": null,
    exams: (
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
        <GraduationCap className="w-3 h-3" />Exam-ready
      </div>
    ),
    "general-knowledge": (
      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-full">
        <Sparkles className="w-3 h-3" />Story
      </div>
    ),
  }[mode];

  return (
    <Link href={`/article/${article.id}`} className="group block no-underline focus:outline-none">
      <article className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer">

        {/* Top row */}
        <div className="flex items-center gap-3 px-5 pt-4 mb-3 flex-wrap">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-semibold rounded-full px-3 text-xs"
          >
            {article.category}
          </Badge>
          <div className="flex items-center text-muted-foreground text-xs font-medium">
            <Clock className="w-3 h-3 mr-1" />
            {article.readingTime} read
          </div>
          {alreadyRead && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-2.5 h-2.5" />Read
            </div>
          )}
          {modeBadge && <div className="ml-auto">{modeBadge}</div>}
          {!modeBadge && article.isFeatured && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3 inline -mt-0.5 mr-0.5" />Top Pick
            </span>
          )}
        </div>

        {/* Content row: text + thumbnail */}
        <div className="flex items-start gap-3 px-5 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-extrabold leading-snug tracking-tight group-hover:text-primary transition-colors mb-2">
              {article.headline}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-[15px] line-clamp-2">
              {article.summary}
            </p>
          </div>
          {(() => {
            const primary = getArticleImage(article.id, article.category, article.headline, article.imageUrl);
            const pexels  = getArticleImage(article.id, article.category, article.headline, null);
            return <Thumbnail src={primary} fallbackSrc={pexels} alt={article.headline} />;
          })()}
        </div>

        {/* Mode-specific hints */}
        {mode === "exams" && article.examRelevance && (
          <div className="mx-5 mb-3 px-3 py-2 bg-amber-50 border-l-2 border-amber-400 rounded">
            <p className="text-xs text-amber-900 font-medium line-clamp-2">
              <span className="font-bold">For your exam: </span>{article.examRelevance.split(".")[0]}.
            </p>
          </div>
        )}
        {mode === "general-knowledge" && article.whyItMatters && (
          <div className="mx-5 mb-3 px-3 py-2 bg-purple-50 border-l-2 border-purple-400 rounded">
            <p className="text-xs text-purple-900 font-medium line-clamp-2 italic">"{article.whyItMatters}"</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleReaction(e, "like")}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all ${
                liked ? "bg-primary text-white scale-110" : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${liked ? "fill-white" : ""}`} />
              <span>{reactions?.likes ?? article.likes}</span>
            </button>
            <button
              onClick={(e) => handleReaction(e, "dislike")}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all ${
                disliked ? "bg-muted-foreground/20 text-foreground scale-110" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <ThumbsDown className={`w-3.5 h-3.5 ${disliked ? "fill-current" : ""}`} />
              <span>{reactions?.dislikes ?? article.dislikes}</span>
            </button>

            {/* Source badge */}
            {article.sourceName && (
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (article.sourceUrl) window.open(article.sourceUrl, "_blank", "noopener,noreferrer");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && article.sourceUrl) window.open(article.sourceUrl, "_blank", "noopener,noreferrer");
                }}
                className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors ml-1 px-2 py-1 rounded-full hover:bg-primary/5 cursor-pointer"
                title={`Source: ${article.sourceName}`}
              >
                <span>{SOURCE_ICONS[article.sourceName] ?? "📰"}</span>
                {article.sourceName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-primary text-xs font-bold group-hover:gap-2 transition-all">
            {mode === "exams" ? "Study" : mode === "general-knowledge" ? "Read story" : "Read"}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  );
}
