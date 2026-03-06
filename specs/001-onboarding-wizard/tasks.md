# Tasks: Onboarding Wizard & Workspace Flow

**Input**: Design documents from `/specs/001-onboarding-wizard/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not explicitly requested in spec — test tasks excluded (use quickstart.md for manual verification).

**Organization**: Tasks grouped by user story for independent implementation and testing.

---

## Phase 1: Setup (DB Schema & Types)

**Purpose**: Schema additions and TypeScript type foundation that ALL user stories depend on. Must be complete before any feature work.

**⚠️ CRITICAL**: Run `npm run db:generate` after ALL schema tasks are complete (T001–T003), not after each individual task.

- [X] T001 Add `userType: varchar('user_type', { length: 20 })` column to users table in `src/db/schema.ts` (NULL = not onboarded, 'USER' = personal, 'WORKSPACE' = team)
- [X] T002 Add `isSearchable: boolean('is_searchable').notNull().default(false)` column to workspaces table in `src/db/schema.ts`
- [X] T003 Add new `workspaceJoinRequests` pgTable to `src/db/schema.ts` with columns: id (serial PK), workspaceId (FK→workspaces), userId (FK→users), message (text, nullable), status (varchar 20, default 'PENDING'), reviewedBy (FK→members, nullable), reviewedAt (timestamptz nullable), createdAt (timestamptz); unique constraint on (workspaceId, userId); index on (workspaceId, status)
- [X] T004 Run `npm run db:generate` to generate migration files in `migrations/` directory, then run `npm run db:migrate` to apply all three schema changes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that every user story depends on. No story work can begin until this phase is complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 [P] Add to `src/types/index.ts`: `USER_TYPE` as const map (`USER`/`WORKSPACE`), `UserType` type (union + null); `JOIN_REQUEST_STATUS` as const map (`PENDING`/`APPROVED`/`REJECTED`), `JoinRequestStatus` type; `JoinRequest` interface; `JoinRequestWithUser` interface (extends JoinRequest with userName, userEmail, userAvatarUrl); `WorkspaceSearchResult` interface (id, name, description, memberCount)
- [X] T006 [P] Create or update `src/types/next-auth.d.ts` to declare module augmentation extending `Session['user']` with `id: string`, `workspaceId: number | null`, `memberId: number | null`, `userType: 'USER' | 'WORKSPACE' | null`
- [X] T007 [P] Add three new Zod schemas to `src/lib/validations.ts`: `patchUserTypeSchema` (userType: z.enum(['USER','WORKSPACE'])); `postJoinRequestSchema` (message: z.string().max(500).optional()); `patchJoinRequestSchema` (action: z.enum(['APPROVE','REJECT'])); `workspaceSearchSchema` (q: z.string().min(1).max(50))
- [X] T008 [P] Create `src/db/queries/joinRequests.ts` with functions: `getJoinRequests(workspaceId, status?)` — query workspace_join_requests joined with users returning JoinRequestWithUser[]; `createJoinRequest(workspaceId, userId, message?)` — insert and return JoinRequest; `getJoinRequestById(id, workspaceId)` — fetch single request; `approveJoinRequest(reqId, workspaceId, reviewerMemberId, newMemberData)` — Drizzle transaction: update status to APPROVED + insert members row, return { joinRequest, member }; `rejectJoinRequest(reqId, workspaceId, reviewerMemberId)` — update status to REJECTED; `getPendingRequestByUser(workspaceId, userId)` — check for duplicate
- [X] T009 Modify `src/lib/auth.ts`: (a) In `signIn` callback — fetch `userType` after upsert by adding `userType: users.userType` to `.returning()`; only auto-create personal workspace + member + default labels when `upsertedUser.userType === 'USER'` (skip for null and 'WORKSPACE'); (b) In `jwt` callback — on `user` present OR `trigger === 'update'`, query `users.userType` from DB and store as `token.userType`; (c) In `session` callback — set `(session.user as any).userType = token.userType ?? null`

**Checkpoint**: Foundation ready — all user stories can now begin.

---

## Phase 3: User Story 1 — First-Time User Onboarding Wizard (Priority: P1) 🎯 MVP

**Goal**: New users see a welcome screen with two cards and are routed to the correct experience based on their choice.

**Independent Test**: Log in with a fresh Google account → land on `/onboarding` → select either card → verify DB `users.user_type` is set and redirect is correct.

- [X] T010 [US1] Create `app/api/users/type/route.ts` — PATCH handler: (1) verify session (401 if none); (2) parse body with `patchUserTypeSchema`; (3) update `users.user_type` in DB; (4) if `userType === 'USER'`, check for existing personal workspace — if none, create workspace (type='PERSONAL', name='내 워크스페이스'), create OWNER member row (displayName=user.name, color='#7EB4A2'), insert DEFAULT_LABELS; (5) call `session.update()` signal by returning `{ user: { id, userType }, workspace: { id } | null }` with status 200
- [X] T011 [US1] Create `app/onboarding/page.tsx` — server component: call `auth()`; if no session redirect to '/login'; if `session.user.userType === 'USER'` redirect to '/'; if `session.user.userType === 'WORKSPACE'` redirect to '/onboarding/workspace'; otherwise render `<OnboardingWizard />` with `session.user.id` and `session.user.name` props
- [X] T012 [US1] Create `src/components/onboarding/OnboardingWizard.tsx` — 'use client' component: two cards side-by-side (mobile: stacked); left card: `User` icon (lucide, 32px, accent color), "개인용" title, "나 혼자 사용 / 칸반 보드 / 무제한 티켓" bullet list, "시작하기 →" Button (variant=primary); right card: `Building2` icon, "워크스페이스" title, "팀과 함께 사용 / 멤버 초대, 협업 / 통합 대시보드", "시작하기 →"; on click: setLoading(true), call PATCH /api/users/type with selected type, then call `update()` from `useSession()`, then `router.push(type === 'USER' ? '/' : '/onboarding/workspace')`; loading state disables both cards and shows spinner on active button; full-viewport centered layout, `#F8F9FB` background
- [X] T013 [US1] Modify `app/page.tsx` — after auth() session check, read `session.user.userType`; if null → `redirect('/onboarding')`; if 'WORKSPACE' → query first workspace membership (members JOIN workspaces WHERE userId=session.user.id AND type='TEAM') → if found `redirect('/team/${workspaceId}')` else `redirect('/onboarding/workspace')`; if 'USER' → fall through to render `<AppShell />`

**Checkpoint**: US1 fully functional — new users see wizard and are correctly routed.

---

## Phase 4: User Story 2 — Personal Mode Board Access (Priority: P2)

**Goal**: Users who chose personal mode land directly on the personal kanban board on all subsequent visits.

**Independent Test**: After completing US1 with 개인용 selection, log out and log back in → land directly on `/` board, no wizard shown.

- [X] T014 [US2] Verify `app/page.tsx` smart redirect (from T013) correctly passes USER-type users through to `<AppShell />` without redirect — confirm existing board renders with workspace data by checking that the session contains valid `workspaceId` for USER-type users; if the session callback in auth.ts does not return workspaceId for USER-type users, add fallback query: `select workspace WHERE ownerId = userId AND type = 'PERSONAL'`

**Checkpoint**: USER-type users see the personal board on every login, with no wizard re-shown.

---

## Phase 5: User Story 3 — Create a Workspace (Priority: P3)

**Goal**: Workspace-type users can create a new named workspace and land on its board as OWNER.

**Independent Test**: From `/onboarding/workspace` → "개설" tab → enter name "Test Team" → submit → land on `/team/[id]` as OWNER.

- [X] T015 [P] [US3] Create `app/onboarding/workspace/page.tsx` — server component: call `auth()`; if no session → redirect '/login'; if `userType === 'USER'` → redirect '/'; if `userType === 'WORKSPACE'`, query first TEAM workspace membership for user — if found redirect `/team/${wsId}`; otherwise render `<WorkspaceOnboarding />` with session user props
- [X] T016 [P] [US3] Create `src/components/onboarding/WorkspaceCreator.tsx` — 'use client' component for "개설" tab: controlled input for workspace name (required, max 100 chars, placeholder "워크스페이스 이름", shows inline validation error if blank on submit); optional textarea for description (max 500 chars); "워크스페이스 만들기" Button (variant=primary, full width); on submit: POST to `/api/workspaces` with `{ name, description, type: 'TEAM' }` → on success `router.push('/team/${response.workspace.id}')`; spinner during API call; validation error inline below name input
- [X] T017 [US3] Create `src/components/onboarding/WorkspaceOnboarding.tsx` — 'use client' tab controller component: two tabs with `Plus` icon ("개설") and `Search` icon ("찾기") from lucide-react; active tab has accent color text + 2px bottom border in accent color; renders `<WorkspaceCreator />` or `<WorkspaceFinder />` based on active tab state; default tab is "개설"; card container with white background, 12px border-radius, border var(--color-border)

**Checkpoint**: WORKSPACE-type users can create their own workspace and reach the team board as OWNER.

---

## Phase 6: User Story 4 — Find and Join a Workspace (Priority: P4)

**Goal**: Workspace-type users can search for public workspaces, submit join requests, or auto-join via invite link.

**Independent Test**: (a) Search flow — type workspace name → see results → click 가입신청 → see success state → verify DB PENDING status. (b) Invite flow — paste /invite/[token] URL → see auto-join success → redirect to /team/[id].

- [X] T018 [US4] Create `app/api/workspaces/search/route.ts` — GET handler: verify session (401); parse `q` param with `workspaceSearchSchema` (400 if invalid); query workspaces with ILIKE `%q%` on name WHERE `is_searchable = TRUE` AND `type = 'TEAM'`; join with members COUNT; return max 20 results as `{ workspaces: WorkspaceSearchResult[] }` — include only id, name, description, memberCount (no owner email or personal data)
- [X] T019 [US4] Create `app/api/workspaces/[id]/join-requests/route.ts` — POST handler: verify session; check workspace exists and is TEAM type (403 for PERSONAL); check user is not already a member (409 ALREADY_MEMBER); call `getPendingRequestByUser` — if exists return 409 ALREADY_REQUESTED; call `createJoinRequest` and return 201 with joinRequest; GET handler: verify session; verify user is OWNER of workspace (403 if not); parse optional `status` query param; call `getJoinRequests(workspaceId, status)` and return 200 with joinRequests array
- [X] T020 [US4] Create `src/components/onboarding/WorkspaceFinder.tsx` — 'use client' component for "찾기" tab: single input field (placeholder "워크스페이스 이름 또는 초대 링크"); "검색" Button; on submit, detect input pattern: (1) regex `/\/invite\/([0-9a-f-]{36})/` → extract token → POST to `/api/invites/${token}/accept` → show success "✅ 워크스페이스에 참여했습니다!" then `router.push('/team/${workspaceId}')`; (2) regex `/\/team\/(\d+)/` → extract id → call POST `/api/workspaces/${id}/join-requests` directly; (3) default → GET `/api/workspaces/search?q=${input}` → render result cards; result card: `Building2` icon, workspace name, "멤버 N명", "가입신청" button; after join request success: button changes to `CheckCircle` icon + "신청 완료" text (disabled); no-results state: "워크스페이스가 없습니다. 초대 링크로 진입하세요."; expired link error: `AlertTriangle` icon + "초대 링크가 만료되었습니다. 오너에게 새 링크를 요청하세요."; loading spinner during all API calls

**Checkpoint**: Users can find workspaces by name or join via invite link.

---

## Phase 7: User Story 5 — Owner Manages Join Requests (Priority: P5)

**Goal**: Workspace OWNER sees pending join requests on the members page and can approve or reject each one.

**Independent Test**: As OWNER on `/team/[id]/members` — pending request is shown; click 승인 → row disappears, user appears in members list; click 거절 → row disappears, no new member.

- [X] T021 [US5] Create `app/api/workspaces/[id]/join-requests/[reqId]/route.ts` — PATCH handler: verify session; verify user is OWNER (403 if not); parse body with `patchJoinRequestSchema`; fetch join request by reqId + workspaceId (404 if not found); if status !== 'PENDING' return 409 ALREADY_PROCESSED; if action === 'APPROVE': call `approveJoinRequest` (Drizzle transaction: set status='APPROVED' + insert member with role='MEMBER', color from deterministic color selection by userId hash, displayName from users.name, joinedAt=now()); return 200 with { joinRequest, member }; if action === 'REJECT': call `rejectJoinRequest`; return 200 with { joinRequest }
- [X] T022 [US5] Create `src/components/workspace/JoinRequestList.tsx` — 'use client' component: props: `workspaceId: number`, `initialRequests: JoinRequestWithUser[]`; local state: `requests` (optimistic list); if no requests, return null (hidden); renders section heading "가입 신청 ({count}건)"; each row: `<Avatar>` component with user initials fallback, userName (bold), userEmail (muted), createdAt (formatted date), "거절" button (variant=ghost, hover red tint), "승인" button (variant=primary, accent); on 승인: optimistically remove row from list → PATCH approve → if error, re-insert row + show error; on 거절: optimistically remove row → PATCH reject → if error, re-insert row + show error; both buttons disabled while respective API call is in flight (loading spinner inside button)
- [X] T023 [US5] Modify `app/team/[workspaceId]/members/page.tsx` — in the server component: if `session.user.role === 'OWNER'` (or check members table), fetch `getJoinRequests(workspaceId, 'PENDING')` from DB; render `<JoinRequestList workspaceId={workspaceId} initialRequests={pendingRequests} />` below the existing members list section

**Checkpoint**: OWNER can fully manage join requests. All 5 user stories are now independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verification, regression testing, and final cleanup.

- [X] T024 [P] Run full test suite and linter: `npm test && npm run lint` — fix any failures caused by schema additions (schema export changes may affect existing test snapshots), auth.ts changes (mocked session may need userType field), or page.tsx redirect changes (mock userType in tests)
- [ ] T025 [P] Execute all 7 quickstart.md manual verification scenarios (requires running dev server — to be done manually) in development environment; document any deviations from expected behavior
- [X] T026 Document the one-time data migration for production deployment in `docs/phase/ONBOARDING-DESIGN.md` "배포 지침" section: `UPDATE users SET user_type = 'USER' WHERE user_type IS NULL;` — must run BEFORE deploying code to prevent existing users from seeing the onboarding wizard

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately. Run `db:generate` and `db:migrate` AFTER T001–T003 are all complete.
- **Phase 2 (Foundational)**: Depends on Phase 1 (schema must be migrated before auth.ts changes reference userType) — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 3 completion (US2 reuses US1's implementation)
- **Phase 5 (US3)**: Depends on Phase 2 completion — can begin in parallel with Phase 3 after Phase 2
- **Phase 6 (US4)**: Depends on Phase 5 completion (WorkspaceFinder is rendered by WorkspaceOnboarding)
- **Phase 7 (US5)**: Depends on Phase 2 completion — can begin in parallel with Phase 3 after Phase 2
- **Phase 8 (Polish)**: Depends on all desired stories being complete

### User Story Dependencies

- **US1 (P1)**: Requires Foundation complete — no story dependencies
- **US2 (P2)**: Requires US1 complete — validation only, no new separate dependencies
- **US3 (P3)**: Requires Foundation complete — independent of US1/US2
- **US4 (P4)**: Requires US3 complete (WorkspaceFinder lives in WorkspaceOnboarding component)
- **US5 (P5)**: Requires Foundation complete — independent of US1/US2/US3/US4

### Within Each Phase

- Phase 1: T001, T002, T003 can run in parallel (all different sections of schema.ts — but since it's one file, do sequentially); T004 MUST run after T001–T003
- Phase 2: T005, T006, T007, T008 can run in parallel (different files); T009 MUST run after T005–T008 complete (depends on types from T005 and queries from T008)
- Phase 3: T010 (API) and T011 (page) can run in parallel (different files); T012 depends on T011; T013 can run in parallel with T010–T012

---

## Parallel Execution Examples

### Phase 1 (Sequential — same file schema.ts)
```
T001 → T002 → T003 → T004 (serial, same file + migration after all)
```

### Phase 2 (Parallel opportunities)
```
Launch simultaneously:
  T005: Add types to src/types/index.ts
  T006: Update src/types/next-auth.d.ts
  T007: Add Zod schemas to src/lib/validations.ts
  T008: Create src/db/queries/joinRequests.ts

Wait for all four → then:
  T009: Modify src/lib/auth.ts (needs T005 types, T008 queries)
```

### Phase 3 + Phase 5 + Phase 7 (all can start after Phase 2)
```
Launch simultaneously after Foundation:
  US1: T010 (API route) ‖ T011 (page)
  US3: T015 (page) ‖ T016 (component)
  US5: T021 (API route) ‖ T022 (component)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (schema + migration)
2. Complete Phase 2: Foundational (types, validations, queries, auth.ts)
3. Complete Phase 3: US1 — Onboarding wizard + routing
4. **STOP and VALIDATE**: Fresh login → wizard appears → select personal → board loads
5. Deploy if ready (US1 + US2 both functional at this point)

### Incremental Delivery

1. Foundation (Phase 1+2) → system ready for all stories
2. US1 + US2 → onboarding wizard + personal mode (MVP deploy point)
3. US3 → workspace creation
4. US4 → workspace finder + join requests
5. US5 → owner approval UI (full feature complete)
6. Each story adds value without breaking previous ones

---

## Format Validation

All tasks follow the required format `- [ ] [ID] [P?] [Story?] Description with file path`:

| Task | Has Checkbox | Has ID | Has [P] if parallel | Has [US#] if story | Has file path |
|------|-------------|--------|--------------------|--------------------|---------------|
| T001–T004 | ✅ | ✅ | N/A (setup) | N/A (setup) | ✅ |
| T005–T009 | ✅ | ✅ | ✅ where applicable | N/A (foundation) | ✅ |
| T010–T013 | ✅ | ✅ | ✅ where applicable | ✅ [US1] | ✅ |
| T014 | ✅ | ✅ | N/A | ✅ [US2] | ✅ |
| T015–T017 | ✅ | ✅ | ✅ where applicable | ✅ [US3] | ✅ |
| T018–T020 | ✅ | ✅ | N/A | ✅ [US4] | ✅ |
| T021–T023 | ✅ | ✅ | N/A | ✅ [US5] | ✅ |
| T024–T026 | ✅ | ✅ | ✅ where applicable | N/A (polish) | ✅ |

---

## Notes

- **[P]** = different files, no incomplete dependencies — can run in parallel
- **schema.ts** is a single file — T001/T002/T003 should be done sequentially by one person
- **auth.ts (T009)** is the highest-risk task — test thoroughly after modification (existing tests may need `userType: null` added to mock session)
- **`/dev` route regression**: after auth.ts change, test `http://localhost:3000/dev` still works in development
- **Existing workspace creation** in `POST /api/workspaces` (used by WorkspaceCreator) is already implemented — reuse as-is
- **`npm run db:generate`** generates migration files only; **`npm run db:migrate`** applies them — both required in T004
- **Production deploy**: must run `UPDATE users SET user_type='USER' WHERE user_type IS NULL` BEFORE code deployment
