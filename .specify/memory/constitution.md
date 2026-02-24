<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0
Modified principles: N/A (initial ratification)
Added sections:
  - Core Principles (I–VI)
  - Technology Stack Constraints
  - Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check section is dynamic; no edits needed
  ✅ .specify/templates/spec-template.md — Generic template; aligned with principles
  ✅ .specify/templates/tasks-template.md — Generic template; test-optional policy confirmed
  ✅ .specify/templates/agent-file-template.md — No constitution references to update
Follow-up TODOs: None
-->

# Tika Constitution

## Core Principles

### I. Spec-Driven Development

Features MUST follow the full speckit workflow before any implementation begins:
`constitution → specify → [clarify] → plan → tasks → implement`.

- No feature implementation starts without an approved spec (`spec.md`) and
  an implementation plan (`plan.md`).
- Skipping or merging workflow steps is NOT allowed without a documented justification
  committed alongside the code.
- All design artifacts (spec, plan, tasks) MUST be committed and kept in sync
  with the code they describe.

**Rationale**: Prevents scope creep and implementation drift. Decisions made
during planning cost a fraction of decisions discovered during coding, and
written specs serve as the single source of truth across the team.

### II. Type Safety & Runtime Validation

TypeScript strict mode is NON-NEGOTIABLE across the entire codebase.

- All API route inputs MUST be validated with Zod schemas defined in
  `src/lib/validations.ts` before any database or business logic executes.
- Shared types MUST be centralized in `src/types/index.ts`; domain-local types
  are only acceptable if they are never consumed across module boundaries.
- `as any` casts are FORBIDDEN; `as unknown as T` MUST include a comment
  explaining why the cast is provably safe.
- TypeScript `enum` declarations are FORBIDDEN; use `as const` object maps instead.

**Rationale**: Eliminates entire classes of runtime bugs. The contract between
client, server, and database is expressed entirely in types — losing type safety
means losing the specification.

### III. Security-First

Every API route MUST verify the user session before executing any logic.

- Unauthenticated requests MUST return HTTP 401 immediately, before any DB access.
- Destructive operations (ticket delete, batch updates) require a UI confirmation
  step and an authorization check at the API layer.
- Environment secrets (`.env.local`) are NEVER committed to version control.
- Authentication cookies MUST be `httpOnly`; the `.env.local` file is managed by
  the user only — agents MUST NOT create or modify it.
- SQL queries MUST go through Drizzle ORM; raw SQL string concatenation is FORBIDDEN.

**Rationale**: The single-user MVP of today becomes a multi-tenant SaaS tomorrow.
Security holes introduced now are expensive to remediate under production load.

### IV. Data Safety & Migration Discipline

Database schema changes MUST be applied exclusively through Drizzle Kit migrations.

- `src/db/schema.ts` MUST NOT be modified without explicit user confirmation.
- Destructive SQL (`DROP TABLE`, `TRUNCATE`, `DELETE` without a `WHERE` clause)
  is FORBIDDEN without explicit user authorization and a data backup confirmation.
- Files inside `migrations/` are auto-generated only; manual edits are FORBIDDEN.
- Production database changes are NEVER applied automatically by an agent.

**Rationale**: Data is the most irreversible asset in the system. A dropped table
or missed migration can destroy user data with no recovery path.

### V. Minimum Viable Complexity (YAGNI)

Add only what is required for the current task. Every layer of complexity MUST
be justified against a concrete, present need.

- Abstractions MUST NOT be created for fewer than three concrete, existing use cases.
- No feature flags, backwards-compatibility shims, or speculative generalization.
- New third-party libraries or frameworks MUST be justified in writing and require
  explicit user approval before installation (`package.json` MUST NOT change
  without user approval).
- Existing library versions are locked; upgrades require a documented reason.

**Rationale**: Tika is an MVP. Premature complexity increases maintenance burden
without delivering user value, and makes future refactoring materially harder.

### VI. Optimistic UI with Guaranteed Rollback

All user-initiated state changes MUST apply optimistic updates immediately on
the client.

- The UI MUST update before the API call resolves.
- On any API failure, the UI MUST roll back to its exact pre-update state.
- Error states MUST be surfaced to the user; silent failures are FORBIDDEN.

**Rationale**: Perceived performance is a core UX principle for a drag-and-drop
kanban board. Latency between user action and visual feedback breaks the flow
state that makes the product feel fast.

## Technology Stack Constraints

The technology stack for Phase 1 is fixed. Deviations require written justification
and explicit user approval before any dependency is installed.

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 15 |
| Language | TypeScript | 5.7 |
| Styling | Tailwind CSS | 4 |
| Drag & Drop | @dnd-kit | 6.x |
| ORM | Drizzle ORM | 0.38 |
| Validation | Zod | 3.24 |
| Auth | NextAuth.js | v5 |
| Database | Vercel Postgres (Neon) | — |
| Deployment | Vercel | — |

**Hard constraints**:

- CSS-in-JS libraries (styled-components, emotion, etc.) are FORBIDDEN.
- Direct SQL string queries are FORBIDDEN; use Drizzle ORM exclusively.
- Global CSS additions to `globals.css` MUST be minimal and individually justified.
- `npm audit fix --force` is FORBIDDEN.

## Development Workflow

### Code Organization

- **Routing & API**: `app/` directory (Next.js App Router conventions).
- **Business Logic**: `src/` directory.
- **Components**: `src/components/{domain}/`; reusable primitives in `src/components/ui/`.
- **DB Layer**: `src/db/` — schema, queries, and seed only; no business logic.
- **Types**: `src/types/index.ts` — all shared types MUST be centralized here.
- **Utils**: `src/lib/` — constants, Zod schemas, pure helper functions.
- **Tests**: `__tests__/` mirroring the source directory structure.

### Quality Gates (MUST pass before merge)

- `npm run lint` — zero ESLint errors.
- `npm run format` — Prettier formatting applied.
- `npm run test` — all Jest tests pass.
- `npm run build` — production build succeeds without type errors.

### Naming Conventions

| Target | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `BoardContainer` |
| Component files | PascalCase.tsx | `TicketCard.tsx` |
| Hooks | `use` prefix + camelCase | `useTickets` |
| Functions/variables | camelCase | `groupTicketsByStatus` |
| Constants | UPPER_SNAKE_CASE | `POSITION_GAP` |
| DB columns | snake_case | `due_date` |
| API response fields | camelCase | `dueDate` |
| Types/Interfaces | PascalCase | `TicketStatus` |

### Forbidden Git Operations

The following are FORBIDDEN without an explicit, scoped user request:

- `git push --force` or any force-push variant.
- `git reset --hard` (discarding local changes).
- `git commit --no-verify` (bypassing pre-commit hooks).
- Amending already-pushed commits.

## Governance

This constitution supersedes all other development practices for the Tika project.
Any violation MUST be documented with justification committed alongside the code.

**Amendment Process**:

1. Propose the amendment with rationale and version bump type (MAJOR/MINOR/PATCH).
2. Obtain explicit user approval before modifying this file.
3. Update `LAST_AMENDED_DATE` and increment `CONSTITUTION_VERSION` accordingly.
4. Run `/speckit.constitution` to propagate changes to dependent templates.

**Versioning Policy**:

- **MAJOR**: Removal or backward-incompatible redefinition of an existing principle.
- **MINOR**: New principle or section added, or materially expanded guidance.
- **PATCH**: Clarification, wording improvement, or typo fix.

**Compliance Review**: Every PR and code review MUST verify compliance with this
constitution. Complexity violations MUST appear in the plan's Complexity Tracking
table before implementation begins.

**Runtime Guidance**: See `.claude/CLAUDE.md` for agent-specific runtime development
guidance (forbidden commands, naming conventions, coding rules) that supplements
this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-02-23 | **Last Amended**: 2026-02-23
