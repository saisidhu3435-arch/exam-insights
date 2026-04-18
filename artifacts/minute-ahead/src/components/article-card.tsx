import { Link } from "wouter";
import { Clock, ThumbsUp, ThumbsDown, ArrowRight, Sparkles, GraduationCap, Zap, ImageOff } from "lucide-react";
import type { NewsArticle } from "@workspace/api-client-react";
import { useCreateReaction, useGetReactions, getGetReactionsQueryKey } from "@workspace/api-client-react";
import { Badge } from "./ui/badge";
import { useSessionId } from "@/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Props {
  article: NewsArticle;
  mode?: "stay-updated" | "exams" | "general-knowledge";
}

function Thumbnail({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="w-24 h-20 sm:w-28 sm:h-24 shrink-0 rounded-xl bg-muted flex items-center justify-center">
        <ImageOff className="w-5 h-5 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-24 h-20 sm:w-28 sm:h-24 shrink-0 rounded-xl object-cover"
      onError={() => setErrored(true)}
    />
  );
}

export function ArticleCard({ article, mode = "stay-updated" }: Props) {
  const sessionId = useSessionId();
  const queryClient = useQueryClient();
  const { data: reactions } = useGetReactions(article.id, {
    query: { queryKey: getGetReactionsQueryKey(article.id) },
  });
  const createReaction = useCreateReaction();

  const handleReaction = (e: React.MouseEvent, type: "like" | "dislike") => {
    e.preventDefault();
    e.stopPropagation();
    const current = reactions?.userReaction;
    const next = current === type ? "none" : type;
    createReaction.mutate(
      { data: { articleId: article.id, reaction: next, sessionId } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetReactionsQueryKey(article.id), data);
        },
      }
    );
  };

  const liked = reactions?.userReaction === "like";
  const disliked = reactions?.userReaction === "dislike";

  const modeBadge = {
    "stay-updated": null,
    exams: (
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
        <GraduationCap className="w-3 h-3" />
        Exam-ready
      </div>
    ),
    "general-knowledge": (
      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-full">
        <Sparkles className="w-3 h-3" />
        Story
      </div>
    ),
  }[mode];

  return (
    <Link href={`/article/${article.id}`} className="group block no-underline focus:outline-none">
      <article className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer">

        {/* Top row: category + meta + mode badge */}
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
          {modeBadge && <div className="ml-auto">{modeBadge}</div>}
          {!modeBadge && article.isFeatured && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3 inline -mt-0.5 mr-0.5" />
              Top Pick
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

          {article.imageUrl && (
            <Thumbnail src={article.imageUrl} alt={article.headline} />
          )}
        </div>

        {/* Mode-specific hint */}
        {mode === "exams" && article.examRelevance && (
          <div className="mx-5 mb-3 px-3 py-2 bg-amber-50 border-l-2 border-amber-400 rounded">
            <p className="text-xs text-amber-900 font-medium line-clamp-2">
              <span className="font-bold">For your exam: </span>
              {article.examRelevance.split(".")[0]}.
            </p>
          </div>
        )}
        {mode === "general-knowledge" && article.whyItMatters && (
          <div className="mx-5 mb-3 px-3 py-2 bg-purple-50 border-l-2 border-purple-400 rounded">
            <p className="text-xs text-purple-900 font-medium line-clamp-2 italic">
              "{article.whyItMatters}"
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleReaction(e, "like")}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all ${
                liked
                  ? "bg-primary text-white scale-110"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${liked ? "fill-white" : ""}`} />
              <span>{reactions?.likes ?? article.likes}</span>
            </button>
            <button
              onClick={(e) => handleReaction(e, "dislike")}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all ${
                disliked
                  ? "bg-muted-foreground/20 text-foreground scale-110"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <ThumbsDown className={`w-3.5 h-3.5 ${disliked ? "fill-current" : ""}`} />
              <span>{reactions?.dislikes ?? article.dislikes}</span>
            </button>
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
