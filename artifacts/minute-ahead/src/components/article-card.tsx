import { Link } from "wouter";
import { Clock, ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react";
import type { NewsArticle } from "@workspace/api-client-react/src/generated/api.schemas";
import { useCreateReaction, useGetReactions, getGetReactionsQueryKey } from "@workspace/api-client-react";
import { Badge } from "./ui/badge";
import { useSessionId } from "@/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";

export function ArticleCard({ article }: { article: NewsArticle }) {
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

  return (
    <Link href={`/article/${article.id}`} className="group block no-underline focus:outline-none">
      <article className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 pt-5 mb-3">
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
          {article.isFeatured && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Top Pick
            </span>
          )}
        </div>

        {/* Headline */}
        <div className="px-5 mb-3">
          <h3 className="text-[1.1rem] font-extrabold leading-snug tracking-tight group-hover:text-primary transition-colors">
            {article.headline}
          </h3>
        </div>

        {/* Summary */}
        <div className="px-5 mb-4">
          <p className="text-muted-foreground leading-relaxed text-sm line-clamp-2">
            {article.summary}
          </p>
        </div>

        {/* Footer: date + reactions + read more */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary/30">
          <div className="flex items-center gap-3">
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
            Read more
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  );
}
