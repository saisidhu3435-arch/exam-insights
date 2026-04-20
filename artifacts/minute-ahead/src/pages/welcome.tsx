import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/react";
import { useSessionId } from "@/hooks/use-session";
import { useSavePreferences, useGetPreferences } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { PreferencesInputGoal, PreferencesInputTimeMode } from "@workspace/api-client-react";

const TOPICS = [
  { label: "Politics & Governance", value: "Politics", icon: "🏛️" },
  { label: "Economy & Finance", value: "Economy", icon: "📈" },
  { label: "Law & Justice", value: "Law", icon: "⚖️" },
  { label: "Science & Tech", value: "Science & Technology", icon: "🔬" },
  { label: "Environment", value: "Environment", icon: "🌿" },
  { label: "International", value: "International Relations", icon: "🌐" },
  { label: "National Security", value: "National Security", icon: "🛡️" },
  { label: "Social Issues", value: "Social", icon: "🤝" },
];

const TIME_OPTIONS = [
  {
    value: "2min" as PreferencesInputTimeMode,
    label: "2 minutes",
    desc: "Just the headlines — the bare minimum to stay informed.",
    icon: "⚡",
  },
  {
    value: "5min" as PreferencesInputTimeMode,
    label: "5 minutes",
    desc: "A solid daily dose. Enough to know what's happening and why.",
    icon: "📖",
  },
  {
    value: "10min" as PreferencesInputTimeMode,
    label: "10 minutes",
    desc: "Go deep. Great for exam prep and building real GK.",
    icon: "🎯",
  },
];

const GOAL_OPTIONS = [
  {
    value: "stay-updated" as PreferencesInputGoal,
    label: "Stay Updated",
    desc: "Keep up with current events in plain English. No fluff.",
    icon: "📰",
    color: "from-blue-500 to-indigo-600",
  },
  {
    value: "exams" as PreferencesInputGoal,
    label: "Exam Prep",
    desc: "CLAT / AILET focused. Q&A format, key facts, exam angles.",
    icon: "📚",
    color: "from-red-500 to-rose-600",
  },
  {
    value: "general-knowledge" as PreferencesInputGoal,
    label: "Build Knowledge",
    desc: "Story-style deep dives with an AI tutor you can chat with.",
    icon: "🧠",
    color: "from-violet-500 to-purple-600",
  },
];

type Step = "goal" | "time" | "topic";

export function WelcomePage() {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const sessionId = useSessionId();
  const queryClient = useQueryClient();
  const { data: preferences, isLoading: prefsLoading } = useGetPreferences(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: ["preferences", sessionId] } }
  );
  const savePreferences = useSavePreferences();

  const [step, setStep] = useState<Step>("goal");
  const [goal, setGoal] = useState<PreferencesInputGoal | null>(null);
  const [timeMode, setTimeMode] = useState<PreferencesInputTimeMode | null>(null);

  const firstName = user?.firstName ?? "there";

  useEffect(() => {
    const pref = preferences as (typeof preferences & { favTopic?: string }) | undefined;
    if (!prefsLoading && pref?.hasCompletedOnboarding && pref?.favTopic) {
      setLocation("/");
    }
  }, [prefsLoading, preferences, setLocation]);

  const stepIndex = step === "goal" ? 0 : step === "time" ? 1 : 2;

  function handleFinish(topic: string) {
    if (!timeMode || !goal || !sessionId) return;
    savePreferences.mutate(
      {
        data: {
          goal,
          timeMode,
          favTopic: topic,
          sessionId,
        },
      },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(["preferences", sessionId], data);
          queryClient.invalidateQueries({ queryKey: ["todays-updates"] });
          localStorage.setItem("ma_goal", goal);
          localStorage.setItem("ma_time_mode", timeMode);
          localStorage.setItem("ma_fav_topic", topic);
          setLocation("/");
        },
      }
    );
  }

  if (!isLoaded || prefsLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((stepIndex + 1) / 3) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <AnimatePresence mode="wait">
          {step === "goal" && (
            <StepGoal
              key="goal"
              firstName={firstName}
              selected={goal}
              onSelect={(v) => {
                setGoal(v);
                setTimeout(() => setStep("time"), 280);
              }}
            />
          )}
          {step === "time" && (
            <StepTime
              key="time"
              selected={timeMode}
              onSelect={(v) => {
                setTimeMode(v);
                setTimeout(() => setStep("topic"), 280);
              }}
              onBack={() => setStep("goal")}
            />
          )}
          {step === "topic" && (
            <StepTopic
              key="topic"
              saving={savePreferences.isPending}
              onSelect={(v) => handleFinish(v)}
              onBack={() => setStep("time")}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2 pb-8">
        {(["goal", "time", "topic"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === stepIndex ? "w-6 bg-primary" : i < stepIndex ? "w-2 bg-primary/40" : "w-2 bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function StepGoal({
  firstName,
  selected,
  onSelect,
}: {
  firstName: string;
  selected: PreferencesInputGoal | null;
  onSelect: (v: PreferencesInputGoal) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md space-y-8"
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary uppercase tracking-widest">Step 1 of 3</p>
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
          Hey {firstName} 👋<br />Why are you here?
        </h1>
        <p className="text-gray-500 text-lg">This shapes how every article is presented to you.</p>
      </div>

      <div className="space-y-3">
        {GOAL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 ${
              selected === opt.value
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center text-lg shrink-0`}>
                {opt.icon}
              </div>
              <div>
                <p className="font-bold text-gray-900">{opt.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function StepTime({
  selected,
  onSelect,
  onBack,
}: {
  selected: PreferencesInputTimeMode | null;
  onSelect: (v: PreferencesInputTimeMode) => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md space-y-8"
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary uppercase tracking-widest">Step 2 of 3</p>
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
          How much time can you give to the news each day?
        </h1>
        <p className="text-gray-500 text-lg">We'll keep your daily brief tight and focused.</p>
      </div>

      <div className="space-y-3">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 ${
              selected === opt.value
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl">{opt.icon}</span>
              <div className="flex-1">
                <span className="font-bold text-gray-900 block">{opt.label}</span>
                <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
        ← Back
      </button>
    </motion.div>
  );
}

function StepTopic({
  saving,
  onSelect,
  onBack,
}: {
  saving: boolean;
  onSelect: (v: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const REQUIRED = 3;

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : prev.length < REQUIRED
        ? [...prev, value]
        : prev
    );
  }

  function handleConfirm() {
    if (selected.length === REQUIRED && !saving) {
      onSelect(selected.join(","));
    }
  }

  const canConfirm = selected.length === REQUIRED;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md space-y-6"
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary uppercase tracking-widest">Step 3 of 3</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Pick your top 3 interests</h1>
        <p className="text-gray-500 text-base">We'll show these stories first every day.</p>
      </div>

      <div className="flex items-center gap-2">
        {Array.from({ length: REQUIRED }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              i < selected.length ? "bg-primary" : "bg-gray-200"
            }`}
          />
        ))}
        <span className="text-sm font-bold text-gray-500 shrink-0 ml-1">
          {selected.length}/{REQUIRED}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TOPICS.map((topic) => {
          const isSelected = selected.includes(topic.value);
          const isDisabled = !isSelected && selected.length >= REQUIRED;
          return (
            <button
              key={topic.value}
              onClick={() => toggle(topic.value)}
              disabled={saving || isDisabled}
              className={`rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm scale-[1.02]"
                  : isDisabled
                  ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                  : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
              } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="text-2xl mb-1">{topic.icon}</div>
              <p className="font-semibold text-sm text-gray-900 leading-tight">{topic.label}</p>
              {isSelected && (
                <div className="mt-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!canConfirm || saving}
        className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base disabled:opacity-40 transition-all hover:bg-primary/90 active:scale-95"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Setting up your feed…
          </span>
        ) : canConfirm ? "Start Reading →" : `Pick ${REQUIRED - selected.length} more`}
      </button>

      <button onClick={onBack} disabled={saving} className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40">
        ← Back
      </button>
    </motion.div>
  );
}
