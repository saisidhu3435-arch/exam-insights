import { useLocation } from "wouter";
import { useSavePreferences, getGetPreferencesQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useSessionId } from "@/hooks/use-session";
import type { PreferencesInputGoal, PreferencesInputTimeMode } from "@workspace/api-client-react";
import { BookOpen, Globe, Clock, Zap, Coffee, ChevronRight } from "lucide-react";
import logoImg from "@assets/logo-transparent.png";
import { useQueryClient } from "@tanstack/react-query";

const goals: { value: PreferencesInputGoal; icon: React.ReactNode; label: string; sub: string }[] = [
  { value: "stay-updated", icon: <Zap className="w-5 h-5" />, label: "Stay Updated", sub: "Daily news, no fluff." },
  { value: "exams", icon: <BookOpen className="w-5 h-5" />, label: "Exam Prep", sub: "CLAT, AILET & more." },
  { value: "general-knowledge", icon: <Globe className="w-5 h-5" />, label: "Build Knowledge", sub: "Curious about everything." },
];

const timeModes: { value: PreferencesInputTimeMode; icon: React.ReactNode; label: string; sub: string }[] = [
  { value: "2min", icon: <Zap className="w-5 h-5" />, label: "2 minutes", sub: "Core facts only." },
  { value: "5min", icon: <Coffee className="w-5 h-5" />, label: "5 minutes", sub: "Balanced take." },
  { value: "10min", icon: <Clock className="w-5 h-5" />, label: "10 minutes", sub: "Deep context." },
];

export function OnboardingPage() {
  const [, setLocation] = useLocation();
  const sessionId = useSessionId();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<PreferencesInputGoal | null>(null);
  const [timeMode, setTimeMode] = useState<PreferencesInputTimeMode | null>(null);
  const savePreferences = useSavePreferences();

  const handleComplete = () => {
    if (goal && timeMode) {
      savePreferences.mutate(
        { data: { goal, timeMode, sessionId } },
        {
          onSuccess: (data) => {
            queryClient.setQueryData(getGetPreferencesQueryKey(), data);
            queryClient.invalidateQueries({ queryKey: ["todays-updates"] });
            setLocation("/");
          },
        }
      );
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0f0f0f 0%, #1a0a0a 50%, #0f0f0f 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #cc0000 0%, transparent 70%)", filter: "blur(60px)" }}
      />
      <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #ff6600 0%, transparent 70%)", filter: "blur(60px)" }}
      />

      <div className="relative flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoImg} alt="Minute Ahead" className="h-24 w-auto" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 1 ? "w-10 bg-red-500" : "w-5 bg-white/20"}`} />
          <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 2 ? "w-10 bg-red-500" : "w-5 bg-white/20"}`} />
        </div>

        {/* Step 1: Goal */}
        {step === 1 && (
          <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-400">
            <div className="mb-8">
              <p className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-2">Step 1 of 2</p>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                Why are you<br />here?
              </h1>
              <p className="text-white/50 mt-2 text-sm">We'll show you only what actually matters to you.</p>
            </div>

            <div className="space-y-3">
              {goals.map((g) => (
                <button
                  key={g.value}
                  onClick={() => { setGoal(g.value); setStep(2); }}
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-200 flex items-center gap-4 group ${
                    goal === g.value
                      ? "bg-red-600 text-white shadow-lg shadow-red-900/40"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl transition-colors ${goal === g.value ? "bg-white/20" : "bg-white/10 group-hover:bg-white/15"}`}>
                    {g.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{g.label}</h3>
                    <p className={`text-xs ${goal === g.value ? "text-white/70" : "text-white/40"}`}>{g.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Time */}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-400">
            <div className="mb-8">
              <p className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-2">Step 2 of 2</p>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                How much<br />time daily?
              </h1>
              <p className="text-white/50 mt-2 text-sm">We'll match the depth of every story to your schedule.</p>
            </div>

            <div className="space-y-3">
              {timeModes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTimeMode(t.value)}
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-200 flex items-center gap-4 group ${
                    timeMode === t.value
                      ? "bg-red-600 text-white shadow-lg shadow-red-900/40"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl transition-colors ${timeMode === t.value ? "bg-white/20" : "bg-white/10 group-hover:bg-white/15"}`}>
                    {t.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{t.label}</h3>
                    <p className={`text-xs ${timeMode === t.value ? "text-white/70" : "text-white/40"}`}>{t.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-full border border-white/20 text-white/70 font-semibold hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={!timeMode || savePreferences.isPending}
                className="flex-[2] py-3.5 rounded-full bg-red-600 text-white font-bold disabled:opacity-40 hover:bg-red-500 active:scale-95 transition-all shadow-lg shadow-red-900/40"
              >
                {savePreferences.isPending ? "Setting up..." : "Start Reading"}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-white/20 text-xs mt-8">
          Minute Ahead — Made for students who think ahead.
        </p>
      </div>
    </div>
  );
}
