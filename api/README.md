# API layer – restaurant-app

HTTP client in root `api.js` (+ `api/demo/` for demo-mode merges). Base URL: `config.API_BASE_URL` from `EXPO_PUBLIC_API_URL`.

Compact list: [docs/endpoints.md](docs/endpoints.md).

## Architecture

| File | Role |
|------|------|
| **api.js** | Singleton client: token/restaurant/user, `apiCall()`, auth, orders, menu, settings, reviews, notifications, uploads |
| **config.js** | `API_BASE_URL`, demo credentials, timeouts |
| **api/demo/** | Demo-mode write/read handlers when `EXPO_PUBLIC_DEMO_MODE` is on |

## Auth

| Method | HTTP | Endpoint |
|--------|------|----------|
| `restaurantLogin(email, password)` | POST | `/auth/restaurant-login` |
| `restaurantSignup(…)` | POST | `/auth/signup` only |
| `createRestaurantDoc(…)` | POST | `/resource/restaurants` (onboarding) |
| `linkUserToRestaurant(…)` | PUT | `/resource/users/${userId}` |
| Logout | – | Clears token + local cache (client-side) |

## Restaurant profile

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getRestaurantProfile()` | GET | `/resource/restaurants/${id}` |
| `updateRestaurantProfile(…)` | PUT | `/resource/restaurants/${id}` |

## Orders

| Method | HTTP | Endpoint |
|--------|------|----------|
| List | GET | `/resource/orders` (optional `?status=`) |
| By id | GET | `/resource/orders/${id}` |
| Accept / prepare / ready / status | PUT | `/resource/orders/${orderId}` |

## Menu (products)

| Method | HTTP | Endpoint |
|--------|------|----------|
| List | GET | `/resource/products?type=${restaurantId}` |
| Create / update / delete | POST/PUT/DELETE | `/resource/products[/${id}]` |

## Settings & catalog refs

| Method | HTTP | Endpoint |
|--------|------|----------|
| Delivery settings | GET/POST/PUT | `/resource/deliverysettings…` |
| Payment settings | GET/POST/PUT | `/resource/restaurantpaymentsettings…` |
| App settings | GET | `/resource/settings` |
| Update settings doc | PUT | `/resource/settings/${id}` |
| Currencies / taxes / categories / variants | GET | `/resource/…` |
| Reviews | GET/PUT | `/resource/reviews…` |
| Notifications | GET/PUT/DELETE | `/resource/notifications…` |
| User settings | GET/PUT | `/user-settings`, `/user-settings/notifications`, `/user-settings/restaurant` |
| Device token | PUT | `/resource/users/${userId}` |
| Cloudinary signature | GET | `/upload/cloudinary-signature` |

## Demo mode

When `EXPO_PUBLIC_DEMO_MODE=true`, selected writes/reads go through `api/demo/`. Builtin demo login (`demo@restaurant.com`) still hits the live API for auth.
