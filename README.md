# Good Food Pro — Restaurant App

Expo / React Native restaurant client for the Good Food Pro food-delivery suite.
Restaurant owners manage orders, menus, profile, delivery settings, and reviews against the **Good Food Pro REST API** (Express + MongoDB).

---

## Requirements

- Node.js **LTS** (20+ recommended)
- npm
- Expo CLI (`npx expo`)
- Android Studio and/or Xcode (native toolchain for the **development build**)
- Running **backend** API (`http://localhost:5000/api` by default)

**Expo Go is not supported.** This app uses a custom native stack (`expo-dev-client`, Firebase messaging, maps, etc.). Install a **development build** once, then use Metro for day-to-day JS changes.

---

## Quick start

1. Configure env and install JS deps:

```bash
cd restaurant-app
cp .env.example .env
npm install
```

2. Start the backend (required for live data):

```bash
cd ../backend   # or my-backend, depending on your package layout
npm install
npm run migrate:up
npm start
```

Point `EXPO_PUBLIC_API_URL` in `.env` at your API (use your LAN IP instead of `localhost` on a physical device).

3. **Build & install the development client** (first time, or after native dependency changes):

```bash
cd restaurant-app
npm run android   # or: npm run ios
```

This runs `expo run:android` / `expo run:ios`. Do **not** use Expo Go.

4. For later sessions (native app already installed), only start Metro:

```bash
npm start
```

Then open the **Good Food Pro Restaurant** app already on the device/emulator.

---

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `EXPO_PUBLIC_DEMO_MODE` | Prefill demo login + local demo merges | `true` |
| `EXPO_PUBLIC_DEMO_EMAIL` | Demo email | `demo@restaurant.com` |
| `EXPO_PUBLIC_DEMO_PASSWORD` | Demo password | `password123` |

Runtime config lives in `config.js`.

### Demo credentials

- **Email:** `demo@restaurant.com`
- **Password:** `password123`

Set `EXPO_PUBLIC_DEMO_MODE=false` for production builds.

### App identity

Edit `app.json` before store submission:

- `expo.name`
- `expo.android.package`
- `expo.ios.bundleIdentifier`
- icons / splash under `assets/`

---

## Project structure

```
restaurant-app/
├── App.js              # Entry
├── api.js              # REST client
├── api/                # Demo handlers + docs
├── app.json            # Expo config
├── .env.example        # Env template
├── assets/             # Images
├── components/         # UI components
├── config.js           # API / demo config
├── contexts/           # React contexts
├── hooks/              # Auth, menu, orders…
├── lang/               # i18n (EN / FR)
├── navigation/         # Navigators
├── screens/            # Screens
├── services/           # Push notifications
├── styles/             # Shared styles
├── utils/              # Helpers / cache
├── __tests__/          # Jest tests
├── android/            # Native Android project
└── ios/                # Native iOS project
```

---

## Scripts

```bash
npm start           # Metro only (requires an installed development build)
npm run android     # Build, install, and run the Android development client
npm run ios         # Build, install, and run the iOS development client
npm run web         # Web (limited)
npm run lint        # ESLint
npm run lint-fix   # ESLint auto-fix
npm test            # Jest
npm run smoke       # Local: Node 20+, npm ci, Expo config, JS export
```

Optional EAS builds: configure your own Expo account, then use `eas.json`.

---

## Tech stack

- Expo ~54 / React Native 0.81 / React 19
- React Navigation 7
- expo-dev-client
- expo-location / expo-image-picker / expo-notifications
- Firebase Cloud Messaging
- react-native-maps
- socket.io-client
- i18n-js (EN / FR)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Expo Go / QR only | Install the development build: `npm run android` or `npm run ios` |
| Network request failed | Start backend; check `EXPO_PUBLIC_API_URL` |
| Demo user missing | Run backend migrations / demo seed |
| Stale bundle | `npx expo start --clear` |

---

## Version

**v1.0.0** — Good Food Pro Restaurant App
