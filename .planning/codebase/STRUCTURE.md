# Codebase Structure

**Analysis Date:** 2025-04-11

## Top-Level Layout

```
tika/
├── app/                    # Next.js App Router (pages, layouts, API routes)
├── src/                    # Application source code
├── public/                 # Static assets
├── docs/                   # Project documentation
├── specs/                  # Feature specifications and contracts
├── migrations/             # Drizzle ORM migrations
├── __tests__/              # Jest unit/integration tests
├── tests/                  # Playwright E2E tests
├── .claude/                # Claude-specific rules and memory
├── .planning/              # GSD phase planning documents
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── next.config.ts          # Next.js configuration
├── drizzle.config.ts       # Drizzle ORM configuration
└── jest.config.js          # Jest test runner config
```

## Directory Purposes

**app/**
- Next.js 15 App Router directory
- Contains pages, layouts, and API routes
- Subdivided by feature (workspace, tickets, settings, etc.)
- `app/api/**` contains all REST endpoints

**src/**
- Core application code (business logic, components, utilities)
- Organized by concern: `components/`, `server/`, `db/`, `lib/`, `hooks/`
- Shared code in `shared/` and `types/`

**public/**
- Static assets (images, icons, demo data)
- `public/demo/` contains static HTML for demo pages

**docs/**
- Markdown documentation (stack, data model, API spec, phase guides)
- `docs/phase/` contains implementation phase definitions

**specs/**
- User-facing specification documents for features
- Organized by feature ID (e.g., `001-kanban-board/`)
- Includes checklists, contracts, test scenarios

**migrations/**
- Drizzle Kit migration SQL files
- Auto-generated; never edited manually
- Run via `npm run db:migrate`

**__tests__/**
- Jest unit and integration tests
- Mirrors `src/` structure: `__tests__/hooks/`, `__tests__/components/`, etc.
- Test files match source files: `X.test.ts` or `X.spec.ts`

**tests/e2e/**
- Playwright end-to-end tests
- `tests/e2e/pages/` contains page object models
- `tests/e2e/fixtures/` contains test data

**.claude/**
- Claude Code AI rules and memory
- `rules/` for domain-specific rules (API, components, safety)
- `memory/` for persistent context across conversations

**.planning/codebase/**
- GSD codebase mapping documents (ARCHITECTURE.md, STRUCTURE.md, etc.)

## Key Directory Details

### src/db/

**Contents:**
- `index.ts` — Drizzle ORM instance (lazy-initialized connection pool)
- `schema.ts` — Drizzle table definitions (users, workspaces, tickets, etc.)
- `queries/` — Pre-written SQL queries organized by domain (tickets.ts, workspaces.ts, etc.)

**Important:**
- `schema.ts` changes require migration via `npm run db:generate` then `db:migrate`
- Queries should live in `queries/` not in API handlers

### src/server/

**Contents:**
- `db/` — Database connection and schema (symlinked from `src/db/`)
- `services/` — Business logic services (ticketService.ts, notificationService.ts, etc.)
- `middleware/` — Auth guards and request middleware

**Pattern:**
- Services encapsulate domain logic
- API handlers delegate to services
- Services return domain models, not DTOs

### src/lib/

**Contents:**
- `auth.ts` — NextAuth configuration and session building
- `validations.ts` — Zod schemas for all API inputs
- `permissions.ts` — RBAC role checking
- `constants.ts` — App-wide constants (limits, defaults)
- `utils.ts` — Utility functions (formatting, filtering, etc.)
- `date.ts` — Date/timezone helpers

**Key Files:**
- `validations.ts` — Single source of truth for API input validation
- `auth.ts` — Session is rebuilt fresh on each request; never cache JWT state

### src/shared/

**Contents:**
- `types/index.ts` — Centralized TypeScript interfaces (Ticket, Board, User, etc.)
- `errors/` — Custom error classes (TicketNotFoundError, UnauthorizedError, etc.)
- `validations/` — Zod schemas for shared validation
- `design/` — Design tokens (colors, spacing, breakpoints)

**Important:**
- All types defined here; never duplicate in components
- Errors extend from shared error base

### src/components/

**Subdirectories:**
- `board/` — Kanban board UI (Column, TicketCard, BoardContainer, etc.)
- `ticket/` — Ticket CRUD forms and detail views
- `team/` — Team/member management (MemberCard, TeamList, etc.)
- `settings/` — Account and workspace settings
- `notifications/` — Notification center and preference UI
- `layout/` — Page layouts (AppShell, Header, Sidebar, Footer)
- `ui/` — Reusable UI primitives (Button, Modal, Badge, etc.)

**Conventions:**
- One component per file (PascalCase filename)
- Props interface named `{ComponentName}Props`
- Server components by default; `'use client'` for interactive
- Tailwind CSS only; no CSS-in-JS or separate CSS files

### src/hooks/

**Files:**
- `useTickets.ts` — Board state hook (fetch, CRUD, filtering)
- `useBoardFilter.ts` — Filter state (active labels, search)
- `useOutsideClick.ts` — Modal/dropdown click-outside detection
- `useResizable.ts` — Resizable panel helper

**Pattern:**
- Hooks manage state and effects
- Separated from components for reusability
- Return actions + state

### app/

**Structure:**
```
app/
├── layout.tsx              # Root layout; SessionProvider wrapper
├── page.tsx                # Home; auth check + workspace routing
├── login/page.tsx          # Google OAuth sign-in page
├── onboarding/             # Workspace selection/creation wizard
├── settings/               # User settings
├── workspace/
│   └── [workspaceId]/
│       ├── page.tsx        # Workspace dashboard
│       ├── board/page.tsx  # Kanban board
│       ├── members/page.tsx
│       ├── analytics/
│       └── trash/page.tsx
├── notifications/page.tsx
└── api/
    ├── tickets/            # /api/tickets (list/create), /api/tickets/[id] (detail)
    ├── workspaces/         # /api/workspaces (list/create), /api/workspaces/[id]
    ├── members/            # /api/members
    ├── labels/             # /api/labels (per workspace)
    ├── notifications/      # /api/notifications/in-app, /api/notifications/...
    ├── auth/               # /api/auth/[...nextauth]
    └── cron/               # /api/cron/notify-due, etc. (Vercel cron)
```

**Key Routes:**
- `/` — Home (redirects to workspace or onboarding)
- `/login` — Google OAuth
- `/workspace/[id]` — Workspace dashboard
- `/workspace/[id]/board` — Kanban board
- `/settings` — Account settings
- `/api/tickets` — GET (board), POST (create)
- `/api/workspaces` — GET (list), POST (create)

## Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout; SessionProvider, global CSS |
| `app/page.tsx` | Home page; auth check, workspace redirect logic |
| `src/db/index.ts` | Drizzle ORM instance; lazy-initialized connection pool |
| `src/db/schema.ts` | Table definitions (users, workspaces, tickets, members, etc.) |
| `src/lib/auth.ts` | NextAuth config; session building, OAuth callbacks |
| `src/lib/validations.ts` | Zod schemas for all API request bodies |
| `src/shared/types/index.ts` | Centralized TypeScript interfaces |
| `src/hooks/useTickets.ts` | Global board state management hook |
| `src/components/layout/AppShell.tsx` | Main app container; DnD orchestration |
| `src/components/board/BoardContainer.tsx` | Kanban board renderer |
| `app/api/tickets/route.ts` | GET (board), POST (create) ticket endpoints |
| `tsconfig.json` | Path aliases: `@/*` → `src/*` |
| `jest.config.js` | Jest test runner with TypeScript support |

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `TicketCard.tsx`)
- Utilities/hooks: `camelCase.ts` (e.g., `useTickets.ts`)
- API routes: `route.ts` in directory matching path (e.g., `app/api/tickets/route.ts`)
- Tests: `*.test.ts` or `*.spec.ts` in `__tests__/` mirroring source structure

**Directories:**
- Feature domains: `kebab-case` (e.g., `src/components/board/`, `app/workspace/`)
- Dynamic routes: `[param]` (e.g., `[workspaceId]`, `[id]`)

**Functions:**
- React component names: `PascalCase` (e.g., `function TicketCard() { }`)
- Utility/service functions: `camelCase` (e.g., `export const createTicket = () => {}`)
- Custom hook functions: `useCamelCase` (e.g., `export function useTickets() { }`)

**Types/Interfaces:**
- Type names: `PascalCase` (e.g., `Ticket`, `BoardData`, `TicketStatus`)
- Props interfaces: `{ComponentName}Props` (e.g., `TicketCardProps`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `TICKET_STATUS`, `TICKET_PRIORITY`)

## Where to Add New Code

**New Feature:**
- Pages/routes: `app/workspace/[workspaceId]/{featureName}/page.tsx`
- API endpoints: `app/api/{resourceName}/route.ts` and `app/api/{resourceName}/[id]/route.ts`
- Components: `src/components/{featureName}/Component.tsx`
- Tests: `__tests__/{featureName}/Component.test.tsx`

**New Component/UI:**
- Reusable primitive: `src/components/ui/NewComponent.tsx`
- Domain-specific: `src/components/{domain}/NewComponent.tsx`
- Tests: `__tests__/components/{domain}/NewComponent.test.tsx`

**New Utility/Helper:**
- Shared utility: `src/lib/newUtil.ts`
- Domain-specific service: `src/server/services/newService.ts`
- Custom hook: `src/hooks/useNewHook.ts`
- Tests: `__tests__/lib/newUtil.test.ts` or `__tests__/hooks/useNewHook.test.ts`

**New Type/Interface:**
- Shared: `src/shared/types/index.ts` (append to exports)
- Domain-specific: `src/types/{domain}.ts` (if isolated to one domain)

**Database Changes:**
- Schema: Edit `src/db/schema.ts`
- Query: Add function to `src/db/queries/{domain}.ts`
- Migration: Run `npm run db:generate` (auto-generates SQL)

## Special Directories

**node_modules/**
- Auto-generated; ignored in git
- Install with `npm install`

**migrations/**
- Auto-generated by Drizzle Kit on `npm run db:generate`
- Never edit manually; part of git history
- Run migrations with `npm run db:migrate`

**.next/**
- Next.js build output; ignored in git
- Generated on `npm run build`

**playwright-report/**, **test-results/**, **coverage/**
- Generated by test runners; ignored in git
- View with `npm run test:e2e:report` or `open coverage/lcov-report/index.html`

**.vscode/**, **.idea/**
- IDE configs; checked in for team consistency
- Contains extensions.json, launch.json, etc.

**.github/workflows/**
- GitHub Actions CI/CD workflows
- Run linting, tests, and build on PR

---

*Structure analysis: 2025-04-11*
