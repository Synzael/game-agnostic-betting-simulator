"use client";

import { BetRecord, SessionEvent, StopReason } from "@/engine/types";
import { formatStake } from "@/engine";
import { buildGraphModel } from "./graph-model";

interface SessionGraphProps {
  readonly betHistory: readonly BetRecord[];
  readonly events?: readonly SessionEvent[];
  readonly stopReason?: StopReason;
  readonly showBetNumbers: boolean;
  readonly height?: number;
  readonly className?: string;
}

const VIRTUAL_WIDTH = 360;

const EVENT_COLORS: Record<SessionEvent["type"], string> = {
  carry_over: "var(--gold)",
  write_off: "var(--amber)",
};

const STOP_REASON_COLORS: Record<NonNullable<StopReason>, string> = {
  profit_target: "var(--emerald)",
  stop_loss: "var(--crimson)",
  bankroll_exhausted: "var(--crimson)",
  table_limit: "var(--crimson)",
  user_stopped: "var(--gold)",
  max_rounds: "var(--amber)",
};

export function SessionGraph({
  betHistory,
  events = [],
  stopReason = null,
  showBetNumbers,
  height = 110,
  className,
}: SessionGraphProps) {
  const model = buildGraphModel(
    betHistory,
    events,
    stopReason,
    VIRTUAL_WIDTH,
    height
  );

  const pnlLabel = model.isEmpty
    ? "No bets yet"
    : `P&L ${model.finalPnl >= 0 ? "+" : ""}${formatStake(model.finalPnl)} after ${betHistory.length} bets`;

  return (
    <svg
      viewBox={`0 0 ${VIRTUAL_WIDTH} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Adventure graph: ${pnlLabel}`}
      className={className}
      data-testid="session-graph"
    >
      {/* Zero baseline */}
      <line
        x1={0}
        y1={model.zeroLineY}
        x2={VIRTUAL_WIDTH}
        y2={model.zeroLineY}
        stroke="var(--noir-border)"
        strokeWidth={1}
        strokeDasharray="3 4"
      />

      {model.isEmpty ? (
        <text
          x={VIRTUAL_WIDTH / 2}
          y={model.zeroLineY - 8}
          textAnchor="middle"
          fontSize={10}
          fill="var(--noir-border)"
          className="font-display uppercase tracking-widest"
        >
          No bets yet
        </text>
      ) : (
        <>
          {/* Event markers behind the line: vertical tick + diamond */}
          {model.eventMarkers.map((marker, index) => (
            <g key={`event-${index}`} data-testid={`event-${marker.type}`}>
              <line
                x1={marker.x}
                y1={6}
                x2={marker.x}
                y2={height - 6}
                stroke={EVENT_COLORS[marker.type]}
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.6}
              />
              <rect
                x={-3.2}
                y={-3.2}
                width={6.4}
                height={6.4}
                fill={EVENT_COLORS[marker.type]}
                transform={`translate(${marker.x}, ${marker.y}) rotate(45)`}
              />
            </g>
          ))}

          {/* P&L line */}
          <polyline
            points={model.linePoints}
            fill="none"
            stroke="var(--gold)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Win/loss dots with optional stake labels */}
          {model.dots.map((dot) => (
            <g key={`dot-${dot.round}`}>
              <circle
                cx={dot.x}
                cy={dot.y}
                r={2.5}
                fill={dot.won ? "var(--emerald)" : "var(--crimson)"}
              />
              {showBetNumbers && dot.showLabel && (
                <text
                  x={dot.x}
                  y={dot.won ? dot.y - 6 : dot.y + 12}
                  textAnchor="middle"
                  fontSize={8}
                  fill={dot.won ? "var(--emerald)" : "var(--crimson)"}
                  data-testid="stake-label"
                >
                  {formatStake(dot.stake)}
                </text>
              )}
            </g>
          ))}

          {/* Terminal outcome marker */}
          {model.terminalMarker && (
            <g data-testid={`terminal-${model.terminalMarker.reason}`}>
              <circle
                cx={model.terminalMarker.x}
                cy={model.terminalMarker.y}
                r={6}
                fill="none"
                stroke={STOP_REASON_COLORS[model.terminalMarker.reason]}
                strokeWidth={1.5}
                opacity={0.7}
              />
              <circle
                cx={model.terminalMarker.x}
                cy={model.terminalMarker.y}
                r={3}
                fill={STOP_REASON_COLORS[model.terminalMarker.reason]}
              />
            </g>
          )}
        </>
      )}
    </svg>
  );
}
