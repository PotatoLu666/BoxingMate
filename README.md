# BoxingMate

A boxing training timer & log — cross-platform mobile app.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up the API environment
cp apps/api/.env.example apps/api/.env

# 3. Run database migration
cd apps/api && npx prisma migrate dev && cd ../..

# 4. Start both servers (in separate terminals)
pnpm dev:api        # API on http://localhost:3000
pnpm dev:mobile     # Expo dev server
```

> **Important**: Update the API URL in `apps/mobile/utils/api.ts` to match
> your machine's local IP if testing on a physical device.

## Architecture

| Layer    | Tech                                    | Location        |
| -------- | --------------------------------------- | --------------- |
| Mobile   | React Native · Expo 54 · Expo Router   | `apps/mobile/`  |
| API      | NestJS 11 · TypeScript                  | `apps/api/`     |
| Database | Prisma 7 · SQLite (dev) / Postgres (prod) | `apps/api/prisma/` |

## Auth Flow

1. **Register** — `POST /auth/register` → user created, 6-digit code generated
2. **Verify email** — code is printed to the API console (no real email yet)
3. **Login** — `POST /auth/login` → JWT access + refresh tokens returned
4. App stores tokens and auto-refreshes on expiry

## Features

- ⏱️ **Train** — configurable round timer (round time, rest time, total rounds)
- 📋 **Log** — local training history with detail view
- 👤 **Profile** — view/edit name, logout
- 🌐 **i18n** — English + Chinese Simplified (auto-detects device language)

## Project Commands

```bash
pnpm dev:api          # Start API in watch mode
pnpm dev:mobile       # Start Expo dev server
pnpm test:api         # Run API unit tests
pnpm test:api:e2e     # Run API e2e tests
pnpm build            # Build everything
pnpm lint             # Lint all packages
```

## Environment Variables

See `apps/api/.env.example`:

| Variable           | Description                          | Default           |
| ------------------ | ------------------------------------ | ----------------- |
| `DATABASE_URL`     | SQLite file path or Postgres URL     | `file:./dev.db`   |
| `JWT_SECRET`       | Secret for signing JWT tokens        | (must change)     |
| `JWT_ACCESS_EXPIRY`| Access token lifetime                | `15m`             |
| `JWT_REFRESH_EXPIRY`| Refresh token lifetime              | `7d`              |
| `PORT`             | API server port                      | `3000`            |
