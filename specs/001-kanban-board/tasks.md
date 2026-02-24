# Tasks: Tika — 티켓 기반 칸반 보드 MVP

**Feature**: `001-kanban-board` | **Date**: 2026-02-23
**Input**: Design documents from `/specs/001-kanban-board/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: Not requested — no test tasks generated. Add via `/speckit.checklist` if needed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US9)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (기반 구조)

**Purpose**: 타겟 디렉토리 구조 및 공유 인프라 파일 생성. 현재 `src/client/, src/server/, src/shared/` 구조에서 CLAUDE.md 타겟 구조(`src/components/, src/db/, src/hooks/, src/lib/, src/types/`)로 이동.

- [X] T001 타겟 디렉토리 구조 생성: `src/types/, src/lib/, src/db/queries/, src/hooks/, src/components/board/, src/components/ticket/, src/components/label/, src/components/issue/, src/components/ui/`
- [X] T002 [P] `src/types/index.ts` — 공유 타입 정의: `TICKET_STATUS`, `TICKET_PRIORITY`(CRITICAL 포함), `TICKET_TYPE`, `ISSUE_TYPE` as const 맵 + `Ticket`, `TicketWithMeta`, `ChecklistItem`, `Label`, `Issue`, `Member`, `Workspace`, `BoardData` 인터페이스
- [X] T003 [P] `src/lib/constants.ts` — 상수 정의: `POSITION_GAP = 1024`, `REBALANCE_THRESHOLD = 2`, `TITLE_MAX_LENGTH = 200`, `DESCRIPTION_MAX_LENGTH = 1000`, `CHECKLIST_MAX_ITEMS = 20`, `LABEL_MAX_PER_TICKET = 5`, `LABEL_MAX_PER_WORKSPACE = 20`, `TICKET_MAX_PER_WORKSPACE = 300`, `DEFAULT_LABELS` 배열 (6개)
- [X] T004 [P] `src/lib/utils.ts` — 유틸 함수: `isOverdue(dueDate, status)`, `groupTicketsByStatus(tickets, meta)`, `calculatePosition(above, below)`, `applyOptimisticMove(board, ticketId, targetStatus, targetIndex)`
- [X] T005 [P] `src/lib/validations.ts` — Zod 스키마 전체: `createTicketSchema`, `updateTicketSchema`, `reorderSchema`, `createLabelSchema`, `updateLabelSchema`, `createIssueSchema`, `updateIssueSchema`, `createChecklistItemSchema`, `updateChecklistItemSchema`

**Checkpoint**: 공유 타입, 상수, 유틸리티, Zod 스키마 완료. 이후 모든 단계에서 참조 가능.

---

## Phase 2: Foundational (DB 스키마 + 마이그레이션)

**Purpose**: Phase 1 이후 반드시 완료해야 하는 DB 스키마. 모든 User Story 구현의 전제조건.

**⚠️ CRITICAL**: 스키마 변경은 사용자 확인 후 진행 (CLAUDE.md §6 - `schema.ts` 수정 시 사용자 확인 필수). T008은 사용자가 직접 실행.

- [X] T006 `src/db/schema.ts` — 8개 테이블 정의: `users`(Google OAuth PK=TEXT), `workspaces`, `tickets`(컬럼 추가: workspace_id, type, issue_id, assignee_id; 제거: planned_start_date, started_at; 추가: CRITICAL 우선순위), `checklist_items`(ON DELETE CASCADE), `labels`(UNIQUE workspace_id+name), `ticket_labels`(M:N PK), `issues`(self-ref parent_id ON DELETE SET NULL), `members`(UNIQUE user_id+workspace_id) — **사용자 확인 후 진행**
- [X] T007 `src/db/index.ts` — Drizzle 인스턴스: `Pool({ max: 1, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000, ssl: { rejectUnauthorized: false } })` + `drizzle(pool, { schema, logger: dev })`
- [ ] T008 DB 마이그레이션 실행: `npm run db:generate` (마이그레이션 파일 생성) → 생성된 파일 검토 → `npm run db:migrate` 적용 — **사용자가 직접 CLI에서 실행**
- [X] T009 `src/db/seed.ts` — 기본 라벨 6개 시드 스크립트: Frontend(#2b7fff), Backend(#00c950), Design(#ad46ff), Bug(#fb2c36), Docs(#ffac6d), Infra(#615fff) — 워크스페이스 ID 파라미터 지원, `signIn` 콜백에서 호출 가능하도록 함수로 분리

**Checkpoint**: DB 스키마 완료. 이후 User Story 구현 시작 가능.

---

## Phase 3: User Story 1 — Google 로그인 + 워크스페이스 자동 생성 (Priority: P1) 🎯 MVP

**Goal**: Google 계정으로 로그인하면 본인의 칸반 보드로 진입. 최초 로그인 시 워크스페이스 + 멤버 자동 생성. 미인증 접근 시 /login 리다이렉트.

**Independent Test**: Google 계정으로 로그인하면 빈 칸반 보드가 표시되고, 미인증 상태에서 `/`에 접근하면 `/login`으로 이동함을 확인.

### Implementation for User Story 1

- [X] T010 [US1] `src/lib/auth.ts` — NextAuth v5 Google OAuth 설정: `providers: [GoogleProvider]`, `session 콜백` (workspaceId, memberId를 session.user에 포함), `signIn 콜백` (신규 사용자 시 DB 트랜잭션으로 users→workspaces→members→기본라벨 6개 원자적 생성), `auth, handlers, signIn, signOut` export
- [X] T011 [US1] `app/api/auth/[...nextauth]/route.ts` — `export { GET, POST } from '@/lib/auth'` NextAuth 핸들러 등록
- [X] T012 [US1] `app/login/page.tsx` — 로그인 페이지: Tika 로고 + Google 로그인 버튼 (`signIn('google')` 호출), 이미 로그인된 경우 `/`로 리다이렉트
- [X] T013 [US1] `app/layout.tsx` — `SessionProvider` 래핑 추가 (NextAuth 클라이언트 세션 공유), `next-auth/react` import
- [X] T014 [US1] `app/page.tsx` — 서버 컴포넌트: `auth()` 호출 → 미인증 시 `redirect('/login')`, 인증 시 워크스페이스 조회 후 `BoardContainer`에 `initialData` 전달 (Phase 4에서 확장)
- [X] T015 [P] [US1] `src/db/queries/members.ts` — 쿼리 함수: `getMemberByUserId(userId, workspaceId)`, `getMembersByWorkspace(workspaceId)` (Drizzle, workspace-scoped)
- [X] T016 [P] [US1] `app/api/workspaces/route.ts` — `GET /api/workspaces`: `auth()` 세션 검증 → 본인 워크스페이스 조회 → `{ workspaces: [...] }` 반환 (Phase 1: 1개)
- [X] T017 [P] [US1] `app/api/members/route.ts` — `GET /api/members`: `auth()` 세션 검증 → 본인 멤버 조회 → `{ members: [...] }` 반환 (Phase 1: 1명)

**Checkpoint**: Google 로그인 → 빈 보드 화면 표시 + 워크스페이스/멤버 자동 생성. 미인증 접근 차단. ✅ US1 독립 테스트 가능.

---

## Phase 4: User Story 2+3 — 칸반 보드 조회 + 티켓 생성 (Priority: P1) 🎯 MVP 핵심

**Goal**: 4칼럼 칸반 보드에서 티켓 현황 파악, 새 티켓 생성(Backlog 맨 위 배치), 우선순위/마감일/오버듀 표시.

**Independent Test**: 여러 상태의 티켓을 DB에 직접 삽입 후 보드를 열었을 때 각 칼럼에 올바르게 표시되는지, 빈 제목으로 생성 시도 시 에러 메시지가 나오는지 확인.

### Implementation for User Story 2+3

- [X] T018 [US2] `src/db/queries/tickets.ts`
- [X] T019 [US2] `app/api/tickets/route.ts`
- [X] T020 [US5] `app/api/tickets/[id]/route.ts`
- [X] T021 [P] [US2] `src/components/ui/Badge.tsx`
- [X] T022 [P] [US2] `src/components/ui/Button.tsx`
- [X] T023 [P] [US2] `src/components/ui/Modal.tsx`
- [X] T024 [P] [US2] `src/components/board/Board.tsx`
- [X] T025 [P] [US2] `src/components/board/Column.tsx`
- [X] T026 [US2] `src/components/board/TicketCard.tsx`
- [X] T027 [US3] `src/components/ticket/TicketForm.tsx`
- [X] T028 [US2] `src/hooks/useTickets.ts`
- [X] T029 [US2] `app/page.tsx`
- [X] T030 [US2] `src/components/board/BoardContainer.tsx`

**Checkpoint**: 보드 로드 + 티켓 생성(Backlog 배치) + 오버듀 시각화 동작. ✅ US2+US3 독립 테스트 가능.

---

## Phase 5: User Story 4 — 드래그앤드롭 + 낙관적 업데이트 (Priority: P1)

**Goal**: @dnd-kit 기반 칼럼 간 이동 + 칼럼 내 순서 변경, 드롭 즉시 200ms 이내 UI 반영, Done 이동 시 완료 시각 기록, 실패 시 스냅샷 롤백. 모바일 터치 지원.

**Independent Test**: Backlog의 카드를 Done으로 드래그하면 Done 칼럼에 즉시 배치되고, 의도적으로 네트워크를 차단 후 드래그하면 원래 위치로 복원됨을 확인.

### Implementation for User Story 4

- [X] T031 [US4] `app/api/tickets/reorder/route.ts`
- [X] T032 [US4] `src/lib/utils.ts` — rebalancePositions 구현 완료
- [X] T033 [US4] `src/components/board/BoardContainer.tsx` — DndContext + DragOverlay 추가
- [X] T034 [US4] `src/components/board/Column.tsx` — useDroppable + SortableContext 추가
- [X] T035 [US4] `src/components/board/TicketCard.tsx` — useSortable 추가
- [X] T036 [US4] `src/hooks/useTickets.ts` — reorder + optimistic update 구현

**Checkpoint**: 카드 드래그 → 즉시 이동 → API 성공 확인, 실패 시 롤백, Done 완료 시각 기록. ✅ US4 독립 테스트 가능.

---

## Phase 6: User Story 5+6 — 티켓 상세 보기 + 수정 + 삭제 (Priority: P2)

**Goal**: 카드 클릭 시 전체 정보 표시 + 인라인 수정, 삭제 확인 다이얼로그, ESC/외부 클릭 닫기.

**Independent Test**: 카드 클릭 → 상세 모달 오픈 → 제목 수정 후 저장 → 카드에 반영 확인. 삭제 버튼 → 다이얼로그 → 확인 → 카드 사라짐 확인.

### Implementation for User Story 5+6

- [X] T037 [P] [US6] `src/components/ui/ConfirmDialog.tsx`
- [X] T038 [US5] `src/components/ticket/TicketModal.tsx`
- [X] T039 [US5] `src/components/ticket/TicketForm.tsx` — create/edit mode 지원
- [X] T040 [US5] `src/components/board/TicketCard.tsx` — isDragging 클릭 방지 구현
- [X] T041 [US6] `src/hooks/useTickets.ts` — deleteTicket 완성

**Checkpoint**: 카드 클릭 → 상세 모달, 수정 저장 → 카드 반영, 삭제 확인 → 카드 제거. ✅ US5+US6 독립 테스트 가능.

---

## Phase 7: User Story 8 — 체크리스트 세부 작업 추적 (Priority: P2)

**Goal**: 티켓에 최대 20개 체크리스트 항목 추가/토글/삭제, 카드 진행률 표시(완료수/전체수).

**Independent Test**: 티켓에 체크리스트 항목 3개 추가 → 1개 체크 → 카드에 "1/3" 표시 확인. 21번째 항목 추가 시도 → 차단 메시지 확인.

### Implementation for User Story 8

- [X] T042 [US8] `src/db/queries/checklist.ts`
- [X] T043 [P] [US8] `app/api/tickets/[id]/checklist/route.ts`
- [X] T044 [P] [US8] `app/api/tickets/[id]/checklist/[itemId]/route.ts`
- [X] T045 [US8] `src/components/ticket/ChecklistSection.tsx`
- [X] T046 [US8] `src/components/ticket/TicketModal.tsx` — ChecklistSection 연결
- [X] T047 [US8] `src/components/board/TicketCard.tsx` — 진행률 뱃지 이미 구현됨

**Checkpoint**: 상세 모달에서 체크리스트 추가/토글/삭제, 카드에 진행률 표시. ✅ US8 독립 테스트 가능.

---

## Phase 8: User Story 7 — 라벨 분류 + 필터링 (Priority: P2)

**Goal**: 기본 6개 + 커스텀 라벨 생성, 티켓에 최대 5개 부착, 보드 라벨 필터.

**Independent Test**: "Bug" 라벨을 티켓에 부착 → 보드 필터에서 "Bug" 선택 → 해당 티켓만 표시 확인. 워크스페이스 라벨 20개 상태에서 21번째 생성 시도 → 차단 확인.

### Implementation for User Story 7

- [X] T048 [US7] `src/db/queries/labels.ts`
- [X] T049 [P] [US7] `app/api/labels/route.ts`
- [X] T050 [P] [US7] `app/api/labels/[id]/route.ts`
- [X] T051 [P] [US7] `src/components/label/LabelBadge.tsx`
- [X] T052 [US7] `src/components/label/LabelSelector.tsx`
- [X] T053 [US7] `src/hooks/useLabels.ts`
- [X] T054 [US7] `src/components/ticket/TicketModal.tsx` — LabelSelector 연결
- [X] T055 [US7] `src/components/board/TicketCard.tsx` — 라벨 뱃지 이미 구현됨
- [X] T056 [US7] `src/components/ui/FilterBar.tsx`
- [X] T057 [US7] `src/hooks/useTickets.ts` — filteredBoard + toggleLabel + clearLabels 구현

**Checkpoint**: 라벨 생성/부착, 카드 라벨 뱃지, 필터 동작. ✅ US7 독립 테스트 가능.

---

## Phase 9: User Story 9 — 이슈 계층 + 담당자 배정 (Priority: P3)

**Goal**: Goal > Story > Feature 3단계 이슈 계층 CRUD, 티켓에 이슈 연결(자유 레벨 선택), 카드 이슈 태그, 모달 브레드크럼, 담당자 아바타.

**Independent Test**: Goal → Story → Feature 순으로 이슈 생성 후 티켓을 Feature에 연결하면 카드에 Feature 태그 + 모달에 브레드크럼 표시 확인.

### Implementation for User Story 9

- [X] T058 [US9] `src/db/queries/issues.ts`
- [X] T059 [P] [US9] `app/api/issues/route.ts`
- [X] T060 [P] [US9] `app/api/issues/[id]/route.ts`
- [X] T061 [US9] `src/hooks/useIssues.ts`
- [X] T062 [P] [US9] `src/components/issue/IssueBreadcrumb.tsx`
- [X] T063 [P] [US9] `src/components/ui/Avatar.tsx`
- [X] T064 [US9] `src/components/ticket/TicketForm.tsx` — 캐스케이딩 이슈 선택 + 담당자 드롭다운 (초기 create form에 통합)
- [X] T065 [US9] `src/components/ticket/TicketModal.tsx` — IssueBreadcrumb + Avatar 연결
- [X] T066 [US9] `src/components/board/TicketCard.tsx` — 이슈 태그 + 담당자 아바타 이미 구현

**Checkpoint**: 이슈 계층 CRUD, 캐스케이딩 선택, 카드 태그, 모달 브레드크럼, 담당자 아바타. ✅ US9 독립 테스트 가능.

---

## Phase 10: Polish — 반응형 + 접근성 + 빈 상태

**Purpose**: SC-003(오버듀), SC-006(반응형), SC-007(접근성) 달성. US2 시나리오 6 (빈 Backlog 안내).

- [X] T067 `src/components/board/Column.tsx` — 빈 상태 UI 이미 구현됨
- [X] T068 [P] `src/components/board/Board.tsx` — 반응형 grid-cols-1/2/4 이미 구현됨
- [X] T069 [P] 전체 접근성: aria-label, role="dialog"/"alertdialog", label 연결, ESC 닫기 모두 구현됨

**Checkpoint**: 360px/768px/1024px 레이아웃 정상, 키보드만으로 주요 기능 사용, 빈 Backlog 안내. ✅ SC-006, SC-007 달성.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 즉시 시작 가능 — 공유 타입, 상수, 유틸 파일
- **Phase 2 (Foundational)**: Phase 1 완료 후 시작 — DB 스키마가 모든 User Story를 블로킹
- **Phase 3–9 (User Stories)**: Phase 2(T008 마이그레이션 완료) 후 시작 가능
- **Phase 10 (Polish)**: 모든 User Story 완료 후

### User Story Dependencies

- **US1 (Phase 3)**: Phase 2 완료 후 시작. 다른 US에 의존하지 않음.
- **US2+US3 (Phase 4)**: Phase 2 완료 후 시작. US1(auth)이 완료되어야 실제 세션 검증 동작.
- **US4 (Phase 5)**: Phase 4(US2+US3) 완료 후 시작. TicketCard, Column, hooks 확장 필요.
- **US5+US6 (Phase 6)**: Phase 4 완료 후 시작. TicketCard 클릭 핸들러, API 라우트 공유.
- **US8 (Phase 7)**: Phase 6 완료 후 시작. TicketModal 체크리스트 섹션 연결.
- **US7 (Phase 8)**: Phase 6 완료 후 시작. TicketModal 라벨 섹션 연결.
- **US9 (Phase 9)**: Phase 8 완료 후 시작. TicketForm, TicketModal 이슈/담당자 섹션.
- **Polish (Phase 10)**: Phase 9 완료 후 전체 컴포넌트 보강.

### Within Each Phase

- 파일이 다른 [P] 태스크들은 병렬로 실행 가능
- 같은 파일을 순차적으로 확장하는 태스크들은 순서 준수 필요 (예: T026 → T035 → T040 → T047 → T055 → T066)
- DB 쿼리 함수(T018, T042, T048, T058) → API 라우트 → 컴포넌트 순서 준수

---

## Parallel Execution Examples

### Phase 1 (전체 병렬)

```
동시 실행 가능:
  T002: src/types/index.ts
  T003: src/lib/constants.ts
  T004: src/lib/utils.ts
  T005: src/lib/validations.ts
```

### Phase 3 (US1) 후반 병렬

```
T010, T011, T012, T013, T014 순차 완료 후 동시 실행:
  T015: src/db/queries/members.ts
  T016: app/api/workspaces/route.ts
  T017: app/api/members/route.ts
```

### Phase 4 (US2+US3) 병렬

```
T018, T019, T020 순차 완료 후 동시 실행:
  T021: src/components/ui/Badge.tsx
  T022: src/components/ui/Button.tsx
  T023: src/components/ui/Modal.tsx
  T024: src/components/board/Board.tsx
  T025: src/components/board/Column.tsx
그 후 T026 → T027 → T028 → T029 → T030 순차
```

### Phase 8 (US7) 병렬

```
T048 완료 후 동시 실행:
  T049: app/api/labels/route.ts
  T050: app/api/labels/[id]/route.ts
  T051: src/components/label/LabelBadge.tsx
```

---

## Implementation Strategy

### MVP First (US1 + US2+US3 + US4 — P1 Only)

1. Phase 1 Setup 완료 (T001-T005)
2. Phase 2 Foundational 완료 (T006-T009) — **사용자 스키마 확인 필수**
3. Phase 3 US1 완료 (T010-T017) → Google 로그인 동작 검증
4. Phase 4 US2+US3 완료 (T018-T030) → 보드 뷰 + 티켓 생성 검증
5. Phase 5 US4 완료 (T031-T036) → 드래그앤드롭 검증
6. **STOP & VALIDATE**: P1 User Stories 모두 동작, SC-001~SC-005, SC-008 달성 여부 확인
7. Deploy/Demo ready

### Incremental Delivery (P2, P3 추가)

8. Phase 6 US5+US6 → 상세 모달 + 삭제 추가
9. Phase 7 US8 → 체크리스트 추가
10. Phase 8 US7 → 라벨 + 필터 추가
11. Phase 9 US9 → 이슈 계층 + 담당자 추가
12. Phase 10 Polish → 반응형 + 접근성 완성

---

## Notes

- [P] 태스크 = 서로 다른 파일, 선행 태스크 완료 불필요 (병렬 실행 가능)
- [Story] 레이블은 spec.md의 User Story 번호에 대응
- T006(`schema.ts`) 수정 전 반드시 사용자 확인 (CLAUDE.md §6 규칙)
- T008 마이그레이션은 자동 실행 불가 — 사용자가 직접 CLI 실행
- 같은 파일을 여러 Phase에서 확장하는 경우(예: TicketCard T026→T035→T040...) 이전 태스크 완료 후 진행
- 현재 `src/client/, src/server/, src/shared/` 코드는 타겟 구조로 점진 이동 — 기능별로 새 경로에 작성 후 기존 파일 정리
- `'use client'` 디렉티브: 모든 상호작용 컴포넌트, useTickets/useLabels/useIssues 훅 사용 파일에 필수
- 에러 응답 형식 일관성: `{ error: { code: 'ERROR_CODE', message: '...' } }` (CLAUDE.md §8)
