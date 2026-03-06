# BoxingMate Mobile

React Native (Expo) frontend for BoxingMate.

## Setup

```bash
# From the repo root:
pnpm install
pnpm dev:mobile
```

> **Physical device**: Update `API_BASE` in `utils/api.ts` to your machine's
> local IP (e.g. `http://192.168.1.x:3000`). The API must be running.

## Screens

### Unauthenticated — `app/(auth)/`

| Screen           | File               | Description                          |
| ---------------- | ------------------ | ------------------------------------ |
| Login            | `login.tsx`        | Email + password sign-in             |
| Register         | `register.tsx`     | Create account (name, email, password) |
| Verify Email     | `verify-email.tsx` | Enter 6-digit code, resend with cooldown |

### Authenticated — `app/(tabs)/`

| Tab      | File           | Description                                |
| -------- | -------------- | ------------------------------------------ |
| Train    | `index.tsx`    | Round timer with configurable settings     |
| Profile  | `profile.tsx`  | View/edit name, logout                     |
| Log      | `log.tsx`      | Training history list with detail modal    |
| Dev      | `dev.tsx`      | API connectivity test tool                 |

## Key Modules

| Module               | Path                        | Purpose                              |
| -------------------- | --------------------------- | ------------------------------------ |
| Auth context         | `contexts/AuthContext.tsx`   | Auth state, login/logout/register    |
| API client           | `utils/api.ts`              | Fetch wrapper with auto token refresh |
| Session storage      | `utils/storage.ts`          | Training data in AsyncStorage (local) |
| i18n config          | `i18n/index.ts`             | Auto-detect device language           |
| English strings      | `i18n/locales/en.json`      | All UI text                          |
| Chinese strings      | `i18n/locales/zh-CN.json`   | 中文翻译                              |

## Auth Flow

1. Root `_layout.tsx` wraps everything in `<AuthProvider>`
2. Auth guard checks `isAuthenticated`:
   - **Not logged in** → redirects to `(auth)/login`
   - **Logged in** → redirects to `(tabs)`
3. Tokens stored in AsyncStorage; auto-refreshed on 401

## Adding a New Screen

1. Create the file in `app/(tabs)/newscreen.tsx`
2. Add a `<Tabs.Screen>` entry in `app/(tabs)/_layout.tsx`
3. Add translation keys to both `i18n/locales/en.json` and `zh-CN.json`

## Adding Translations

Both locale files must stay in sync. Every user-facing string should use `t()`:

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<Text>{t('section.key')}</Text>
```
