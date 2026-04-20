import { useState } from "react";
import { Link } from "wouter";
import { useGetMonthlySummary, useGetPreferences } from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, XCircle, Sparkles, BookOpen, Trophy } from "lucide-react";
import type { PreferencesInputGoal } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function MonthlySummaryPage() {
  const sessionId = useSessionId();
  const { data: preferences } = useGetPreferences(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: ["preferences", sessionId] } }
  );

  const goal = (preferences?.goal ?? (typeof window !== "undefined" ? localStorage.getItem("ma_goal") : null) ?? "stay-updated") as PreferencesInputGoal;
  const favTopic = ((preferences as { favTopic?: string } | undefined)?.favTopic ?? (typeof window !== "undefined" ? localStorage.getItem("ma_fav_topic") : null)) ?? undefined;

  const { data, isLoading, error } = useGetMonthlySummary(
    { goal, favTopic },
    { query: { queryKey: ["monthly-summary", goal, favTopic], staleTime: 60 * 60 * 1000 } }
  );

  // Mark as seen when the page loads
  if (typeof window !== "undefined" && data) {
    localStorage.setItem("ma_last_monthly_summary", String(Date.now()));
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center space-y-3">
        <p className="text-2xl font-bold">Couldn't build your monthly summary</p>
        <p className="text-muted-foreground">Please try again in a moment.</p>
        <Link href="/" className="inline-block mt-4 text-primary font-bold underline">Back to news</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-16 space-y-6 max-w-3xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold">
        <ArrowLeft className="w-4 h-4" /> Back to news
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-widest">
          <Sparkles className="w-4 h-4" /> Monthly Summary
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{data.month}</h1>
        <p className="text-sm text-muted-foreground">Built from {data.articleCount} stories you could have read this month.</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
        <p className="text-base leading-relaxed text-foreground">{data.intro}</p>
      </div>

      <div className="space-y-4">
        {data.sections.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">{s.category}</p>
              <h2 className="text-xl font-extrabold tracking-tight mt-1">{s.headline}</h2>
            </div>
            <ul className="space-y-2">
              {s.points.map((p, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
                  <span className="text-primary font-bold mt-0.5">·</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {goal === "exams" && data.questions && data.questions.length > 0 && (
        <QuizSection questions={data.questions} />
      )}

      <p className="text-center text-xs text-muted-foreground pt-4">
        New monthly summary available every 30 days · Keep reading daily for the best one.
      </p>
    </div>
  );
}

function QuizSection({
  questions,
}: {
  questions: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correctIndex) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setPicked(null);
    }
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
        <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
        <p className="text-2xl font-extrabold">{score} / {questions.length} correct</p>
        <p className="text-sm text-muted-foreground">
          {score === questions.length ? "Perfect run! You're exam-ready." : score >= questions.length / 2 ? "Solid grasp on the month's news." : "Keep reading daily — you'll nail it next month."}
        </p>
        <button onClick={restart} className="mt-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-amber-700 text-sm font-bold uppercase tracking-widest">
        <BookOpen className="w-4 h-4" /> Exam Quiz · 2 min
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-amber-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
        <span className="text-xs font-bold text-amber-800">{index + 1} / {questions.length}</span>
      </div>

      <h3 className="text-lg font-bold leading-snug">{q.question}</h3>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const isPicked = picked === i;
          const showResult = picked !== null;
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`w-full text-left rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all flex items-center gap-3 ${
                showResult && isCorrect
                  ? "border-green-500 bg-green-50 text-green-900"
                  : showResult && isPicked && !isCorrect
                  ? "border-red-500 bg-red-50 text-red-900"
                  : "border-border bg-white hover:border-primary/50 hover:bg-primary/5"
              } ${picked !== null ? "cursor-default" : "cursor-pointer"}`}
            >
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
              {showResult && isPicked && !isCorrect && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className={`rounded-xl p-4 text-sm leading-relaxed ${picked === q.correctIndex ? "bg-green-50 border border-green-200 text-green-900" : "bg-red-50 border border-red-200 text-red-900"}`}>
          <p className="font-bold mb-1">{picked === q.correctIndex ? "Correct!" : "Not quite."}</p>
          <p>{q.explanation}</p>
        </div>
      )}

      {picked !== null && (
        <button onClick={next} className="w-full py-3 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors">
          {index + 1 >= questions.length ? "See results" : "Next question"}
        </button>
      )}
    </div>
  );
}

export { basePath };
