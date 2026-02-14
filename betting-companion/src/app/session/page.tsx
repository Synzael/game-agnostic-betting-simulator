"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/store";
import { Button } from "@/components/ui";
import {
  BetInputPanel,
  PnLDisplay,
  LadderDisplay,
  RecoveryBanner,
  SessionStats,
} from "@/components/session";

export default function SessionPage() {
  const router = useRouter();
  const state = useSessionStore((s) => s.state);
  const isDecisionPending = useSessionStore((s) => s.isDecisionPending);
  const makeDecision = useSessionStore((s) => s.makeDecision);

  // Redirect to decision screen if decision pending
  useEffect(() => {
    if (state?.awaitingDecision && state.pendingDecisionType === "bridging") {
      router.push("/decision");
    }
  }, [state?.awaitingDecision, state?.pendingDecisionType, router]);

  // Redirect to summary if session ended
  useEffect(() => {
    if (state?.stopped) {
      router.push("/summary");
    }
  }, [state?.stopped, router]);

  // Redirect to setup if no session
  if (!state) {
    return (
      <div className="min-h-screen bg-noir p-6 flex flex-col items-center justify-center">
        <div className="text-center animate-fadeInUp">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--gold-glow)] border border-[var(--gold-dim)] flex items-center justify-center">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-secondary mb-6 font-display text-lg">No active session</p>
          <Link href="/setup">
            <Button variant="gold" size="lg">Start New Session</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Handle every-bet confirmation mode
  const handleContinue = () => {
    makeDecision("carry_over");
  };

  const handleStop = () => {
    makeDecision("stop_session");
  };

  return (
    <div className="min-h-screen bg-noir flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-[var(--noir-border)] bg-[var(--noir-soft)]">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-secondary hover:text-champagne text-sm transition-colors">
            <span className="text-gold mr-1">&larr;</span> Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted uppercase tracking-wider">Round</span>
            <span className="font-display text-xl text-gold">
              {state.rounds}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
          >
            End
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Recovery Banner (if in recovery) */}
        <RecoveryBanner />

        {/* PnL Display */}
        <div className="animate-fadeInUp">
          <PnLDisplay />
        </div>

        {/* Ladder Position */}
        <div className="animate-fadeInUp stagger-1">
          <LadderDisplay />
        </div>

        {/* Session Stats */}
        <div className="animate-fadeInUp stagger-2">
          <SessionStats />
        </div>
      </main>

      {/* Bottom Action Area */}
      <div className="border-t border-[var(--noir-border)] bg-[var(--noir-soft)]">
        {isDecisionPending() && state.pendingDecisionType === "every_bet" ? (
          // Every-bet confirmation mode
          <div className="p-6 safe-bottom">
            <p className="text-center text-sm text-secondary mb-4 font-display">
              Continue to next bet?
            </p>
            <div className="flex gap-3">
              <Button
                variant="success"
                size="lg"
                fullWidth
                onClick={handleContinue}
              >
                Continue
              </Button>
              <Button
                variant="danger"
                size="lg"
                fullWidth
                onClick={handleStop}
              >
                Stop
              </Button>
            </div>
          </div>
        ) : (
          // Normal bet input
          <BetInputPanel />
        )}
      </div>
    </div>
  );
}
