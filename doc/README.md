# Documentation — Good Food Pro Restaurant App

Technical notes for developers. For install and first run, start with the root [`README.md`](../README.md).

## Contents

| File | Description |
|------|-------------|
| [architecture.md](./architecture.md) | Stack, folders, navigation, state |
| [../api/README.md](../api/README.md) | REST client + endpoints |
| [../api/docs/endpoints.md](../api/docs/endpoints.md) | Compact endpoint list |

## Quick facts

| Item | Value |
|------|--------|
| App version | 1.0.0 |
| Expo | ~54 |
| React Native | 0.81.5 |
| Demo login | `demo@restaurant.com` / `password123` |
| Login endpoint | `POST /auth/restaurant-login` |

```bash
cp .env.example .env
npm install
npm run android   # first time: install development build (not Expo Go)
npm start         # later: Metro only
```
