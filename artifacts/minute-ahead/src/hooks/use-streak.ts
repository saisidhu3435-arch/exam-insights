import { useState, useEffect, useCallback } from "react";

interface StreakData {
  count: number;
  lastReadDate: string | null;
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem("ma_streak");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { count: 0, lastReadDate: null };
}

function saveStreak(data: StreakData) {
  localStorage.setItem("ma_streak", JSON.stringify(data));
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastReadDate: null });

  useEffect(() => {
    setStreak(loadStreak());
  }, []);

  const markRead = useCallback(() => {
    const today = getTodayStr();
    const current = loadStreak();

    if (current.lastReadDate === today) return;

    let newCount = 1;
    if (current.lastReadDate) {
      const last = new Date(current.lastReadDate);
      const now = new Date(today);
      const diffDays = Math.round((now.getTime() - last.getTime()) / 86400000);
      if (diffDays === 1) {
        newCount = current.count + 1;
      }
    }

    const updated: StreakData = { count: newCount, lastReadDate: today };
    saveStreak(updated);
    setStreak(updated);
  }, []);

  return { streak: streak.count, markRead };
}
