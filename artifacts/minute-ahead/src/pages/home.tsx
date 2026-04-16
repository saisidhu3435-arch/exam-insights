import { useGetPreferences, useGetTodaysUpdates, useSavePreferences, getGetPreferencesQueryKey } from "@workspace/api-client-react";
import { ArticleCard } from "@/components/article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useStreak } from "@/hooks/use-streak";
import { useSessionId } from "@/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Zap, Sparkles, Settings2 } from "lucide-react";
import type { PreferencesInputGoal, PreferencesInputTimeMode } from "@workspace/api-client-react";

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
} as const;

// Floating bubble component
function Bubble({ size, x, y, opacity, delay }: { size: number; x: number; y: number; opacity: number; delay: number }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        opacity,
        background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.7), rgba(204,0,0,0.06))",
        border: "1px solid rgba(204,0,0,0.08)",
        animation: `floatBubble ${6 + delay}s ease-in-out infinite alternate`,
        animationDelay: `${delay}s`,
        backdropFilter: "blur(2px)",
      }}
    />
  );
}

const BUBBLES = [
  { size: 90,  x: 5,  y: 12, opacity: 0.35, delay: 0   },
  { size: 55,  x: 88, y: 8,  opacity: 0.28, delay: 1.2 },
  { size: 70,  x: 75, y: 55, opacity: 0.25, delay: 2.5 },
  { size: 40,  x: 18, y: 72, opacity: 0.30, delay: 0.8 },
  { size: 100, x: 92, y: 80, opacity: 0.20, delay: 3.1 },
  { size: 30,  x: 50, y: 5,  opacity: 0.32, delay: 1.7 },
  { size: 60,  x: 35, y: 88, opacity: 0.22, delay: 2.0 },
];

export function HomePage() {
  const sessionId = useSessionId();
  const queryClient = useQueryClient();
  const { streak } = useStreak();
  const [activeTopic, setActiveTopic] = useState<string>("All");
  const [showModeSwitch, setShowModeSwitch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const { data: preferences, isLoading: prefsLoading } = useGetPreferences();
  const savePreferences = useSavePreferences();

  // Read localStorage fallbacks for anonymous users
  const localGoal = typeof window !== "undefined" ? (localStorage.getItem("ma_goal") as PreferencesInputGoal | null) : null;
  const localTimeMode = typeof window !== "undefined" ? (localStorage.getItem("ma_time_mode") as PreferencesInputTimeMode | null) : null;

  // Mouse-following glow
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!glowRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glowRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, hsla(0, 80%, 60%, 0.08) 0%, hsla(25, 80%, 70%, 0.04) 35%, transparent 65%)`;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Effective preferences: DB record (from welcome flow) or localStorage defaults
  const effectiveGoal = (preferences?.goal ?? localGoal ?? "stay-updated") as PreferencesInputGoal;
  const effectiveTimeMode = (preferences?.timeMode ?? localTimeMode ?? "5min") as PreferencesInputTimeMode;
  const favTopic = ((preferences as { favTopic?: string } | undefined)?.favTopic ?? localStorage.getItem("ma_fav_topic")) ?? undefined;

  const goal = (effectiveGoal as keyof typeof goalConfig) ?? "stay-updated";
  const config = goalConfig[goal] ?? goalConfig["stay-updated"];

  const { data: updates, isLoading: updatesLoading } = useGetTodaysUpdates(
    { goal: effectiveGoal, timeMode: effectiveTimeMode, favTopic },
    {
      query: {
        queryKey: ["todays-updates", effectiveGoal, effectiveTimeMode, favTopic],
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

  const switchMode = (newGoal: PreferencesInputGoal) => {
    if (!sessionId) return;
    savePreferences.mutate(
      { data: { goal: newGoal, timeMode: effectiveTimeMode, favTopic, sessionId } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetPreferencesQueryKey(), data);
          queryClient.invalidateQueries({ queryKey: ["todays-updates"] });
          localStorage.setItem("ma_goal", newGoal);
          setShowModeSwitch(false);
        },
      }
    );
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div ref={containerRef} className="relative min-h-[80vh] overflow-hidden">
      {/* CSS for animations */}
      <style>{`
        @keyframes floatBubble {
          0%   { transform: translateY(0px) translateX(0px) scale(1); }
          33%  { transform: translateY(-18px) translateX(8px) scale(1.03); }
          66%  { transform: translateY(-8px) translateX(-10px) scale(0.97); }
          100% { transform: translateY(-24px) translateX(4px) scale(1.01); }
        }
      `}</style>

      {/* Mouse-following glow layer */}
      <div ref={glowRef} className="pointer-events-none fixed inset-0 z-0 transition-all duration-300" />

      {/* Floating bubbles */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {BUBBLES.map((b, i) => (
          <Bubble key={i} {...b} />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 sm:p-6 pb-16 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-muted-foreground text-sm font-medium">{greeting}.</p>
            <div className="flex items-center gap-2">
              {streak > 0 && (
                <span className="text-xs font-bold text-orange-600 bg-orange-100 border border-orange-200 px-2.5 py-1 rounded-full">
                  🔥 {streak} day streak
                </span>
              )}
              <button
                onClick={() => setShowModeSwitch((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                {config.icon}
                {config.label}
                <Settings2 className="w-3 h-3 opacity-60" />
              </button>
            </div>
          </div>

          {/* Mode switcher */}
          {showModeSwitch && (
            <div className="bg-card border border-border rounded-2xl p-3 flex gap-2 flex-wrap animate-in fade-in slide-in-from-top-2 duration-200">
              {(Object.entries(goalConfig) as [PreferencesInputGoal, typeof goalConfig[keyof typeof goalConfig]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => switchMode(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    goal === key
                      ? "bg-primary text-white shadow-md"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">{config.title}</h1>
          <p className="text-muted-foreground text-sm sm:text-base font-medium">{config.subtitle}</p>
          {favTopic && (
            <p className="text-xs text-primary/70 font-medium">
              ⭐ Showing <span className="font-bold text-primary">{favTopic}</span> stories first — your top pick.
            </p>
          )}
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
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        {/* Mode hints */}
        {goal === "exams" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-900 font-semibold">
              Every story includes constitutional articles, key facts, and the exam angle you need. Tap to study.
            </p>
          </div>
        )}
        {goal === "general-knowledge" && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
            <p className="text-xs text-purple-900 font-semibold">
              Every story is told as a story — and you can ask our AI tutor anything inside.
            </p>
          </div>
        )}

        {/* Cards or skeletons */}
        {prefsLoading || updatesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-52 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUpdates.map((article) => (
              <ArticleCard key={article.id} article={article} mode={goal} />
            ))}
          </div>
        )}

        {!prefsLoading && !updatesLoading && filteredUpdates.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <p className="text-2xl font-bold">Nothing here yet</p>
            <p className="text-muted-foreground text-sm">Try a different topic, or come back tomorrow.</p>
          </div>
        )}

        {!prefsLoading && !updatesLoading && filteredUpdates.length > 0 && (
          <p className="text-center text-xs text-muted-foreground font-medium pt-4">
            Read one story a day. Stay a year ahead.
          </p>
        )}
      </div>
    </div>
  );
}
