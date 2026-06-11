"use client";

/**
 * App-wide display settings, persisted to localStorage.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SettingsStore {
  showBetNumbers: boolean;
  setShowBetNumbers: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      showBetNumbers: true,

      setShowBetNumbers: (show) => set({ showBetNumbers: show }),
    }),
    {
      name: "app-settings:v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ showBetNumbers: state.showBetNumbers }),
    }
  )
);
