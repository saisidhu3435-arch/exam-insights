import { useParams, Link } from "wouter";
import { useGetNewsArticle, useGetReactions, useCreateReaction, getGetReactionsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, ThumbsUp, ThumbsDown, Bookmark, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSessionId } from "@/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";

export function ArticlePage() {
  const params = useParams();
  const id = Number(params.id);
  const sessionId = useSessionId();
  const queryClient = useQueryClient();

  const { data: article, isLoading } = useGetNewsArticle(id, {
    query: { enabled: !!id, queryKey: ["article", id] }
  });

  const { data: reactions } = useGetReactions(id, {
    query: { enabled: !!id, queryKey: getGetReactionsQueryKey(id) }
  });

  const createReaction = useCreateReaction();

  const handleReaction = (reactionType: "like" | "dislike") => {
    // Optimistic update
    const currentReaction = reactions?.userReaction;
    const isRemoving = currentReaction === reactionType;
    const newReaction = isRemoving ? "none" : reactionType;

    createReaction.mutate(
      { data: { articleId: id, reaction: newReaction, sessionId } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetReactionsQueryKey(id), data);
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 animate-in fade-in">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
        <div className="space-y-2 mt-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!article) {
    return <div className="p-8 text-center text-muted-foreground">Article not found.</div>;
  }

  return (
    <article className="pb-24 animate-in slide-in-from-bottom-4 duration-500">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Bookmark className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Share2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-semibold px-3">
            {article.category}
          </Badge>
          <div className="flex items-center text-muted-foreground text-xs font-medium">
            <Clock className="w-3.5 h-3.5 mr-1" />
            <span>{article.readingTime} read</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4 tracking-tight">
          {article.headline}
        </h1>

        <div className="text-sm text-muted-foreground font-medium mb-8 pb-6 border-b border-border">
          {new Date(article.publishedAt).toLocaleDateString('en-IN', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground font-medium leading-relaxed">
          <p className="text-xl leading-relaxed font-semibold mb-6">
            {article.summary}
          </p>
          
          <div className="text-base font-medium space-y-6" dangerouslySetInnerHTML={{ __html: article.fullExplanation.replace(/\n/g, '<br/>') }} />
        </div>

        {article.whyItMatters && (
          <div className="mt-10 bg-secondary/50 border border-border p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <span className="bg-foreground text-background text-xs px-2 py-1 rounded">TL;DR</span>
              Why It Matters
            </h3>
            <p className="text-muted-foreground font-medium">{article.whyItMatters}</p>
          </div>
        )}

        {article.examRelevance && (
          <div className="mt-6 bg-primary/5 border border-primary/20 p-6 rounded-2xl">
            <h3 className="font-bold text-primary text-lg mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Exam Relevance
            </h3>
            <p className="text-muted-foreground font-medium">{article.examRelevance}</p>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-border flex flex-col items-center">
          <h4 className="text-lg font-bold mb-6">What do you think?</h4>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => handleReaction("like")}
              className={`flex flex-col items-center gap-2 transition-all p-4 rounded-2xl ${reactions?.userReaction === 'like' ? 'bg-primary/10 text-primary scale-110' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <ThumbsUp className={`w-8 h-8 ${reactions?.userReaction === 'like' ? 'fill-primary' : ''}`} />
              <span className="font-bold">{reactions?.likes || 0}</span>
            </button>
            <button 
              onClick={() => handleReaction("dislike")}
              className={`flex flex-col items-center gap-2 transition-all p-4 rounded-2xl ${reactions?.userReaction === 'dislike' ? 'bg-destructive/10 text-destructive scale-110' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <ThumbsDown className={`w-8 h-8 ${reactions?.userReaction === 'dislike' ? 'fill-destructive' : ''}`} />
              <span className="font-bold">{reactions?.dislikes || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// Add BookOpen import
import { BookOpen as BookOpenIcon } from "lucide-react";
