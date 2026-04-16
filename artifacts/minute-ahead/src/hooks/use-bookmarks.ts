import { useState, useEffect, useCallback } from "react";

function load(): number[] {
  try {
    const raw = localStorage.getItem("ma_bookmarks");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function save(ids: number[]) {
  localStorage.setItem("ma_bookmarks", JSON.stringify(ids));
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  useEffect(() => {
    setBookmarks(load());
  }, []);

  const toggle = useCallback((id: number) => {
    const current = load();
    const next = current.includes(id)
      ? current.filter((b) => b !== id)
      : [...current, id];
    save(next);
    setBookmarks(next);
  }, []);

  const isBookmarked = useCallback(
    (id: number) => bookmarks.includes(id),
    [bookmarks]
  );

  return { bookmarks, toggle, isBookmarked };
}
