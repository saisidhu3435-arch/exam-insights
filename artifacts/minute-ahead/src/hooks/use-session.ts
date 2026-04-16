import { useState, useEffect } from "react";

export function useSessionId() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem("ma_session_id");
    if (!id) {
      id = "sess_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("ma_session_id", id);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}
