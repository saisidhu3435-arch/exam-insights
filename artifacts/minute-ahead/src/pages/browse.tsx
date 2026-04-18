import { useListCategories, useListNews, useGetNewsArticle } from "@workspace/api-client-react";
import { ArticleCard } from "@/components/article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { Bookmark } from "lucide-react";

function BookmarksSection() {
  const { bookmarks } = useBookmarks();

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <Bookmark className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="font-semibold text-foreground mb-1">No saved articles yet</p>
        <p className="text-sm text-muted-foreground">Bookmark any article using the 🔖 button while reading.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 animate-in fade-in duration-500">
      {bookmarks.map((id) => (
        <BookmarkedArticle key={id} id={id} />
      ))}
    </div>
  );
}

function BookmarkedArticle({ id }: { id: number }) {
  const { data: article, isLoading } = useGetNewsArticle(id, {
    query: { queryKey: ["article", id] },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (!article) return null;
  return <ArticleCard article={article} />;
}

type Tab = "browse" | "saved";

export function BrowsePage() {
  const [activeTab, setActiveTab] = useState<Tab>("browse");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const { data: categories, isLoading: categoriesLoading } = useListCategories();
  const { data: articles, isLoading: articlesLoading } = useListNews(
    { category: selectedCategory },
    { query: { queryKey: ["list-news", selectedCategory], enabled: activeTab === "browse" } }
  );
  const { bookmarks } = useBookmarks();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-[53px] z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="px-4 pt-4 pb-0">
          <h1 className="text-2xl font-bold tracking-tight mb-3">Browse</h1>

          {/* Tabs */}
          <div className="flex gap-1 mb-0">
            <button
              onClick={() => setActiveTab("browse")}
              className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors border-b-2 ${
                activeTab === "browse"
                  ? "text-primary border-primary bg-primary/5"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              All Topics
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "saved"
                  ? "text-primary border-primary bg-primary/5"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved
              {bookmarks.length > 0 && (
                <span className="text-[10px] font-extrabold bg-primary text-white rounded-full px-1.5 py-0.5 leading-none">
                  {bookmarks.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category filter (only in browse tab) */}
        {activeTab === "browse" && (
          <ScrollArea className="w-full whitespace-nowrap px-4 py-2">
            <div className="flex w-max space-x-2">
              <button
                onClick={() => setSelectedCategory(undefined)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  !selectedCategory
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                All
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
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 flex-1 bg-muted/20">
        {activeTab === "saved" ? (
          <BookmarksSection />
        ) : articlesLoading ? (
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
