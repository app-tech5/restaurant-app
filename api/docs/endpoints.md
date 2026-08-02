# Restaurant API endpoints (source of truth: `api.js`)

Base: `EXPO_PUBLIC_API_URL` (default `http://localhost:5000/api`).

## Auth

- `POST /auth/restaurant-login` — `{ email, password }` → `{ token, user, … }`
- `POST /auth/signup` — restaurant account registration

## Resources

- `GET/PUT /resource/restaurants…`
- `GET/PUT /resource/orders…`
- `GET/POST/PUT/DELETE /resource/products…`
- `GET/POST/PUT /resource/deliverysettings…`
- `GET/POST/PUT /resource/restaurantpaymentsettings…`
- `GET /resource/settings`
- `GET /resource/currencies`
- `GET /resource/taxes`
- `GET /resource/categories`
- `GET /resource/variants`
- `GET/PUT /resource/reviews…`
- `GET/PUT/DELETE /resource/notifications…`
- `GET/PUT /user-settings…`
- `POST /upload/cloudinary-signature` — image upload helper

Auth header: `Authorization: Bearer <token>` after login.
