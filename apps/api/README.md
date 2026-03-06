# BoxingMate API

NestJS backend for BoxingMate.

## Setup

```bash
# From the repo root:
cp apps/api/.env.example apps/api/.env
cd apps/api && npx prisma migrate dev && cd ../..
pnpm dev:api
```

## API Endpoints

### Auth (public)

| Method | Path                | Body                                    | Response               |
| ------ | ------------------- | --------------------------------------- | ---------------------- |
| POST   | `/auth/register`    | `{ email, password, name? }`            | `{ id, email }`        |
| POST   | `/auth/verify-email`| `{ email, code }`                       | `{ verified: true }`   |
| POST   | `/auth/login`       | `{ email, password }`                   | `{ accessToken, refreshToken }` |
| POST   | `/auth/refresh`     | `{ refreshToken }`                      | `{ accessToken, refreshToken }` |
| POST   | `/auth/resend-code` | `{ email }`                             | `{ sent: true }`       |

### Profile (requires `Authorization: Bearer <token>`)

| Method | Path       | Body            | Response                          |
| ------ | ---------- | --------------- | --------------------------------- |
| GET    | `/profile` | —               | `{ id, email, name, createdAt }`  |
| PATCH  | `/profile` | `{ name? }`     | `{ id, email, name, createdAt }`  |

### Other

| Method | Path      | Response            |
| ------ | --------- | ------------------- |
| GET    | `/`       | `"Hello World!"`    |
| GET    | `/health` | `{ ok: true }`      |

## Database

- **Dev**: SQLite at `prisma/dev.db`
- **Prod**: Change `DATABASE_URL` to a Postgres connection string and update `schema.prisma` provider

### Migrations

```bash
cd apps/api
npx prisma migrate dev --name <name>   # create + apply
npx prisma studio                       # visual data browser
```

## Email Verification

Currently **mocked** — verification codes are printed to the console:

```
📧 Verification code for user@example.com: 123456
```

To enable real email, replace `console.log` in `src/auth/auth.service.ts` with your SMTP provider.
