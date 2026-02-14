"use client";

import { useSessionStore } from "@/store";
import { formatStake } from "@/engine";

export function RecoveryBanner() {
  const state = useSessionStore((s) => s.state);

  if (!state || !state.inRecovery) {
    return null;
  }

  const progress = state.recoveryTargetPnl <= state.pnl
    ? 100
    : state.pnl < 0
    ? ((state.recoveryTargetPnl - state.pnl) / (state.recoveryTargetPnl - state.pnl + Math.abs(state.pnl - state.recoveryTargetPnl))) * 100
    : 0;

  const remaining = state.recoveryTargetPnl - state.pnl;

  return (
    <div className="recovery-banner">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[var(--amber)] flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--noir)]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[var(--amber)] font-bold uppercase tracking-wider text-sm">
            Recovery Mode
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[var(--amber)]/70">Target:</span>
            <span className="text-[var(--amber)] font-medium ml-1">
              {formatStake(state.recoveryTargetPnl)}
            </span>
          </div>
          <div>
            <span className="text-[var(--amber)]/70">Need:</span>
            <span className="text-[var(--amber)] font-medium ml-1">
              {remaining > 0 ? formatStake(remaining) : "Done!"}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-track mt-3">
          <div
            className="h-full rounded-full bg-[var(--amber)] transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
