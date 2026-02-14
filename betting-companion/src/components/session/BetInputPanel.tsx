"use client";

import { useCallback } from "react";
import { useSessionStore } from "@/store";
import { formatStake } from "@/engine";

export function BetInputPanel() {
  const state = useSessionStore((s) => s.state);
  const recordBet = useSessionStore((s) => s.recordBet);
  const getCurrentStake = useSessionStore((s) => s.getCurrentStake);
  const isDecisionPending = useSessionStore((s) => s.isDecisionPending);

  const handleWin = useCallback(() => {
    recordBet(true);
  }, [recordBet]);

  const handleLoss = useCallback(() => {
    recordBet(false);
  }, [recordBet]);

  if (!state || state.stopped || isDecisionPending()) {
    return null;
  }

  const stake = getCurrentStake();

  return (
    <div className="p-6 safe-bottom">
      {/* Current Stake Display */}
      <div className="text-center mb-8">
        <span className="text-xs text-secondary uppercase tracking-[0.2em] font-medium">
          Current Stake
        </span>
        <div className="stake-display mt-2">
          {formatStake(stake)}
        </div>
      </div>

      {/* Decorative divider */}
      <div className="divider-gold mb-8 opacity-50" />

      {/* Win/Loss Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleWin}
          className="btn-stakes btn-win h-28 text-2xl font-bold tracking-wider relative overflow-hidden group"
        >
          <span className="relative z-10">WIN</span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
        <button
          onClick={handleLoss}
          className="btn-stakes btn-loss h-28 text-2xl font-bold tracking-wider relative overflow-hidden group"
        >
          <span className="relative z-10">LOSS</span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </div>

      {/* Hint text */}
      <p className="text-center text-xs text-muted mt-6 tracking-wide">
        TAP THE RESULT OF YOUR BET
      </p>
    </div>
  );
}
