import { useState, useEffect } from "react";

/** Get or create the session ID synchronously (safe to call outside hooks) */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("ma_session_id");
  if (!id) {
    id = "sess_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("ma_session_id", id);
  }
  return id;
}

/** React hook — returns the session ID, empty string on SSR first render */
export function useSessionId() {
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  return sessionId;
}
