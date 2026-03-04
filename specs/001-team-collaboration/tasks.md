# Tasks: Team Collaboration Workspace

**Input**: Design documents from `specs/001-team-collaboration/`
**Branch**: `001-team-collaboration`
**Spec**: spec.md | **Plan**: plan.md | **Data Model**: data-model.md | **Contracts**: contracts/api.md

> **Tests**: 명세에 TDD 요청 없음 — 별도 테스트 태스크는 Phase 7(Polish)에 RBAC 단위 테스트만 포함.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 완료된 의존성 없음)
- **[Story]**: 유저 스토리 매핑 (US1~US5)
- 모든 경로는 저장소 루트 기준 절대 경로

---

## Phase 1: Setup (공유 인프라)

**Purpose**: 브랜치 환경 준비 및 디렉토리 구조 생성

- [X] T001 Create contracts/ and analytics route directories: `app/api/workspaces/[id]/analytics/`, `app/api/workspaces/[id]/members/`, `app/api/workspaces/[id]/invites/`, `app/api/workspaces/[id]/sprints/`, `app/api/invites/[token]/accept/`, `app/api/invites/[token]/reject/`, `app/team/[workspaceId]/members/`, `app/team/[workspaceId]/analytics/`, `app/team/[workspaceId]/burndown/`, `app/team/[workspaceId]/wbs/`, `app/invite/[token]/`, `src/components/team/charts/`
- [X] T002 [P] Create component placeholder files: `src/components/team/TeamSidebar.tsx`, `src/components/team/WorkspaceSwitcher.tsx`, `src/components/layout/TeamShell.tsx`, `src/components/ui/RoleBadge.tsx`

---

## Phase 2: Foundational (블로킹 기반)

**Purpose**: 모든 유저 스토리가 의존하는 DB 스키마, 타입, RBAC 헬퍼, 쿼리 레이어

**⚠️ CRITICAL**: 이 Phase 완료 전 어떤 유저 스토리 작업도 시작할 수 없음

- [X] T003 Modify `src/db/schema.ts` (사용자 확인 후): `workspaces`에 `type VARCHAR(10) NOT NULL DEFAULT 'PERSONAL'` 추가; `members`에 `invited_by INT NULLABLE FK→members(id)`, `joined_at TIMESTAMPTZ NULLABLE` 추가 및 role default를 `'MEMBER'`로 변경; `tickets`에 `sprint_id INT NULLABLE FK→sprints(id) ON DELETE SET NULL`, `story_points INT NULLABLE` 추가; `sprints`, `workspace_invites`, `ticket_assignees` 테이블 신규 추가 (data-model.md 스키마 기준)
- [X] T004 Run `npm run db:generate` — inspect generated migration SQL file in `migrations/`, manually append role migration: `UPDATE members SET role = 'OWNER' WHERE role = 'admin'; UPDATE members SET role = 'MEMBER' WHERE role = 'member';`
- [X] T005 Run `npm run db:migrate` — verify migration applies cleanly with no errors
- [X] T006 Update `src/types/index.ts`: add `TEAM_ROLE` (`OWNER/MEMBER/VIEWER`), `WORKSPACE_TYPE`, `SPRINT_STATUS`, `INVITE_STATUS` as `const` maps; add `Sprint`, `WorkspaceInvite`, `TicketAssignee` interfaces; extend `Workspace` with `type: WorkspaceType`, `Ticket` with `sprintId/storyPoints`, `TicketWithMeta` with `assignees: Member[]`; update `MEMBER_ROLE` to alias `TEAM_ROLE`
- [X] T007 Update `src/lib/validations.ts`: change `updateMemberRoleSchema` enum from `['admin','member']` to `['OWNER','MEMBER','VIEWER']`; add `createWorkspaceSchema`, `updateWorkspaceSchema`, `createInviteSchema`, `createSprintSchema`, `updateSprintSchema`, `completeSprintSchema`, `updateMemberRoleTeamSchema`
- [X] T008 Create `src/lib/permissions.ts`: implement `requireRole(userId: string, workspaceId: number, minimum: TeamRole)` that queries `members` table via `getMemberByUserId`, compares ROLE_RANK (`OWNER=3, MEMBER=2, VIEWER=1`), returns `{ member }` on success or `NextResponse` 403 on failure
- [X] T009 [P] Update `src/db/queries/members.ts`: change all `'admin'` literal comparisons to `'OWNER'` and `'member'` to `'MEMBER'`; add `getUserWorkspaces(userId: string)` that joins `members` + `workspaces` and returns workspaces with role; add `getMembersByWorkspace(workspaceId)` (alias); update `getAdminCount` → `getOwnerCount` checking `role = 'OWNER'`
- [X] T010 [P] Update `src/db/queries/workspaces.ts`: add `getWorkspacesByMemberId(userId: string)` that fetches all workspaces where user is a member (not just owner); add `getTeamWorkspaceCountByOwner(userId: string)` for the 3-workspace limit check; add `createWorkspace(data)`, `updateWorkspace(id, data)`, `deleteWorkspace(id)` functions
- [X] T011 Create `src/db/queries/sprints.ts`: implement `createSprint`, `getSprintsByWorkspace`, `getSprintById`, `updateSprint`, `deleteSprint` (PLANNED only), `activateSprint` (checks no ACTIVE exists), `completeSprint` (batch ticket moves from completeSprintSchema)
- [X] T012 Create `src/db/queries/invites.ts`: implement `createInvite` (generates token via `crypto.randomUUID()`, sets `expires_at = now + 7days`), `getInvitesByWorkspace`, `getInviteByToken`, `acceptInvite` (email match check, creates member record), `rejectInvite`, `revokeInvite`, `expireStaleInvites` (for cron)
- [X] T013 Create `src/db/queries/ticketAssignees.ts`: implement `getAssigneesByTicket(ticketId)`, `setAssignees(ticketId, memberIds[])` (max 5 validation, replace all), `removeAssignee(ticketId, memberId)`, `getTicketIdsByMember(memberId, workspaceId)` (for "내 티켓" filter)
- [X] T014 Create `src/db/queries/analytics.ts`: implement `getBurndownData(workspaceId, sprintId?, from, to)` returning daily `{date, remainingTickets, remainingPoints, idealTickets}`; `getCfdData(workspaceId, from, to)` returning daily status counts; `getVelocityData(workspaceId)` returning per-sprint completed points; `getCycleTimeData(workspaceId, from, to)` returning distribution; `getLabelAnalytics(workspaceId, from, to)` returning label counts; `getMemberWorkload(workspaceId)` returning per-member status counts

**Checkpoint**: DB 마이그레이션 완료, RBAC 헬퍼 및 모든 쿼리 레이어 준비 — 유저 스토리 구현 시작 가능

---

## Phase 3: US1 + US2 — 팀 워크스페이스 & RBAC (Priority: P1) 🎯 MVP

**Goal**: 팀 워크스페이스 생성, 멤버 초대(링크 복사 방식), 역할 기반 접근 제어가 완전히 동작하는 상태

**Independent Test**: 팀 워크스페이스 생성 → 초대 링크 생성 → `/invite/[token]`에서 미리보기 → 수락 → 멤버 목록에 추가 확인; VIEWER로 로그인 후 티켓 생성 시 403 확인

### Workspace API (US1)

- [X] T015 [US1] Update `app/api/workspaces/route.ts` GET: change query from `ownerId` filter to `getWorkspacesByMemberId(userId)` join so all member workspaces (PERSONAL + TEAM) are returned with `role` field
- [X] T016 [US1] Update `app/api/workspaces/route.ts` POST: add handler to create TEAM workspace using `createWorkspaceSchema`; check `getTeamWorkspaceCountByOwner(userId) >= 3` → 409 `WORKSPACE_LIMIT_EXCEEDED`; auto-create OWNER member record
- [X] T017 [US1] Create `app/api/workspaces/[id]/route.ts`: PATCH (update name/description, RBAC: OWNER); DELETE (confirm name match via `confirmName`, CASCADE delete — 400 `NAME_MISMATCH` on mismatch)

### Member Management API (US1 + US2)

- [X] T018 [US1] [US2] Create `app/api/workspaces/[id]/members/route.ts` GET: call `requireRole(userId, wsId, 'VIEWER')`, return members list with email via `getMembersWithEmailByWorkspace`
- [X] T019 [US2] Create `app/api/workspaces/[id]/members/[memberId]/route.ts` PATCH: RBAC OWNER; validate role enum; check `getOwnerCount` → 409 `LAST_OWNER` when demoting last OWNER; call `updateMemberRole`
- [X] T020 [US2] Add DELETE to `app/api/workspaces/[id]/members/[memberId]/route.ts`: RBAC OWNER; block self-removal → 400 `CANNOT_REMOVE_SELF`; call `removeMember`
- [X] T021 [US1] Create `app/api/workspaces/[id]/members/me/route.ts` DELETE: verify caller is MEMBER or VIEWER (block OWNER → 400 `OWNER_CANNOT_LEAVE`); remove self from workspace

### Invite API (US1)

- [X] T022 [US1] Create `app/api/workspaces/[id]/invites/route.ts` GET: RBAC OWNER; return invite list via `getInvitesByWorkspace`; POST: RBAC OWNER; validate `createInviteSchema`; check existing pending invite for same email → 409 `PENDING_INVITE_EXISTS`; check already member → 409 `ALREADY_MEMBER`; call `createInvite`; return invite with `inviteUrl: /invite/${token}`
- [X] T023 [US1] Create `app/api/workspaces/[id]/invites/[inviteId]/route.ts` DELETE: RBAC OWNER; check invite status = PENDING → 400 `INVITE_NOT_PENDING`; call `revokeInvite`
- [X] T024 [US1] Create `app/api/invites/[token]/route.ts` GET (no auth required): call `getInviteByToken`; check `expires_at < now()` → 400 `INVITE_EXPIRED`; return `{ workspaceName, inviterName, role, status, expiresAt, emailHint: mask email }` — never expose full email
- [X] T025 [US1] Create `app/api/invites/[token]/accept/route.ts` POST: require auth (401); get invite by token; check `session.user.email !== invite.email` → 403 `EMAIL_MISMATCH`; check expired → 400; check already member → 409; call `acceptInvite` (creates member record, updates status to ACCEPTED); return `{ workspaceId, role }`
- [X] T026 [US1] Create `app/api/invites/[token]/reject/route.ts` POST: require auth; get invite; check PENDING → 400; call `rejectInvite`; return `{ status: 'REJECTED' }`
- [X] T027 [US1] Update `app/api/cron/route.ts`: add `expireStaleInvites()` call to expire PENDING invites where `expires_at < now()`

### Team Layout & Shell (US1 + US2)

- [X] T028 [US1] Implement `src/components/layout/TeamShell.tsx`: client component wrapping Header + TeamSidebar + main content + Footer; NO DndContext (team board does not have drag-and-drop at this phase); accepts `workspaceId: number` prop
- [X] T029 [US1] Implement `src/components/team/TeamSidebar.tsx`: shows workspace name, role badge, nav links (대시보드/WBS/멤버/분석/번다운); WorkspaceSwitcher dropdown at top; matches design from `public/demo/team/team.html` sidebar
- [X] T030 [US1] Implement `src/components/team/WorkspaceSwitcher.tsx`: dropdown listing all user workspaces (from `GET /api/workspaces`); shows current workspace name; links to `/team/[id]` for TEAM type and `/` for PERSONAL
- [X] T031 [US2] Implement `src/components/ui/RoleBadge.tsx`: shows OWNER (purple), MEMBER (blue), VIEWER (gray) badge variants using Tailwind; small text pill style matching design system

### Team Pages (US1 + US2)

- [X] T032 [US1] Create `app/invite/[token]/page.tsx`: server component; fetch invite preview from `GET /api/invites/[token]`; show WorkspaceName, inviterName, role, expiry; if user logged in and `status=PENDING` show Accept/Reject buttons (client-side POST); if not logged in show "Google로 로그인하여 수락" button with `callbackUrl=/invite/[token]`; handle EXPIRED/ACCEPTED/REJECTED states with appropriate messages
- [X] T033 [US1] Create `app/team/[workspaceId]/page.tsx` (대시보드 skeleton): server component; verify membership via session; render TeamShell with placeholder sections (SprintBanner, stats cards); will be filled in Phase 6 with real components

**Checkpoint**: 팀 워크스페이스 생성 → 초대 링크 → 수락 플로우 완전 동작; RBAC 403 확인 가능

---

## Phase 4: US3 — 스프린트 계획 및 실행 (Priority: P2)

**Goal**: OWNER가 스프린트를 생성·시작·완료하고, 미완료 티켓을 수동으로 다음 스프린트 또는 백로그로 이동할 수 있는 상태

**Independent Test**: 스프린트 생성(PLANNED) → 시작(ACTIVE) → 티켓 배정 → 완료 다이얼로그에서 미완료 티켓 이동 선택 → COMPLETED 확인; ACTIVE 스프린트 2개 동시 생성 → 409 확인

### Sprint API (US3)

- [X] T034 [US3] Create `app/api/workspaces/[id]/sprints/route.ts`: GET (RBAC VIEWER+) lists sprints with ticket count; POST (RBAC OWNER) validates `createSprintSchema`, calls `createSprint`
- [X] T035 [US3] Create `app/api/workspaces/[id]/sprints/[sid]/route.ts`: GET returns single sprint with tickets; PATCH (RBAC OWNER) updates name/goal/dates via `updateSprint`; DELETE (RBAC OWNER) only if status=PLANNED → 400 `SPRINT_NOT_DELETABLE` otherwise
- [X] T036 [US3] Create `app/api/workspaces/[id]/sprints/[sid]/activate/route.ts` POST: RBAC OWNER; check no ACTIVE sprint exists → 409 `ACTIVE_SPRINT_EXISTS`; call `activateSprint`; return updated sprint
- [X] T037 [US3] Create `app/api/workspaces/[id]/sprints/[sid]/complete/route.ts` POST: RBAC OWNER; validate `completeSprintSchema` (array of `{ ticketId, destination: 'backlog'|'sprint', targetSprintId? }`); call `completeSprint` batch update; return `{ sprint, movedCount }`
- [X] T038 [US3] Update `app/api/tickets/route.ts` and `app/api/tickets/[id]/route.ts`: add `sprintId` and `storyPoints` fields to GET response and PATCH handler using updated `createTicketSchema`/`updateTicketSchema`

### Sprint UI Components (US3)

- [X] T039 [US3] Implement `src/components/team/SprintBanner.tsx`: shows sprint name, date range, progress bar (completed/total tickets), story points summary; links to burndown page; matches design from `public/demo/team/team.html` sprint banner section
- [X] T040 [US3] Implement sprint completion dialog in `app/team/[workspaceId]/page.tsx`: when ACTIVE sprint exists and OWNER clicks "완료", fetch incomplete tickets, render dialog with ticket list and per-ticket destination selector (backlog / select next sprint); submit via `POST .../complete`

**Checkpoint**: 스프린트 전체 라이프사이클(PLANNED→ACTIVE→COMPLETED) 및 미완료 티켓 수동 이동 동작 확인

---

## Phase 5: US4 — 다중 담당자 배정 (Priority: P2)

**Goal**: 티켓에 최대 5명의 담당자를 배정하고, 카드에 아바타 스택으로 표시하며, "내 티켓" 필터가 동작하는 상태

**Independent Test**: 티켓 수정에서 멤버 2명 선택 → 저장 → 티켓 카드에 아바타 2개 표시 → "내 티켓" 필터 → 본인 포함 티켓만 표시; 6번째 추가 시도 → 오류 메시지 확인

### Multi-assignee API (US4)

- [X] T041 [US4] Update `app/api/tickets/route.ts` POST and `app/api/tickets/[id]/route.ts` PATCH: after ticket create/update, if `assigneeIds` array present call `setAssignees(ticketId, assigneeIds)` (max 5 validation → 400); include `assignees: Member[]` in GET response by joining `ticket_assignees` + `members`
- [X] T042 [US4] Update `GET /api/tickets` query in `src/db/queries/tickets.ts`: join `ticket_assignees` → `members` to populate `TicketWithMeta.assignees`; support `?assigneeId=me` query param filtering via `getTicketIdsByMember` for "내 티켓" filter

### Multi-assignee UI (US4)

- [X] T043 [US4] Update `src/components/board/TicketCard.tsx`: replace single `assignee` avatar with `assignees` array; render up to 3 avatars stacked (overlapping, -ml-2 offset), show "+N" badge if more than 3; maintain existing single assignee fallback for personal board
- [X] T044 [US4] Update `src/components/ticket/TicketForm.tsx`: replace single `assigneeId` selector with multi-select member list (checkboxes); enforce max 5 selection with inline error; add `storyPoints` number input (1-100, optional); add `sprintId` dropdown (active sprints in workspace)

**Checkpoint**: 다중 담당자 배정, 아바타 스택, "내 티켓" 필터 모두 동작 확인

---

## Phase 6: US5 — 팀 대시보드 및 분석 (Priority: P3)

**Goal**: 5개 팀 화면(대시보드·WBS·멤버·분석·번다운)이 HTML 프로토타입과 동일한 레이아웃으로 렌더링되고, 차트에 실제 데이터가 표시되는 상태

**Independent Test**: 스프린트+티켓 데이터가 있는 워크스페이스에서 각 팀 페이지 접속 → 차트 렌더링 확인; 날짜 범위 필터 변경 → 데이터 갱신 확인

### Analytics API (US5)

- [X] T045 [US5] Create `app/api/workspaces/[id]/analytics/burndown/route.ts`: RBAC VIEWER+; parse `?sprintId=`, `?from=`, `?to=`; call `getBurndownData`; return `{ meta: { sprintId, storyPointsTotal }, data: [{date, remainingTickets, remainingPoints, idealTickets}] }`
- [X] T046 [US5] Create `app/api/workspaces/[id]/analytics/cfd/route.ts`: RBAC VIEWER+; call `getCfdData(workspaceId, from, to)`; return daily status counts array
- [X] T047 [US5] Create `app/api/workspaces/[id]/analytics/velocity/route.ts`: RBAC VIEWER+; call `getVelocityData`; return `{ sprints: [{sprintId, name, completedPoints, plannedPoints}] }`
- [X] T048 [US5] Create `app/api/workspaces/[id]/analytics/cycle-time/route.ts`: RBAC VIEWER+; call `getCycleTimeData`; return `{ average, median, distribution: [{days, count}] }`
- [X] T049 [US5] Create `app/api/workspaces/[id]/analytics/labels/route.ts`: RBAC VIEWER+; call `getLabelAnalytics`; return `{ labels: [{name, color, count, percentage}] }`
- [X] T050 [US5] Create `app/api/workspaces/[id]/members/workload/route.ts`: RBAC VIEWER+; call `getMemberWorkload`; return `{ members: [{memberId, displayName, role, assigned, inProgress, completed, byStatus}] }`

### Chart Components (US5)

- [X] T051 [P] [US5] Implement `src/components/team/charts/BurndownChart.tsx`: mini burndown (for dashboard); props: `data[]`, `storyPointsTotal`; SVG with ideal dashed line + actual line; matches dashboard design from `public/demo/team/team.html`
- [X] T052 [P] [US5] Implement `src/components/team/charts/BurndownChartFull.tsx`: full-page burndown with toggle (ticket count / story points); date range filter (7d/30d/custom); data points with values labeled; matches `public/demo/team/team-burndown.html`
- [X] T053 [P] [US5] Implement `src/components/team/charts/ProgressDonut.tsx`: circular progress donut with % label and legend; pure SVG; used in dashboard
- [X] T054 [P] [US5] Implement `src/components/team/charts/CumulativeFlowDiagram.tsx`: stacked area SVG chart for BACKLOG/TODO/IN_PROGRESS/DONE; matches `public/demo/team/team-analytics.html` CFD section
- [X] T055 [P] [US5] Implement `src/components/team/charts/VelocityChart.tsx`: horizontal bar chart comparing sprint story points; matches velocity section in analytics and burndown pages
- [X] T056 [P] [US5] Implement `src/components/team/charts/CycleTimeAnalysis.tsx`: histogram of completion time distribution; matches `public/demo/team/team-analytics.html` cycle time section
- [X] T057 [P] [US5] Implement `src/components/team/charts/TypeDistributionChart.tsx`: stacked bar showing GOAL/STORY/FEATURE/TASK distribution
- [X] T058 [P] [US5] Implement `src/components/team/charts/LabelAnalyticsCard.tsx`: label bubble/row visualization with counts and percentages
- [X] T059 [P] [US5] Implement `src/components/team/charts/TrendChart.tsx`: created vs resolved trend line chart for dashboard
- [X] T060 [P] [US5] Implement `src/components/team/charts/PriorityStatusMatrix.tsx`: table with priority rows × status columns and ticket counts
- [X] T061 [P] [US5] Implement `src/components/team/charts/DailyLogTable.tsx`: date, completed delta, added delta, remaining count, absorption rate % table for analytics page

### Dashboard Components (US5)

- [X] T062 [US5] Implement `src/components/team/DeadlineOverview.tsx`: timeline visualization showing overdue and upcoming tickets with deadline statistics; matches `public/demo/team/team.html` deadline section
- [X] T063 [US5] Implement `src/components/team/GoalProgressRow.tsx`: 3-column goal cards with progress bar, completion %, task count; matches goal section in dashboard prototype
- [X] T064 [US5] Implement `src/components/team/WbsMiniCard.tsx`: compact tree view of issues (Goal→Story→Feature) with type badge and status; matches WBS summary card in dashboard
- [X] T065 [US5] Implement `src/components/team/WorkloadHeatmap.tsx`: member workload table showing assigned/in-progress/completed/capacity per member; matches `public/demo/team/team-members.html`
- [X] T066 [US5] Implement `src/components/team/MemberDetailCard.tsx`: per-member card with avatar, name, email, role badge, stats grid, and scrollable ticket list; matches member cards in `public/demo/team/team-members.html`
- [X] T067 [US5] Implement `src/components/team/InviteModal.tsx`: modal for OWNER to create invite (email input, role selector); calls `POST /api/workspaces/[id]/invites`; shows generated invite link with copy button; lists current PENDING invites with revoke option

### Team Pages (US5)

- [X] T068 [US5] Complete `app/team/[workspaceId]/page.tsx` (대시보드): full implementation with SprintBanner, BurndownChart (mini), ProgressDonut, TrendChart, PriorityStatusMatrix, DeadlineOverview, GoalProgressRow, WbsMiniCard, WorkloadHeatmap (mini); fetch all data from analytics APIs; date range filter (7d/30d)
- [X] T069 [US5] Create `app/team/[workspaceId]/members/page.tsx`: WorkloadHeatmap (full) + MemberDetailCard grid; fetch from `GET /api/workspaces/[id]/members/workload`; InviteModal trigger for OWNER; member list with role badges and remove option
- [X] T070 [US5] Create `app/team/[workspaceId]/analytics/page.tsx`: sprint summary stats cards, BurndownChart + CumulativeFlowDiagram side-by-side, VelocityChart, DailyLogTable, CycleTimeAnalysis, TypeDistributionChart, LabelAnalyticsCard; date range filter; matches `public/demo/team/team-analytics.html`
- [X] T071 [US5] Create `app/team/[workspaceId]/burndown/page.tsx`: BurndownChartFull with toggle, VelocityChart comparison, DailyLogTable, CumulativeFlowDiagram; sprint selector dropdown; matches `public/demo/team/team-burndown.html`
- [X] T072 [US5] Create `app/team/[workspaceId]/wbs/page.tsx`: summary stats (Goal/Story/Feature/Task counts, overall %), Goal selector dropdown, GanttChart 3-panel layout; fetch issues + tickets with date ranges; matches `public/demo/team/team-wbs.html`
- [X] T073 [US5] Implement `src/components/team/GanttChart.tsx`: pure SVG/DOM React component (no external library); 3-panel layout — left tree (220px, type badge + name + indent), center timeline (scrollable SVG grid, colored cells by status), right panel (260px, assignee + priority + status); `useRef` for scroll sync; hover highlight across panels; data props: `items: GanttItem[]` where GanttItem has `{id, type, name, status, priority, assignees, startDate, endDate, children}`

**Checkpoint**: 5개 팀 화면 모두 실제 데이터로 렌더링 확인

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: RBAC 테스트, 코드 품질 검증, 최종 빌드

- [X] T074 Create `__tests__/lib/permissions.test.ts`: 26개 RBAC 조합 테스트 — VIEWER/MEMBER/OWNER × 각 기능(워크스페이스 삭제, 멤버 초대, 스프린트 시작, 티켓 생성 등) × 성공/실패 케이스
- [X] T075 [P] Create `__tests__/lib/inviteFlow.test.ts`: EMAIL_MISMATCH 403, PENDING→ACCEPTED 전이, EXPIRED 토큰 400 테스트
- [X] T076 [P] Create `__tests__/lib/sprintFlow.test.ts`: ACTIVE_SPRINT_EXISTS 409, SPRINT_NOT_DELETABLE 400, completeSprint 배치 이동 테스트
- [X] T077 Run `npm run lint` — fix all ESLint errors across new files
- [X] T078 Run `npm run build` — fix all TypeScript strict mode errors
- [X] T079 Run `npm test` — all tests pass (313개 테스트 전부 통과)
- [ ] T080 Verify quickstart.md verification checklist: all 10 items manually confirmed working end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 즉시 시작 가능
- **Phase 2 (Foundational)**: Phase 1 완료 후 시작 — 모든 유저 스토리 블로킹
- **Phase 3 (US1+US2)**: Phase 2 완료 후
- **Phase 4 (US3)**: Phase 2 완료 후 → Phase 3과 병렬 가능
- **Phase 5 (US4)**: Phase 2 완료 후 → Phase 3, 4와 병렬 가능
- **Phase 6 (US5)**: Phase 5 완료 후 (MemberDetailCard, 다중 담당자 표시 의존)
- **Phase 7 (Polish)**: Phase 3~6 완료 후

### User Story Dependencies

- **US1 + US2 (P1)**: Phase 2 완료 후 시작, 서로 강결합(동시 구현 권장)
- **US3 (P2)**: Phase 2 완료 후 US1과 병렬 가능
- **US4 (P2)**: Phase 2 완료 후 US1, US3과 병렬 가능
- **US5 (P3)**: US4 완료 후 (assignees 배열 필요)

---

## Parallel Example: Phase 2 (Foundational)

```text
# T009, T010, T011, T012, T013 병렬 실행 (서로 다른 파일):
Task: "Update src/db/queries/members.ts role literals + getUserWorkspaces"
Task: "Update src/db/queries/workspaces.ts + add new functions"
Task: "Create src/db/queries/sprints.ts"
Task: "Create src/db/queries/invites.ts"
Task: "Create src/db/queries/ticketAssignees.ts"
# T014 (analytics.ts)은 위 모두와 병렬 가능
```

## Parallel Example: Phase 6 차트 컴포넌트 (T051~T061)

```text
# 모든 charts/ 컴포넌트는 서로 독립 — 11개 동시 실행 가능:
Task: "BurndownChart.tsx"
Task: "BurndownChartFull.tsx"
Task: "ProgressDonut.tsx"
Task: "CumulativeFlowDiagram.tsx"
Task: "VelocityChart.tsx"
Task: "CycleTimeAnalysis.tsx"
Task: "TypeDistributionChart.tsx"
Task: "LabelAnalyticsCard.tsx"
Task: "TrendChart.tsx"
Task: "PriorityStatusMatrix.tsx"
Task: "DailyLogTable.tsx"
```

---

## Implementation Strategy

### MVP (US1 + US2 Only)

1. Phase 1 Setup 완료
2. Phase 2 Foundational 완료 (T003~T014) — CRITICAL
3. Phase 3 US1+US2 완료 (T015~T033)
4. **STOP & VALIDATE**: 팀 워크스페이스 생성 → 초대 → 수락 → RBAC 확인
5. 데모 가능한 최소 팀 기능 완성

### Incremental Delivery

1. Phase 1+2 → 기반 완성
2. Phase 3 → MVP (워크스페이스·초대·RBAC) 데모 가능
3. Phase 4 → 스프린트 관리 추가
4. Phase 5 → 다중 담당자 추가
5. Phase 6 → 전체 분석 화면 완성
6. Phase 7 → 품질 검증 후 PR

---

## Notes

- `src/db/schema.ts` 수정(T003)은 **반드시 사용자 확인 후** 진행
- `migrations/` 파일에 role UPDATE SQL 수동 추가(T004) 후 migrate 실행
- GanttChart(T073)는 의존성이 가장 복잡하므로 Phase 6 마지막에 구현
- 모든 팀 API 라우트는 `requireRole()` 헬퍼를 첫 번째로 호출
- HTML 프로토타입(`public/demo/team/*.html`)을 각 컴포넌트 구현 시 반드시 참조
