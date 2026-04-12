import { describe, expect, it } from 'vitest';

import { CountingEngine } from './countingEngine';

describe('CountingEngine', () => {
  it('applies Dragon 7 and Panda 8 tags correctly', () => {
    const engine = new CountingEngine();

    engine.cardSeen(8);
    engine.cardSeen(9);
    engine.cardSeen(3);
    const state = engine.cardSeen('K');

    expect(state.systems.dragon7.runningCount).toBe(3);
    expect(state.systems.panda8.runningCount).toBe(1);
  });

  it('calculates true count from decks remaining', () => {
    const engine = new CountingEngine({ deckCount: 1 });

    for (let index = 0; index < 2; index += 1) {
      engine.cardSeen(8);
    }

    for (let index = 0; index < 24; index += 1) {
      engine.cardSeen(0);
    }

    const state = engine.getState();

    expect(state.cardsSeen).toBe(26);
    expect(state.cardsRemaining).toBe(26);
    expect(state.decksRemaining).toBe(0.5);
    expect(state.systems.dragon7.runningCount).toBe(4);
    expect(state.systems.dragon7.trueCount).toBe(8);
    expect(state.systems.panda8.runningCount).toBe(20);
    expect(state.systems.panda8.trueCount).toBe(40);
  });

  it('detects triggers and records theoretical profit when a hand completes', () => {
    const engine = new CountingEngine({ deckCount: 1 });

    expect(engine.getState().systems.dragon7.shouldBet).toBe(false);
    expect(engine.getState().systems.panda8.shouldBet).toBe(false);

    for (let index = 0; index < 2; index += 1) {
      engine.cardSeen(8);
    }

    for (let index = 0; index < 24; index += 1) {
      engine.cardSeen(0);
    }

    const state = engine.completeHand();

    expect(state.systems.dragon7.shouldBet).toBe(true);
    expect(state.systems.panda8.shouldBet).toBe(true);
    expect(state.systems.dragon7.betsMade).toBe(1);
    expect(state.systems.panda8.betsMade).toBe(1);
    expect(state.systems.dragon7.theoreticalProfitUnits).toBeCloseTo(0.0502, 10);
    expect(state.systems.panda8.theoreticalProfitUnits).toBeCloseTo(0.2707, 10);
  });

  it('resets the shoe back to the initial state', () => {
    const engine = new CountingEngine();

    engine.cardSeen(8);
    engine.cardSeen(9);
    engine.completeHand();
    const resetState = engine.resetShoe();

    expect(resetState.cardsSeen).toBe(0);
    expect(resetState.cardsRemaining).toBe(416);
    expect(resetState.handsCompleted).toBe(0);
    expect(resetState.systems.dragon7.runningCount).toBe(0);
    expect(resetState.systems.panda8.runningCount).toBe(0);
    expect(resetState.systems.dragon7.betsMade).toBe(0);
    expect(resetState.systems.panda8.betsMade).toBe(0);
  });

  it('scales dollar-denominated projections when the bet size changes', () => {
    const engine = new CountingEngine();
    const baselineState = engine.getState();
    const resizedState = engine.setBetSize(250);

    expect(baselineState.systems.dragon7.projectedHourlyProfitDollars).toBeCloseTo(44.9, 10);
    expect(baselineState.systems.panda8.projectedHourlyProfitDollars).toBeCloseTo(17.8, 10);
    expect(baselineState.projectedHourlyProfitDollars).toBeCloseTo(62.7, 10);
    expect(resizedState.systems.dragon7.projectedHourlyProfitDollars).toBeCloseTo(112.25, 10);
    expect(resizedState.systems.panda8.projectedHourlyProfitDollars).toBeCloseTo(44.5, 10);
    expect(resizedState.projectedHourlyProfitDollars).toBeCloseTo(156.75, 10);
  });
});
