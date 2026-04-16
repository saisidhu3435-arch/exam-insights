import { useGetPreferences, useGetTodaysUpdates } from "@workspace/api-client-react";
import { ArticleCard } from "@/components/article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useStreak } from "@/hooks/use-streak";
import { Flame, BookOpen, Zap } from "lucide-react";

function StreakBadge({ count }: { count: number }) {
  if (count === 0) return null;

  const label =
    count >= 30
      ? "You're unstoppable."
      : count >= 14
      ? "Two weeks strong!"
      : count >= 7
      ? "One week streak!"
      : count >= 3
      ? "On a roll!"
      : "Keep it up!";

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-full px-4 py-2">
      <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
      <span className="text-sm font-bold text-orange-600">
        {count} day streak
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function GoalBadge({ goal }: { goal?: string }) {
  if (!goal) return null;
  const map: Record<string, { icon: React.ReactNode; label: string }> = {
    exams: { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Exam Mode" },
    "stay-updated": { icon: <Zap className="w-3.5 h-3.5" />, label: "Quick Brief" },
    "general-knowledge": { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Deep Dive" },
  };
  const item = map[goal];
  if (!item) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      {item.icon}
      {item.label}
    </div>
  );
}

export function HomePage() {
  const [, setLocation] = useLocation();
  const { data: preferences, isLoading: prefsLoading } = useGetPreferences();
  const { streak } = useStreak();

  useEffect(() => {
    if (!prefsLoading && preferences && !preferences.hasCompletedOnboarding) {
      setLocation("/onboarding");
    }
  }, [preferences, prefsLoading, setLocation]);

  const { data: updates, isLoading: updatesLoading } = useGetTodaysUpdates(
    {
      goal: preferences?.goal,
      timeMode: preferences?.timeMode,
    },
    {
      query: {
        enabled: !!preferences?.hasCompletedOnboarding,
        queryKey: ["todays-updates", preferences?.goal, preferences?.timeMode],
      },
    }
  );

  if (prefsLoading || (preferences?.hasCompletedOnboarding && updatesLoading)) {
    return (
      <div className="p-4 space-y-6">
        <div className="space-y-2 pt-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!preferences?.hasCompletedOnboarding) {
    return null;
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="pt-2 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{greeting}.</p>
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              Today's Brief.
            </h1>
          </div>
          <GoalBadge goal={preferences.goal} />
        </div>

        <StreakBadge count={streak} />

        <p className="text-muted-foreground text-sm font-medium">
          {updates?.length ?? 0} stories selected for you. No noise, just clarity.
        </p>
      </div>

      {/* Article cards */}
      <div className="grid gap-4">
        {updates?.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {updates?.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-2xl">You're all caught up</p>
          <p className="text-muted-foreground text-sm">
            New stories drop every morning. Come back tomorrow.
          </p>
        </div>
      )}

      {/* Bottom nudge */}
      {(updates?.length ?? 0) > 0 && (
        <div className="text-center pb-2">
          <p className="text-xs text-muted-foreground font-medium">
            Read one story a day. Stay a year ahead.
          </p>
        </div>
      )}
    </div>
  );
}
