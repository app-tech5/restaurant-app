# Restaurant API endpoints (source of truth: `api.js`)

Base: `EXPO_PUBLIC_API_URL` (default `http://localhost:5000/api`).

## Auth

- `POST /auth/restaurant-login` — `{ email, password }` → `{ token, user, … }`
- `POST /auth/signup` — account registration (restaurant document created later in onboarding)

## Resources

- `GET/PUT /resource/restaurants…`
- `PUT /resource/users/:id`
- `GET/PUT /resource/orders…` (including `GET /resource/orders/:id`)
- `GET/POST/PUT/DELETE /resource/products…`
- `GET/POST/PUT /resource/deliverysettings…`
- `GET/POST/PUT /resource/restaurantpaymentsettings…`
- `GET /resource/settings` · `PUT /resource/settings/:id`
- `GET /resource/currencies`
- `GET /resource/taxes`
- `GET /resource/categories`
- `GET /resource/variants`
- `GET/PUT /resource/reviews…`
- `GET/PUT/DELETE /resource/notifications…`
- `GET/PUT /user-settings` · `/user-settings/notifications` · `/user-settings/restaurant`
- `GET /upload/cloudinary-signature`

Auth header: `Authorization: Bearer <token>` after login.
