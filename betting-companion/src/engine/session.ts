/**
 * Session simulation engine.
 * Ported from Python simulator.py SessionSimulator class.
 *
 * Key differences from Python:
 * - No RNG (real input mode only)
 * - Decision points pause for user input
 * - Immutable state updates
 */

import {
  SessionState,
  SessionConfig,
  StrategyConfig,
  BridgingDecision,
  StopReason,
} from "./types";
import { getStake, getMaxIndex, isAtTop } from "./ladder";

/**
 * Create initial session state.
 */
export function createInitialState(
  strategy: StrategyConfig,
  startingLadder: number = 0
): SessionState {
  const ladderTouches: Record<number, number> = {};
  strategy.ladders.forEach((_, i) => {
    ladderTouches[i] = 0;
  });

  // Clamp starting ladder to valid range
  const validStartingLadder = Math.max(
    0,
    Math.min(startingLadder, strategy.ladders.length - 1)
  );

  return {
    currentLadder: validStartingLadder,
    currentIndex: 0,
    pnl: 0,
    rounds: 0,
    totalWagered: 0,
    maxStake: 0,
    maxDrawdown: 0,
    peakPnl: 0,
    ladderTouches,
    topTouches: 0,
    stopped: false,
    stopReason: null,
    inRecovery: false,
    recoveryTargetPnl: 0,
    awaitingDecision: false,
    pendingDecisionType: null,
  };
}

/**
 * Get current stake based on position.
 */
export function getCurrentStake(
  state: SessionState,
  strategy: StrategyConfig
): number {
  const ladder = strategy.ladders[state.currentLadder];
  return getStake(ladder, state.currentIndex);
}

/**
 * Get current bankroll (initial + pnl).
 */
export function getCurrentBankroll(
  state: SessionState,
  config: SessionConfig
): number {
  return config.bankroll + state.pnl;
}

/**
 * Check if bankroll can afford current stake.
 */
export function canAffordStake(
  state: SessionState,
  config: SessionConfig,
  strategy: StrategyConfig
): boolean {
  const currentBankroll = getCurrentBankroll(state, config);
  return currentBankroll >= getCurrentStake(state, strategy);
}

/**
 * Check if session should stop due to table max.
 */
export function exceedsTableMax(
  state: SessionState,
  config: SessionConfig,
  strategy: StrategyConfig
): boolean {
  if (!config.tableMax) return false;
  return getCurrentStake(state, strategy) > config.tableMax;
}

/**
 * Process a bet result (win or loss).
 * Returns new state - does NOT mutate input.
 */
export function processBet(
  state: SessionState,
  config: SessionConfig,
  strategy: StrategyConfig,
  won: boolean,
  decisionMode: "at_bridging_only" | "every_bet"
): SessionState {
  // Can't process if stopped or awaiting decision
  if (state.stopped || state.awaitingDecision) {
    return state;
  }

  const stake = getCurrentStake(state, strategy);

  // Check affordability
  if (!canAffordStake(state, config, strategy)) {
    return {
      ...state,
      stopped: true,
      stopReason: "bankroll_exhausted",
    };
  }

  // Check table max
  if (exceedsTableMax(state, config, strategy)) {
    return {
      ...state,
      stopped: true,
      stopReason: "table_limit",
    };
  }

  // Calculate PnL change
  const roundPnl = won ? stake : -stake;

  // Create new state with bet result
  let newState: SessionState = {
    ...state,
    pnl: state.pnl + roundPnl,
    rounds: state.rounds + 1,
    totalWagered: state.totalWagered + stake,
    maxStake: Math.max(state.maxStake, stake),
    ladderTouches: {
      ...state.ladderTouches,
      [state.currentLadder]: state.ladderTouches[state.currentLadder] + 1,
    },
  };

  // Update drawdown tracking
  newState = {
    ...newState,
    peakPnl: Math.max(newState.peakPnl, newState.pnl),
    maxDrawdown: Math.max(newState.maxDrawdown, newState.peakPnl - newState.pnl),
  };

  // Check session stop conditions
  if (newState.pnl >= config.profitTarget) {
    return { ...newState, stopped: true, stopReason: "profit_target" };
  }

  if (-newState.pnl >= config.stopLossAbs) {
    return { ...newState, stopped: true, stopReason: "stop_loss" };
  }

  if (newState.rounds >= config.maxRounds) {
    return { ...newState, stopped: true, stopReason: "max_rounds" };
  }

  // Step the ladder index
  newState = stepIndex(newState, strategy, won);

  // Handle every-bet decision mode
  if (
    decisionMode === "every_bet" &&
    !newState.stopped &&
    !newState.awaitingDecision
  ) {
    newState = {
      ...newState,
      awaitingDecision: true,
      pendingDecisionType: "every_bet",
    };
  }

  return newState;
}

/**
 * Step the ladder index based on win/loss.
 * Handles bridging logic when at top of ladder.
 *
 * Base logic (ported from Python):
 * - Win: index -= 2 (move down 2 steps)
 * - Loss: index += 1 (move up 1 step)
 * - Clamp to [0, max_index] within current ladder
 */
function stepIndex(
  state: SessionState,
  strategy: StrategyConfig,
  won: boolean
): SessionState {
  const currentLadder = strategy.ladders[state.currentLadder];
  const maxIndex = getMaxIndex(currentLadder);
  const atTopBeforeStep = state.currentIndex >= maxIndex;

  // Calculate new index
  let newIndex = won ? state.currentIndex - 2 : state.currentIndex + 1;

  // Check if bridging is needed (lost at top)
  const needsBridging = !won && atTopBeforeStep;

  if (needsBridging) {
    return handleBridging(state, strategy);
  }

  // Normal stepping - clamp to valid range
  newIndex = Math.max(0, Math.min(newIndex, maxIndex));

  let newState: SessionState = { ...state, currentIndex: newIndex };

  // Check for recovery completion
  if (newState.inRecovery && newState.pnl >= newState.recoveryTargetPnl) {
    newState = {
      ...newState,
      inRecovery: false,
      recoveryTargetPnl: 0,
      currentLadder: 0,
      currentIndex: 0,
    };
  }

  return newState;
}

/**
 * Handle bridging when losing at top of ladder.
 * Sets awaitingDecision flag for user input.
 */
function handleBridging(
  state: SessionState,
  strategy: StrategyConfig
): SessionState {
  const atLastLadder = state.currentLadder === strategy.ladders.length - 1;

  // Track top touch
  let newState: SessionState = { ...state, topTouches: state.topTouches + 1 };

  // If using stop_at_table_limit policy, just stop
  if (strategy.bridgingPolicy === "stop_at_table_limit") {
    return {
      ...newState,
      stopped: true,
      stopReason: "table_limit",
    };
  }

  // If at last ladder, must stop
  if (atLastLadder) {
    return {
      ...newState,
      stopped: true,
      stopReason: "table_limit",
    };
  }

  // Pause for user decision (roguelike moment!)
  return {
    ...newState,
    awaitingDecision: true,
    pendingDecisionType: "bridging",
  };
}

/**
 * Process user's bridging decision.
 */
export function processBridgingDecision(
  state: SessionState,
  strategy: StrategyConfig,
  decision: BridgingDecision
): SessionState {
  if (!state.awaitingDecision) {
    return state;
  }

  // Handle every-bet continue decision
  if (state.pendingDecisionType === "every_bet") {
    if (decision === "stop_session") {
      return {
        ...state,
        stopped: true,
        stopReason: "user_stopped",
        awaitingDecision: false,
        pendingDecisionType: null,
      };
    }
    // Continue playing
    return {
      ...state,
      awaitingDecision: false,
      pendingDecisionType: null,
    };
  }

  // Handle bridging decisions
  switch (decision) {
    case "stop_session":
      return {
        ...state,
        stopped: true,
        stopReason: "user_stopped",
        awaitingDecision: false,
        pendingDecisionType: null,
      };

    case "write_off":
      // Reset to ladder 0, index 0 - accept the loss
      return {
        ...state,
        currentLadder: 0,
        currentIndex: 0,
        inRecovery: false,
        recoveryTargetPnl: 0,
        awaitingDecision: false,
        pendingDecisionType: null,
      };

    case "carry_over":
      return executeCarryOver(state, strategy);

    default:
      return state;
  }
}

/**
 * Execute carry over bridging logic.
 */
function executeCarryOver(
  state: SessionState,
  strategy: StrategyConfig
): SessionState {
  let newState = { ...state };

  // Enter recovery mode if not already in it
  if (!newState.inRecovery) {
    newState.inRecovery = true;

    if (newState.pnl < 0) {
      const recoveryAmount = Math.abs(newState.pnl) * strategy.recoveryTargetPct;
      newState.recoveryTargetPnl = newState.pnl + recoveryAmount;
    } else {
      // Edge case: in profit, no recovery needed
      newState.recoveryTargetPnl = newState.pnl;
    }
  }

  // Advance to next ladder with offset
  const nextLadder = strategy.ladders[newState.currentLadder + 1];
  const maxNextIndex = getMaxIndex(nextLadder);
  const clampedOffset = Math.min(strategy.crossoverOffset, maxNextIndex);

  return {
    ...newState,
    currentLadder: newState.currentLadder + 1,
    currentIndex: clampedOffset,
    awaitingDecision: false,
    pendingDecisionType: null,
  };
}

/**
 * Calculate progress towards profit target (0-100%).
 */
export function getProfitProgress(
  state: SessionState,
  config: SessionConfig
): number {
  if (state.pnl <= 0) return 0;
  return Math.min(100, (state.pnl / config.profitTarget) * 100);
}

/**
 * Calculate progress towards stop loss (0-100%).
 */
export function getStopLossProgress(
  state: SessionState,
  config: SessionConfig
): number {
  if (state.pnl >= 0) return 0;
  return Math.min(100, (Math.abs(state.pnl) / config.stopLossAbs) * 100);
}

/**
 * Get human-readable stop reason.
 */
export function getStopReasonText(reason: StopReason): string {
  switch (reason) {
    case "profit_target":
      return "Target Reached!";
    case "stop_loss":
      return "Stop Loss Hit";
    case "max_rounds":
      return "Max Rounds Reached";
    case "table_limit":
      return "Table Limit Hit";
    case "bankroll_exhausted":
      return "Bankroll Exhausted";
    case "user_stopped":
      return "Session Ended";
    default:
      return "Session Active";
  }
}

/**
 * Check if session ended successfully (hit profit target).
 */
export function isWinningSession(state: SessionState): boolean {
  return state.stopped && state.stopReason === "profit_target";
}

/**
 * Get ladder name for display.
 */
export function getLadderName(
  state: SessionState,
  strategy: StrategyConfig
): string {
  return strategy.ladders[state.currentLadder].name;
}
