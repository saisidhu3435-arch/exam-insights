import { useState, useEffect, useCallback } from "react";

const KEY = "ma_read_articles";

function load(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function save(ids: number[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export function useReadArticles() {
  const [readIds, setReadIds] = useState<number[]>([]);

  useEffect(() => {
    setReadIds(load());
  }, []);

  const markRead = useCallback((id: number) => {
    const current = load();
    if (current.includes(id)) return;
    const next = [...current, id];
    save(next);
    setReadIds(next);
  }, []);

  const isRead = useCallback(
    (id: number) => readIds.includes(id),
    [readIds]
  );

  return { readIds, markRead, isRead };
}
