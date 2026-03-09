# AI Global Instructions — BoxingMate Monorepo

This file is the **single source of truth** for every AI coding agent
(GitHub Copilot, Claude Code, OpenCode, Cursor, etc.).
If another instruction file conflicts with this one, **this file wins**.

---

## Project Overview

BoxingMate is a cross-platform mobile **MVP** that prioritises
**fast iteration and shipping** above all else.

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | React Native 0.81 · Expo 54 · Expo Router · TypeScript  |
| Backend    | NestJS 11 · Node 22 (Volta) · TypeScript                |
| Database   | Prisma 7 ORM · SQLite (dev) / Azure Postgres (prod)     |
| Validation | Zod 4                                                    |
| Auth       | JWT (access + refresh) · Passport · bcrypt               |
| i18n       | i18next · react-i18next · expo-localization (EN + zh-CN) |
| Cloud      | Microsoft Azure (Blob Storage, Postgres, deploy)         |
| Testing    | Jest 30 · Supertest (API only)                           |
| Linting    | ESLint 9 · Prettier · typescript-eslint                  |

---

## Development Model

I will provide features **one by one**.

- **Do NOT invent features.** Implement only what is explicitly requested.
- Do not add analytics, ads, payments, push notifications, or any new
  product features unless explicitly asked.
- **Do NOT run `git commit` or `git push`.** The developer handles all
  git operations manually. You may stage files with `git add` if asked.

---

## Core Principles (MVP)

| Optimise for              | Avoid                            |
| ------------------------- | -------------------------------- |
| Working software          | Over-engineered architecture     |
| Fast iteration            | Unnecessary refactors            |
| Small, focused diffs      | Premature abstraction            |
| Straightforward code      | Heavy dependency additions       |

Technical debt is acceptable unless it blocks shipping.

---

## Monorepo Structure

```
BoxingMate/                     ← always run commands from here
├── apps/
│   ├── api/                    ← NestJS API
│   │   ├── src/
│   │   │   ├── auth/           ← register, login, verify-email, refresh (JWT + bcrypt)
│   │   │   ├── profile/        ← GET/PATCH /profile (protected)
│   │   │   ├── prisma/         ← PrismaService (global module)
│   │   │   ├── app.module.ts   ← root module (ConfigModule, PrismaModule, AuthModule, ProfileModule)
│   │   │   └── main.ts         ← bootstrap with CORS
│   │   ├── prisma/
│   │   │   └── schema.prisma   ← User, VerificationCode models
│   │   ├── prisma.config.ts    ← Prisma 7 config (datasource URL here, NOT in schema)
│   │   ├── test/unit/          ← *.spec.ts
│   │   ├── test/e2e/           ← *.e2e-spec.ts
│   │   └── .env.example
│   └── mobile/                 ← Expo app
│       ├── app/
│       │   ├── (auth)/         ← login, register, verify-email (unauthenticated)
│       │   ├── (tabs)/         ← train, profile, log, dev (authenticated)
│       │   └── _layout.tsx     ← AuthProvider + auth guard redirect
│       ├── contexts/
│       │   └── AuthContext.tsx  ← auth state, login/logout/register methods
│       ├── i18n/
│       │   ├── index.ts        ← i18next config (auto-detect device locale)
│       │   └── locales/        ← en.json, zh-CN.json
│       ├── utils/
│       │   ├── api.ts          ← API client with auto token refresh
│       │   └── storage.ts      ← training session local storage
│       ├── types/
│       │   └── session.ts      ← TrainingSession, SessionSummary
│       └── components/
├── docs/ai/GLOBAL.md           ← this file
├── package.json                ← root scripts & shared deps
├── pnpm-workspace.yaml         ← workspace config (apps/*)
└── pnpm-lock.yaml
```

---

## Package Manager & Runtime

- **pnpm 9** — the only allowed package manager.
- **Node 22.12.0** — pinned via Volta in the root `package.json`.

---

## 🚨 CRITICAL: Workflow Rules

**Always run every command from the repository root.**

### ✅ Allowed commands

```bash
# Dependencies
pnpm install

# Dev servers (run BOTH for full-stack dev)
pnpm dev:api              # NestJS watch mode
pnpm dev:mobile           # Expo dev server
pnpm start:api            # alias for dev:api
pnpm start:mobile         # alias for dev:mobile

# Testing (API only — mobile has no tests yet)
pnpm test:api             # unit tests
pnpm test:api:e2e         # end-to-end tests

# Building
pnpm build                # build API + mobile
pnpm build:api            # TypeScript compile (API)
pnpm build:mobile         # Expo web export
pnpm lint                 # lint all packages
```

### 🚫 Forbidden

```bash
# NEVER do this:
cd apps/mobile && pnpm start        # 
cd apps/api && npm run start:dev    # 
# NEVER install deps inside a subfolder
```

---

## Database & Prisma 7

- **Dev**: SQLite (`file:./dev.db`), no external database needed.
- **Prod**: Azure PostgreSQL (change `DATABASE_URL` + schema provider).
- **Prisma 7 breaking change**: datasource URL lives in `prisma.config.ts`,
  **NOT** in `schema.prisma`. The schema only declares `provider`.
- **PrismaClient** requires an **adapter** in the constructor
  (e.g. `PrismaLibSql` for SQLite, `PrismaPg` for Postgres).
  See `apps/api/src/prisma/prisma.service.ts`.
- Run migrations: `cd apps/api && npx prisma migrate dev --name <name>`
- Inspect data: `cd apps/api && npx prisma studio`

---

## Authentication Architecture

### Backend (`apps/api/src/auth/`)

| Endpoint               | Method | Auth | Description                        |
| ---------------------- | ------ | ---- | ---------------------------------- |
| `/auth/register`       | POST   | No   | Create user, send verification code |
| `/auth/verify-email`   | POST   | No   | Verify 6-digit code                |
| `/auth/login`          | POST   | No   | Returns access + refresh JWT       |
| `/auth/refresh`        | POST   | No   | Exchange refresh token for new pair |
| `/auth/resend-code`    | POST   | No   | Resend verification code            |
| `/profile`             | GET    | JWT  | Get user profile                   |
| `/profile`             | PATCH  | JWT  | Update user name                   |

- Passwords hashed with **bcrypt** (10 rounds).
- JWT tokens signed with `JWT_SECRET` from `.env`.
- Access token: 15min. Refresh token: 7 days.
- Email verification: **mocked** — codes print to API console (`console.log`).
  Swap to real SMTP when ready.
- Protected routes use `@UseGuards(JwtAuthGuard)`.

### Frontend (`apps/mobile/`)

- **AuthContext** (`contexts/AuthContext.tsx`): provides `user`, `isAuthenticated`,
  `login`, `logout`, `register`, `verifyEmail`, `resendCode`, `refreshProfile`.
- **Auth guard** in root `_layout.tsx`: redirects to `(auth)/login` if not
  authenticated, to `(tabs)` if authenticated.
- **Token storage**: JWT stored in AsyncStorage via `utils/api.ts`.
- **Auto-refresh**: `api.ts` automatically attempts token refresh on 401.
- **API base URL**: hardcoded in `utils/api.ts` — change when deploying.

---

## i18n (Internationalisation)

- **Languages**: English (`en`), Chinese Simplified (`zh-CN`).
- **Auto-detection**: device locale via `expo-localization`, falls back to `en`.
- **Translation files**: `apps/mobile/i18n/locales/{en,zh-CN}.json`.
- **Usage**: `const { t } = useTranslation()` then `t('section.key')`.
- **When adding new screens**: add keys to BOTH locale files.
- Date/time formatting uses `i18n.language` to pick locale for `toLocaleString`.

---

## Backend Conventions (`apps/api`)

- **NestJS 11** — keep modules simple; avoid excessive layering.
- **Prisma** for all database access and migrations.
- **Zod** for runtime validation of DTOs / inputs.
- Environment variables for secrets (never commit `.env`).
- File uploads: prefer **client-side direct upload to Azure Blob
  via SAS tokens** generated by the API.
- Tests live in `test/unit/**/*.spec.ts` and `test/e2e/**/*.e2e-spec.ts`.

---

## Frontend Conventions (`apps/mobile`)

- **Expo 54 + React Native 0.81 + TypeScript**.
- **Expo Router** for navigation (file-based, typed routes enabled).
- `(auth)/` route group = unauthenticated screens.
- `(tabs)/` route group = authenticated screens (Train, Profile, Log, Dev).
- State management: React hooks first, **Zustand** when component-local
  state is insufficient. Avoid Redux unless explicitly requested.
- Training data stored **locally** in AsyncStorage (not synced to server).
- Keep dependencies minimal and mainstream.

---

## Type Management

- Define types **close to where they are used**.
- When sharing types between `api` and `mobile`, prefer simple
  duplication over a shared package.
- Avoid premature type abstractions.

---

## Output Requirements

When generating or modifying code, always include:

1. **Files changed** — list of new and modified files.
2. **Full file contents** — not partial snippets (unless explicitly asked).
3. **Run commands** — exact commands to execute.
4. **Verification steps** — how to manually confirm the change works.

---

## Handling Ambiguity

- Make the **smallest reasonable assumption** to keep moving.
- Only ask a question if it truly **blocks progress**.
- Otherwise proceed with sensible defaults.