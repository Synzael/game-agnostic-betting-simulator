"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type EntitlementSource = "app_store" | "restored" | "dev_override";

export function hasPremiumEntitlement(
  isPremium: boolean,
  expiresAt: number | null,
  now: number = Date.now()
): boolean {
  if (!isPremium) return false;
  if (expiresAt === null) return true;
  return now < expiresAt;
}

interface PremiumStore {
  isPremium: boolean;
  source: EntitlementSource | null;
  activatedAt: number | null;
  expiresAt: number | null;
  markPremium: (source: EntitlementSource, expiresAt?: number | null) => void;
  clearPremium: () => void;
  hasPremiumAccess: () => boolean;
}

export const usePremiumStore = create<PremiumStore>()(
  persist(
    (set, get) => ({
      isPremium: false,
      source: null,
      activatedAt: null,
      expiresAt: null,

      markPremium: (source, expiresAt = null) => {
        set({
          isPremium: true,
          source,
          activatedAt: Date.now(),
          expiresAt,
        });
      },

      clearPremium: () => {
        set({
          isPremium: false,
          source: null,
          activatedAt: null,
          expiresAt: null,
        });
      },

      hasPremiumAccess: () => {
        const { isPremium, expiresAt } = get();
        return hasPremiumEntitlement(isPremium, expiresAt);
      },
    }),
    {
      name: "premium-entitlement:v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
