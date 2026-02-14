/**
 * Engine module barrel export.
 */

// Types
export type {
  LadderSpec,
  BridgingPolicy,
  StrategyConfig,
  SessionConfig,
  DecisionMode,
  BridgingDecision,
  StopReason,
  SessionState,
  BetRecord,
  SessionResult,
  PresetConfig,
  AppSettings,
} from "./types";

// Ladder utilities
export {
  createLadder,
  getMaxIndex,
  getStake,
  isAtTop,
  isAtBottom,
  DEFAULT_LADDERS,
  getTotalStakes,
  formatStake,
} from "./ladder";

// Presets
export {
  PRESETS,
  getPreset,
  getPresetNames,
  getAllPresets,
  createStrategyFromPreset,
  createStrategy,
  DEFAULT_SESSION_CONFIG,
} from "./presets";

// Session engine
export {
  createInitialState,
  getCurrentStake,
  getCurrentBankroll,
  canAffordStake,
  exceedsTableMax,
  processBet,
  processBridgingDecision,
  getProfitProgress,
  getStopLossProgress,
  getStopReasonText,
  isWinningSession,
  getLadderName,
} from "./session";
