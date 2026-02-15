/**
 * Core type definitions for the betting strategy engine.
 * Ported from Python simulator.py dataclasses.
 */

/**
 * Specification for a stake ladder.
 */
export interface LadderSpec {
  readonly name: string;
  readonly stakes: readonly number[];
}

/**
 * Bridging policy when losing at top of ladder.
 */
export type BridgingPolicy =
  | "advance_to_next_ladder_start"
  | "carry_over_index_delta"
  | "stop_at_table_limit";

/**
 * Strategy configuration.
 */
export interface StrategyConfig {
  readonly ladders: readonly LadderSpec[];
  readonly bridgingPolicy: BridgingPolicy;
  readonly recoveryTargetPct: number; // 0.0-1.0
  readonly crossoverOffset: number;
}

/**
 * Session configuration.
 */
export interface SessionConfig {
  readonly bankroll: number;
  readonly profitTarget: number;
  readonly stopLossAbs: number;
  readonly maxRounds: number;
  readonly tableMax?: number;
}

/**
 * Decision mode setting.
 */
export type DecisionMode = "at_bridging_only" | "every_bet";

/**
 * Decision options when at bridging point.
 */
export type BridgingDecision = "carry_over" | "write_off" | "stop_session";

/**
 * Stop reasons for session termination.
 */
export type StopReason =
  | "profit_target"
  | "stop_loss"
  | "max_rounds"
  | "table_limit"
  | "bankroll_exhausted"
  | "user_stopped"
  | null;

/**
 * Current session state.
 */
export interface SessionState {
  // Position tracking
  currentLadder: number;
  currentIndex: number;

  // Performance tracking
  pnl: number;
  rounds: number;
  totalWagered: number;
  maxStake: number;
  maxDrawdown: number;
  peakPnl: number;

  // Ladder statistics
  ladderTouches: Record<number, number>;
  topTouches: number;

  // Session control
  stopped: boolean;
  stopReason: StopReason;

  // Recovery mode (for carry_over_index_delta)
  inRecovery: boolean;
  recoveryTargetPnl: number;

  // Decision state
  awaitingDecision: boolean;
  pendingDecisionType: "bridging" | "every_bet" | null;
}

/**
 * Single bet record for history tracking.
 */
export interface BetRecord {
  readonly round: number;
  readonly timestamp: number;
  readonly ladder: number;
  readonly index: number;
  readonly stake: number;
  readonly won: boolean;
  readonly pnlAfter: number;
}

/**
 * Complete session result for history.
 */
export interface SessionResult {
  readonly id: string;
  readonly startTime: number;
  readonly endTime: number;

  // Stop reasons
  readonly hitTarget: boolean;
  readonly hitStopLoss: boolean;
  readonly hitMaxRounds: boolean;
  readonly hitTableLimit: boolean;
  readonly bankrollExhausted: boolean;
  readonly userStopped: boolean;

  // Performance metrics
  readonly finalPnl: number;
  readonly roundsPlayed: number;
  readonly totalWagered: number;
  readonly maxStakeSeen: number;
  readonly maxDrawdown: number;

  // Ladder tracking
  readonly ladderTouches: Record<number, number>;
  readonly topOfLadderTouches: number;
  readonly finalLadder: number;
  readonly finalIndex: number;

  // Configuration snapshot
  readonly config: SessionConfig;
  readonly strategy: StrategyConfig;

  // Bet history (optional, for replay)
  readonly betHistory?: readonly BetRecord[];
}

/**
 * Preset configuration.
 */
export interface PresetConfig {
  readonly name: string;
  readonly displayName: string;
  readonly bridgingPolicy: BridgingPolicy;
  readonly recoveryTargetPct: number;
  readonly crossoverOffset: number;
  readonly description: string;
}

/**
 * App settings persisted across sessions.
 */
export interface AppSettings {
  decisionMode: DecisionMode;
  hapticFeedback: boolean;
  soundEffects: boolean;
  theme: "light" | "dark" | "system";
  lastPreset: string;
}
