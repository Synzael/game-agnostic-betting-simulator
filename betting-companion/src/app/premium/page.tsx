"use client";

import { useState } from "react";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { Button, Card, CardContent } from "@/components/ui";
import { usePremiumStore } from "@/store";
import { restorePremiumEntitlement } from "@/lib/premium-entitlements";

const allowDevOverride = process.env.NEXT_PUBLIC_ALLOW_DEV_PREMIUM_OVERRIDE === "1";

export default function PremiumPage() {
  const hasPremiumAccess = usePremiumStore((s) => s.hasPremiumAccess());
  const markPremium = usePremiumStore((s) => s.markPremium);
  const clearPremium = usePremiumStore((s) => s.clearPremium);
  const source = usePremiumStore((s) => s.source);
  const expiresAt = usePremiumStore((s) => s.expiresAt);

  const [isRestoring, setIsRestoring] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleRestore = async () => {
    setIsRestoring(true);
    setStatus(null);
    const restored = await restorePremiumEntitlement();
    setStatus(restored ? "Premium restored successfully." : "No active premium subscription found.");
    setIsRestoring(false);
  };

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="min-h-screen bg-noir p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4 pt-4">
          <Link href="/" className="text-secondary hover:text-primary">
            ← Back
          </Link>
          <h1 className="font-display text-3xl text-champagne">Premium Access</h1>
        </div>

        <Card variant={hasPremiumAccess ? "success" : "gold"}>
          <CardContent className="space-y-3">
            <div className="text-xs uppercase tracking-[0.15em] text-muted">Status</div>
            <div className="font-display text-2xl text-champagne">
              {hasPremiumAccess ? "Premium Active" : "Premium Required"}
            </div>
            <div className="text-sm text-secondary">
              {hasPremiumAccess
                ? "Offline mode is enabled. Your sessions and history stay on this device."
                : "Activate premium to use the iOS or Android app without any internet connection."}
            </div>
            {source && (
              <div className="text-xs uppercase tracking-[0.12em] text-muted">
                Source: {source}
              </div>
            )}
            {expiresAt && (
              <div className="text-xs uppercase tracking-[0.12em] text-muted">
                Expires: {new Date(expiresAt).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleRestore}
            disabled={!isNative || isRestoring}
          >
            {isRestoring ? "Restoring..." : "Restore Subscription"}
          </Button>
          {!isNative && (
            <p className="text-xs text-muted">
              Restore is available only in the native iOS/Android app.
            </p>
          )}
          {status && <p className="text-sm text-secondary">{status}</p>}
        </div>

        {allowDevOverride && (
          <Card variant="warning">
            <CardContent className="space-y-3">
              <div className="text-xs uppercase tracking-[0.15em] text-muted">
                Dev Override
              </div>
              <div className="flex gap-2">
                <Button variant="success" size="md" onClick={() => markPremium("dev_override")} fullWidth>
                  Mark Premium
                </Button>
                <Button variant="danger" size="md" onClick={clearPremium} fullWidth>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
