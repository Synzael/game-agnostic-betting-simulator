"use client";

import { Button } from "@/components/ui";
import type { CardRank } from "@/engine/countingEngine";
import type { SideBetSnapshot } from "@/engine/countingEngine";
import { useCountingStore } from "@/store";

const RANK_BUTTONS: ReadonlyArray<{
  readonly rank: CardRank;
  readonly label: string;
}> = [
  { rank: "A", label: "A" },
  { rank: 2, label: "2" },
  { rank: 3, label: "3" },
  { rank: 4, label: "4" },
  { rank: 5, label: "5" },
  { rank: 6, label: "6" },
  { rank: 7, label: "7" },
  { rank: 8, label: "8" },
  { rank: 9, label: "9" },
  { rank: 10, label: "10" },
  { rank: "J", label: "J" },
  { rank: "Q", label: "Q" },
  { rank: "K", label: "K" },
];

const ZONE_STYLES: Record<SideBetSnapshot["zone"], string> = {
  red: "border-[var(--crimson)] bg-[rgba(127,29,29,0.24)] text-red-200",
  yellow: "border-[var(--amber)] bg-[rgba(120,53,15,0.24)] text-amber-100",
  green: "border-[var(--emerald)] bg-[rgba(6,95,70,0.24)] text-emerald-100",
};

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatRank(rank: CardRank): string {
  return typeof rank === "number" ? String(rank) : rank;
}

function ZoneBadge({ system }: { readonly system: SideBetSnapshot }) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${ZONE_STYLES[system.zone]}`}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide">{system.label}</p>
        <p className="text-[10px] text-secondary">
          TC {formatSigned(system.trueCount)} / RC{" "}
          {formatSigned(system.runningCount)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-secondary">
          {system.edgePctDisplay}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${
            system.shouldBet
              ? "bg-[rgba(16,185,129,0.24)] text-emerald-300"
              : "bg-[rgba(220,38,38,0.18)] text-red-300"
          }`}
        >
          {system.recommendation}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact card counting panel for inline use on the session page.
 * Reads from the shared counting store — no props required.
 */
export function CardCountingPanel() {
  const snapshot = useCountingStore((s) => s.snapshot);
  const cardSeen = useCountingStore((s) => s.cardSeen);
  const completeHand = useCountingStore((s) => s.completeHand);
  const resetShoe = useCountingStore((s) => s.resetShoe);
  const pushEvent = useCountingStore((s) => s.pushEvent);
  const getBurnCount = useCountingStore((s) => s.getBurnCount);

  function handleCardSeen(rank: CardRank): void {
    cardSeen(rank);
    pushEvent(`Card: ${formatRank(rank)}`, "card");
  }

  function handleCompleteHand(): void {
    completeHand();
    pushEvent("Hand completed", "hand");
  }

  function handleResetShoe(): void {
    resetShoe();
    pushEvent("Shoe reset", "reset");
  }

  function handleBurnCard(rank: CardRank): void {
    cardSeen(rank);
    pushEvent(
      `Burn: ${formatRank(rank)} (+${getBurnCount(rank)} burned)`,
      "burn"
    );
  }

  return (
    <div className="card-noir p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-champagne">Card Counting</h3>
        <span className="text-[10px] uppercase tracking-[0.18em] text-secondary">
          {snapshot.shoeProgressPct.toFixed(1)}% &middot;{" "}
          {snapshot.cardsRemaining} left
        </span>
      </div>

      {/* Zone badges */}
      <div className="grid grid-cols-2 gap-2">
        <ZoneBadge system={snapshot.systems.dragon7} />
        <ZoneBadge system={snapshot.systems.panda8} />
      </div>

      {/* Shoe progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--noir-border)]">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${snapshot.shoeProgressPct}%`,
            background: "var(--gradient-gold)",
          }}
        />
      </div>

      {/* Card input grid */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-secondary">
          Record Card
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {RANK_BUTTONS.map(({ rank, label }) => (
            <Button
              key={label}
              variant="ghost"
              size="sm"
              onClick={() => handleCardSeen(rank)}
              className="justify-center px-0 text-xs"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Burn card row */}
      <details className="group">
        <summary className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-secondary hover:text-champagne transition-colors">
          Burn card shortcut
        </summary>
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {RANK_BUTTONS.map(({ rank, label }) => (
            <Button
              key={`burn-${label}`}
              variant="ghost"
              size="sm"
              onClick={() => handleBurnCard(rank)}
              className="justify-center px-0 text-xs opacity-60 hover:opacity-100"
            >
              {label}
            </Button>
          ))}
        </div>
      </details>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="success" size="sm" onClick={handleCompleteHand}>
          Complete Hand
        </Button>
        <Button variant="danger" size="sm" onClick={handleResetShoe}>
          Reset Shoe
        </Button>
      </div>

      {/* Cut card warning */}
      {snapshot.cutCardReached && (
        <div className="rounded-lg border border-[var(--amber)] bg-[rgba(120,53,15,0.15)] px-3 py-2 text-xs text-amber-200">
          Cut card reached &mdash; {snapshot.handsRemainingBeforeShuffle} hand(s)
          before shuffle
        </div>
      )}
    </div>
  );
}

export default CardCountingPanel;
