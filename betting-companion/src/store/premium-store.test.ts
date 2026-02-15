import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePremiumStore } from "./premium-store";

describe("usePremiumStore", () => {
  beforeEach(() => {
    usePremiumStore.setState({
      isPremium: false,
      source: null,
      activatedAt: null,
      expiresAt: null,
    });
  });

  it("starts with no premium access", () => {
    const state = usePremiumStore.getState();
    expect(state.isPremium).toBe(false);
    expect(state.hasPremiumAccess()).toBe(false);
  });

  it("marks premium without expiration", () => {
    usePremiumStore.getState().markPremium("app_store");
    const state = usePremiumStore.getState();

    expect(state.isPremium).toBe(true);
    expect(state.source).toBe("app_store");
    expect(state.activatedAt).not.toBeNull();
    expect(state.hasPremiumAccess()).toBe(true);
  });

  it("expires premium when current time passes expiration", () => {
    const now = new Date("2026-01-01T00:00:00.000Z").getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    usePremiumStore.getState().markPremium("restored", now + 1000);
    expect(usePremiumStore.getState().hasPremiumAccess()).toBe(true);

    vi.setSystemTime(now + 1001);
    expect(usePremiumStore.getState().hasPremiumAccess()).toBe(false);

    vi.useRealTimers();
  });

  it("clears premium state", () => {
    usePremiumStore.getState().markPremium("app_store");
    usePremiumStore.getState().clearPremium();

    const state = usePremiumStore.getState();
    expect(state.isPremium).toBe(false);
    expect(state.source).toBeNull();
    expect(state.activatedAt).toBeNull();
    expect(state.expiresAt).toBeNull();
    expect(state.hasPremiumAccess()).toBe(false);
  });
});
