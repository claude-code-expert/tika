# Implementation Plan: Tika — 티켓 기반 칸반 보드 MVP

**Branch**: `001-kanban-board` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-kanban-board/spec.md`

---

## Summary

Tika Phase 1 MVP는 Google OAuth 인증, 워크스페이스 자동 생성, 칸반 보드(4칼럼), 티켓 CRUD, 드래그앤드롭(낙관적 업데이트), 오버듀 표시, 체크리스트, 라벨, 이슈 계층(Goal/Story/Feature), 담당자 배정을 포함하는 풀스택 웹 애플리케이션이다.

현재 코드베이스는 기본 티켓 CRUD (인증·워크스페이스 미적용) 상태이며, 이 플랜은 전체 Phase 1 명세를 완성하기 위한 증분 구현 경로를 정의한다.

---

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), @dnd-kit 6.x, Drizzle ORM 0.38, Zod 3.24, NextAuth.js v5, Tailwind CSS 4
**Storage**: Vercel Postgres (Neon) — Drizzle ORM 경유, 직접 SQL 금지
**Testing**: Jest 29.7, @testing-library/react 16
**Target Platform**: Vercel (serverless edge functions)
**Project Type**: Full-stack web application (Next.js monolith)
**Performance Goals**: API p95 < 200ms | FCP < 2s (300개 티켓 기준) | Drag response < 200ms (낙관적 업데이트)
**Constraints**: 워크스페이스당 최대 300개 티켓 | 티켓당 체크리스트 최대 20개 | 티켓당 라벨 최대 5개 | 워크스페이스당 라벨 최대 20개
**Scale/Scope**: 단일 사용자 1개 워크스페이스 (Phase 1), Vercel 서버리스

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Principle | Status | Notes |
|------|-----------|--------|-------|
| I | Spec-Driven Development | ✅ PASS | spec.md + clarifications 완료 |
| II | Type Safety & Runtime Validation | ✅ PASS | TS strict, Zod 스키마 in `src/shared/validations/`, as const maps 사용 |
| III | Security-First | ✅ PASS | 모든 API route에 `auth()` 세션 검증 선행, httpOnly 쿠키 |
| IV | Data Safety & Migration Discipline | ✅ PASS | Drizzle Kit migration만 사용, schema.ts 수정 시 사용자 확인 필요 |
| V | YAGNI (Minimum Viable Complexity) | ✅ PASS | 기존 스택 내에서 구현, 신규 라이브러리 없음 |
| VI | Optimistic UI with Guaranteed Rollback | ✅ PASS | 드래그앤드롭 낙관적 업데이트 + 실패 시 롤백 명시 |

**Gate II 추가 확인**: `TICKET_PRIORITY`에 `CRITICAL` 추가 필요 (현재 코드에 누락됨)
**Gate III 추가 확인**: 현재 API routes에 인증 없음 → 전체 라우트에 `auth()` 체크 추가 필수

---

## Project Structure

### Documentation (this feature)

```text
specs/001-kanban-board/
├── plan.md              # This file
├── research.md          # Phase 0 research findings
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 quickstart guide
├── contracts/           # Phase 1 API contracts
│   ├── tickets.md
│   ├── checklist.md
│   ├── labels.md
│   ├── issues.md
│   ├── members.md
│   └── workspaces.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (target state — follows CLAUDE.md architecture)

```text
app/
├── api/
│   ├── auth/[...nextauth]/route.ts    # NextAuth 핸들러
│   ├── tickets/
│   │   ├── route.ts                   # GET, POST
│   │   ├── reorder/route.ts           # PATCH
│   │   └── [id]/
│   │       ├── route.ts               # GET, PATCH, DELETE
│   │       └── checklist/
│   │           ├── route.ts           # POST
│   │           └── [itemId]/route.ts  # PATCH, DELETE
│   ├── labels/
│   │   ├── route.ts                   # GET, POST
│   │   └── [id]/route.ts             # PATCH, DELETE
│   ├── issues/
│   │   ├── route.ts                   # GET, POST
│   │   └── [id]/route.ts             # PATCH, DELETE
│   ├── members/route.ts               # GET
│   └── workspaces/route.ts            # GET
├── login/page.tsx                     # 로그인 페이지
├── layout.tsx                         # 루트 레이아웃 (SessionProvider)
└── page.tsx                           # 메인 보드 페이지 (서버 컴포넌트)

src/
├── components/
│   ├── board/
│   │   ├── BoardContainer.tsx         # 클라이언트 컨테이너 (DndContext)
│   │   ├── Board.tsx                  # 4칼럼 그리드
│   │   ├── Column.tsx                 # 단일 칼럼 (SortableContext)
│   │   └── TicketCard.tsx             # 드래그 가능한 카드
│   ├── ticket/
│   │   ├── TicketForm.tsx             # 생성/수정 폼
│   │   ├── TicketModal.tsx            # 상세 모달
│   │   └── ChecklistSection.tsx       # 체크리스트 UI
│   ├── label/
│   │   ├── LabelBadge.tsx
│   │   └── LabelSelector.tsx
│   ├── issue/
│   │   └── IssueBreadcrumb.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Badge.tsx
│       ├── Modal.tsx
│       ├── ConfirmDialog.tsx
│       ├── Avatar.tsx
│       └── FilterBar.tsx
├── db/
│   ├── index.ts                       # Drizzle 인스턴스
│   ├── schema.ts                      # 8개 테이블 정의
│   ├── seed.ts                        # 시드 데이터
│   └── queries/
│       ├── tickets.ts
│       ├── checklist.ts
│       ├── labels.ts
│       ├── issues.ts
│       └── members.ts
├── hooks/
│   ├── useTickets.ts                  # 보드 상태 + 낙관적 업데이트
│   ├── useLabels.ts
│   └── useIssues.ts
├── lib/
│   ├── auth.ts                        # NextAuth 설정
│   ├── constants.ts                   # POSITION_GAP, 제한값
│   ├── validations.ts                 # Zod 스키마 (전체)
│   └── utils.ts                       # groupTicketsByStatus, isOverdue
└── types/
    └── index.ts                       # 공유 타입 중앙 관리

__tests__/
├── api/
│   ├── tickets.test.ts
│   ├── checklist.test.ts
│   ├── labels.test.ts
│   └── issues.test.ts
└── components/
    ├── Board.test.tsx
    ├── TicketCard.test.tsx
    └── TicketForm.test.tsx
```

**Structure Decision**: CLAUDE.md에 정의된 target 아키텍처를 따른다. 현재 코드(`src/client/`, `src/server/`, `src/shared/`)는 target 구조(`src/components/`, `src/db/`, `src/hooks/`, `src/lib/`, `src/types/`)로 마이그레이션하며, 점진적 이동(기능별)으로 진행한다.

---

## Implementation Phases

> 각 Phase는 독립적으로 배포 및 테스트 가능한 단위로 구성된다.

### Milestone A: 기반 — 인증 + 워크스페이스 + DB 스키마

**목표**: 로그인 없이 데이터 접근 불가, 첫 로그인 시 워크스페이스 자동 생성

**작업 목록**:
1. `src/lib/auth.ts` — NextAuth.js v5 Google OAuth 설정 (signIn 콜백에서 user → workspace → member 자동 생성)
2. `app/api/auth/[...nextauth]/route.ts` — NextAuth 핸들러 등록
3. `app/login/page.tsx` — Google 로그인 버튼 페이지
4. `src/db/schema.ts` — users, workspaces, members 테이블 추가, tickets 테이블에 workspace_id, type, issue_id, assignee_id 컬럼 추가 *(사용자 확인 후 진행)*
5. `migrations/` — `npm run db:generate` 후 `npm run db:migrate` 실행
6. `app/layout.tsx` — SessionProvider 래핑 추가
7. `app/page.tsx` — `auth()` 기반 미인증 리다이렉트 처리
8. 모든 기존 API routes에 `auth()` 세션 검증 추가 + workspace_id 스코핑

**완료 기준**: Google 로그인 → 빈 보드 표시, 미인증 접근 시 `/login` 리다이렉트

---

### Milestone B: 핵심 칸반 보드 — 티켓 CRUD + 보드 뷰

**목표**: 티켓 생성/조회/수정/삭제, 칸반 보드 4칼럼 뷰

**작업 목록**:
1. `src/types/index.ts` — TICKET_TYPE, TICKET_PRIORITY(CRITICAL 추가), 전체 공유 타입 업데이트
2. `src/lib/validations.ts` — createTicket, updateTicket, reorder Zod 스키마
3. `src/db/queries/tickets.ts` — workspace-scoped 티켓 쿼리 함수
4. `app/api/tickets/route.ts` — GET (보드 데이터), POST (생성, 300개 제한 체크)
5. `app/api/tickets/[id]/route.ts` — GET (상세), PATCH (부분 수정), DELETE (하드 삭제)
6. `src/components/board/Board.tsx`, `Column.tsx` — 4칼럼 레이아웃
7. `src/components/ticket/TicketCard.tsx` — 카드 UI (우선순위 뱃지, 마감일, 오버듀 표시)
8. `src/components/ticket/TicketForm.tsx` — 생성/수정 폼
9. `src/components/ticket/TicketModal.tsx` — 상세 모달
10. `src/components/ui/ConfirmDialog.tsx` — 삭제 확인
11. `src/lib/utils.ts` — `isOverdue()`, `groupTicketsByStatus()`
12. `src/hooks/useTickets.ts` — 보드 상태 훅 (fetch, create, update, delete)

**완료 기준**: 티켓 생성 → Backlog 배치, 클릭 → 상세 모달, 수정/삭제 동작

---

### Milestone C: 드래그앤드롭 + 오버듀

**목표**: @dnd-kit 기반 카드 이동, 낙관적 업데이트, 오버듀 시각적 경고

**작업 목록**:
1. `app/api/tickets/reorder/route.ts` — PATCH (position 재계산 + status 변경, 트랜잭션)
2. `src/lib/constants.ts` — `POSITION_GAP = 1024` 상수
3. `src/components/board/BoardContainer.tsx` — DndContext, DragOverlay 설정
4. `src/components/board/Column.tsx` — SortableContext (droppable)
5. `src/components/board/TicketCard.tsx` — useSortable (draggable)
6. `src/hooks/useTickets.ts` — 낙관적 업데이트 + 롤백 로직 추가
7. 모바일 터치 드래그 지원 (200ms 딜레이)
8. 오버듀 판정: `src/lib/utils.ts` + `TicketCard.tsx` 시각적 경고 (빨간 테두리 + ⚠)

**완료 기준**: 카드 드래그 → 즉시 이동 → API 실패 시 롤백, 오버듀 카드 경고 표시

---

### Milestone D: 체크리스트

**목표**: 티켓 하위 작업 추가/체크/삭제, 카드 진행률 표시

**작업 목록**:
1. `src/db/schema.ts` — checklist_items 테이블 (milestone A에서 함께 추가됨)
2. `src/db/queries/checklist.ts` — 체크리스트 CRUD 쿼리
3. `app/api/tickets/[id]/checklist/route.ts` — POST (추가, 20개 제한)
4. `app/api/tickets/[id]/checklist/[itemId]/route.ts` — PATCH (토글), DELETE
5. `src/components/ticket/ChecklistSection.tsx` — UI (추가/체크/삭제)
6. `src/components/board/TicketCard.tsx` — 진행률 표시 추가

**완료 기준**: 상세 모달에서 체크리스트 항목 추가/토글/삭제, 카드에 "2/4" 표시

---

### Milestone E: 라벨

**목표**: 색상 라벨 생성/부착/필터링

**작업 목록**:
1. `src/db/schema.ts` — labels, ticket_labels 테이블 (milestone A에서 함께 추가됨)
2. `src/db/queries/labels.ts` — 라벨 CRUD + ticket_labels 조작
3. `app/api/labels/route.ts` — GET, POST (20개 제한)
4. `app/api/labels/[id]/route.ts` — PATCH, DELETE
5. `src/components/label/LabelBadge.tsx`, `LabelSelector.tsx` — UI
6. `src/hooks/useLabels.ts` — 라벨 상태 훅
7. `src/components/board/FilterBar.tsx` — 라벨 필터

**완료 기준**: 기본 라벨 표시, 커스텀 라벨 생성, 티켓에 부착, 필터링 동작

---

### Milestone F: 이슈 계층 + 담당자

**목표**: Goal/Story/Feature 3단계 이슈 계층, 담당자 배정

**작업 목록**:
1. `src/db/schema.ts` — issues 테이블 (milestone A에서 함께 추가됨)
2. `src/db/queries/issues.ts` — 이슈 CRUD
3. `app/api/issues/route.ts` — GET, POST
4. `app/api/issues/[id]/route.ts` — PATCH, DELETE
5. `app/api/members/route.ts` — GET (본인 멤버만)
6. `src/components/issue/IssueBreadcrumb.tsx` — 브레드크럼 UI
7. `src/components/ticket/TicketForm.tsx` — 캐스케이딩 이슈 선택 추가
8. `src/hooks/useIssues.ts` — 이슈 상태 훅
9. `src/components/ui/Avatar.tsx` — 담당자 아바타 (이니셜 + 배경색)

**완료 기준**: 이슈 계층 선택 드롭다운, 카드 이슈 태그, 모달 브레드크럼, 담당자 아바타

---

### Milestone G: 반응형 + 접근성 + 빈 상태

**목표**: 모바일/태블릿 반응형, 키보드 네비게이션, Empty State

**작업 목록**:
1. `src/components/board/Column.tsx` — 빈 Backlog 칼럼 Empty State (안내 텍스트 + 버튼)
2. Tailwind 반응형 클래스 적용 (sm/md/lg 브레이크포인트)
3. 모바일 1칼럼, 태블릿 2칼럼, 데스크톱 4칼럼 레이아웃
4. 키보드 네비게이션 (Tab/Enter/ESC), aria-label 추가

**완료 기준**: 360px/768px/1024px에서 레이아웃 정상, 키보드만으로 주요 기능 사용 가능

---

## Complexity Tracking

*Constitution Gate V 위반 없음. 모든 구현이 기존 스택 내에서 가능하며 신규 라이브러리 없음.*

---

## Risk Assessment

| 위험 | 심각도 | 대응 |
|------|--------|------|
| NextAuth v5 + Next.js 15 호환성 이슈 | Medium | research.md에서 구체적 패턴 사전 검증 |
| Drizzle 스키마 마이그레이션 중 데이터 손실 | High | 개발 DB에서 먼저 테스트, 사용자 확인 후 진행 |
| @dnd-kit 터치 드래그 모바일 이슈 | Low | @dnd-kit/modifiers의 TouchSensor 설정으로 해결 |
| 현재 src/ 구조 → target 구조 마이그레이션 | Medium | 기능별 점진적 이동, 빌드 검증 후 진행 |
| 300개 티켓 제한 체크 API 레이어 | Low | POST /api/tickets에서 COUNT 쿼리로 사전 검증 |
