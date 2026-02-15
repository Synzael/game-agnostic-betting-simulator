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

## Native wrapper build

```bash
npm run build:native
```

For full native setup and premium/offline flow:

- [iOS Offline Premium Guide](./docs/IOS_OFFLINE_PREMIUM.md)
- [Android Offline Premium Guide](./docs/ANDROID_OFFLINE_PREMIUM.md)

## Key scripts

- `npm run cap:copy:ios` build native web bundle and copy to iOS project
- `npm run cap:sync:ios` build native web bundle and sync Capacitor iOS project
- `npm run ios:open` open Xcode project
- `npm run ios:run` sync and run on iOS target
- `npm run cap:copy:android` build native web bundle and copy to Android project
- `npm run cap:sync:android` build native web bundle and sync Capacitor Android project
- `npm run android:open` open Android Studio project
- `npm run android:run` sync and run on Android target
