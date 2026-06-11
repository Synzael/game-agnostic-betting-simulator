"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  CountingEngine,
  type CardRank,
  type CountingSnapshot,
} from "@/engine/countingEngine";

type EventType = "card" | "burn" | "hand" | "reset";

export interface EventLogEntry {
  readonly id: number;
  readonly label: string;
  readonly type: EventType;
}

interface CountingStoreState {
  readonly enabled: boolean;
  readonly snapshot: CountingSnapshot;
  readonly eventLog: readonly EventLogEntry[];
}

interface CountingStoreActions {
  setEnabled: (enabled: boolean) => void;
  cardSeen: (rank: CardRank) => void;
  completeHand: (units?: number) => void;
  resetShoe: () => void;
  setBetSize: (betSize: number) => void;
  getBurnCount: (rank: CardRank) => number;
  pushEvent: (label: string, type: EventType) => void;
}

type CountingStore = CountingStoreState & CountingStoreActions;

/**
 * Module-level singleton engine.
 * Survives Next.js client-side navigation so counts persist across pages.
 */
let engine = new CountingEngine();
let eventIdCounter = 0;

export const useCountingStore = create<CountingStore>()(
  persist(
    (set) => ({
      enabled: false,
      snapshot: engine.getState(),
      eventLog: [],

      setEnabled: (enabled) => set({ enabled }),

      cardSeen: (rank) =>
        set({ snapshot: engine.cardSeen(rank) }),

      completeHand: (units = 1) =>
        set({ snapshot: engine.completeHand(units) }),

      resetShoe: () => {
        const betSize = engine.getState().config.betSize;
        engine = new CountingEngine({ betSize });
        set({ snapshot: engine.getState(), eventLog: [] });
        eventIdCounter = 0;
      },

      setBetSize: (betSize) =>
        set({ snapshot: engine.setBetSize(betSize) }),

      getBurnCount: (rank) => engine.getBurnCount(rank),

      pushEvent: (label, type) => {
        eventIdCounter += 1;
        const id = eventIdCounter;
        set((state) => ({
          eventLog: [{ id, label, type }, ...state.eventLog].slice(0, 12),
        }));
      },
    }),
    {
      name: "card-counting:v1",
      partialize: (state) => ({ enabled: state.enabled }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<CountingStore>),
        snapshot: engine.getState(),
        eventLog: [],
      }),
    }
  )
);
