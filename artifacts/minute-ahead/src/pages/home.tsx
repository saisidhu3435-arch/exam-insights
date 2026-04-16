import { useGetPreferences, useGetTodaysUpdates } from "@workspace/api-client-react";
import { ArticleCard } from "@/components/article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function HomePage() {
  const [, setLocation] = useLocation();
  const { data: preferences, isLoading: prefsLoading } = useGetPreferences();
  
  useEffect(() => {
    if (!prefsLoading && preferences && !preferences.hasCompletedOnboarding) {
      setLocation("/onboarding");
    }
  }, [preferences, prefsLoading, setLocation]);

  const { data: updates, isLoading: updatesLoading } = useGetTodaysUpdates(
    { 
      goal: preferences?.goal, 
      timeMode: preferences?.timeMode 
    },
    {
      query: {
        enabled: !!preferences?.hasCompletedOnboarding,
        queryKey: ["todays-updates", preferences?.goal, preferences?.timeMode]
      }
    }
  );

  if (prefsLoading || (preferences?.hasCompletedOnboarding && updatesLoading)) {
    return (
      <div className="p-4 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!preferences?.hasCompletedOnboarding) {
    return null; // Will redirect
  }

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2 pt-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Today's Brief.</h1>
        <p className="text-muted-foreground font-medium">
          Cut the noise. Here is what matters today.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {updates?.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      
      {updates?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>You're all caught up for today!</p>
        </div>
      )}
    </div>
  );
}
