# API layer – restaurant-app

HTTP client in `api.js` (+ `api/demo/` for demo-mode merges). Base URL: `config.API_BASE_URL` from `EXPO_PUBLIC_API_URL`.

> Paths below match the current `api.js` sources. Compact list: [docs/endpoints.md](docs/endpoints.md).

## Architecture

| File | Role |
|------|------|
| **api.js** | Singleton client: token/restaurant/user, `apiCall()`, auth, orders, menu, settings |
| **config.js** | `API_BASE_URL`, demo credentials, timeouts |
| **api/demo/** | Demo-mode write/read handlers when `EXPO_PUBLIC_DEMO_MODE` is on |

## Auth

| Method | HTTP | Endpoint |
|--------|------|----------|
| `restaurantLogin(email, password)` | POST | `/auth/restaurant-login` |
| `restaurantSignup(…)` | POST | `/auth/signup` then creates `/resource/restaurants` |
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
| Accept / prepare / ready | PUT | `/resource/orders/${orderId}` |

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
| App settings / currencies / taxes / categories / variants | GET | `/resource/…` |
| Reviews / notifications | GET/PUT/DELETE | `/resource/reviews…`, `/resource/notifications…` |

## Demo mode

When `EXPO_PUBLIC_DEMO_MODE=true`, selected writes/reads go through `api/demo/` handlers so buyers can explore offline-ish flows against seeded demo data. Builtin demo login (`demo@restaurant.com`) still hits the live API for auth.
