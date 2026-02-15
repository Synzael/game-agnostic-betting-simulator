"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { useSessionStore, useHistoryStore, usePremiumStore } from "@/store";
import { calculateHistoryStats } from "@/store/history-store";
import { hasPremiumEntitlement } from "@/store/premium-store";

export default function Home() {
  const isSessionActive = useSessionStore((s) => s.isSessionActive);
  const sessions = useHistoryStore((s) => s.sessions);
  const isPremium = usePremiumStore((s) => s.isPremium);
  const premiumExpiresAt = usePremiumStore((s) => s.expiresAt);
  const stats = useMemo(() => calculateHistoryStats(sessions), [sessions]);
  const hasPremiumAccess = hasPremiumEntitlement(isPremium, premiumExpiresAt);

  const isNative = Capacitor.isNativePlatform();
  const premiumRequired = isNative && !hasPremiumAccess;

  return (
    <div className="min-h-screen bg-noir p-4 flex flex-col">
      {/* Header */}
      <div className="text-center py-12 animate-fadeInUp">
        <div className="inline-block mb-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dim)] flex items-center justify-center shadow-gold">
            <svg className="w-10 h-10 text-noir" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2h11a1 1 0 000-2H3zm0 4a1 1 0 000 2h9a1 1 0 000-2H3zm0 4a1 1 0 100 2h7a1 1 0 100-2H3zm0 4a1 1 0 100 2h5a1 1 0 100-2H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h1 className="font-display text-4xl text-champagne mb-3">
          Velvet Stakes
        </h1>
        <p className="text-secondary text-sm tracking-wide">
          Your roguelike betting strategy companion
        </p>
        <div className="mt-4 inline-flex items-center rounded-full border border-[var(--gold-dim)] px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-secondary">
          {isNative ? (premiumRequired ? "Premium Required" : "Premium Active") : "Web Mode"}
        </div>
      </div>

      {/* Main Actions */}
      <div className="flex-1 flex flex-col gap-4 max-w-md mx-auto w-full">
        {premiumRequired && (
          <Link href="/premium" className="block animate-fadeInUp">
            <div className="card-gold p-5 group cursor-pointer transition-all duration-300 hover:scale-[1.02]">
              <div className="font-display text-xl text-gold">
                Unlock Premium
              </div>
              <div className="text-xs text-secondary mt-1">
                Restore your subscription to run fully offline on iOS and Android.
              </div>
            </div>
          </Link>
        )}

        {/* Resume Session (if active) */}
        {isSessionActive() && !premiumRequired && (
          <Link href="/session" className="block animate-fadeInUp">
            <div className="card-gold p-5 group cursor-pointer transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-display text-xl text-gold">
                    Resume Session
                  </div>
                  <div className="text-xs text-secondary mt-0.5">
                    Continue your active session
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* New Session */}
        <Link href={premiumRequired ? "/premium" : "/setup"} className="block animate-fadeInUp stagger-1">
          <div
            className={`card-emerald p-5 group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              premiumRequired ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--emerald)]/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--emerald)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-display text-xl text-[var(--emerald)]">
                  {premiumRequired ? "Premium Unlock Needed" : isSessionActive() ? "New Session" : "Start Session"}
                </div>
                <div className="text-xs text-secondary mt-0.5">
                  {premiumRequired
                    ? "Subscribe once and continue fully offline on iOS and Android."
                    : "Configure and begin a new betting session"}
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* History */}
        <Link href={premiumRequired ? "/premium" : "/history"} className="block animate-fadeInUp stagger-2">
          <div
            className={`card-noir p-5 group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-[var(--gold-dim)] ${
              premiumRequired ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--noir-elevated)] flex items-center justify-center">
                <svg className="w-7 h-7 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-display text-xl text-champagne">
                  History
                </div>
                <div className="text-xs text-secondary mt-0.5">
                  View past sessions and stats
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      {stats.totalSessions > 0 && (
        <div className="mt-8 card-noir p-5 max-w-md mx-auto w-full animate-fadeInUp stagger-3">
          <div className="text-[10px] text-muted uppercase tracking-[0.15em] mb-4">
            Quick Stats
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-display text-2xl text-champagne">
                {stats.totalSessions}
              </div>
              <div className="text-[10px] text-muted uppercase tracking-wider mt-1">Sessions</div>
            </div>
            <div>
              <div className="font-display text-2xl text-[var(--emerald)]">
                {stats.winRate.toFixed(0)}%
              </div>
              <div className="text-[10px] text-muted uppercase tracking-wider mt-1">Win Rate</div>
            </div>
            <div>
              <div
                className={`font-display text-2xl ${
                  stats.totalPnl >= 0 ? "pnl-positive" : "pnl-negative"
                }`}
              >
                {stats.totalPnl >= 0 ? "+" : ""}${Math.abs(stats.totalPnl).toFixed(0)}
              </div>
              <div className="text-[10px] text-muted uppercase tracking-wider mt-1">Total P&L</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-6 text-[10px] text-muted uppercase tracking-wider">
        Offline-first • Local data only • Native iOS + Android ready
      </div>
    </div>
  );
}
