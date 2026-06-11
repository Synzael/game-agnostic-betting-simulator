"use client";

import { useSessionStore, useSettingsStore } from "@/store";
import { SessionGraph } from "./SessionGraph";

interface AdventureGraphProps {
  readonly height?: number;
  readonly className?: string;
}

/**
 * Connected wrapper: renders the live adventure graph for the
 * current session. Returns null when no session exists.
 */
export function AdventureGraph({ height = 110, className }: AdventureGraphProps) {
  const betHistory = useSessionStore((s) => s.betHistory);
  const sessionEvents = useSessionStore((s) => s.sessionEvents);
  const stopReason = useSessionStore((s) => s.state?.stopReason ?? null);
  const hasSession = useSessionStore((s) => s.state !== null);
  const showBetNumbers = useSettingsStore((s) => s.showBetNumbers);

  if (!hasSession) {
    return null;
  }

  return (
    <div className={`card-noir p-3 ${className ?? ""}`}>
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[10px] text-muted uppercase tracking-[0.15em]">
          Adventure
        </span>
        <span className="flex items-center gap-2 text-[9px] text-muted">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--emerald)]" />
            Win
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--crimson)]" />
            Loss
          </span>
        </span>
      </div>
      <SessionGraph
        betHistory={betHistory}
        events={sessionEvents}
        stopReason={stopReason}
        showBetNumbers={showBetNumbers}
        height={height}
      />
    </div>
  );
}
