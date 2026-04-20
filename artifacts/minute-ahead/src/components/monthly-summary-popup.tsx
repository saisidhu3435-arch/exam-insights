import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = "ma_last_monthly_summary";
const FIRST_SEEN_KEY = "ma_first_seen";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export function MonthlySummaryPopup() {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (location === "/monthly-summary") return;

    let firstSeen = localStorage.getItem(FIRST_SEEN_KEY);
    if (!firstSeen) {
      firstSeen = String(Date.now());
      localStorage.setItem(FIRST_SEEN_KEY, firstSeen);
    }
    const firstSeenTs = Number(firstSeen);
    const lastSeen = Number(localStorage.getItem(STORAGE_KEY) ?? 0);

    // Only show after the user has been around for 30+ days, and only once per 30 days
    const now = Date.now();
    const usedAppLongEnough = now - firstSeenTs >= THIRTY_DAYS;
    const dueForSummary = now - lastSeen >= THIRTY_DAYS;

    if (usedAppLongEnough && dueForSummary) {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  if (!open) return null;

  function close() {
    setOpen(false);
    // Snooze for 24h so the user isn't pestered every refresh
    localStorage.setItem(STORAGE_KEY, String(Date.now() - (THIRTY_DAYS - 24 * 60 * 60 * 1000)));
  }

  function open_summary() {
    setOpen(false);
    setLocation("/monthly-summary");
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={close}
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight mb-2">Ready for your monthly summary?</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-5">
          We've stitched together everything that mattered this month into one quick read. For exam mode, there's a 2-minute quiz at the end.
        </p>

        <div className="flex gap-2">
          <button
            onClick={close}
            className="flex-1 py-3 rounded-full border border-border text-muted-foreground font-bold hover:bg-muted transition-colors"
          >
            Later
          </button>
          <button
            onClick={open_summary}
            className="flex-[2] py-3 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-md"
          >
            Show me
          </button>
        </div>
      </div>
    </div>
  );
}
