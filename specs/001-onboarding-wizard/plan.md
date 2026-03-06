# Implementation Plan: Onboarding Wizard & Workspace Flow

**Branch**: `001-onboarding-wizard` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-onboarding-wizard/spec.md`

## Summary

Implement an onboarding wizard that routes first-time Google OAuth users to either a personal kanban board (개인용) or a workspace collaboration flow (워크스페이스). Adds three DB schema changes (`users.user_type`, `workspaces.is_searchable`, new `workspace_join_requests` table), five new API endpoints, two new page routes, and five new React components. All existing invite link infrastructure is reused without modification.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: Next.js 15 App Router, Drizzle ORM 0.38, Zod 3.24, NextAuth.js v5, Tailwind CSS 4, lucide-react (existing)
**Storage**: Vercel Postgres (Neon) — PostgreSQL
**Testing**: Jest 29.7 + @testing-library/react 16
**Target Platform**: Web, Vercel deployment
**Project Type**: Full-stack web application (Next.js App Router)
**Performance Goals**: Search results < 2 seconds; onboarding completion < 2 minutes (per SC-001, SC-006)
**Constraints**: TypeScript strict, no new npm packages, no raw SQL, no CSS-in-JS, schema changes via Drizzle Kit only
**Scale/Scope**: MVP, single workspace membership assumed for initial routing (user may belong to multiple workspaces in Phase 5)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ PASS | spec.md complete, plan.md this file, tasks.md follows |
| II. Type Safety & Runtime Validation | ✅ PASS | All new API inputs validated via Zod; new types added to `src/types/index.ts`; `next-auth.d.ts` extended |
| III. Security-First | ✅ PASS | All 5 new endpoints verify session before any DB access; join request approval verifies OWNER role; no raw SQL |
| IV. Data Safety & Migration Discipline | ✅ PASS | Schema changes via `drizzle-kit generate` only; one-time data migration documented (users SET type='USER') |
| V. YAGNI | ✅ PASS | No new packages required; existing invite infrastructure reused; no speculative generalization |
| VI. Optimistic UI | ✅ PASS | JoinRequestList applies optimistic remove on approve/reject with rollback on failure |

**No violations. Complexity Tracking table not required.**

## Project Structure

### Documentation (this feature)

```text
specs/001-onboarding-wizard/
├── plan.md              ← This file
├── spec.md              ← Feature specification
├── research.md          ← Phase 0: decisions
├── data-model.md        ← Phase 1: schema additions
├── quickstart.md        ← Phase 1: test scenarios
├── contracts/
│   ├── api.md           ← Phase 1: API contracts
│   └── ui.md            ← Phase 1: UI contracts
└── tasks.md             ← Phase 2 output (next step: /speckit.tasks)
```

### Source Code (new files)

```text
app/
├── onboarding/
│   ├── page.tsx                             ← OnboardingWizard page (server, auth guard)
│   └── workspace/
│       └── page.tsx                         ← WorkspaceOnboarding page (server, auth guard)
├── api/
│   ├── users/type/route.ts                  ← PATCH /api/users/type
│   └── workspaces/
│       ├── search/route.ts                  ← GET /api/workspaces/search
│       └── [id]/join-requests/
│           ├── route.ts                     ← GET + POST /api/workspaces/[id]/join-requests
│           └── [reqId]/route.ts             ← PATCH /api/workspaces/[id]/join-requests/[reqId]

src/
├── components/
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx             ← Personal/Workspace selection cards
│   │   ├── WorkspaceOnboarding.tsx          ← Tab controller (개설 | 찾기)
│   │   ├── WorkspaceCreator.tsx             ← Workspace name form + creation
│   │   └── WorkspaceFinder.tsx             ← Search + invite link detection
│   └── workspace/
│       └── JoinRequestList.tsx             ← Owner join request management
├── db/
│   ├── schema.ts                           ← MODIFIED: 3 additions
│   └── queries/
│       └── joinRequests.ts                 ← New DB query functions
├── lib/
│   └── validations.ts                      ← MODIFIED: 3 new Zod schemas
└── types/
    ├── index.ts                            ← MODIFIED: UserType, JoinRequest types
    └── next-auth.d.ts                      ← MODIFIED or CREATED: userType in session
```

### Modified Files

```text
src/db/schema.ts                            ← Add users.userType, workspaces.isSearchable, workspaceJoinRequests table
src/lib/auth.ts                             ← Remove auto-workspace-creation from signIn; add userType to JWT/session
src/types/index.ts                          ← Add USER_TYPE, JOIN_REQUEST_STATUS, JoinRequest, WorkspaceSearchResult types
src/types/next-auth.d.ts                    ← Extend Session type with userType
app/page.tsx                               ← Smart redirect based on userType
app/team/[workspaceId]/members/page.tsx    ← Add JoinRequestList section for OWNER
migrations/                                ← Auto-generated by drizzle-kit generate
```

## Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | DB schema additions + drizzle-kit generate + migrate | schema.ts, migrations/ |
| 2 | Type additions (UserType, JoinRequest, Session) | types/index.ts, types/next-auth.d.ts |
| 3 | auth.ts: remove auto-workspace-creation; add userType to JWT/session | lib/auth.ts |
| 4 | app/page.tsx: smart redirect logic | app/page.tsx |
| 5 | PATCH /api/users/type endpoint (with workspace auto-creation for USER type) | api/users/type/route.ts, db/queries/joinRequests.ts |
| 6 | OnboardingWizard page + component | app/onboarding/page.tsx, components/onboarding/OnboardingWizard.tsx |
| 7 | GET /api/workspaces/search endpoint | api/workspaces/search/route.ts |
| 8 | WorkspaceOnboarding + WorkspaceCreator components | app/onboarding/workspace/page.tsx, WorkspaceOnboarding.tsx, WorkspaceCreator.tsx |
| 9 | WorkspaceFinder component (search + invite link detection) | components/onboarding/WorkspaceFinder.tsx |
| 10 | POST + GET /api/workspaces/[id]/join-requests | api/workspaces/[id]/join-requests/route.ts |
| 11 | PATCH /api/workspaces/[id]/join-requests/[reqId] (approve/reject transaction) | api/workspaces/[id]/join-requests/[reqId]/route.ts |
| 12 | JoinRequestList component + Members page integration | components/workspace/JoinRequestList.tsx, members/page.tsx |

## Key Design Decisions

See `research.md` for full rationale. Summary:

1. **userType in JWT** — avoids extra DB query per session callback
2. **Remove auto-workspace creation from signIn** — workspace creation is now explicit, triggered by type selection
3. **Preserve email validation in invite acceptance** — security feature, not relaxed for finder UX
4. **Smart input detection on submit** — client-side regex, no extra API calls until submit
5. **Drizzle transaction for approval** — atomic join request + member insert
6. **Default is_searchable=FALSE** — workspaces are private by default, opt-in to public search

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Existing users see wizard after deployment | One-time SQL: `UPDATE users SET user_type='USER' WHERE user_type IS NULL` before deploy |
| auth.ts change breaks dev bypass session | Test `/dev` route explicitly after auth.ts modification |
| WorkspaceFinder invite URL detection false positives | Regex anchored to known patterns; plain text fallback is safe (just triggers a search) |
| Approval transaction failure leaves inconsistent data | Drizzle transaction rolls back both operations atomically |
| Members page OWNER check performance | Session already contains memberId; role lookup uses existing members query |
