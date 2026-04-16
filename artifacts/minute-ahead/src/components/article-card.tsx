import { Link } from "wouter";
import { Clock, BookOpen } from "lucide-react";
import type { NewsArticle } from "@workspace/api-client-react/src/generated/api.schemas";
import { Badge } from "./ui/badge";

export function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <Link href={`/article/${article.id}`} className="group block no-underline focus:outline-none">
      <article className="border border-border bg-card rounded-xl p-5 sm:p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 active:scale-[0.99] flex flex-col h-full cursor-pointer relative overflow-hidden">
        {article.isFeatured && (
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold uppercase tracking-wider py-1 px-8 translate-x-[30%] translate-y-[50%] rotate-45 text-center w-full">
              Featured
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-3 mb-3">
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-medium rounded-full px-3">
            {article.category}
          </Badge>
          <div className="flex items-center text-muted-foreground text-xs font-medium">
            <Clock className="w-3 h-3 mr-1" />
            <span>{article.readingTime} read</span>
          </div>
        </div>

        <h3 className="text-xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {article.headline}
        </h3>
        
        <p className="text-muted-foreground leading-relaxed line-clamp-3 text-sm sm:text-base flex-grow">
          {article.summary}
        </p>

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground font-medium">
            {new Date(article.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </div>
          <div className="text-primary text-sm font-bold flex items-center group-hover:translate-x-1 transition-transform">
            Read <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">-&gt;</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
