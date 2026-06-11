/**
 * Pure derivation logic for the adventure graph.
 * Maps bet history + roguelike events into SVG coordinates.
 * No React — fully unit-testable.
 */

import {
  BetRecord,
  SessionEvent,
  SessionResult,
  StopReason,
} from "@/engine/types";

export interface GraphDot {
  readonly x: number;
  readonly y: number;
  readonly won: boolean;
  readonly stake: number;
  readonly round: number;
  readonly showLabel: boolean;
}

export interface GraphEventMarker {
  readonly x: number;
  readonly y: number;
  readonly type: SessionEvent["type"];
}

export interface GraphTerminalMarker {
  readonly x: number;
  readonly y: number;
  readonly reason: NonNullable<StopReason>;
}

export interface GraphModel {
  readonly isEmpty: boolean;
  readonly width: number;
  readonly height: number;
  readonly linePoints: string;
  readonly dots: readonly GraphDot[];
  readonly eventMarkers: readonly GraphEventMarker[];
  readonly terminalMarker: GraphTerminalMarker | null;
  readonly zeroLineY: number;
  readonly finalPnl: number;
}

const PAD_X = 12;
const PAD_Y = 16;
const MAX_LABELS = 25;

export function buildGraphModel(
  betHistory: readonly BetRecord[],
  events: readonly SessionEvent[],
  stopReason: StopReason,
  width: number,
  height: number
): GraphModel {
  if (betHistory.length === 0) {
    return {
      isEmpty: true,
      width,
      height,
      linePoints: "",
      dots: [],
      eventMarkers: [],
      terminalMarker: null,
      zeroLineY: height / 2,
      finalPnl: 0,
    };
  }

  const pnls = betHistory.map((bet) => bet.pnlAfter);
  // Domain always includes zero so the baseline stays on-chart.
  const yMin = Math.min(0, ...pnls);
  const yMax = Math.max(0, ...pnls);
  const ySpan = yMax - yMin || 1;
  const maxRound = betHistory[betHistory.length - 1].round || 1;

  const toX = (round: number): number =>
    PAD_X + (round / maxRound) * (width - 2 * PAD_X);
  const toY = (pnl: number): number =>
    PAD_Y + ((yMax - pnl) / ySpan) * (height - 2 * PAD_Y);

  const labelEvery = Math.ceil(betHistory.length / MAX_LABELS);
  const lastIndex = betHistory.length - 1;

  const dots: GraphDot[] = betHistory.map((bet, index) => ({
    x: toX(bet.round),
    y: toY(bet.pnlAfter),
    won: bet.won,
    stake: bet.stake,
    round: bet.round,
    // Anchor thinning on the latest bet so it is always labeled.
    showLabel: (lastIndex - index) % labelEvery === 0,
  }));

  const originPoint = `${toX(0)},${toY(0)}`;
  const linePoints = [
    originPoint,
    ...dots.map((dot) => `${dot.x},${dot.y}`),
  ].join(" ");

  const eventMarkers: GraphEventMarker[] = events.map((event) => ({
    x: toX(event.round),
    y: toY(event.pnlAt),
    type: event.type,
  }));

  const lastDot = dots[dots.length - 1];
  const terminalMarker: GraphTerminalMarker | null = stopReason
    ? { x: lastDot.x, y: lastDot.y, reason: stopReason }
    : null;

  return {
    isEmpty: false,
    width,
    height,
    linePoints,
    dots,
    eventMarkers,
    terminalMarker,
    zeroLineY: toY(0),
    finalPnl: pnls[pnls.length - 1],
  };
}

/**
 * Derive the StopReason from a stored SessionResult's outcome flags,
 * so History mini-graphs can render a terminal marker.
 */
export function stopReasonFromResult(result: SessionResult): StopReason {
  if (result.hitTarget) return "profit_target";
  if (result.hitStopLoss) return "stop_loss";
  if (result.hitMaxRounds) return "max_rounds";
  if (result.hitTableLimit) return "table_limit";
  if (result.bankrollExhausted) return "bankroll_exhausted";
  if (result.userStopped) return "user_stopped";
  return null;
}
