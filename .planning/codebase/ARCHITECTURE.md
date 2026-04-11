# Architecture

**Analysis Date:** 2025-04-11

## Pattern Overview

**Overall:** Layered Next.js 15 + App Router architecture with clear separation between server-side rendering, API routes, and client-side state management.

**Key Characteristics:**
- Server-first architecture with optional client-side hydration
- Database-driven state (Drizzle ORM + Vercel Postgres)
- API-first design for separation of concerns
- Optimistic UI updates with eventual consistency
- Role-based access control (RBAC) throughout

## Layers

| Layer | Purpose | Key Files |
|-------|---------|-----------|
| **Routing** | Next.js App Router pages and API routes | `app/page.tsx`, `app/layout.tsx`, `app/api/**/*` |
| **Authentication** | NextAuth v5 with Google OAuth | `src/lib/auth.ts`, `app/api/auth/[...nextauth]` |
| **API Handlers** | Request validation, auth checks, RBAC | `app/api/tickets/route.ts`, `app/api/workspaces/route.ts` |
| **Services** | Business logic and domain operations | `src/server/services/ticketService.ts` |
| **Database** | Drizzle ORM queries and schema | `src/db/index.ts`, `src/db/schema.ts`, `src/db/queries/**/*` |
| **Components** | Server/client React components | `src/components/**/*` |
| **Client Hooks** | State management with SWR/fetch | `src/hooks/useTickets.ts` |
| **Shared Types** | Centralized type definitions | `src/shared/types/index.ts` |
| **Utilities** | Helpers for validation, formatting | `src/lib/validations.ts`, `src/lib/utils.ts` |

## Entry Points

| Entry | File | Purpose |
|-------|------|---------|
| **Home** | `app/page.tsx` | Public landing; redirects authenticated users to workspace |
| **Login** | `app/login/page.tsx` | Google OAuth sign-in page |
| **Onboarding** | `app/onboarding/page.tsx` | First-time user wizard (workspace selection/creation) |
| **Workspace** | `app/workspace/[workspaceId]/page.tsx` | Main workspace dashboard |
| **Board** | `app/workspace/[workspaceId]/board/page.tsx` | Kanban board view |
| **Settings** | `app/settings/page.tsx` | User account settings |
| **API Root** | `app/api/**/*` | RESTful API endpoints |

## Data Flow

**Authentication Flow:**
1. User visits `/` → redirected to `/login`
2. Click "Google Login" → NextAuth sign-in flow
3. `auth.ts` callback creates/upserts user in DB
4. Personal workspace auto-created if missing
5. Session callback builds fresh `SessionUserData` from DB
6. Redirect to `/` or workspace dashboard

**Ticket CRUD Flow:**
1. Client component calls `useTickets()` hook
2. Hook fetches `/api/tickets` via `fetch()`
3. API handler validates auth with `auth()`
4. Performs RBAC check via `requireRole()`
5. Queries `src/db/queries/tickets.ts` for board data
6. Returns paginated/filtered response
7. Client updates state with optimistic UI patterns

**Real-time Updates:**
- No WebSocket; clients rely on polling or manual refresh (`router.refresh()`)
- Optimistic UI: local state updated immediately, API call follows
- On error: state rolled back to last known server state

## Key Abstractions

| Abstraction | File(s) | Purpose |
|-------------|---------|---------|
| **Session** | `src/lib/auth.ts` | NextAuth configuration; builds fresh session on each request |
| **useTickets** | `src/hooks/useTickets.ts` | Global board state hook; CRUD + filtering logic |
| **useBoardFilter** | `src/hooks/useBoardFilter.ts` | Local board filter state (active labels, search) |
| **RBAC** | `src/lib/permissions.ts` | Role checking; returns error or allows operation |
| **Zod Schema** | `src/lib/validations.ts` | Request validation schemas for all API inputs |
| **BoardData** | `src/shared/types/index.ts` | Shared interface for board response (columns × tickets) |
| **ticketService** | `src/server/services/ticketService.ts` | Domain logic: ticket creation, position calc, status transitions |

## Component Map

**Server Components** (async, data-fetching):
- `app/layout.tsx` — Root layout; SessionProvider wrapper
- `app/page.tsx` — Home; workspace routing logic
- `app/workspace/[workspaceId]/page.tsx` — Workspace shell; fetches workspace metadata

**Client Components** (interactive):
- `src/components/layout/AppShell` — Main board container; drag-drop orchestration
- `src/components/board/BoardContainer` — Renders columns
- `src/components/board/Column` — Single kanban column with drop zone
- `src/components/board/TicketCard` — Ticket display with inline edit
- `src/components/ticket/TicketModal` — Full ticket detail view/edit
- `src/components/ui/*` — Reusable UI primitives (Button, Modal, Badge, etc.)

**Feature Domains:**
- `src/components/board/` — Kanban board UI
- `src/components/ticket/` — Ticket CRUD forms
- `src/components/team/` — Team/member management
- `src/components/notifications/` — In-app notification center
- `src/components/settings/` — Account & workspace settings

## State Management

**Global State:**
- `useTickets()` hook manages board state (columns + tickets)
- Fetched from `/api/tickets` on mount
- Local mutations: add, update, delete, reorder
- Optimistic updates with rollback on error

**Local UI State:**
- Component `useState()` for modals, forms, filters
- `useBoardFilter()` hook for active label/search filters
- No Redux/Zustand; fetch-based with React Query-like patterns

**Server State (Source of Truth):**
- Database (Vercel Postgres) is authoritative
- Session rebuilt fresh on each request via `buildSessionUser()`
- No client-side JWT caching of auth state

## Cross-Cutting Concerns

**Authentication:**
- NextAuth handles OAuth flow
- Session rebuilt from DB to avoid stale auth state
- RBAC applied in API handlers via `requireRole()`

**Validation:**
- All API inputs validated via Zod schema in `src/lib/validations.ts`
- Returns 400 with `VALIDATION_ERROR` code on failure

**Error Handling:**
- API handlers catch exceptions and return standardized `{ error: { code, message } }`
- Client catches fetch errors and sets local error state
- No unhandled promise rejections

**Logging:**
- Console.error for exceptions in handlers and callbacks
- Drizzle logger enabled in dev mode
- No structured logging service (Sentry, etc.)

**Authorization:**
- `src/lib/permissions.ts` handles role checking
- Roles: OWNER, MEMBER, VIEWER
- Workspace membership enforced per-request

## Notes

- **API-first design:** Business logic lives in handlers and services, not components
- **Dual-structure:** `src/db/queries/` and `src/server/services/` separate concerns
- **No real-time:** Polling or manual `router.refresh()` for updates; no WebSocket
- **Vercel-optimized:** Uses Vercel Postgres, Blob storage, Cron functions
- **Multi-tenant:** Each user has 1+ workspaces; workspace scoping enforced at API level
- **Soft deletes:** `tickets.deleted` flag instead of hard delete; trash view filters by flag

---

*Architecture analysis: 2025-04-11*
