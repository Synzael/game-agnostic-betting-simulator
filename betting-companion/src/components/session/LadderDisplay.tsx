"use client";

import { useSessionStore } from "@/store";
import { formatStake, getLadderName, getMaxIndex } from "@/engine";

export function LadderDisplay() {
  const state = useSessionStore((s) => s.state);
  const strategy = useSessionStore((s) => s.strategy);

  if (!state || !strategy) {
    return null;
  }

  const currentLadder = strategy.ladders[state.currentLadder];
  const ladderName = getLadderName(state, strategy);
  const maxIndex = getMaxIndex(currentLadder);
  const isAtTop = state.currentIndex >= maxIndex;

  return (
    <div className="card-noir p-5">
      {/* Ladder Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-secondary uppercase tracking-[0.15em]">
          Position
        </span>
        <span className="text-sm font-medium text-gold">
          {ladderName}
        </span>
      </div>

      {/* Visual Ladder - Vertical */}
      <div className="relative">
        {currentLadder.stakes.slice().reverse().map((stake, reversedIndex) => {
          const index = currentLadder.stakes.length - 1 - reversedIndex;
          const isCurrent = index === state.currentIndex;
          const isPast = index < state.currentIndex;

          return (
            <div
              key={index}
              className={`
                ladder-rung mb-1 flex items-center justify-between
                ${isCurrent ? "active" : ""}
              `}
            >
              <span className={`
                text-xs font-medium
                ${isCurrent ? "text-gold" : isPast ? "text-secondary" : "text-muted"}
              `}>
                {index + 1}
              </span>
              <span className={`
                font-display text-sm
                ${isCurrent ? "text-gold" : isPast ? "text-secondary" : "text-muted"}
              `}>
                {formatStake(stake)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Position Text */}
      <div className="flex justify-between text-sm mt-4 pt-3 border-t border-[var(--noir-border)]">
        <span className="text-secondary">
          Step {state.currentIndex + 1} of {maxIndex + 1}
        </span>
        {isAtTop && (
          <span className="text-[var(--amber)] font-medium animate-pulse">
            AT TOP
          </span>
        )}
      </div>

      {/* All Ladders Overview */}
      <div className="mt-4 pt-3 border-t border-[var(--noir-border)]">
        <div className="flex gap-2">
          {strategy.ladders.map((ladder, index) => {
            const isCurrent = index === state.currentLadder;
            return (
              <div
                key={index}
                className={`
                  flex-1 py-2 px-2 rounded-lg text-center text-xs font-medium
                  transition-all duration-200
                  ${
                    isCurrent
                      ? "bg-[var(--gold-glow)] text-gold border border-[var(--gold-dim)]"
                      : "bg-[var(--noir-elevated)] text-muted"
                  }
                `}
              >
                {ladder.name}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
