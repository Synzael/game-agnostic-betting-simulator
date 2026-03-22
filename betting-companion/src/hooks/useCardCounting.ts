"use client";

import { useState } from "react";

import type {
  CardRank,
  CountingEngineConfig,
  CountingSnapshot,
} from "@/engine/countingEngine";
import { CountingEngine } from "@/engine/countingEngine";

export interface UseCardCountingResult {
  readonly engine: CountingEngine;
  readonly state: CountingSnapshot;
  cardSeen: (rank: CardRank) => void;
  completeHand: (units?: number) => void;
  resetShoe: () => void;
  setBetSize: (betSize: number) => void;
  getBurnCount: (rank: CardRank) => number;
}

/**
 * React wrapper around the mutable counting engine.
 *
 * The hook keeps the engine instance stable and surfaces immutable snapshots so
 * React components re-render on every state transition.
 */
export function useCardCounting(
  initialConfig: Partial<CountingEngineConfig> = {}
): UseCardCountingResult {
  const [engine] = useState<CountingEngine>(() => new CountingEngine(initialConfig));
  const [state, setState] = useState<CountingSnapshot>(() => engine.getState());

  function updateState(nextState: CountingSnapshot): void {
    setState(nextState);
  }

  function cardSeen(rank: CardRank): void {
    updateState(engine.cardSeen(rank));
  }

  function completeHand(units: number = 1): void {
    updateState(engine.completeHand(units));
  }

  function resetShoe(): void {
    updateState(engine.resetShoe());
  }

  function setBetSize(betSize: number): void {
    updateState(engine.setBetSize(betSize));
  }

  function getBurnCount(rank: CardRank): number {
    return engine.getBurnCount(rank);
  }

  return {
    engine,
    state,
    cardSeen,
    completeHand,
    resetShoe,
    setBetSize,
    getBurnCount,
  };
}
