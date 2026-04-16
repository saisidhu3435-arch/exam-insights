import { useListCategories, useListNews } from "@workspace/api-client-react";
import { ArticleCard } from "@/components/article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function BrowsePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  
  const { data: categories, isLoading: categoriesLoading } = useListCategories();
  const { data: articles, isLoading: articlesLoading } = useListNews(
    { category: selectedCategory },
    { query: { queryKey: ["list-news", selectedCategory] } }
  );

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-[53px] z-40 bg-background/95 backdrop-blur-md border-b border-border pt-4 pb-2 shadow-sm">
        <div className="px-4 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Browse</h1>
        </div>
        
        <ScrollArea className="w-full whitespace-nowrap px-4 pb-2">
          <div className="flex w-max space-x-2">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                !selectedCategory 
                  ? "bg-foreground text-background" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All Topics
            </button>
            {categoriesLoading ? (
              Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full inline-block" />
              ))
            ) : (
              categories?.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                    selectedCategory === cat.name 
                      ? "bg-foreground text-background" 
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {cat.name}
                  <span className={`text-[10px] py-0.5 px-1.5 rounded-full ${
                    selectedCategory === cat.name ? "bg-background/20" : "bg-background"
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </div>

      <div className="p-4 sm:p-6 flex-1 bg-muted/20">
        {articlesLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : articles?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground font-medium">No articles found in this category.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 animate-in fade-in duration-500">
            {articles?.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
