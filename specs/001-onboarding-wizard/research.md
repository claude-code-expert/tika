# Research: Onboarding Wizard & Workspace Flow

**Feature**: 001-onboarding-wizard
**Phase**: 0 — Research
**Date**: 2026-03-05

---

## Decision 1: userType persistence and session delivery

**Decision**: Store `userType` in the NextAuth JWT token. Fetch the user's `type` once in the `signIn` callback and propagate it through `jwt` → `session` callbacks.

**Rationale**: The user's type is set exactly once (during onboarding) and never changes in normal flow. Adding it to the JWT avoids an extra DB query on every session callback invocation (which fires on every authenticated page load). The JWT payload is small and stays within the 4 KB cookie limit.

**Alternatives considered**:
- Query `users.type` in the `session` callback on every request — rejected: unnecessary DB hit on each page load.
- Store type only client-side in localStorage — rejected: violates security-first principle, can be tampered with.

**Implementation note**: The `jwt` callback must store `userType` from the DB result. The `session` callback exposes it as `session.user.userType`. TypeScript type declaration in `src/types/next-auth.d.ts` must be updated.

---

## Decision 2: auth.ts signIn callback — remove auto-workspace creation for new users

**Decision**: Remove the automatic personal workspace creation from the `signIn` callback. Instead, workspace creation is triggered explicitly after the user selects their type in the onboarding wizard.

**Rationale**: The current `signIn` callback creates a PERSONAL workspace for every new user unconditionally. With onboarding, new WORKSPACE-type users must NOT receive an auto-created personal workspace. Moving workspace creation to the type-selection handlers ensures workspaces are created only when and how the user intends.

**Alternatives considered**:
- Keep auto-creation in `signIn` and delete it if user picks WORKSPACE — rejected: wasteful DB write + delete, breaks atomicity.
- Create workspace in `signIn` only if `users.type = 'USER'` — rejected: `users.type` is NULL at first `signIn`, so the condition can never be evaluated on first login.

**Migration impact**: Existing users who already have workspaces are unaffected. The signIn callback checks for an existing workspace first; the new behavior only changes what happens when NO workspace exists — it no longer auto-creates one.

**One-time data migration required**: Existing users in production must have `type='USER'` set before deployment, so they don't get routed through onboarding again.

---

## Decision 3: Invite link validation preserves email-matching

**Decision**: The `WorkspaceFinder`'s invite link detection calls the existing `POST /api/invites/[token]/accept` endpoint unchanged. Email validation remains enforced.

**Rationale**: The existing invite system is email-targeted — the owner creates an invite for a specific recipient email. The accept endpoint validates that the logged-in user's email matches. This is a security feature. The onboarding flow's "paste invite link" UX works correctly because the invite was created for the specific person being invited.

**Alternatives considered**:
- Create "open invite links" without email validation — rejected: violates security-first principle (CLAUDE.md §6), anyone with the link could join any workspace.
- Add an `isOpen` flag to `workspaceInvites` to allow email-agnostic acceptance — rejected: scope creep beyond MVP; a new table or flag is not needed since the existing email-targeted system covers all stated user stories.

**UX implication**: If a user pastes a link whose email doesn't match their Google account, they see a clear error message ("이 초대 링크는 다른 이메일 주소로 발급된 초대장입니다"). This is documented in the WorkspaceFinder component spec.

---

## Decision 4: Workspace searchability via is_searchable column

**Decision**: Add a `is_searchable BOOLEAN NOT NULL DEFAULT FALSE` column to the `workspaces` table. Search API filters by this flag. Default is non-searchable (private). Owners enable search visibility from workspace settings (out of scope for this feature — managed as a separate setting toggle).

**Rationale**: Minimal schema change. Opt-in searchability protects workspace privacy. Drizzle ORM handles the WHERE clause efficiently with an index on the column.

**Alternatives considered**:
- Separate `public_workspaces` table — rejected: unnecessary complexity for a boolean flag.
- No searchability flag (all TEAM workspaces are searchable) — rejected: exposes all team workspaces to anyone, privacy violation.
- Searchability flag set during onboarding — rejected: creates UX friction during workspace creation; better as a settings toggle.

---

## Decision 5: Join request approval atomicity

**Decision**: The `PATCH /api/workspaces/[id]/join-requests/[reqId]` approval handler uses a Drizzle ORM transaction: atomically sets `workspace_join_requests.status = 'APPROVED'` AND inserts a new `members` row. Both succeed or both roll back.

**Rationale**: Partial approval (request marked approved but member not created, or vice versa) is a data integrity violation. Without a transaction, a server crash between the two writes leaves the data in an inconsistent state.

**Alternatives considered**:
- Two separate writes without transaction — rejected: violates data safety (constitution §IV).
- Saga/compensating transaction — rejected: overengineering for a two-write operation.

---

## Decision 6: Smart input detection in WorkspaceFinder

**Decision**: The single input field in `WorkspaceFinder` parses its value using three priority-ordered regex patterns:

```
Priority 1: /\/invite\/([a-f0-9-]{36})/ — UUID in invite URL → extract token → POST /api/invites/[token]/accept
Priority 2: /\/team\/(\d+)/            — workspace ID in team URL → extract ID → navigate to join form
Priority 3: (default)                   — plain text → GET /api/workspaces/search?q=
```

The detection runs on form submit (not on every keystroke) to avoid spurious API calls.

**Alternatives considered**:
- Separate tabs/fields for each input type — rejected: adds UI complexity; users may not know which tab to use.
- Server-side detection — rejected: requires round trip before showing correct UI; client-side regex is instant.

---

## Decision 7: app/page.tsx smart redirect logic

**Decision**: The root page server component fetches `users.type` from the session (which includes `userType` from the JWT) and redirects:
- `userType === null` → `/onboarding`
- `userType === 'USER'` → stay on `/` (personal board)
- `userType === 'WORKSPACE'` + has workspace membership → `/team/[id]` (first workspace they belong to)
- `userType === 'WORKSPACE'` + no workspace → `/onboarding/workspace`

**Rationale**: Server-side redirect in a Server Component is the cleanest approach in Next.js App Router. No client-side flash of incorrect content.

**Alternatives considered**:
- Middleware-based redirect — considered, but middleware runs before session is available from DB; the userType check requires a DB-backed session value.
- Client component with useEffect redirect — rejected: causes flash of incorrect content before redirect.

---

## Existing infrastructure confirmed available (no new work needed)

| Component | Location | Reuse |
|-----------|----------|-------|
| Invite creation | `POST /api/workspaces/[id]/invites` | Reused as-is |
| Invite acceptance | `POST /api/invites/[token]/accept` | Reused as-is |
| Invite preview | `GET /api/invites/[token]` | Reused as-is |
| Invite landing page | `app/invite/[token]/page.tsx` | Reused as-is |
| Workspace creation | `POST /api/workspaces` | Reused as-is |
| Workspace list | `GET /api/workspaces` | Reused as-is |

---

## No new libraries required

All implementation can be done with existing dependencies. Lucide React is already installed. No `package.json` changes are needed.
