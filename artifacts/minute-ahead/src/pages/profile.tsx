import { useUser, useClerk, Show } from "@clerk/react";
import { Link } from "wouter";
import { LogIn, LogOut, User, BookOpen, Zap, Sparkles, Clock, Coffee, Flame, Award, CheckCircle2 } from "lucide-react";
import { useGetPreferences, useSavePreferences, getGetPreferencesQueryKey } from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";
import { useStreak } from "@/hooks/use-streak";
import { useQueryClient } from "@tanstack/react-query";
import type { PreferencesInputGoal, PreferencesInputTimeMode } from "@workspace/api-client-react";
import { useState } from "react";

const goals: { value: PreferencesInputGoal; icon: React.ReactNode; label: string; sub: string; color: string }[] = [
  { value: "stay-updated", icon: <Zap className="w-4 h-4" />, label: "Stay Updated", sub: "Daily news, no fluff.", color: "blue" },
  { value: "exams", icon: <BookOpen className="w-4 h-4" />, label: "Exam Prep", sub: "CLAT, AILET & more.", color: "amber" },
  { value: "general-knowledge", icon: <Sparkles className="w-4 h-4" />, label: "Build Knowledge", sub: "Curious about everything.", color: "purple" },
];

const timeModes: { value: PreferencesInputTimeMode; icon: React.ReactNode; label: string; sub: string }[] = [
  { value: "2min", icon: <Zap className="w-4 h-4" />, label: "2 minutes", sub: "Core facts only." },
  { value: "5min", icon: <Coffee className="w-4 h-4" />, label: "5 minutes", sub: "Balanced take." },
  { value: "10min", icon: <Clock className="w-4 h-4" />, label: "10 minutes", sub: "Deep context." },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-secondary/20">
        <h3 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const sessionId = useSessionId();
  const { streak } = useStreak();
  const queryClient = useQueryClient();
  const { data: preferences } = useGetPreferences();
  const savePreferences = useSavePreferences();
  const [saved, setSaved] = useState(false);

  const handleGoal = (g: PreferencesInputGoal) => {
    if (!sessionId) return;
    const tm = (preferences?.timeMode as PreferencesInputTimeMode) ?? "5min";
    savePreferences.mutate(
      { data: { goal: g, timeMode: tm, sessionId } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetPreferencesQueryKey(), data);
          queryClient.invalidateQueries({ queryKey: ["todays-updates"] });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  };

  const handleTime = (t: PreferencesInputTimeMode) => {
    if (!sessionId) return;
    const g = (preferences?.goal as PreferencesInputGoal) ?? "stay-updated";
    savePreferences.mutate(
      { data: { goal: g, timeMode: t, sessionId } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetPreferencesQueryKey(), data);
          queryClient.invalidateQueries({ queryKey: ["todays-updates"] });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  };

  return (
    <div className="p-4 sm:p-6 pb-16 space-y-6 animate-in fade-in duration-400">
      {/* Profile header */}
      <div className="pt-4">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Profile</h1>
        <p className="text-muted-foreground text-sm">Your account and reading preferences.</p>
      </div>

      {/* User account card */}
      <Show when="signed-out">
        <SectionCard title="Account">
          <div className="flex flex-col items-center py-4 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-bold text-lg">Sign in to sync your progress</p>
              <p className="text-muted-foreground text-sm mt-1">
                Save your streak, bookmarks, and preferences across devices.
              </p>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <Link
                href="/sign-in"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors"
              >
                <LogIn className="w-4 h-4" /> Sign in
              </Link>
              <Link
                href="/sign-up"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-secondary text-foreground font-bold rounded-full hover:bg-secondary/80 transition-colors border border-border"
              >
                Create account
              </Link>
            </div>
          </div>
        </SectionCard>
      </Show>

      <Show when="signed-in">
        <SectionCard title="Account">
          {isLoaded && user && (
            <div className="flex items-center gap-4">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName ?? "User"}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-lg truncate">{user.fullName ?? user.username ?? "Reader"}</p>
                <p className="text-muted-foreground text-sm truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded-full hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </SectionCard>
      </Show>

      {/* Streak */}
      {streak > 0 && (
        <SectionCard title="Your Streak">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl">
              🔥
            </div>
            <div>
              <p className="font-extrabold text-2xl">{streak} {streak === 1 ? "day" : "days"}</p>
              <p className="text-muted-foreground text-sm">
                {streak >= 7 ? "You're on fire! Keep it up!" : "Keep reading daily to grow your streak."}
              </p>
            </div>
            {streak >= 7 && (
              <div className="ml-auto">
                <Award className="w-8 h-8 text-amber-500" />
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Mode preference */}
      <SectionCard title="Reading Mode">
        <div className="space-y-2">
          {goals.map((g) => (
            <button
              key={g.value}
              onClick={() => handleGoal(g.value)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left ${
                preferences?.goal === g.value
                  ? "bg-primary text-white shadow-md"
                  : "bg-secondary hover:bg-secondary/80 text-foreground"
              }`}
            >
              <div className={`p-2 rounded-lg ${preferences?.goal === g.value ? "bg-white/20" : "bg-background"}`}>
                {g.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{g.label}</p>
                <p className={`text-xs ${preferences?.goal === g.value ? "text-white/70" : "text-muted-foreground"}`}>{g.sub}</p>
              </div>
              {preferences?.goal === g.value && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Time preference */}
      <SectionCard title="Daily Reading Time">
        <div className="flex gap-2">
          {timeModes.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTime(t.value)}
              className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                preferences?.timeMode === t.value
                  ? "bg-primary text-white shadow-md"
                  : "bg-secondary hover:bg-secondary/80 text-foreground"
              }`}
            >
              {t.icon}
              <span className="font-bold text-sm">{t.label}</span>
              <span className={`text-[11px] ${preferences?.timeMode === t.value ? "text-white/70" : "text-muted-foreground"}`}>{t.sub}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Save confirmation */}
      {saved && (
        <div className="flex items-center justify-center gap-2 text-green-600 font-semibold text-sm animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          Preferences saved!
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground pt-4">
        Minute Ahead — Made for students who think ahead.
      </p>
    </div>
  );
}
