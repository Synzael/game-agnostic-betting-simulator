"use client";

import { Capacitor } from "@capacitor/core";

const RELATIVE_WHITELIST_URL = "/card-counting-whitelist.json";
const PRODUCTION_WHITELIST_URL =
  "https://game-agnostic-betting-simulator.vercel.app/card-counting-whitelist.json";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CardCountingWhitelist {
  readonly version: number;
  readonly approvedEmailHashes: readonly string[];
}

export type WhitelistError = "network_error" | "invalid_response";

export type WhitelistFetchResult =
  | { readonly ok: true; readonly whitelist: CardCountingWhitelist }
  | { readonly ok: false; readonly error: WhitelistError };

export type ApprovalCheckResult =
  | {
      readonly ok: true;
      readonly approved: boolean;
      readonly emailHash: string;
    }
  | { readonly ok: false; readonly error: WhitelistError | "invalid_email" };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

/**
 * SHA-256 hex digest of the normalized email. The published whitelist
 * stores hashes (not addresses) so approved users' emails are never
 * exposed at the public URL.
 */
export async function hashEmail(email: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeEmail(email));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Native builds bundle their own copy of /public, so they must fetch the
 * live list from production; web builds can use the same-origin file.
 */
export function resolveWhitelistUrl(
  isNative: boolean = Capacitor.isNativePlatform()
): string {
  const override = process.env.NEXT_PUBLIC_CARD_COUNTING_WHITELIST_URL;
  if (override) return override;
  return isNative ? PRODUCTION_WHITELIST_URL : RELATIVE_WHITELIST_URL;
}

function parseWhitelist(payload: unknown): CardCountingWhitelist | null {
  if (typeof payload !== "object" || payload === null) return null;

  const candidate = payload as {
    version?: unknown;
    approvedEmailHashes?: unknown;
  };
  if (!Array.isArray(candidate.approvedEmailHashes)) return null;
  if (!candidate.approvedEmailHashes.every((h) => typeof h === "string")) {
    return null;
  }

  return {
    version: typeof candidate.version === "number" ? candidate.version : 1,
    approvedEmailHashes: candidate.approvedEmailHashes,
  };
}

export async function fetchWhitelist(
  url: string = resolveWhitelistUrl()
): Promise<WhitelistFetchResult> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    return { ok: false, error: "network_error" };
  }

  if (!response.ok) {
    return { ok: false, error: "network_error" };
  }

  try {
    const whitelist = parseWhitelist(await response.json());
    return whitelist
      ? { ok: true, whitelist }
      : { ok: false, error: "invalid_response" };
  } catch {
    return { ok: false, error: "invalid_response" };
  }
}

export async function checkApproval(
  email: string,
  url?: string
): Promise<ApprovalCheckResult> {
  if (!isValidEmail(email)) {
    return { ok: false, error: "invalid_email" };
  }

  const emailHash = await hashEmail(email);
  const result = await fetchWhitelist(url);
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    approved: result.whitelist.approvedEmailHashes.includes(emailHash),
    emailHash,
  };
}
