# Architecture — Good Food Pro Restaurant

## Stack

- Expo ~54 / React Native 0.81 / React 19
- React Navigation (drawer + stacks)
- Context: `RestaurantContext`
- expo-location, expo-image-picker, expo-notifications
- socket.io-client
- i18n-js (EN / FR)

## Entry & navigation

- `App.js` → providers → navigators under `navigation/`
- Authenticated shell: `DrawerNavigator` (Dashboard, Orders, Menu, …)
- Auth screens: Login / Signup / RestaurantOnboarding

## Data

- REST via `api.js` against Good Food Pro backend
- Demo merges in `api/demo/` when `EXPO_PUBLIC_DEMO_MODE=true`
- Local cache helpers under `utils/`

## Scripts

```bash
npm run android   # first-time / native: install development build
npm run ios
npm start         # Metro only (dev client must already be installed)
npm test
npm run lint
npm run smoke
```

**Not Expo Go** — requires `expo-dev-client` (see root README).

Optional EAS: `eas.json` (bring your own Expo account).
