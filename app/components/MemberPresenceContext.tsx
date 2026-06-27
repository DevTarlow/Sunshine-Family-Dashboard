"use client";

import { createContext, useContext, useEffect, useState } from "react";

const HEARTBEAT_INTERVAL_MS = 30_000;

// Record<string, number> — memberId (as string) → last-seen timestamp (ms)
const MemberPresenceContext = createContext<Record<string, number>>({});

export function MemberPresenceProvider({
  lastSeenMap,
  currentMemberId,
  children,
}: {
  lastSeenMap: Record<string, number>;
  currentMemberId: number | null;
  children: React.ReactNode;
}) {
  const [presenceMap, setPresenceMap] = useState<Record<string, number>>(lastSeenMap);

  useEffect(() => {
    if (!currentMemberId) return;

    async function sendHeartbeat() {
      try {
        const res = await fetch("/api/heartbeat", { method: "POST" });
        if (res.ok) {
          const updated: Record<string, number> = await res.json();
          setPresenceMap(updated);
        }
      } catch {
        // ignore network errors — presence just won't update this cycle
      }
    }

    sendHeartbeat();
    const id = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [currentMemberId]);

  return (
    <MemberPresenceContext.Provider value={presenceMap}>
      {children}
    </MemberPresenceContext.Provider>
  );
}

export function useMemberPresence(memberId?: number): number | null {
  const map = useContext(MemberPresenceContext);
  if (memberId === undefined || memberId === null) return null;
  return map[String(memberId)] ?? null;
}
