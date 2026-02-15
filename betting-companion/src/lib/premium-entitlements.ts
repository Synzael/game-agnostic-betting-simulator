"use client";

import { Capacitor } from "@capacitor/core";
import { usePremiumStore } from "@/store";

interface PremiumRestoreResult {
  active: boolean;
  expiresAt?: number | null;
}

interface PremiumBridge {
  restorePurchases: () => Promise<PremiumRestoreResult>;
}

declare global {
  interface Window {
    premiumBridge?: PremiumBridge;
  }
}

export async function restorePremiumEntitlement(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  const bridge = window.premiumBridge;
  if (!bridge) {
    return false;
  }

  try {
    const result = await bridge.restorePurchases();
    const premiumStore = usePremiumStore.getState();

    if (result.active) {
      premiumStore.markPremium("restored", result.expiresAt ?? null);
      return true;
    }

    premiumStore.clearPremium();
    return false;
  } catch {
    return false;
  }
}
