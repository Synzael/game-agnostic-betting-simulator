"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { NumberInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { CountingSnapshot, SideBetSnapshot } from "@/engine/countingEngine";

const dollarFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

interface CardCountingHUDProps {
  readonly state: CountingSnapshot;
  readonly className?: string;
  readonly onBetSizeChange?: (betSize: number) => void;
  readonly onResetShoe?: () => void;
}

const zoneStyles: Record<SideBetSnapshot["zone"], string> = {
  red: "border-[var(--crimson)] bg-[rgba(127,29,29,0.24)] text-red-200",
  yellow: "border-[var(--amber)] bg-[rgba(120,53,15,0.24)] text-amber-100",
  green: "border-[var(--emerald)] bg-[rgba(6,95,70,0.24)] text-emerald-100",
};

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatUnits(value: number): string {
  return `${value.toFixed(2)}u`;
}

function formatDollars(value: number): string {
  return dollarFormatter.format(value);
}

function renderDeltaLabel(system: SideBetSnapshot): string {
  if (system.countsFromTrigger >= 0) {
    return `${formatSigned(system.countsFromTrigger)} above trigger`;
  }
  return `${Math.abs(system.countsFromTrigger)} below trigger`;
}

function SystemCountCard({ system }: { system: SideBetSnapshot }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${zoneStyles[system.zone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl text-champagne">{system.label}</p>
          <p className="text-xs uppercase tracking-[0.24em] text-secondary">
            Trigger TC {formatSigned(system.triggerTrueCount)}
          </p>
        </div>
        <div className="rounded-full border border-current px-3 py-1 text-xs font-semibold tracking-[0.18em]">
          {system.recommendation}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">
            Running Count
          </p>
          <p className="mt-1 font-display text-3xl">{formatSigned(system.runningCount)}</p>
        </div>
        <div className="rounded-xl bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">True Count</p>
          <p className="mt-1 font-display text-3xl">{formatSigned(system.trueCount)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-secondary">
        <span>{renderDeltaLabel(system)}</span>
        <span>{system.edgePctDisplay} edge</span>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--noir-border)] py-2 last:border-b-0">
      <span className="text-sm text-secondary">{label}</span>
      <span className={emphasis ? "font-semibold text-champagne" : "text-sm text-primary"}>
        {value}
      </span>
    </div>
  );
}

function RecommendationCard({ system }: { system: SideBetSnapshot }) {
  return (
    <div className="rounded-2xl border border-[var(--noir-border)] bg-[var(--noir-soft)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg text-champagne">{system.label}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">
            {system.shouldBet ? "Qualifies now" : "Wait for better count"}
          </p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] ${
            system.shouldBet
              ? "bg-[rgba(16,185,129,0.18)] text-emerald-300"
              : "bg-[rgba(220,38,38,0.18)] text-red-300"
          }`}
        >
          {system.recommendation}
        </div>
      </div>

      <div className="mt-4">
        <MetricRow label="Current edge" value={system.edgePctDisplay} emphasis />
        <MetricRow label="Count delta" value={renderDeltaLabel(system)} />
        <MetricRow
          label="Bet frequency at trigger"
          value={`${system.betFrequencyPct.toFixed(2)}%`}
        />
        <MetricRow
          label="Baseline house edge"
          value={`${system.baselineHouseEdgePct.toFixed(3)}%`}
        />
      </div>
    </div>
  );
}

function ProjectionCard({ system }: { system: SideBetSnapshot }) {
  return (
    <div className="rounded-2xl border border-[var(--noir-border)] bg-[var(--noir-soft)] p-4">
      <p className="font-display text-lg text-champagne">{system.label}</p>
      <div className="mt-3">
        <MetricRow label="Bets made" value={`${system.betsMade}`} />
        <MetricRow label="Units wagered" value={formatUnits(system.totalUnitsWagered)} />
        <MetricRow
          label="Theoretical profit"
          value={`${formatUnits(system.theoreticalProfitUnits)} / ${formatDollars(system.theoreticalProfitDollars)}`}
        />
        <MetricRow
          label="Projected remainder"
          value={`${formatUnits(system.projectedRemainingProfitUnits)} / ${formatDollars(system.projectedRemainingProfitDollars)}`}
        />
        <MetricRow
          label="Projected per shoe"
          value={`${formatUnits(system.projectedShoeProfitUnits)} / ${formatDollars(system.projectedShoeProfitDollars)}`}
        />
        <MetricRow
          label="Projected per hour"
          value={`${formatUnits(system.projectedHourlyProfitUnits)} / ${formatDollars(system.projectedHourlyProfitDollars)}`}
          emphasis
        />
      </div>
    </div>
  );
}

/**
 * Live baccarat counting dashboard for Dragon 7 and Panda 8.
 */
export function CardCountingHUD({
  state,
  className = "",
  onBetSizeChange,
  onResetShoe,
}: CardCountingHUDProps) {
  const progressWidth = `${100 - (state.cardsRemaining / (state.config.deckCount * state.config.cardsPerDeck)) * 100}%`;

  return (
    <div className={`space-y-6 ${className}`}>
      <Card variant="gold">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Card Counting HUD</CardTitle>
            <CardDescription>
              Live Dragon 7 and Panda 8 counts with Jacobson-derived trigger and edge
              math.
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[260px]">
            <NumberInput
              label="Bet Size"
              value={state.config.betSize}
              min={1}
              prefix="$"
              disabled={!onBetSizeChange}
              onChange={(value) => onBetSizeChange?.(value)}
            />
            {onResetShoe ? (
              <Button variant="secondary" size="sm" onClick={onResetShoe}>
                Reset Shoe
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Counts</CardTitle>
          <CardDescription>
            Red is below trigger, yellow is within 2 true counts, green is ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <SystemCountCard system={state.systems.dragon7} />
            <SystemCountCard system={state.systems.panda8} />
          </div>

          <div className="rounded-2xl border border-[var(--noir-border)] bg-[var(--noir-soft)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-lg text-champagne">Shoe Depth</p>
                <p className="text-sm text-secondary">
                  {state.cardsRemaining} cards remaining across {state.decksRemaining.toFixed(2)}{" "}
                  decks
                </p>
              </div>
              <div className="text-sm text-secondary">
                {state.cutCardReached
                  ? `Cut card reached, ${state.handsRemainingBeforeShuffle} hand(s) left before shuffle`
                  : "Cut card not reached"}
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--noir-border)]">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: progressWidth, background: "var(--gradient-gold)" }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-secondary">
              <span>{state.shoeProgressPct.toFixed(1)}% through playable shoe</span>
              <span>{state.recommendShuffle ? "Shuffle recommended" : "Continue shoe"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bet Recommendations</CardTitle>
          <CardDescription>
            Evaluate at the end of each hand and place only the qualified side bet.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <RecommendationCard system={state.systems.dragon7} />
          <RecommendationCard system={state.systems.panda8} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shoe Statistics &amp; Projections</CardTitle>
          <CardDescription>
            Theoretical results use the interpolated edge at the moment each bet qualified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ProjectionCard system={state.systems.dragon7} />
            <ProjectionCard system={state.systems.panda8} />
          </div>

          <div className="rounded-2xl border border-[var(--gold-dim)] bg-[rgba(212,175,55,0.08)] p-5">
            <p className="font-display text-xl text-champagne">Combined Projection</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                  Total Units Wagered
                </p>
                <p className="mt-2 font-display text-2xl text-primary">
                  {formatUnits(state.totalUnitsWagered)}
                </p>
              </div>
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                  Theoretical Profit
                </p>
                <p className="mt-2 font-display text-2xl text-primary">
                  {formatUnits(state.totalTheoreticalProfitUnits)}
                </p>
                <p className="text-sm text-secondary">
                  {formatDollars(state.totalTheoreticalProfitDollars)}
                </p>
              </div>
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                  Projected This Shoe
                </p>
                <p className="mt-2 font-display text-2xl text-primary">
                  {formatUnits(state.projectedShoeProfitUnits)}
                </p>
                <p className="text-sm text-secondary">
                  {formatDollars(state.projectedShoeProfitDollars)}
                </p>
              </div>
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                  Projected Per Hour
                </p>
                <p className="mt-2 font-display text-2xl text-primary">
                  {formatUnits(state.projectedHourlyProfitUnits)}
                </p>
                <p className="text-sm text-secondary">
                  {formatDollars(state.projectedHourlyProfitDollars)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CardCountingHUD;
