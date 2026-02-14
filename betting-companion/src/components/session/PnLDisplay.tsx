"use client";

import { useSessionStore } from "@/store";
import { formatStake, getProfitProgress, getStopLossProgress } from "@/engine";

export function PnLDisplay() {
  const state = useSessionStore((s) => s.state);
  const config = useSessionStore((s) => s.config);

  if (!state || !config) {
    return null;
  }

  const pnl = state.pnl;
  const isPositive = pnl >= 0;
  const profitProgress = getProfitProgress(state, config);
  const lossProgress = getStopLossProgress(state, config);

  return (
    <div className="card-noir p-5">
      {/* Main PnL Display */}
      <div className="text-center mb-6">
        <span className="text-xs text-secondary uppercase tracking-[0.15em]">
          Profit / Loss
        </span>
        <div
          className={`font-display text-5xl font-semibold mt-2 ${
            isPositive ? "pnl-positive" : "pnl-negative"
          }`}
        >
          {isPositive ? "+" : ""}
          {formatStake(pnl)}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {/* Profit Target Progress */}
        <div>
          <div className="flex justify-between text-xs text-secondary mb-2">
            <span>Target: {formatStake(config.profitTarget)}</span>
            <span className="text-gold">{profitProgress.toFixed(0)}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill emerald"
              style={{ width: `${Math.min(100, profitProgress)}%` }}
            />
          </div>
        </div>

        {/* Stop Loss Progress */}
        <div>
          <div className="flex justify-between text-xs text-secondary mb-2">
            <span>Stop Loss: {formatStake(config.stopLossAbs)}</span>
            <span className="text-[var(--crimson)]">{lossProgress.toFixed(0)}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill crimson"
              style={{ width: `${Math.min(100, lossProgress)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
