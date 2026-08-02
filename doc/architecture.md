# Architecture — Good Food Pro Restaurant

## Stack

- Expo ~54 / React Native 0.81 / React 19
- React Navigation (drawer + nested stacks)
- Contexts: `RestaurantContext`, `SettingContext`, `OrderIncomingToastContext`
- expo-dev-client, expo-image-picker, expo-notifications
- Firebase Cloud Messaging (`@react-native-firebase/*`)
- socket.io-client
- i18n-js (EN / FR)

## Entry & navigation

- `App.js` → providers → `navigation/AppNavigator.js`
- Auth: Splash / Login / Signup / RestaurantOnboarding
- Authenticated shell: `DrawerNavigator`
  - Dashboard, Analytics, Notifications, Support
  - Orders → OrderDetails / OrderHistory
  - Menu → AddEditMenuItem / MenuCategories / MenuAnalytics
  - Reviews, Reports → ReportDetails
  - Profile, Settings → OpeningHours / Delivery / Payment / Language / Notification settings

## Data

- REST via root `api.js` against Good Food Pro backend
- Demo merges in `api/demo/` when `EXPO_PUBLIC_DEMO_MODE=true`
- Local cache helpers under `utils/`

## Scripts

```bash
npm run android   # first-time / native: install development build
npm run ios
npm start         # Metro only (dev client must already be installed)
npm test
npm run lint
npm run smoke     # local: Node 20+, npm ci, Expo config, JS export (no live domain)
```

**Not Expo Go** — requires `expo-dev-client` (see root README).

Optional EAS: `eas.json` (bring your own Expo account). Replace placeholder `android/app/google-services.json` with your Firebase Android config for push.
