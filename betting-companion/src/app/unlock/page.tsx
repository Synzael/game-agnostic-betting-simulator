"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { useCardCountingAccessStore } from "@/store";
import { checkApproval } from "@/lib/card-counting-access";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  not_approved:
    "This email hasn't been approved yet. Ask the app owner for an invite.",
  network_error:
    "Couldn't reach the approval server. Check your connection and try again.",
  invalid_response: "The approval list couldn't be read. Try again later.",
};

export default function UnlockPage() {
  const approvedEmailHash = useCardCountingAccessStore(
    (s) => s.approvedEmailHash
  );
  const unlocked = useCardCountingAccessStore((s) => s.unlocked);
  const markApproved = useCardCountingAccessStore((s) => s.markApproved);
  const markUnlocked = useCardCountingAccessStore((s) => s.markUnlocked);

  const [email, setEmail] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isApproved = approvedEmailHash !== null;
  const hasAccess = isApproved && unlocked;

  const handleCheckApproval = async () => {
    setIsChecking(true);
    setError(null);

    const result = await checkApproval(email);
    if (!result.ok) {
      setError(ERROR_MESSAGES[result.error]);
    } else if (!result.approved) {
      setError(ERROR_MESSAGES.not_approved);
    } else {
      markApproved(result.emailHash);
    }

    setIsChecking(false);
  };

  return (
    <div className="min-h-screen bg-noir p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4 pt-4">
          <Link href="/" className="text-secondary hover:text-primary">
            ← Back
          </Link>
          <h1 className="font-display text-3xl text-champagne">
            {isApproved ? "Card Counting" : "Invite Access"}
          </h1>
        </div>

        {hasAccess ? (
          <Card variant="success">
            <CardContent className="space-y-4">
              <div className="text-xs uppercase tracking-[0.15em] text-muted">
                Status
              </div>
              <div className="font-display text-2xl text-champagne">
                Card Counting Unlocked
              </div>
              <p className="text-sm text-secondary">
                The live Dragon 7 and Panda 8 shoe tracker is now available
                from the home screen and during sessions.
              </p>
              <Link href="/card-counting" className="block">
                <Button variant="success" size="lg" fullWidth>
                  Open Card Counting
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : isApproved ? (
          <Card variant="gold">
            <CardContent className="space-y-4">
              <div className="text-xs uppercase tracking-[0.15em] text-muted">
                Invite Approved
              </div>
              <div className="font-display text-2xl text-champagne">
                Card Counting — $5
              </div>
              <p className="text-sm text-secondary">
                Unlock the live EZ Baccarat shoe tracker: Dragon 7 and Panda 8
                counts, burn-card handling, and in-session counting tools. One
                payment, yours on this device.
              </p>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => markUnlocked("simulated")}
              >
                Unlock for $5
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-4">
              <div className="text-xs uppercase tracking-[0.15em] text-muted">
                Step 1 of 2
              </div>
              <p className="text-sm text-secondary">
                Some features are invite-only. Enter the email that was
                approved by the app owner to continue.
              </p>
              <Input
                label="Approved email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error ?? undefined}
              />
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleCheckApproval}
                disabled={isChecking || email.trim() === ""}
              >
                {isChecking ? "Checking..." : "Check Invite"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
