"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store";
import { DecisionScreen } from "@/components/decision";

export default function DecisionPage() {
  const router = useRouter();
  const state = useSessionStore((s) => s.state);

  // Redirect if not awaiting decision
  useEffect(() => {
    if (!state?.awaitingDecision || state.pendingDecisionType !== "bridging") {
      router.push("/session");
    }
  }, [state?.awaitingDecision, state?.pendingDecisionType, router]);

  if (!state?.awaitingDecision) {
    return null;
  }

  return <DecisionScreen />;
}
