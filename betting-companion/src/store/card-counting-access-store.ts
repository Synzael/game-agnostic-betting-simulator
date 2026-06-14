"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type UnlockSource = "simulated" | "app_store" | "dev_override";

interface CardCountingAccessStore {
  // Whitelist approval (remote check, cached locally)
  approvedEmailHash: string | null;
  approvedAt: number | null;

  // Paywall ($5 unlock)
  unlocked: boolean;
  unlockedAt: number | null;
  unlockSource: UnlockSource | null;

  markApproved: (emailHash: string) => void;
  markUnlocked: (source: UnlockSource) => void;
  clearAccess: () => void;

  /** Access requires BOTH whitelist approval and a passed paywall. */
  hasCardCountingAccess: () => boolean;
}

export const useCardCountingAccessStore = create<CardCountingAccessStore>()(
  persist(
    (set, get) => ({
      approvedEmailHash: null,
      approvedAt: null,
      unlocked: false,
      unlockedAt: null,
      unlockSource: null,

      markApproved: (emailHash) => {
        set({
          approvedEmailHash: emailHash,
          approvedAt: Date.now(),
        });
      },

      markUnlocked: (source) => {
        set({
          unlocked: true,
          unlockedAt: Date.now(),
          unlockSource: source,
        });
      },

      clearAccess: () => {
        set({
          approvedEmailHash: null,
          approvedAt: null,
          unlocked: false,
          unlockedAt: null,
          unlockSource: null,
        });
      },

      hasCardCountingAccess: () => {
        const { approvedEmailHash, unlocked } = get();
        return approvedEmailHash !== null && unlocked;
      },
    }),
    {
      name: "card-counting-access:v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
