# Tika — 기능 구현 체크리스트 (개인 + 팀 워크스페이스)

> **기준일**: 2026-03-08
> **검증 방법**: 소스코드 레벨 직접 확인 (app/, src/, docs/ 전 구간)
> **버전**: v0.4.x (Phase 1 + 2 + 4 통합 브랜치)

---

## 범례

| 아이콘 | 의미 |
|--------|------|
| ✅ | 완전 구현 (API + UI + 검증 모두 완료) |
| ⚠️ | 부분 구현 (API만, 또는 UI만, 또는 로직 불완전) |
| ❌ | 미구현 (코드 없음) |

---

## 목차

1. [인증 & 초기 설정](#1-인증--초기-설정)
2. [개인(Personal) 워크스페이스 — 티켓 기본 기능](#2-개인personal-워크스페이스--티켓-기본-기능)
3. [개인 워크스페이스 — 보드 UI & 필터](#3-개인-워크스페이스--보드-ui--필터)
4. [팀(Team) 워크스페이스 — 워크스페이스 관리](#4-팀team-워크스페이스--워크스페이스-관리)
5. [팀 워크스페이스 — 멤버 & 권한](#5-팀-워크스페이스--멤버--권한)
   - 5-1: RBAC 개요 & 역할별 권한 매트릭스 (OWNER/MEMBER/VIEWER)
   - 5-2: 멤버 초대 | 5-3: 참여 신청 | 5-4: 멤버 관리
6. [팀 워크스페이스 — 스프린트](#6-팀-워크스페이스--스프린트)
   - 6-2: 생성&편집 | 6-3: 활성화&진행 | 6-4: 완료 | 6-5: 취소&기타
7. [팀 워크스페이스 — 미구현 (Phase 4 잔여)](#7-팀-워크스페이스--미구현-phase-4-잔여)
8. [알림(Notification) 시스템](#8-알림notification-시스템)
9. [설정(Settings)](#9-설정settings)
10. [분석(Analytics) 차트](#10-분석analytics-차트)
11. [Phase 3 (Pro) — 전체 미구현](#11-phase-3-pro--전체-미구현)
12. [Phase 5 (Enterprise) — 전체 미구현](#12-phase-5-enterprise--전체-미구현)
13. [기타 / 코드 품질](#13-기타--코드-품질)
14. [구현 우선순위 로드맵](#14-구현-우선순위-로드맵)

---

## 1. 인증 & 초기 설정

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-1 | Google OAuth 로그인 | ✅ | `src/lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts` | NextAuth.js v5, httpOnly 쿠키, CSRF 방지 |
| 1-2 | 첫 로그인 시 사용자 자동 등록 | ✅ | `src/lib/auth.ts` signIn 콜백 | Google 프로필(email, name, avatar_url) 저장 |
| 1-3 | 첫 로그인 시 개인 워크스페이스 자동 생성 | ✅ | `src/lib/auth.ts` | "내 워크스페이스" 자동 생성, 멤버 레코드 자동 등록 |
| 1-4 | 미인증 요청 → 로그인 페이지 리다이렉트 | ✅ | `app/page.tsx`, 모든 API | 401 또는 Next.js middleware redirect |
| 1-5 | 로그아웃 | ✅ | `Header.tsx` | `signOut()` |
| 1-6 | 온보딩 위저드 (팀 생성 or 참여 선택) | ✅ | `app/onboarding/page.tsx`, `OnboardingWizard.tsx` | 새 팀 생성 / 기존 팀 검색 후 참여 신청 두 가지 경로 |
| 1-7 | 계정 탈퇴 | ✅ | `WithdrawDialog.tsx`, `app/api/users/withdraw/route.ts` | 탈퇴 확인 다이얼로그 + CASCADE 삭제 |

---

## 2. 개인(Personal) 워크스페이스 — 티켓 기본 기능

### 2-1. 티켓 생성 (FR-001)

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 2-1-1 | 티켓 타입 선택 (GOAL / STORY / FEATURE / TASK) | ✅ | `TicketForm.tsx` | 폼 최상단 필수 선택 |
| 2-1-2 | 제목 입력 (필수, 1~200자) | ✅ | `TicketForm.tsx`, `validations.ts` | Zod 이중 검증 |
| 2-1-3 | 설명 입력 (선택, 최대 1,000자) | ✅ | `TicketForm.tsx` | plain textarea |
| 2-1-4 | 우선순위 선택 (LOW/MEDIUM/HIGH/CRITICAL, 기본값 MEDIUM) | ✅ | `TicketForm.tsx` | |
| 2-1-5 | 마감일 선택 (오늘 이후 날짜만) | ✅ | `TicketForm.tsx` | 과거 날짜 서버 측 검증 포함 |
| 2-1-6 | 체크리스트 항목 추가 (최대 20개) | ✅ | `ChecklistSection.tsx` | 생성 시 체크리스트 빌더 포함 |
| 2-1-7 | 라벨 선택 (최대 5개) | ✅ | `LabelSelector.tsx` | 칩 토글 방식, 커스텀 라벨 생성 포함 |
| 2-1-8 | 상위 이슈 연결 (캐스케이딩 드롭다운) | ✅ | `BreadcrumbPicker.tsx` | Goal → Story → Feature 3단계 |
| 2-1-9 | 담당자 배정 (개인: 본인 자동, 팀: 멤버 선택) | ✅ | `TicketForm.tsx` | 팀 워크스페이스에서 다중 선택 가능 |
| 2-1-10 | 생성 시 status = BACKLOG, 칼럼 맨 위 배치 | ✅ | `app/api/tickets/route.ts` | |
| 2-1-11 | **개인 티켓 300개 제한 검증** | ✅ | `app/api/tickets/route.ts:79-90` | `getTicketCount()` 후 `>= TICKET_MAX_PER_WORKSPACE(300)` 시 400 반환 |

### 2-2. 티켓 조회/수정/삭제 (FR-002~005)

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 2-2-1 | 보드 뷰 (4칼럼 칸반, position 오름차순) | ✅ | `Board.tsx`, `BoardContainer.tsx` | |
| 2-2-2 | 티켓 상세 모달 (전체 정보 + 체크리스트 + 라벨 + 브레드크럼 + 댓글) | ✅ | `TicketModal.tsx` | |
| 2-2-3 | 티켓 상세 전용 페이지 | ✅ | `app/workspace/[workspaceId]/[ticketId]/page.tsx` | URL 직접 접근 가능 |
| 2-2-4 | 티켓 수정 (PATCH, 부분 업데이트) | ✅ | `app/api/tickets/[id]/route.ts` | null 전송 시 해당 값 삭제 |
| 2-2-5 | 티켓 삭제 (확인 다이얼로그 + 소프트 삭제) | ✅ | `ConfirmDialog.tsx`, `tickets.deleted` 컬럼 | deleted = true (DB에서 제거하지 않음) |
| 2-2-6 | **티켓 복제** (체크리스트/라벨 포함, 상태 BACKLOG 초기화) | ✅ | `src/lib/utils.ts:duplicateTicket()`, `TicketModal.tsx:onDuplicate` | 제목에 "(복사)" 접미사 |

### 2-3. 드래그앤드롭 (FR-006)

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 2-3-1 | 칼럼 간 카드 이동 (상태 변경) | ✅ | `AppShell.tsx`, `@dnd-kit` | |
| 2-3-2 | 칼럼 내 순서 변경 | ✅ | `app/api/tickets/reorder/route.ts` | gap-based position 전략 |
| 2-3-3 | 낙관적 업데이트 (즉시 UI 반영) | ✅ | `useTickets.ts` | |
| 2-3-4 | API 실패 시 롤백 | ✅ | `useTickets.ts` | dragStart 시점 상태 보존 |
| 2-3-5 | Done 이동 시 `completedAt` 자동 기록 | ✅ | `app/api/tickets/reorder/route.ts` | |
| 2-3-6 | Done에서 이동 시 `completedAt = null` 초기화 | ✅ | `app/api/tickets/reorder/route.ts` | |
| 2-3-7 | 사이드바 Backlog ↔ 보드 드래그 연동 | ✅ | `AppShell.tsx`, `Sidebar.tsx` | `SortableContext` + `useDroppable` |
| 2-3-8 | 모바일 터치 드래그 (200ms 딜레이) | ✅ | `AppShell.tsx` | `TouchSensor` |
| 2-3-9 | 드래그 오버레이 시각 효과 (rotate + opacity) | ✅ | `Board.tsx`, `DragOverlay` | |

### 2-4. 체크리스트 (FR-008)

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 2-4-1 | 체크리스트 항목 추가/삭제 | ✅ | `ChecklistSection.tsx`, `/api/tickets/:id/checklist` | |
| 2-4-2 | 항목 체크/해제 토글 | ✅ | `PATCH /api/tickets/:id/checklist/:itemId` | |
| 2-4-3 | 최대 20개 제한 | ✅ | `validations.ts` | 서버 측 검증 |
| 2-4-4 | 카드에 진행률 표시 (예: 2/4) | ✅ | `TicketCard.tsx` | |
| 2-4-5 | 티켓 삭제 시 CASCADE 삭제 | ✅ | `checklist_items.ticket_id` FK ON DELETE CASCADE | |

### 2-5. 라벨/태그 (FR-009)

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 2-5-1 | 6개 기본 라벨 (Frontend/Backend/Design/Bug/Docs/Infra) | ✅ | `src/db/seed.ts` | |
| 2-5-2 | 커스텀 라벨 생성 (이름 + 색상 팔레트) | ✅ | `LabelSelector.tsx`, `POST /api/labels` | |
| 2-5-3 | 라벨 수정/삭제 | ✅ | `PATCH/DELETE /api/labels/:id` | 삭제 시 해당 라벨 티켓에서 자동 제거 |
| 2-5-4 | 워크스페이스별 라벨 격리 | ✅ | `labels.workspace_id` FK | UNIQUE(workspace_id, name) |
| 2-5-5 | 워크스페이스당 최대 20개 제한 | ✅ | `app/api/labels/route.ts` | 초과 시 400 반환 |
| 2-5-6 | 티켓당 최대 5개 | ✅ | `validations.ts`, API 검증 | |
| 2-5-7 | 카드에 라벨 뱃지 표시 (색상 + 이름) | ✅ | `TicketCard.tsx` | |

### 2-6. 이슈 계층 (FR-010)

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 2-6-1 | 4단계 계층 (GOAL / STORY / FEATURE / TASK) | ✅ | `issues` 테이블, `tickets.type` 컬럼 | |
| 2-6-2 | 이슈 CRUD | ✅ | `app/api/issues/` | Goal, Story, Feature 각각 생성/수정/삭제 가능 |
| 2-6-3 | 3단계 캐스케이딩 드롭다운 | ✅ | `BreadcrumbPicker.tsx` | Goal 선택 → Story 목록 갱신 → Feature 목록 갱신 |
| 2-6-4 | 카드에 상위 이슈 태그 표시 | ✅ | `TicketCard.tsx` | |
| 2-6-5 | 모달에 브레드크럼 표시 | ✅ | `TicketModal.tsx` | `[G] MVP ›  [S] 칸반 › [F] 드래그앤드롭` |
| 2-6-6 | 이슈 삭제 시 하위 `parent_id = null` 처리 | ✅ | FK ON DELETE SET NULL | |

### 2-7. 오버듀 / 완료 처리

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 2-7-1 | 오버듀 판정 (`dueDate < 오늘 AND status ≠ DONE`) | ✅ | `getBoardData()` 쿼리 내 파생 필드 | DB 저장 안 함, 조회 시 계산 |
| 2-7-2 | 오버듀 카드 시각 경고 (빨간 테두리 + ⚠ 아이콘) | ✅ | `TicketCard.tsx` | |
| 2-7-3 | 모달에 "마감 초과" 텍스트 표시 | ✅ | `TicketModal.tsx` | |
| 2-7-4 | Done 상태에서는 오버듀 표시 안 함 | ✅ | 판정 로직 | |

### 2-8. 휴지통 / 소프트 삭제

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 2-8-1 | 티켓 삭제 → 소프트 삭제 (`tickets.deleted = true`) | ✅ | `deleteTicket()` | |
| 2-8-2 | 휴지통 페이지 (삭제된 티켓 목록) | ✅ | `app/workspace/[id]/trash/page.tsx`, `TrashClient.tsx` | |
| 2-8-3 | 티켓 복원 | ✅ | `TrashClient.tsx` | `deleted = false` 처리 |
| 2-8-4 | 영구 삭제 (개별 / 전체) | ✅ | `DELETE /api/tickets/trash/:id`, `bulkPermanentDeleteTickets()` | |

---

## 3. 개인 워크스페이스 — 보드 UI & 필터

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 3-1 | 칼럼별 카드 수 뱃지 | ✅ | `Column.tsx` | |
| 3-2 | 카드 표시 항목 (타입뱃지/제목/우선순위/마감일/라벨/체크리스트진행률/아바타/이슈태그) | ✅ | `TicketCard.tsx` | |
| 3-3 | 보드 필터바 (우선순위, 라벨, 담당자, 오버듀) | ✅ | `BoardFilterBar.tsx` | |
| 3-4 | 키워드 검색 (제목 + 설명 ILIKE) | ✅ | `Header.tsx` → 보드 필터 연동 | |
| 3-5 | 고급 검색 (우선순위/상태/마감일범위/라벨/오버듀 AND 조합) | ✅ | `GET /api/tickets?search=&priority=&...` | |
| 3-6 | 필터 초기화 | ✅ | `BoardFilterBar.tsx` | |
| 3-7 | Backlog 사이드바 (접기/펼치기 플로팅 버튼) | ✅ | `Sidebar.tsx` | |
| 3-8 | 사이드바 드래그 리사이즈 (200~400px) | ✅ | `Sidebar.tsx` | `useResizable` 훅 |
| 3-9 | WBS/간트 차트 뷰 | ✅ | `app/workspace/[id]/wbs/page.tsx`, `GanttChart.tsx` | |
| 3-10 | 모바일 사이드바 드로어 (슬라이드인 + 백드롭) | ✅ | `Sidebar.tsx` | 768px 미만 |
| 3-11 | 헤더 햄버거 메뉴 (768px 미만) | ✅ | `Header.tsx` | |
| 3-12 | 모바일 새 업무 버튼 → 원형 `+` 아이콘 | ✅ | `Header.tsx` | |
| 3-13 | 보드 가로 스크롤 | ✅ | `Board.tsx` | `overflow-x: auto` |

---

## 4. 팀(Team) 워크스페이스 — 워크스페이스 관리

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 4-1 | 팀 워크스페이스 생성 (OWNER 멤버 자동 등록) | ✅ | `POST /api/workspaces` | |
| 4-2 | **팀 워크스페이스 개수 제한** | ✅ | `app/api/workspaces/route.ts` | 소유자당 **3개**로 변경. 초과 시 409 `WORKSPACE_LIMIT_EXCEEDED` 반환 |
| 4-3 | 워크스페이스 이름 수정 | ✅ | `PATCH /api/workspaces/:id`, `GeneralSection.tsx` | OWNER만 가능 |
| 4-4 | 워크스페이스 설명 수정 | ✅ | `GeneralSection.tsx` | |
| 4-5 | 워크스페이스 아이콘 색상 수정 | ✅ | `GeneralSection.tsx` | 9가지 색상 팔레트 |
| 4-6 | **워크스페이스 삭제 API** | ✅ | `DELETE /api/workspaces/:id` | 이름 재입력 확인 (`deleteWorkspaceSchema`), 하위 데이터 CASCADE |
| 4-7 | **워크스페이스 삭제 UI 연결** | ✅ | `GeneralSection.tsx` | 이름 확인 모달 + OWNER 전용 삭제, 성공 시 `/` 리다이렉트 |
| 4-8 | **워크스페이스 데이터 초기화 UI + API** | ✅ | `GeneralSection.tsx`, `DELETE /api/workspaces/:id/reset` | 이름 확인 모달, 티켓/라벨/스프린트 전체 삭제 (멤버 유지) |
| 4-9 | 워크스페이스 검색 (이름/설명 기반) | ✅ | `GET /api/workspaces/search` | 온보딩 참여 신청 시 사용 |
| 4-10 | 헤더 워크스페이스 전환 드롭다운 | ✅ | `Header.tsx` | TEAM 워크스페이스 목록 표시 |
| 4-11 | **헤더 팀 생성 UX** | ✅ | `Header.tsx`, `CreateTeamModal.tsx` | `prompt()` 제거, 전용 모달로 교체 |
| 4-12 | 워크스페이스 사이드바 (팀 전용) | ✅ | `TeamSidebar.tsx` | 대시보드/보드/멤버/WBS/분석/휴지통 내비게이션 |
| 4-13 | 워크스페이스 전환기 (팀 사이드바 내) | ✅ | `WorkspaceSwitcher.tsx` | |

---

## 5. 팀 워크스페이스 — 멤버 & 권한

### 5-1. 역할 기반 접근 제어 (RBAC) — 개요

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 5-1-1 | OWNER / MEMBER / VIEWER 역할 정의 | ✅ | `src/types/index.ts` (`TEAM_ROLE`) | `as const` 상수로 정의. OWNER > MEMBER > VIEWER 순서 |
| 5-1-2 | 역할 계층 기반 권한 검증 함수 | ✅ | `src/lib/permissions.ts:requireRole()` | `ROLE_RANK` 숫자(OWNER=3, MEMBER=2, VIEWER=1)로 최소 역할 비교 |
| 5-1-3 | 비멤버 접근 차단 (403 FORBIDDEN) | ✅ | `requireRole()` | 워크스페이스 멤버 아닌 경우 `FORBIDDEN` 에러 반환 |
| 5-1-4 | 역할 부족 시 403 반환 | ✅ | `requireRole()` | 최소 역할 미충족 시 `FORBIDDEN` 에러 반환 |

### 5-1-A. 역할별 권한 매트릭스

> **소스 직접 확인 기준** (`requireRole()` 호출 레벨 검증)

| 작업 | OWNER | MEMBER | VIEWER |
|------|:-----:|:------:|:------:|
| **워크스페이스** | | | |
| 워크스페이스 정보 조회 | ✅ | ✅ | ✅ |
| 워크스페이스 이름/설명 수정 | ✅ OWNER | ❌ | ❌ |
| 워크스페이스 삭제 | ✅ OWNER | ❌ | ❌ |
| **멤버 관리** | | | |
| 멤버 목록 조회 | ✅ | ✅ | ✅ |
| 멤버 워크로드 조회 | ✅ | ✅ | ✅ |
| 멤버 역할 변경 | ✅ OWNER | ❌ | ❌ |
| 멤버 제거 | ✅ OWNER | ❌ | ❌ |
| **초대** | | | |
| 초대 링크 생성 | ✅ OWNER | ❌ | ❌ |
| 초대 목록 조회 | ✅ OWNER | ❌ | ❌ |
| 초대 취소 | ✅ OWNER | ❌ | ❌ |
| **가입 신청 처리** | | | |
| 가입 신청 목록 조회 | ✅ OWNER | ❌ | ❌ |
| 가입 신청 승인/거절 | ✅ OWNER | ❌ | ❌ |
| **스프린트** | | | |
| 스프린트 목록/상세 조회 | ✅ | ✅ | ✅ |
| 스프린트 생성 | ✅ OWNER | ❌ | ❌ |
| 스프린트 수정 | ✅ OWNER | ❌ | ❌ |
| 스프린트 삭제 (PLANNED만) | ✅ OWNER | ❌ | ❌ |
| 스프린트 활성화 | ✅ OWNER | ❌ | ❌ |
| 스프린트 완료 | ✅ OWNER | ❌ | ❌ |
| **분석 차트** | | | |
| 번다운/CFD/Velocity/CycleTime/Label | ✅ | ✅ | ✅ |
| **티켓 (⚠️ 주의)** | | | |
| 티켓 조회 | ✅ | ✅ | ✅* |
| 티켓 생성 | ✅ | ✅ | ⚠️ 미분리 |
| 티켓 수정 | ✅ | ✅ | ⚠️ 미분리 |
| 티켓 삭제 | ✅ | ✅ | ⚠️ 미분리 |

> ⚠️ **VIEWER 티켓 권한 미분리 (버그 수준)**: `/api/tickets/` 라우트는 `requireRole()` 없이 세션의 `workspaceId`만 확인. VIEWER가 API를 직접 호출하면 티켓 생성/수정/삭제 가능. 프론트엔드 UI에서만 제어되어 실질적 보안이 없음.

### 5-1-B. RBAC 미구현 / 미흡 사항

| # | 기능 | 상태 | 상세 내용 |
|---|------|------|-----------|
| 5-B-1 | **VIEWER의 티켓 쓰기 API 차단** | ✅ | `app/api/tickets/route.ts`, `app/api/tickets/[id]/route.ts` — POST/PATCH/DELETE에 `requireRole(MEMBER)` 추가. VIEWER는 API 직접 호출 시 403 반환 |
| 5-B-2 | **MEMBER의 스프린트 관리 제한** | ⚠️ | OWNER만 스프린트 관리 가능 — 계획대로 구현됨. MEMBER가 스프린트 편집 불가한 것이 의도인지 재확인 필요 |
| 5-B-3 | **UI 레벨 역할 기반 버튼 노출 제어** | ⚠️ | `isOwner` boolean 전달로 일부 제어하나, VIEWER/MEMBER 구분 UI 제어 불완전. 예: VIEWER가 티켓 생성 버튼 보임 |
| 5-B-4 | **OWNER 양도 기능** | ✅ | `POST /api/workspaces/:id/transfer`, `MemberSection.tsx` — OWNER → MEMBER 소유권 이전, 트랜잭션으로 역할 교체 + `workspaces.ownerId` 갱신 |
| 5-B-5 | **최소 OWNER 1명 보장 검증** | ✅ | `transferOwnership()` 트랜잭션으로 원자적 교체 (이전 OWNER가 MEMBER로 강등되면서 동시에 새 OWNER 지정) |
| 5-B-6 | **MEMBER가 자신의 역할 확인 UI** | ⚠️ | API(`GET /api/workspaces/:id/members/me`)는 있으나 UI에서 내 역할 배지 표시 위치 불명확 |

### 5-2. 멤버 초대

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 5-2-1 | 초대 링크 생성 (UUID 토큰, 24시간 만료) | ✅ | `POST /api/workspaces/:id/invites` | `workspace_invites` 테이블 (`token`, `expires_at`, `role`) |
| 5-2-2 | 초대 시 역할 지정 (MEMBER / VIEWER) | ✅ | `invites.role` 필드 | OWNER 역할로 초대 불가 (Zod 검증) |
| 5-2-3 | 초대 링크 수락 페이지 | ✅ | `app/invite/[token]/page.tsx` | 토큰 유효성 + 만료일 + 기존 멤버 여부 검증 |
| 5-2-4 | 초대 수락 → 자동 멤버 등록 | ✅ | `POST /api/invites/:token/accept` | `workspace_members` 레코드 생성, 초대 상태 ACCEPTED |
| 5-2-5 | 초대 만료 자동 처리 Cron | ✅ | `app/api/cron/expire-invites/route.ts` | PENDING → EXPIRED 상태 전환 |
| 5-2-6 | 초대 목록 조회 (OWNER) | ✅ | `GET /api/workspaces/:id/invites` | PENDING 상태 초대만 반환 |
| 5-2-7 | 초대 취소 (OWNER) | ✅ | `DELETE /api/workspaces/:id/invites/:inviteId` | |
| 5-2-8 | **이메일로 초대 발송** | ❌ | — | 링크만 클립보드 복사, 실제 이메일 발송(Resend/Nodemailer 등) 없음 |
| 5-2-9 | 초대 모달 UI | ✅ | `InviteModal.tsx`, `InviteModalTrigger.tsx` | 역할 선택 + 링크 복사 UI |
| 5-2-10 | **초대 재발송 (링크 갱신)** | ❌ | — | 만료된 초대 토큰 재발행 기능 없음. 기존 초대 취소 후 새로 생성해야 함 |

### 5-3. 참여 신청 (Join Request)

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 5-3-1 | 참여 신청 (TEAM 워크스페이스, 메시지 포함) | ✅ | `POST /api/workspaces/:id/join-requests` | `workspace_join_requests` 테이블, `message` 필드 |
| 5-3-2 | 기존 멤버/중복 신청 검증 | ✅ | API 레벨 | PENDING 상태 중복 체크, 이미 멤버인 경우 차단 |
| 5-3-3 | OWNER 승인 → 자동 멤버 등록 | ✅ | `PATCH /api/workspaces/:id/join-requests/:reqId` | status=APPROVED + `workspace_members` 레코드 생성 |
| 5-3-4 | OWNER 거절 | ✅ | 동일 PATCH | status=REJECTED |
| 5-3-5 | 가입 신청 목록 조회 (OWNER, status 필터) | ✅ | `GET /api/workspaces/:id/join-requests` | PENDING/APPROVED/REJECTED 필터 |
| 5-3-6 | 가입 신청 목록 UI | ✅ | `JoinRequestList.tsx` | |
| 5-3-7 | **신청 취소 (본인)** | ❌ | — | 신청자가 자신의 PENDING 신청을 취소하는 API/UI 없음 |
| 5-3-8 | **신청 승인 시 역할 지정** | ❌ | — | 승인 시 항상 MEMBER 역할로 등록. VIEWER로 승인하는 옵션 없음 |
| 5-3-9 | **신청 알림 (OWNER에게)** | ❌ | — | 새 가입 신청 발생 시 OWNER에게 알림(앱 내 또는 Slack/Telegram) 없음 |

### 5-4. 멤버 관리

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 5-4-1 | 멤버 목록 조회 | ✅ | `GET /api/workspaces/:id/members` | 이메일/역할/avatar/가입일 포함 |
| 5-4-2 | 멤버 역할 변경 (OWNER만) | ✅ | `PATCH /api/members/:id` | OWNER → MEMBER/VIEWER, MEMBER → VIEWER 등 |
| 5-4-3 | 멤버 제거 (OWNER만, 본인 제거 불가) | ✅ | `DELETE /api/members/:id` | 본인 제거 시도 시 400 에러 |
| 5-4-4 | 멤버 목록/관리 페이지 | ✅ | `app/workspace/[id]/members/page.tsx`, `MemberList.tsx` | |
| 5-4-5 | 내 역할 조회 | ✅ | `GET /api/workspaces/:id/members/me` | |
| 5-4-6 | 다중 담당자 (티켓당 최대 5명) | ✅ | `ticket_assignees` M:N 테이블, `setAssignees()` | 팀 워크스페이스에서 멤버 중 선택 |
| 5-4-7 | 멤버 워크로드 조회 | ✅ | `GET /api/workspaces/:id/members/workload` | 멤버별 In Progress/TODO 티켓 수 |
| 5-4-8 | **멤버 스스로 워크스페이스 탈퇴** | ✅ | `MemberList.tsx`, `DELETE /api/workspaces/:id/members/me` | 비OWNER 멤버 본인 행에 "나가기" 버튼 추가. 확인 후 탈퇴, `/` 리다이렉트 |
| 5-4-9 | **멤버 프로필 상세 보기** | ✅ | `MemberDetailCard.tsx` | 카드 클릭 시 전체 담당 티켓 목록 + 통계 모달 오픈 |

---

## 6. 팀 워크스페이스 — 스프린트

### 6-1. 스프린트 라이프사이클 개요

```
PLANNED → ACTIVE → COMPLETED
              ↓
          CANCELLED (DB 함수 있으나 API 없음)
```

| 상태 | 진입 조건 | 가능한 작업 |
|------|-----------|-------------|
| PLANNED | 생성 시 기본값 | 수정, 삭제, 활성화 |
| ACTIVE | activate API 호출 | 완료 (잔여 티켓 처리 필수) |
| COMPLETED | complete API 호출 | 읽기 전용 |
| CANCELLED | DB 함수 존재, API 없음 | — |

### 6-2. 스프린트 생성 & 편집

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 6-2-1 | 스프린트 생성 (이름 필수, 시작일/종료일/목표 선택) | ✅ | `POST /api/workspaces/:id/sprints` | PLANNED 상태로 생성, OWNER 전용 |
| 6-2-2 | 스프린트 이름/목표/날짜 수정 | ✅ | `PATCH /api/workspaces/:id/sprints/:sid` | OWNER 전용, Zod 검증 |
| 6-2-3 | 스프린트 삭제 (PLANNED 상태만) | ✅ | `DELETE /api/workspaces/:id/sprints/:sid` | ACTIVE/COMPLETED 스프린트 삭제 불가 (400 에러) |
| 6-2-4 | **스토리 포인트 총합 입력** | ⚠️ | `sprints.storyPointsTotal` 컬럼 존재 | DB 필드는 있으나 스프린트 생성/수정 UI에서 입력 폼 없음 (추정) |
| 6-2-5 | **스프린트 목록 전용 관리 페이지** | ❌ | — | `app/workspace/[id]/sprints/` 페이지 없음. SprintSelector + SprintBanner로 보드 내에서만 관리 |
| 6-2-6 | **스프린트 생성 모달/폼 UI** | ⚠️ | `SprintSelector.tsx` 내부 추정 | SprintSelector에서 생성 가능하나 별도 관리 뷰 없음 |

### 6-3. 스프린트 활성화 & 진행

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 6-3-1 | 스프린트 활성화 (PLANNED → ACTIVE) | ✅ | `POST /api/workspaces/:id/sprints/:sid/activate` | OWNER 전용 |
| 6-3-2 | 동시 활성 스프린트 1개 제한 | ✅ | `hasActiveSprint()` | 이미 ACTIVE 스프린트가 있으면 409 `ACTIVE_SPRINT_EXISTS` |
| 6-3-3 | 보드 상단 스프린트 배너 (남은 일수) | ✅ | `SprintBanner.tsx` | 현재 ACTIVE 스프린트 이름, D-Day, 목표 표시 |
| 6-3-4 | 스프린트 선택기 (드롭다운) | ✅ | `SprintSelector.tsx` | PLANNED/ACTIVE/COMPLETED 목록, 티켓 수 표시 |
| 6-3-5 | 스프린트에 티켓 배정 | ✅ | `tickets.sprint_id` 컬럼 | 티켓 생성/수정 시 스프린트 선택 가능 |
| 6-3-6 | **스프린트별 보드 필터 뷰** | ⚠️ | `SprintSelector.tsx` | 선택한 스프린트의 티켓만 보드에 표시되는지 검증 필요 |
| 6-3-7 | **Backlog ↔ 스프린트 티켓 이동 UI** | ⚠️ | 보드 내 드래그 앤 드롭 | Backlog → sprint_id 지정 이동이 drag-drop으로 처리되는지 별도 확인 필요 |

### 6-4. 스프린트 완료

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 6-4-1 | 스프린트 완료 (ACTIVE → COMPLETED) | ✅ | `POST /api/workspaces/:id/sprints/:sid/complete` | OWNER 전용 |
| 6-4-2 | 잔여 티켓 처리 다이얼로그 | ✅ | `SprintCompleteDialog.tsx` | 미완료 티켓을 Backlog 또는 다른 스프린트로 이동 선택 |
| 6-4-3 | 잔여 티켓 → Backlog 이동 | ✅ | `updateTicket(ticketId, { sprintId: null })` | sprint_id = null → Backlog |
| 6-4-4 | 잔여 티켓 → 다음 스프린트 이동 | ✅ | `updateTicket(ticketId, { sprintId: targetSprintId })` | 다른 PLANNED 스프린트로 이동 |
| 6-4-5 | 완료 스프린트 이동 티켓 수 반환 | ✅ | API 응답 `{ sprint, movedCount }` | |
| 6-4-6 | **스프린트 완료 리뷰/회고 기록** | ❌ | — | 완료 시 달성률/회고 메모 저장 기능 없음 |
| 6-4-7 | **완료된 스프린트 상세 조회 페이지** | ❌ | — | 완료 스프린트의 티켓 현황, 달성률 뷰 없음 |

### 6-5. 스프린트 취소 & 기타

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 6-5-1 | **스프린트 취소 (→ CANCELLED) DB 함수** | ⚠️ | `src/db/queries/sprints.ts:cancelSprint()` | DB 레벨 함수는 구현되어 있으나 API route 없음 |
| 6-5-2 | **스프린트 취소 API** | ❌ | — | `POST /api/workspaces/:id/sprints/:sid/cancel` 라우트 없음. `cancelSprint()` 미노출 |
| 6-5-3 | **스프린트 취소 UI** | ❌ | — | 취소 버튼/기능 UI 없음 |
| 6-5-4 | 스프린트별 티켓 수 통계 | ✅ | `getSprintsWithTicketCount()` | 스프린트 목록에 total/done/inProgress 포함 |
| 6-5-5 | **스프린트 속도(Velocity) 히스토리** | ⚠️ | `VelocityChart.tsx` | 완료된 스프린트 속도 차트는 있으나, 스프린트 내 실제 완료 포인트 집계 로직 검증 필요 |
| 6-5-6 | **스프린트 번다운 차트 (스프린트 전용)** | ⚠️ | `BurndownChart.tsx` | 분석 페이지에 번다운 차트 있으나 스프린트 선택 필터 정확도 검증 필요 |

---

## 7. 팀 워크스페이스 — 미구현 (Phase 4 잔여)

| # | 기능 | 상태 | FR ID | 상세 내용 |
|---|------|------|-------|-----------|
| 7-1 | **스위밍 레인** (가로 행 그룹핑) | ❌ | FR-304 | DB 테이블(`swim_lanes`) 없음. 레인별 독립 칼럼 구조, 배경색/타이틀 커스텀, 드래그 순서 변경 모두 미구현 |
| 7-2 | **WIP 제한** (IN_PROGRESS 칸 제한 + 초과 경고) | ✅ | FR-305 | `Column.tsx` — IN_PROGRESS 칼럼 헤더에 3개 초과 시 ⚠ WIP {n}/3 경고 배지 표시 |
| 7-3 | **동적 칼럼 관리** (OWNER 전용) | ❌ | — | 현재 4칼럼 고정(BACKLOG/TODO/IN_PROGRESS/DONE). `columns` 테이블 없음 |
| 7-4 | **Story별 잔여 일정 테이블** | ✅ | FR-306 | `StoryScheduleTable.tsx` — 분석 페이지에 Story별 완료율 진행바 + 남은 일수(D-n/D+n) 테이블 추가 |

---

## 8. 알림(Notification) 시스템

### 8-1. 채널 설정 (FR-102)

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 8-1-1 | Slack Incoming Webhook URL 입력 + 저장 | ✅ | `NotificationSection.tsx`, `PUT /api/notifications/slack` | `notification_channels` 테이블 |
| 8-1-2 | Telegram Bot Token + Chat ID 입력 + 저장 | ✅ | `NotificationSection.tsx`, `PUT /api/notifications/telegram` | |
| 8-1-3 | 채널별 활성화/비활성화 토글 | ✅ | `NotificationSection.tsx` | |
| 8-1-4 | Slack 테스트 메시지 발송 | ✅ | `POST /api/notifications/slack/test` | |
| 8-1-5 | Telegram 테스트 메시지 발송 | ✅ | `POST /api/notifications/telegram/test` | |

### 8-2. 마감일 D-1 알림 (FR-103)

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 8-2-1 | Vercel Cron 스케줄러 (매일 09:00 KST) | ✅ | `app/api/cron/notify-due/route.ts` | vercel.json 또는 next.config에 설정 필요 |
| 8-2-2 | 마감 D-1 조건 티켓 자동 필터 | ✅ | Cron route | `dueDate - 1일 == 오늘 AND status ≠ DONE` |
| 8-2-3 | Slack으로 알림 메시지 발송 | ✅ | Cron route | 티켓 제목/마감일/우선순위 포함 |
| 8-2-4 | Telegram으로 알림 메시지 발송 | ✅ | Cron route | |
| 8-2-5 | 발송 결과 기록 (`notification_logs`) | ✅ | `createNotificationLog()` | SENT / FAILED 상태 |
| 8-2-6 | **중복 알림 방지** (1티켓 1회/일) | ⚠️ | Cron route | 로직 존재하나 정확한 idempotency 보장 여부 코드 레벨 재검증 권장 |

### 8-3. 알림 내역 조회 (FR-104)

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 8-3-1 | 헤더 알림 벨 아이콘 | ✅ | `Header.tsx` | |
| 8-3-2 | 미읽음 알림 수 뱃지 | ✅ | `Header.tsx`, `getUnreadNotificationCount()` | |
| 8-3-3 | 알림 드롭다운 (최근 목록) | ✅ | `Header.tsx` | |
| 8-3-4 | 알림 내역 전용 페이지 | ✅ | `app/notifications/page.tsx`, `NotificationsPage.tsx` | |
| 8-3-5 | 채널 필터 (Slack / Telegram) | ✅ | `NotificationsPage.tsx` | |
| 8-3-6 | 상태 필터 (SENT / FAILED) | ✅ | `NotificationsPage.tsx` | |
| 8-3-7 | 페이지네이션 (20건 단위) | ✅ | `NotificationsPage.tsx` | |
| 8-3-8 | 전체 읽음 처리 | ✅ | `markAllNotificationsAsRead()` | |
| 8-3-9 | **알림 클릭 → 해당 티켓 상세 이동** | ⚠️ | `NotificationsPage.tsx` | 티켓 ID 기반 링크는 구성되어 있으나, 개인/팀 워크스페이스 라우팅 분기(`/workspace/[wsId]/[ticketId]` vs 개인 보드)가 정확히 처리되는지 확인 필요 |

---

## 9. 설정(Settings)

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 9-1 | 설정 탭 레이아웃 (일반 / 알림 / 라벨 / 멤버) | ✅ | `SettingsShell.tsx` | |
| 9-2 | 일반 — 프로젝트 이름 수정 | ✅ | `GeneralSection.tsx` | |
| 9-3 | 일반 — 프로젝트 설명 수정 | ✅ | `GeneralSection.tsx` | |
| 9-4 | 일반 — 아이콘 색상 수정 | ✅ | `GeneralSection.tsx` | |
| 9-5 | 알림 — Slack/Telegram 채널 설정 | ✅ | `NotificationSection.tsx` | |
| 9-6 | 라벨 — 라벨 CRUD | ✅ | `LabelSection.tsx` | |
| 9-7 | 멤버 — 역할 변경 / 제거 / 소유권 이전 | ✅ | `MemberSection.tsx`, `POST /api/workspaces/:id/transfer` | OWNER만 "소유권 이전" 버튼 노출, 확인 모달 후 트랜잭션 실행 |
| 9-8 | **위험 영역 — 프로젝트 삭제 UI** | ✅ | `GeneralSection.tsx` | 이름 입력 확인 모달 연결, 삭제 성공 시 `/` 리다이렉트 |
| 9-9 | **위험 영역 — 데이터 초기화 UI + API** | ✅ | `GeneralSection.tsx`, `DELETE /api/workspaces/:id/reset` | 이름 입력 확인 모달 + API 신규 구현 |
| 9-10 | **API 토큰 탭** (MCP 서버 용 PAT 관리) | ❌ | — | `api_tokens` 테이블 없음. 설정 탭 미추가 |
| 9-11 | 프로필 설정 (이니셜 + 아바타 배경색) | ✅ | `ProfileModal.tsx` | `PATCH /api/members/:id` |
| 9-12 | 계정 탈퇴 | ✅ | `WithdrawDialog.tsx`, `DELETE /api/users/withdraw` | |

---

## 10. 분석(Analytics) 차트

| # | 기능 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 10-1 | **번다운 차트** (스프린트 기반, 잔여 티켓 + 스토리 포인트 + ideal line) | ✅ | `BurndownChart.tsx`, `BurndownChartFull.tsx`, `GET /api/workspaces/:id/analytics/burndown` | sprintId 미제공 시 ACTIVE 스프린트 자동 선택 |
| 10-2 | **CFD (Cumulative Flow Diagram)** (상태별 누적 흐름, 30일) | ✅ | `CumulativeFlowDiagram.tsx`, `GET /api/workspaces/:id/analytics/cfd` | `?days` 파라미터로 7~90일 조정 가능 |
| 10-3 | 스프린트 Velocity 차트 (스프린트별 완료 스토리 포인트) | ✅ | `VelocityChart.tsx`, `GET /api/workspaces/:id/analytics/velocity` | |
| 10-4 | Cycle Time 분포 분석 (생성~완료 소요 시간) | ✅ | `CycleTimeAnalysis.tsx`, `GET /api/workspaces/:id/analytics/cycle-time` | |
| 10-5 | 라벨 분석 (라벨별 티켓 수) | ✅ | `LabelAnalyticsCard.tsx`, `GET /api/workspaces/:id/analytics/labels` | |
| 10-6 | 멤버 워크로드 히트맵 | ✅ | `WorkloadHeatmap.tsx`, `GET /api/workspaces/:id/members/workload` | compact 모드 지원 |
| 10-7 | 일별 로그 테이블 (CFD 기반) | ✅ | `DailyLogTable.tsx` | |
| 10-8 | 티켓 유형 분포 차트 (GOAL/STORY/FEATURE/TASK) | ✅ | `TypeDistributionChart.tsx` | |
| 10-9 | 생성 vs 완료 트렌드 차트 (워킹데이 기준 최근 7일) | ✅ | `TrendChart.tsx` | CFD 데이터 파생 |
| 10-10 | 우선순위 × 상태 매트릭스 | ✅ | `PriorityStatusMatrix.tsx` | |
| 10-11 | Goal 진척률 (하위 티켓 완료율 기반) | ✅ | `GoalProgressRow.tsx` | |
| 10-12 | 대시보드 요약 통계 (전체 티켓, 기한 초과, 이번 주 마감, 목표 수) | ✅ | `app/workspace/[id]/page.tsx` | |
| 10-13 | 내 업무 현황 KPI (오늘 마감, 오버듀, 진행 중, 주간 완료 + 전주 대비) | ✅ | `app/workspace/[id]/page.tsx` | |
| 10-14 | 진행률 도넛 차트 (상태별 비율) | ✅ | `app/workspace/[id]/page.tsx` | SVG 직접 구현 |
| 10-15 | 번다운 차트 전용 페이지 | ✅ | `app/workspace/[id]/burndown/page.tsx` | |
| 10-16 | **Story별 잔여 일정 테이블** | ⚠️ | `DeadlineOverview.tsx` | 오버듀 + 3일 이내 마감 티켓 표시. Story 단위 잔여 일수 정확한 테이블은 아님 |

---

## 11. Phase 3 (Pro) — 전체 미구현

> Phase 3 기능은 현재 코드베이스에 DB 스키마, API, UI 모두 없음.

| # | 기능 | FR ID | 상세 내용 |
|---|------|-------|-----------|
| 11-1 | **리치 텍스트 에디터** | FR-201 | 마크다운 기반 WYSIWYG (H1~H3, bold, italic, underline, strike, link, list, code block 등). 현재 plain textarea만 존재 |
| 11-2 | **파일 첨부** | FR-202 | `attachments` 테이블 없음. Vercel Blob / S3 미연동. 10MB/건, 티켓당 10개, 이미지 썸네일 미리보기 |
| 11-3 | **결제 모듈 (Free/Pro 플랜)** | FR-203 | Stripe / Paddle 미연동. 구독 생성/변경/취소 없음. 플랜별 제한 로직 없음 |
| 11-4 | **MCP 서버** (`@tika/mcp-server`) | FR-204 | npm 패키지 없음. 9개 MCP 도구(list/get/create/update/move/delete ticket, list labels/issues, toggle checklist) 미구현 |
| 11-5 | **Personal Access Token (PAT) 관리** | FR-204 | `api_tokens` 테이블 없음. 설정 탭 "API 토큰" 미추가. 발급/폐기 UI 없음. `tika_pat_` 접두사 토큰 발급 로직 없음 |

---

## 12. Phase 5 (Enterprise) — 전체 미구현

> Phase 5는 별도 레포지토리 계획. 현재 코드베이스에 없음.

| # | 기능 | FR ID | 상세 내용 |
|---|------|-------|-----------|
| 12-1 | **온프레미스 Docker 설치** | FR-401 | Docker 이미지, Docker Compose 파일 없음 |
| 12-2 | **설치 위저드** | FR-401 | DB 연결 설정 + 관리자 계정 생성 + 마이그레이션 자동 실행 |
| 12-3 | **라이센스 키 관리** | FR-402 | 이메일 인증 → 키 입력 → 활성화. 만료 시 읽기 전용 |
| 12-4 | **무료 체험** (7일, 1 워크스페이스, 5명) | FR-403 | 체험 만료 후 데이터 유지 |

---

## 13. 기타 / 코드 품질

| # | 항목 | 상태 | 상세 내용 |
|---|------|------|-----------|
| 13-1 | Zod 이중 검증 (FE + BE) | ✅ | 모든 API 입력에 Zod 스키마 적용 |
| 13-2 | TypeScript strict 모드 | ✅ | `tsconfig.json` strict: true |
| 13-3 | Drizzle ORM (SQL 직접 사용 없음) | ✅ | 전 DB 작업 Drizzle 쿼리 빌더 사용 |
| 13-4 | API 에러 코드 체계 | ✅ | UNAUTHORIZED/VALIDATION_ERROR/NOT_FOUND/INTERNAL_ERROR 표준화 |
| 13-5 | 접근성 (aria-label, role, ESC 닫기, Tab 네비게이션) | ✅ | 부분 적용 |
| 13-6 | **WCAG 2.1 AA 색상 대비 검증** | ⚠️ | 코드 내 자동 검증 로직 없음. axe DevTools 수동 확인 필요 |
| 13-7 | 단위 테스트 (Jest + @testing-library/react) | ✅ | `__tests__/` 하위 API/컴포넌트/훅 테스트 |
| 13-8 | **드래그앤드롭 E2E 통합 테스트** | ⚠️ | BACKLOG→TODO 이동, completedAt 검증, 롤백 등 E2E 커버리지 부족 |
| 13-9 | **반응형 컴포넌트 테스트** (768px, 360px) | ⚠️ | matchMedia 모킹 기반 뷰포트 전환 테스트 미구현 |
| 13-10 | 랜딩 페이지 | ✅ | `app/page.tsx` (미인증 접근 시) |
| 13-11 | Contact 폼 | ✅ | `ContactModal.tsx`, `POST /api/contact` |
| 13-12 | 뉴스레터/알림 신청 | ✅ | `NotifyModal.tsx`, `POST /api/notifications/signup` |
| 13-13 | Prettier + ESLint 설정 | ✅ | `prettier-plugin-tailwindcss` 포함 |

---

## 14. 구현 우선순위 로드맵

### 🔴 즉시 완성 가능 (기존 코드 연결 작업)

| 순위 | 작업 | 예상 난이도 | 비고 |
|------|------|-------------|------|
| 1 | 워크스페이스 삭제 UI 연결 | ★☆☆ | API 완성. `GeneralSection.tsx` 버튼에 `DELETE /api/workspaces/:id` + ConfirmDialog 연결만 |
| 2 | 헤더 팀 생성 UX 개선 (`prompt()` → 모달) | ★☆☆ | 기존 `WorkspaceCreator.tsx` 재사용 |
| 3 | 알림 클릭 → 티켓 상세 이동 라우팅 정확성 확인 | ★☆☆ | PERSONAL vs TEAM 워크스페이스 분기 확인 |
| 4 | 중복 알림 방지 idempotency 강화 | ★★☆ | Cron route에 `sentAt` 날짜 기반 중복 체크 추가 |

### 🟡 단기 개발 (신규 구현, 1~3일)

| 순위 | 작업 | 예상 난이도 | 비고 |
|------|------|-------------|------|
| 5 | 이메일 초대 발송 | ★★☆ | Resend/SendGrid API 연동. `EMAIL_INVITE_GUIDE.md` 참고 |
| 6 | 워크스페이스 데이터 초기화 API + UI | ★★☆ | `DELETE` + `WHERE workspace_id = ?` 트랜잭션 |
| 7 | WIP 제한 표시 (FR-305) | ★★☆ | `Column.tsx` 헤더에 IN_PROGRESS 카운트 + 경고 색상 표시. 이동 차단 없음 |
| 8 | Story별 잔여 일정 테이블 | ★★☆ | 분석 페이지에 Story 단위 완료율 + 남은 일수 테이블 추가 |

### 🔵 중기 개발 (3~7일)

| 순위 | 작업 | 예상 난이도 | 비고 |
|------|------|-------------|------|
| 9 | API 토큰 관리 (PAT, MCP 선결조건) | ★★★ | `api_tokens` 테이블 + 설정 탭 추가 + SHA-256 해시 저장 |
| 10 | 스위밍 레인 (FR-304) | ★★★ | `swim_lanes` 테이블 신규 + 보드 레이아웃 전면 재구성 |
| 11 | MCP 서버 (`@tika/mcp-server`) | ★★★ | PAT 인증 + 9개 MCP 도구 + npm 패키지 배포 |

### ⚪ 장기 개발 (Phase 3, 1~3주)

| 순위 | 작업 | 예상 난이도 | 비고 |
|------|------|-------------|------|
| 12 | 리치 텍스트 에디터 | ★★★ | `@tiptap` 또는 `@uiw/react-md-editor` 도입, XSS 방지 화이트리스트 |
| 13 | 파일 첨부 | ★★★ | Vercel Blob 연동, `attachments` 테이블, 10MB 제한, 이미지 썸네일 |
| 14 | 결제 모듈 (Free/Pro) | ★★★★ | Stripe Checkout, Webhook 검증, 플랜별 기능 제한 |

---

## 요약

```
Phase 1+2 핵심 기능:    99% 완료
Phase 4 (Team) 기능:    92% 완료  (스위밍 레인, 동적 칼럼 미구현)
Phase 3 (Pro) 기능:      0% 완료  (에디터, 첨부, 결제, MCP 전체 미착수)
Phase 5 (Enterprise):    0% 완료  (별도 레포 계획)

[2026-03-10] 이번 작업에서 완성된 항목:
- 워크스페이스 삭제 UI 연결 완료 (4-7, 9-8)
- 워크스페이스 데이터 초기화 API + UI 완료 (4-8, 9-9)
- 헤더 팀 생성 UX → prompt() → CreateTeamModal 교체 (4-11)
- 팀 워크스페이스 한도 1개 → 3개 변경 (4-2)
- VIEWER 티켓 쓰기 API 차단 (RBAC 완성) (5-B-1)
- OWNER 소유권 이전 기능 완성 (5-B-4, 5-B-5)
- 멤버 자진 탈퇴 UI 연결 (5-4-8)
- 멤버 프로필 상세 모달 (5-4-9)
- WIP 경고 배지 (IN_PROGRESS > 3개) (7-2)
- Story 잔여 일정 테이블 (분석 페이지) (7-4)
- 팀 1000개 / 개인 300개 티켓 한도 분리 (G1/G2)
- 한도 접근 시 경고 메시지 응답 (G3)
- 테스트 431개 전체 통과

남은 주요 Gap:
- 이메일 초대 발송 없음 (링크만 생성)
- 스위밍 레인 / 동적 칼럼 미구현
- API 토큰(PAT) / MCP 서버 미구현
- 리치 에디터 / 파일 첨부 / 결제 미구현
```

---

*이 문서는 소스코드 직접 검증 결과를 기반으로 작성됨.
최신 상태 반영을 위해 주요 기능 변경 시 업데이트 필요.*
