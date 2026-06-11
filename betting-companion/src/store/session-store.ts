"use client";

/**
 * Session state management with Zustand.
 * Persists active session to localStorage for recovery.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  SessionState,
  SessionConfig,
  StrategyConfig,
  BridgingDecision,
  BetRecord,
  SessionEvent,
  SessionResult,
  DecisionMode,
} from "@/engine/types";
import {
  createInitialState,
  processBet,
  processBridgingDecision,
  getCurrentStake as getStake,
  canAffordStake,
} from "@/engine/session";

interface SessionStore {
  // Configuration
  config: SessionConfig | null;
  strategy: StrategyConfig | null;
  decisionMode: DecisionMode;

  // Active session state
  state: SessionState | null;
  betHistory: BetRecord[];
  sessionEvents: SessionEvent[];
  startTime: number | null;

  // Actions
  startSession: (config: SessionConfig, strategy: StrategyConfig) => void;
  recordBet: (won: boolean) => void;
  makeDecision: (decision: BridgingDecision) => void;
  endSession: () => SessionResult | null;
  resetSession: () => void;
  setDecisionMode: (mode: DecisionMode) => void;

  // Computed helpers
  getCurrentStake: () => number;
  isDecisionPending: () => boolean;
  isSessionActive: () => boolean;
  canContinue: () => boolean;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      config: null,
      strategy: null,
      decisionMode: "at_bridging_only",
      state: null,
      betHistory: [],
      sessionEvents: [],
      startTime: null,

      startSession: (config, strategy) => {
        set({
          config,
          strategy,
          state: createInitialState(strategy, config.startingLadder),
          betHistory: [],
          sessionEvents: [],
          startTime: Date.now(),
        });
      },

      recordBet: (won) => {
        const { state, config, strategy, betHistory, decisionMode } = get();
        if (!state || !config || !strategy || state.stopped) return;

        // Check affordability
        if (!canAffordStake(state, config, strategy)) {
          set({
            state: {
              ...state,
              stopped: true,
              stopReason: "bankroll_exhausted",
            },
          });
          return;
        }

        const stake = getStake(state, strategy);
        const newState = processBet(state, config, strategy, won, decisionMode);

        // Record bet history
        const newRecord: BetRecord = {
          round: state.rounds + 1,
          timestamp: Date.now(),
          ladder: state.currentLadder,
          index: state.currentIndex,
          stake,
          won,
          pnlAfter: newState.pnl,
        };

        set({
          state: newState,
          betHistory: [...betHistory, newRecord],
        });
      },

      makeDecision: (decision) => {
        const { state, strategy, sessionEvents } = get();
        if (!state || !strategy || !state.awaitingDecision) return;

        const newState = processBridgingDecision(state, strategy, decision);

        // Log roguelike adventure events for the graph. Only bridging
        // carry_over/write_off are recorded — stop/terminal outcomes are
        // derivable from stopReason.
        const isBridgingEvent =
          state.pendingDecisionType === "bridging" &&
          (decision === "carry_over" || decision === "write_off");

        const newEvent: SessionEvent | null = isBridgingEvent
          ? {
              round: state.rounds,
              timestamp: Date.now(),
              type: decision as "carry_over" | "write_off",
              pnlAt: state.pnl,
              fromLadder: state.currentLadder,
              toLadder: newState.currentLadder,
            }
          : null;

        set({
          state: newState,
          sessionEvents: newEvent ? [...sessionEvents, newEvent] : sessionEvents,
        });
      },

      endSession: () => {
        const { state, config, strategy, betHistory, sessionEvents, startTime } =
          get();
        if (!state || !config || !strategy) return null;

        const result: SessionResult = {
          id: crypto.randomUUID(),
          startTime: startTime ?? Date.now(),
          endTime: Date.now(),
          hitTarget: state.stopReason === "profit_target",
          hitStopLoss: state.stopReason === "stop_loss",
          hitMaxRounds: state.stopReason === "max_rounds",
          hitTableLimit: state.stopReason === "table_limit",
          bankrollExhausted: state.stopReason === "bankroll_exhausted",
          userStopped: state.stopReason === "user_stopped",
          finalPnl: state.pnl,
          roundsPlayed: state.rounds,
          totalWagered: state.totalWagered,
          maxStakeSeen: state.maxStake,
          maxDrawdown: state.maxDrawdown,
          ladderTouches: { ...state.ladderTouches },
          topOfLadderTouches: state.topTouches,
          finalLadder: state.currentLadder,
          finalIndex: state.currentIndex,
          config,
          strategy,
          betHistory,
          events: sessionEvents,
        };

        return result;
      },

      resetSession: () => {
        set({
          config: null,
          strategy: null,
          state: null,
          betHistory: [],
          sessionEvents: [],
          startTime: null,
        });
      },

      setDecisionMode: (mode) => {
        set({ decisionMode: mode });
      },

      getCurrentStake: () => {
        const { state, strategy } = get();
        if (!state || !strategy) return 0;
        return getStake(state, strategy);
      },

      isDecisionPending: () => {
        const { state } = get();
        return state?.awaitingDecision ?? false;
      },

      isSessionActive: () => {
        const { state } = get();
        return state !== null && !state.stopped;
      },

      canContinue: () => {
        const { state, config, strategy } = get();
        if (!state || !config || !strategy) return false;
        if (state.stopped) return false;
        return canAffordStake(state, config, strategy);
      },
    }),
    {
      name: "betting-session:v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        strategy: state.strategy,
        state: state.state,
        betHistory: state.betHistory,
        sessionEvents: state.sessionEvents,
        startTime: state.startTime,
        decisionMode: state.decisionMode,
      }),
    }
  )
);
