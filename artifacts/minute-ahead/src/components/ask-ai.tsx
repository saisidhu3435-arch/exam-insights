import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useSessionId } from "@/hooks/use-session";

interface QA {
  question: string;
  answer: string;
}

export function AskAI({ articleId }: { articleId: number }) {
  const sessionId = useSessionId();
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestions = [
    "Explain this like I'm 12.",
    "What's the historical background?",
    "Give me 3 key facts to remember.",
    "What might happen next?",
  ];

  const ask = async (q: string) => {
    const trimmed = q.trim().slice(0, 500);
    if (trimmed.length < 3 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, question: trimmed, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? "Couldn't reach the AI right now. Try again in a moment.");
        return;
      }
      setHistory((h) => [...h, { question: trimmed, answer: data.answer }]);
      setQuestion("");
    } catch {
      setError("Couldn't reach the AI right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-purple-600 text-white rounded-xl">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-extrabold text-base">Ask anything</h3>
          <p className="text-xs text-muted-foreground">An AI tutor that knows this article inside out.</p>
        </div>
      </div>

      {/* Conversation */}
      {history.length > 0 && (
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
          {history.map((qa, i) => (
            <div key={i} className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white border border-purple-200 rounded-xl px-4 py-3 ml-8">
                <p className="text-xs font-bold text-purple-600 mb-1">You asked</p>
                <p className="text-sm font-medium">{qa.question}</p>
              </div>
              <div className="bg-purple-600/5 border border-purple-200 rounded-xl px-4 py-3 mr-8">
                <p className="text-xs font-bold text-purple-700 mb-1">AI</p>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{qa.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions when empty */}
      {history.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={loading}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-purple-200 rounded-full hover:bg-purple-100 hover:border-purple-300 transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question..."
          maxLength={500}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-full border border-purple-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-4 py-2.5 bg-purple-600 text-white rounded-full font-bold disabled:opacity-40 hover:bg-purple-700 transition-colors flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      {error && <p className="text-xs text-red-600 mt-3 font-medium">{error}</p>}
    </div>
  );
}
