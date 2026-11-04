# Yoda Pro Admin

Responsive React/Vite admin dashboard for managing news, categories, comments, reports, registered users, deletion requests, notifications, and administrator profiles.

## Run locally

```sh
npm install
npm run dev
```

The demo data is stored in browser `localStorage` and does not synchronize with the mobile app or other administrators. Connect the context actions to your authenticated application API before using this panel with production data.

## Admin authentication

Without `VITE_ADMIN_API_URL`, login uses demo credentials `admin` / `admin1234` only when no administrator credential document exists yet. The PBKDF2 password verifier and profile are stored in the Firestore document `settings/admin`; the demo session marker remains in `localStorage`. Existing local credential records are migrated to Firestore on first initialization. This client-side demo authentication is not a substitute for server-side authentication and must not be used in production.

For production, configure `VITE_ADMIN_API_URL` to an authenticated backend implementing `POST /auth/login`, `GET /auth/session`, `POST /auth/logout`, and `PUT /auth/profile` (accepting profile fields and an optional new password). Use HTTPS, rate limiting, secure `HttpOnly`, `SameSite` session cookies, CSRF defenses, and server-side credential hashing. The browser does not persist bearer tokens in production mode. Rotate the default demo password before enabling any production authentication.

## Push notification dispatch

Set `VITE_PUSH_DISPATCH_URL` to an authenticated backend endpoint that accepts `POST` JSON with `id`, `title`, `message`, `image`, and `link`. A successful 2xx response marks the notification as sent; a missing endpoint or failed response is shown in the notification history. Keep push-provider credentials on the server, never in Vite environment variables or browser code.

Administrator profile records are stored in `settings/admin` in Firestore when using demo authentication. Passwords are hashed before they are stored there; account creation and password changes in production require a secure authentication API.

## Global settings and app management

The settings form is wired to `DataContext`. For local demo use, non-secret settings are stored in browser storage while API and provider keys remain in memory for the current page session only. For shared/mobile-app synchronization, set `VITE_ADMIN_API_URL` to an authenticated same-origin or appropriately CORS-configured admin API implementing:

- `GET /settings` — return the settings JSON object.
- `PUT /settings` — validate and save the settings, then publish configuration changes to the mobile-app sync service.
- `POST /settings/api-key` — rotate the API key and return `{ "apiKey": "..." }`.

The API must authenticate and authorize administrators, protect secrets at rest, and avoid logging credentials. A Vite environment variable is public client configuration, not a place to store secret API credentials.

Manage Apps uses local browser demo records. The displayed `DEMO_ONLY` keys are placeholders; app credentials must be provisioned and managed by the backend before production use.
