# Android Offline Wrapper (Premium)

This app can be packaged as an offline Android app using Capacitor.  
All UI and logic are bundled from the static `out/` export, so runtime internet is not required.

## What is already wired

- Static export build for native packaging (`next.config.ts` uses `output: "export"`).
- No runtime external font fetches.
- Capacitor config (`capacitor.config.ts`) targeting `out/`.
- Premium entitlement store persisted locally (`src/store/premium-store.ts`).
- Premium restore screen (`/premium`) with a native bridge hook.

## Prerequisites

- Android Studio (latest stable)
- Android SDK + platform tools
- Java 17+
- Node.js + npm

## First-time Android setup

From `betting-companion`:

```bash
npm install
npx cap add android
```

## Build and sync Android app

```bash
npm run cap:sync:android
npm run android:open
```

Then run from Android Studio on an emulator/device.

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
