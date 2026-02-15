/**
 * Preset configurations for betting strategies.
 * Ported from Python presets.ini.
 */

import { PresetConfig, StrategyConfig, LadderSpec } from "./types";
import { DEFAULT_LADDERS } from "./ladder";

/**
 * All available preset configurations.
 */
export const PRESETS: Record<string, PresetConfig> = {
  default: {
    name: "default",
    displayName: "Default",
    bridgingPolicy: "carry_over_index_delta",
    recoveryTargetPct: 0.5,
    crossoverOffset: 0,
    description: "Balanced approach - recover 50% of losses",
  },
  aggressive: {
    name: "aggressive",
    displayName: "Aggressive",
    bridgingPolicy: "carry_over_index_delta",
    recoveryTargetPct: 0.75,
    crossoverOffset: 2,
    description: "Higher recovery target, start mid-ladder",
  },
  conservative: {
    name: "conservative",
    displayName: "Conservative",
    bridgingPolicy: "carry_over_index_delta",
    recoveryTargetPct: 0.25,
    crossoverOffset: 0,
    description: "Quick resets, lower variance",
  },
  moderate: {
    name: "moderate",
    displayName: "Moderate",
    bridgingPolicy: "carry_over_index_delta",
    recoveryTargetPct: 0.5,
    crossoverOffset: 1,
    description: "Balanced with slight offset",
  },
  full_recovery: {
    name: "full_recovery",
    displayName: "Full Recovery",
    bridgingPolicy: "carry_over_index_delta",
    recoveryTargetPct: 1.0,
    crossoverOffset: 0,
    description: "Must recover all losses before reset",
  },
  quick_reset: {
    name: "quick_reset",
    displayName: "Quick Reset",
    bridgingPolicy: "carry_over_index_delta",
    recoveryTargetPct: 0.1,
    crossoverOffset: 0,
    description: "Minimal recovery, fast resets",
  },
  high_offset: {
    name: "high_offset",
    displayName: "High Offset",
    bridgingPolicy: "carry_over_index_delta",
    recoveryTargetPct: 0.5,
    crossoverOffset: 3,
    description: "Standard recovery, start higher in next ladder",
  },
};

/**
 * Get preset by name.
 */
export function getPreset(name: string): PresetConfig | undefined {
  return PRESETS[name];
}

/**
 * Get all preset names.
 */
export function getPresetNames(): string[] {
  return Object.keys(PRESETS);
}

/**
 * Get all presets as array.
 */
export function getAllPresets(): PresetConfig[] {
  return Object.values(PRESETS);
}

/**
 * Create StrategyConfig from preset.
 */
export function createStrategyFromPreset(
  presetName: string,
  ladders: readonly LadderSpec[] = DEFAULT_LADDERS
): StrategyConfig {
  const preset = PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  return {
    ladders,
    bridgingPolicy: preset.bridgingPolicy,
    recoveryTargetPct: preset.recoveryTargetPct,
    crossoverOffset: preset.crossoverOffset,
  };
}

/**
 * Create StrategyConfig with custom values.
 */
export function createStrategy(
  bridgingPolicy: StrategyConfig["bridgingPolicy"],
  recoveryTargetPct: number,
  crossoverOffset: number,
  ladders: readonly LadderSpec[] = DEFAULT_LADDERS
): StrategyConfig {
  if (recoveryTargetPct <= 0 || recoveryTargetPct > 1) {
    throw new Error("recoveryTargetPct must be in (0, 1]");
  }
  if (crossoverOffset < 0) {
    throw new Error("crossoverOffset must be non-negative");
  }

  return {
    ladders,
    bridgingPolicy,
    recoveryTargetPct,
    crossoverOffset,
  };
}

/**
 * Default session configuration.
 */
export const DEFAULT_SESSION_CONFIG = {
  bankroll: 10000,
  profitTarget: 500,
  stopLossAbs: 1000,
  maxRounds: 5000,
} as const;
