# Velvet Stakes (Betting Companion)

Offline-first roguelike betting strategy companion built with Next.js.

## Local development

```bash
npm install
npm run dev
```

## Test suite

```bash
npm run test -- --run
```

## Web build (static + PWA)

```bash
npm run build
```

## Native iOS wrapper build

```bash
npm run build:native
```

For full iOS setup and premium/offline flow:

- [iOS Offline Premium Guide](./docs/IOS_OFFLINE_PREMIUM.md)

## Key scripts

- `npm run cap:copy:ios` build native web bundle and copy to iOS project
- `npm run cap:sync:ios` build native web bundle and sync Capacitor iOS project
- `npm run ios:open` open Xcode project
- `npm run ios:run` sync and run on iOS target
