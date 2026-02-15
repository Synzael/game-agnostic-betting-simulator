# iOS Offline Wrapper (Premium)

This app can be packaged as an offline iOS app using Capacitor.  
All UI/logic is bundled from the static `out/` export, so runtime internet is not required.

## What is already wired

- Static export build for native packaging (`next.config.ts` uses `output: "export"`).
- No runtime external font fetches.
- Capacitor config (`capacitor.config.ts`) targeting `out/`.
- Premium entitlement store persisted locally (`src/store/premium-store.ts`).
- Premium restore screen (`/premium`) with a native bridge hook.

## Prerequisites

- Xcode (latest stable)
- CocoaPods
- Node.js + npm

Install CocoaPods (if missing):

```bash
brew install cocoapods
```

## First-time iOS setup

From `betting-companion`:

```bash
npm install
npx cap add ios
```

## Build and sync iOS app

```bash
npm run cap:sync:ios
npm run ios:open
```

Then run from Xcode on a simulator/device.

## Premium entitlement bridge contract

The web app expects an optional native bridge:

- `window.premiumBridge.restorePurchases(): Promise<{ active: boolean; expiresAt?: number | null }>`

If `active: true`, the app grants premium access and stores it locally for offline use.  
If `active: false`, premium is cleared.

This contract is used by:

- `src/lib/premium-entitlements.ts`
- `src/app/premium/page.tsx`

## Development-only override

To enable the manual premium override UI on `/premium`:

```bash
NEXT_PUBLIC_ALLOW_DEV_PREMIUM_OVERRIDE=1 npm run dev
```

Use this only for local testing.
