import { beforeEach, describe, expect, it } from "vitest";
import { useCardCountingAccessStore } from "./card-counting-access-store";

const TEST_HASH =
  "b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514";

describe("useCardCountingAccessStore", () => {
  beforeEach(() => {
    useCardCountingAccessStore.setState({
      approvedEmailHash: null,
      approvedAt: null,
      unlocked: false,
      unlockedAt: null,
      unlockSource: null,
    });
  });

  it("starts locked with no approval", () => {
    const state = useCardCountingAccessStore.getState();
    expect(state.approvedEmailHash).toBeNull();
    expect(state.unlocked).toBe(false);
    expect(state.hasCardCountingAccess()).toBe(false);
  });

  it("approval alone does not grant access", () => {
    useCardCountingAccessStore.getState().markApproved(TEST_HASH);

    const state = useCardCountingAccessStore.getState();
    expect(state.approvedEmailHash).toBe(TEST_HASH);
    expect(state.approvedAt).not.toBeNull();
    expect(state.hasCardCountingAccess()).toBe(false);
  });

  it("payment alone does not grant access", () => {
    useCardCountingAccessStore.getState().markUnlocked("simulated");

    const state = useCardCountingAccessStore.getState();
    expect(state.unlocked).toBe(true);
    expect(state.unlockedAt).not.toBeNull();
    expect(state.unlockSource).toBe("simulated");
    expect(state.hasCardCountingAccess()).toBe(false);
  });

  it("grants access once approved and unlocked", () => {
    useCardCountingAccessStore.getState().markApproved(TEST_HASH);
    useCardCountingAccessStore.getState().markUnlocked("simulated");

    expect(useCardCountingAccessStore.getState().hasCardCountingAccess()).toBe(
      true
    );
  });

  it("clearAccess resets everything", () => {
    useCardCountingAccessStore.getState().markApproved(TEST_HASH);
    useCardCountingAccessStore.getState().markUnlocked("dev_override");
    useCardCountingAccessStore.getState().clearAccess();

    const state = useCardCountingAccessStore.getState();
    expect(state.approvedEmailHash).toBeNull();
    expect(state.approvedAt).toBeNull();
    expect(state.unlocked).toBe(false);
    expect(state.unlockedAt).toBeNull();
    expect(state.unlockSource).toBeNull();
    expect(state.hasCardCountingAccess()).toBe(false);
  });
});
