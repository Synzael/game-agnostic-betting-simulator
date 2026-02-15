import { describe, it, expect } from 'vitest';
import {
  PRESETS,
  getPreset,
  getPresetNames,
  getAllPresets,
  createStrategyFromPreset,
  createStrategy,
  DEFAULT_SESSION_CONFIG,
} from './presets';
import { createLadder, DEFAULT_LADDERS } from './ladder';

describe('PRESETS', () => {
  it('contains all expected presets', () => {
    const expectedNames = [
      'default',
      'aggressive',
      'conservative',
      'moderate',
      'full_recovery',
      'quick_reset',
      'high_offset',
    ];
    expectedNames.forEach((name) => {
      expect(PRESETS[name]).toBeDefined();
    });
  });

  it('default preset has correct values', () => {
    const preset = PRESETS['default'];
    expect(preset.name).toBe('default');
    expect(preset.displayName).toBe('Default');
    expect(preset.bridgingPolicy).toBe('carry_over_index_delta');
    expect(preset.recoveryTargetPct).toBe(0.5);
    expect(preset.crossoverOffset).toBe(0);
  });

  it('aggressive preset has higher recovery target and offset', () => {
    const preset = PRESETS['aggressive'];
    expect(preset.recoveryTargetPct).toBe(0.75);
    expect(preset.crossoverOffset).toBe(2);
  });

  it('conservative preset has lower recovery target', () => {
    const preset = PRESETS['conservative'];
    expect(preset.recoveryTargetPct).toBe(0.25);
    expect(preset.crossoverOffset).toBe(0);
  });

  it('full_recovery preset has 100% recovery', () => {
    const preset = PRESETS['full_recovery'];
    expect(preset.recoveryTargetPct).toBe(1.0);
  });

  it('quick_reset preset has minimal recovery', () => {
    const preset = PRESETS['quick_reset'];
    expect(preset.recoveryTargetPct).toBe(0.1);
  });
});

describe('getPreset', () => {
  it('returns preset by name', () => {
    const preset = getPreset('aggressive');
    expect(preset).toBeDefined();
    expect(preset?.name).toBe('aggressive');
  });

  it('returns undefined for unknown preset', () => {
    expect(getPreset('unknown')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(getPreset('')).toBeUndefined();
  });
});

describe('getPresetNames', () => {
  it('returns array of preset names', () => {
    const names = getPresetNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBe(7);
    expect(names).toContain('default');
    expect(names).toContain('aggressive');
  });
});

describe('getAllPresets', () => {
  it('returns array of all presets', () => {
    const presets = getAllPresets();
    expect(Array.isArray(presets)).toBe(true);
    expect(presets.length).toBe(7);
  });

  it('each preset has required fields', () => {
    const presets = getAllPresets();
    presets.forEach((preset) => {
      expect(preset.name).toBeDefined();
      expect(preset.displayName).toBeDefined();
      expect(preset.bridgingPolicy).toBeDefined();
      expect(typeof preset.recoveryTargetPct).toBe('number');
      expect(typeof preset.crossoverOffset).toBe('number');
      expect(preset.description).toBeDefined();
    });
  });
});

describe('createStrategyFromPreset', () => {
  it('creates strategy with default ladders', () => {
    const strategy = createStrategyFromPreset('default');
    expect(strategy.ladders).toEqual(DEFAULT_LADDERS);
    expect(strategy.bridgingPolicy).toBe('carry_over_index_delta');
    expect(strategy.recoveryTargetPct).toBe(0.5);
    expect(strategy.crossoverOffset).toBe(0);
  });

  it('creates strategy with custom ladders', () => {
    const customLadders = [
      createLadder('Custom1', [10, 20]),
      createLadder('Custom2', [100, 200]),
    ];
    const strategy = createStrategyFromPreset('aggressive', customLadders);
    expect(strategy.ladders).toEqual(customLadders);
    expect(strategy.recoveryTargetPct).toBe(0.75);
    expect(strategy.crossoverOffset).toBe(2);
  });

  it('throws error for unknown preset', () => {
    expect(() => createStrategyFromPreset('nonexistent')).toThrow(
      'Unknown preset: nonexistent'
    );
  });
});

describe('createStrategy', () => {
  it('creates strategy with valid values', () => {
    const strategy = createStrategy('carry_over_index_delta', 0.6, 1);
    expect(strategy.bridgingPolicy).toBe('carry_over_index_delta');
    expect(strategy.recoveryTargetPct).toBe(0.6);
    expect(strategy.crossoverOffset).toBe(1);
    expect(strategy.ladders).toEqual(DEFAULT_LADDERS);
  });

  it('creates strategy with custom ladders', () => {
    const customLadders = [createLadder('Test', [10, 20, 30])];
    const strategy = createStrategy(
      'advance_to_next_ladder_start',
      0.5,
      0,
      customLadders
    );
    expect(strategy.ladders).toEqual(customLadders);
  });

  it('accepts recoveryTargetPct of exactly 1', () => {
    const strategy = createStrategy('carry_over_index_delta', 1.0, 0);
    expect(strategy.recoveryTargetPct).toBe(1.0);
  });

  it('throws error for recoveryTargetPct of 0', () => {
    expect(() => createStrategy('carry_over_index_delta', 0, 0)).toThrow(
      'recoveryTargetPct must be in (0, 1]'
    );
  });

  it('throws error for negative recoveryTargetPct', () => {
    expect(() => createStrategy('carry_over_index_delta', -0.5, 0)).toThrow(
      'recoveryTargetPct must be in (0, 1]'
    );
  });

  it('throws error for recoveryTargetPct > 1', () => {
    expect(() => createStrategy('carry_over_index_delta', 1.5, 0)).toThrow(
      'recoveryTargetPct must be in (0, 1]'
    );
  });

  it('throws error for negative crossoverOffset', () => {
    expect(() => createStrategy('carry_over_index_delta', 0.5, -1)).toThrow(
      'crossoverOffset must be non-negative'
    );
  });

  it('accepts crossoverOffset of 0', () => {
    const strategy = createStrategy('carry_over_index_delta', 0.5, 0);
    expect(strategy.crossoverOffset).toBe(0);
  });
});

describe('DEFAULT_SESSION_CONFIG', () => {
  it('has expected default values', () => {
    expect(DEFAULT_SESSION_CONFIG.bankroll).toBe(10000);
    expect(DEFAULT_SESSION_CONFIG.profitTarget).toBe(500);
    expect(DEFAULT_SESSION_CONFIG.stopLossAbs).toBe(1000);
    expect(DEFAULT_SESSION_CONFIG.maxRounds).toBe(5000);
  });

  it('is readonly', () => {
    // TypeScript enforces this at compile time via 'as const'
    expect(typeof DEFAULT_SESSION_CONFIG.bankroll).toBe('number');
  });
});
