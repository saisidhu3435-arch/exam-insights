import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";

const ANON_KEY = "ma_session_id";

function getOrCreateAnonId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = "sess_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

export function getOrCreateSessionId(): string {
  return getOrCreateAnonId();
}

export function useSessionId() {
  const { user, isLoaded } = useUser();
  const [anonId, setAnonId] = useState<string>(() => getOrCreateAnonId());

  useEffect(() => {
    setAnonId(getOrCreateAnonId());
  }, []);

  if (isLoaded && user?.id) {
    return `user_${user.id}`;
  }
  return anonId;
}
