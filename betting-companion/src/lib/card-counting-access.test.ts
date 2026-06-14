import { afterEach, describe, expect, it, vi } from "vitest";

import {
  checkApproval,
  fetchWhitelist,
  hashEmail,
  isValidEmail,
  normalizeEmail,
  resolveWhitelistUrl,
} from "./card-counting-access";

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => false },
}));

// printf '%s' "user@example.com" | shasum -a 256
const USER_HASH =
  "b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514";
// printf '%s' "friend@test.com" | shasum -a 256
const FRIEND_HASH =
  "2ba171d9845fb139cc62571a922846e740a70ee650e870da7509d1fbb1028c9c";

function stubFetchResponse(body: unknown, ok = true): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: async () => body,
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("normalizeEmail", () => {
  it("trims whitespace and lowercases", () => {
    expect(normalizeEmail("  User@Example.COM  ")).toBe("user@example.com");
  });
});

describe("isValidEmail", () => {
  it("accepts a simple email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("accepts emails needing normalization", () => {
    expect(isValidEmail("  User@Example.COM ")).toBe(true);
  });

  it("rejects empty and malformed input", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing@tld")).toBe(false);
    expect(isValidEmail("two words@example.com")).toBe(false);
  });
});

describe("hashEmail", () => {
  it("returns the sha-256 hex of the normalized email", async () => {
    await expect(hashEmail("user@example.com")).resolves.toBe(USER_HASH);
  });

  it("hashes equivalently after normalization", async () => {
    await expect(hashEmail("  User@Example.COM ")).resolves.toBe(USER_HASH);
  });
});

describe("resolveWhitelistUrl", () => {
  it("uses the relative path on web", () => {
    expect(resolveWhitelistUrl(false)).toBe("/card-counting-whitelist.json");
  });

  it("uses the production URL on native", () => {
    expect(resolveWhitelistUrl(true)).toBe(
      "https://game-agnostic-betting-simulator.vercel.app/card-counting-whitelist.json"
    );
  });

  it("prefers the env override on any platform", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_CARD_COUNTING_WHITELIST_URL",
      "https://example.com/list.json"
    );
    expect(resolveWhitelistUrl(false)).toBe("https://example.com/list.json");
    expect(resolveWhitelistUrl(true)).toBe("https://example.com/list.json");
  });
});

describe("fetchWhitelist", () => {
  it("returns the whitelist on a valid response", async () => {
    stubFetchResponse({ version: 1, approvedEmailHashes: [USER_HASH] });

    const result = await fetchWhitelist("/card-counting-whitelist.json");

    expect(result).toEqual({
      ok: true,
      whitelist: { version: 1, approvedEmailHashes: [USER_HASH] },
    });
  });

  it("flags a malformed payload as invalid_response", async () => {
    stubFetchResponse({ version: 1, approvedEmailHashes: "nope" });

    const result = await fetchWhitelist("/card-counting-whitelist.json");

    expect(result).toEqual({ ok: false, error: "invalid_response" });
  });

  it("flags non-string hash entries as invalid_response", async () => {
    stubFetchResponse({ version: 1, approvedEmailHashes: [42] });

    const result = await fetchWhitelist("/card-counting-whitelist.json");

    expect(result).toEqual({ ok: false, error: "invalid_response" });
  });

  it("flags an unreachable server as network_error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    const result = await fetchWhitelist("/card-counting-whitelist.json");

    expect(result).toEqual({ ok: false, error: "network_error" });
  });

  it("flags a non-OK HTTP status as network_error", async () => {
    stubFetchResponse({}, false);

    const result = await fetchWhitelist("/card-counting-whitelist.json");

    expect(result).toEqual({ ok: false, error: "network_error" });
  });
});

describe("checkApproval", () => {
  it("rejects malformed emails without fetching", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await checkApproval("not-an-email");

    expect(result).toEqual({ ok: false, error: "invalid_email" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("approves a whitelisted email regardless of casing", async () => {
    stubFetchResponse({ version: 1, approvedEmailHashes: [FRIEND_HASH] });

    const result = await checkApproval("  Friend@Test.COM ");

    expect(result).toEqual({
      ok: true,
      approved: true,
      emailHash: FRIEND_HASH,
    });
  });

  it("declines an email that is not on the whitelist", async () => {
    stubFetchResponse({ version: 1, approvedEmailHashes: [FRIEND_HASH] });

    const result = await checkApproval("user@example.com");

    expect(result).toEqual({
      ok: true,
      approved: false,
      emailHash: USER_HASH,
    });
  });

  it("propagates fetch failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    const result = await checkApproval("user@example.com");

    expect(result).toEqual({ ok: false, error: "network_error" });
  });
});
