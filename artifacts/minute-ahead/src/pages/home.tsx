import { useGetPreferences, useGetTodaysUpdates } from "@workspace/api-client-react";
import { ArticleCard } from "@/components/article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { useStreak } from "@/hooks/use-streak";
import { Flame, BookOpen, Zap, Sparkles } from "lucide-react";

function StreakBadge({ count }: { count: number }) {
  if (count === 0) return null;
  const label =
    count >= 30 ? "Unstoppable." : count >= 14 ? "Two weeks!" : count >= 7 ? "One week!" : count >= 3 ? "On a roll!" : "Keep it up!";
  return (
    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-full px-3 py-1.5">
      <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
      <span className="text-xs font-bold text-orange-600">{count} day streak</span>
      <span className="text-[11px] text-muted-foreground">· {label}</span>
    </div>
  );
}

const goalConfig = {
  "stay-updated": {
    icon: <Zap className="w-4 h-4" />,
    label: "Quick Brief",
    title: "Today's Brief.",
    subtitle: "Just the news. No fluff. No noise.",
  },
  exams: {
    icon: <BookOpen className="w-4 h-4" />,
    label: "Exam Mode",
    title: "Today's Study Pack.",
    subtitle: "Every story explained for your exam.",
  },
  "general-knowledge": {
    icon: <Sparkles className="w-4 h-4" />,
    label: "Deep Dive",
    title: "Today's Stories.",
    subtitle: "Understand the world, one story at a time.",
  },
};

export function HomePage() {
  const [, setLocation] = useLocation();
  const { data: preferences, isLoading: prefsLoading } = useGetPreferences();
  const { streak } = useStreak();
  const [activeTopic, setActiveTopic] = useState<string>("All");

  useEffect(() => {
    if (!prefsLoading && preferences && !preferences.hasCompletedOnboarding) {
      setLocation("/onboarding");
    }
  }, [preferences, prefsLoading, setLocation]);

  const { data: updates, isLoading: updatesLoading } = useGetTodaysUpdates(
    { goal: preferences?.goal, timeMode: preferences?.timeMode },
    {
      query: {
        enabled: !!preferences?.hasCompletedOnboarding,
        queryKey: ["todays-updates", preferences?.goal, preferences?.timeMode],
      },
    }
  );

  const topics = useMemo(() => {
    if (!updates) return ["All"];
    const cats = Array.from(new Set(updates.map((a) => a.category)));
    return ["All", ...cats];
  }, [updates]);

  const filteredUpdates = useMemo(() => {
    if (!updates) return [];
    if (activeTopic === "All") return updates;
    return updates.filter((a) => a.category === activeTopic);
  }, [updates, activeTopic]);

  if (prefsLoading || (preferences?.hasCompletedOnboarding && updatesLoading)) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!preferences?.hasCompletedOnboarding) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const goal = preferences.goal as keyof typeof goalConfig;
  const config = goalConfig[goal] ?? goalConfig["stay-updated"];

  return (
    <div className="p-4 sm:p-6 pb-16 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="pt-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-muted-foreground text-sm font-medium">{greeting}.</p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            {config.icon}
            {config.label}
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">{config.title}</h1>
        <p className="text-muted-foreground text-sm sm:text-base font-medium">{config.subtitle}</p>
        <StreakBadge count={streak} />
      </div>

      {/* Topic filter — only for stay-updated mode */}
      {goal === "stay-updated" && topics.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 scrollbar-hide">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setActiveTopic(topic)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeTopic === topic
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {/* Mode-specific intro for exams */}
      {goal === "exams" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-900 font-semibold">
            Each story includes the constitutional articles, key facts, and the exam angle you need.
          </p>
        </div>
      )}

      {/* Mode-specific intro for general-knowledge */}
      {goal === "general-knowledge" && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
          <p className="text-xs text-purple-900 font-semibold">
            Every story is told as a story — and you can ask our AI tutor anything inside.
          </p>
        </div>
      )}

      {/* Cards */}
      <div className="grid gap-4">
        {filteredUpdates.map((article) => (
          <ArticleCard key={article.id} article={article} mode={goal} />
        ))}
      </div>

      {filteredUpdates.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-2xl font-bold">Nothing here yet</p>
          <p className="text-muted-foreground text-sm">Try a different topic, or come back tomorrow.</p>
        </div>
      )}

      {filteredUpdates.length > 0 && (
        <p className="text-center text-xs text-muted-foreground font-medium pt-4">
          Read one story a day. Stay a year ahead.
        </p>
      )}
    </div>
  );
}
