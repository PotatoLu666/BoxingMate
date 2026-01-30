# Copilot Instructions — BoxingMate Monorepo

You are GitHub Copilot working in this monorepo.

## What this repo is
BoxingMate is a cross-platform mobile product built as an MVP, with:
- Frontend: React Native (Expo) + TypeScript
- Backend: NestJS (Node.js) + TypeScript
- Cloud: Microsoft Azure (Blob Storage, Azure Postgres, Azure deployment)

I will provide features one by one. **Do not invent or add features.**
Implement only what I explicitly request.

## Core principles (MVP)
- Optimize for: working software, fast iteration, small diffs.
- Prefer straightforward code over “clean architecture” / over-abstraction.
- Technical debt is acceptable unless it blocks shipping.
- Avoid refactors unrelated to the current request.

## Monorepo structure
- `apps/mobile`: React Native Expo app (TypeScript)
- `apps/api`: NestJS API (TypeScript)
- `infra/`: local dev infrastructure (docker-compose, scripts)

## 🚨 CRITICAL: pnpm Workflow Rules

**ALWAYS work from the ROOT directory** (`e:\test\BoxingMate\`). Never `cd` into subdirectories unless absolutely necessary.

### Required commands (use these ONLY):
```bash
# Install dependencies (from ROOT)
pnpm install

# Start development servers (from ROOT)
pnpm dev:mobile          # Start Expo mobile app
pnpm dev:api             # Start NestJS API server

# Alternative start commands
pnpm start:mobile        # Same as dev:mobile
pnpm start:api          # Same as dev:api

# Testing (from ROOT)
pnpm test:api           # Run API unit tests
pnpm test:api:e2e       # Run API e2e tests

# Building (from ROOT)  
pnpm build:mobile       # Export web app
pnpm build              # Build all packages
pnpm lint               # Lint all packages
```

### 🚫 DO NOT USE:
- `cd apps/mobile && pnpm start` ❌
- `cd apps/api && npm run start:dev` ❌
- Individual package installs in subdirectories ❌

## Type management
- Define types locally within each app as needed.
- For shared types between apps, consider copying types or using a simple approach.
- Keep type definitions close to where they're used.
- Do not duplicate complex business logic across apps.

## Backend conventions
- NestJS modules should stay simple; avoid excessive layering.
- Prefer Prisma for DB access and migrations unless told otherwise.
- Use environment variables for secrets and connection strings.
- For file uploads, prefer "client direct upload to Azure Blob using SAS" patterns when relevant.

## Frontend conventions
- Expo + TypeScript.
- Keep state simple (hooks / zustand). Avoid Redux unless asked.
- Keep dependencies minimal and mainstream.
- Do not add analytics, ads, payments, or push notifications unless requested.

## Output requirements for code generation
When generating or updating code, always include:
1) List of files changed (new/modified)
2) Full contents of each changed file (not partial snippets)
3) Exact run steps (commands)
4) Quick manual verification steps

## If something is unclear
- Make the smallest reasonable assumption to unblock progress.
- Ask a question only if truly blocking; otherwise proceed with defaults.

End.
