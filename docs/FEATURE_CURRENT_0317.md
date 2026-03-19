# Tika — 기능 현황 점검 (2026-03-18 재점검)

> 기준: develop 브랜치 최신 커밋 (86d0de5)
> 참조: check_list_workspace.md, check_list_notification.md, REQUIREMENTS.md, 코드베이스 직접 확인
> **스프린트 관련 기능은 이번 구현 범위 제외 (SprintBanner, SprintCompleteDialog, SprintSelector 포함)**
>
> 분류 기준:
> - **(A) 코드 구현됐으나 UI/페이지에 미연결** — 컴포넌트·API가 존재하나 어느 페이지에도 렌더되지 않음
> - **(B) 문서·스펙 있으나 코드 미구현** — 요구사항/체크리스트에 명시됐으나 해당 코드 없음
> - **(C) 코드 구현됐으나 스펙 불일치** — 구현은 있으나 스펙과 다르게 동작함

---

## (A) 코드 구현됐으나 UI/페이지에 미연결

### ~~A-1. JoinRequestList 컴포넌트~~ — 해결 완료

- **수정:** `app/workspace/[workspaceId]/members/page.tsx`에 OWNER 권한 조건부 렌더링으로 연결

### ~~A-2. FilterBar (ui) 컴포넌트~~ — 해결 완료

- **수정:** `src/components/ui/FilterBar.tsx` 삭제 (`BoardFilterBar.tsx`가 대체)

---

## (B) 문서·스펙 있으나 코드 미구현

### ~~B-1. 온보딩 위저드 — 개인 WS → 팀 WS 순차 흐름~~ — 해결 완료

- **수정:** `src/components/onboarding/OnboardingWizard.tsx`를 2단계 순차 흐름으로 재구현
  - Step 1: 개인 워크스페이스 생성 (`PATCH /api/users/type { userType: 'USER' }`)
  - Step 2: 팀 워크스페이스 만들기 (`/onboarding/workspace`) 또는 개인 보드로 바로 시작 (`/`)

### ~~B-2. FR-105 — 워크스페이스 간 라벨 복사/이동~~ — 해결 완료

- **수정:**
  - `app/api/labels/copy/route.ts` 신규 생성 (`POST /api/labels/copy`)
  - `src/db/queries/labels.ts` — `copyLabelsToWorkspace` 함수 추가 (중복 이름 스킵)
  - `src/lib/validations.ts` — `copyLabelsSchema` 추가
  - `src/components/settings/LabelSection.tsx` — 복사 다이얼로그 UI 추가

### ~~B-3. TD-101 — 공유 상수 미내보내기~~ — 해결 완료

- **수정:** `src/types/index.ts`에 `COLUMN_ORDER`, `COLUMN_LABELS` export 추가; `Board.tsx` 로컬 중복 정의 제거

### ~~B-4. TD-102 — 날짜 형식 검증 누락~~ — 해결 완료 (기존 구현 확인)

- **확인:** `createTicketSchema`의 `plannedStartDate`/`plannedEndDate`에 이미 `YYYY-MM-DD` regex 검증 적용됨 — 코드 변경 불필요

---

## (C) 코드 구현됐으나 스펙 불일치

### ~~C-1. 담당자 최대 인원 불일치~~ — 해결 완료

- **확정 스펙:** 담당자 최대 3명 (스펙을 코드 기준으로 수정)
- **수정 파일:**
  - `src/lib/validations.ts` — `assigneeIds.max(5)` → `max(3)`, 메시지 통일
  - `src/components/ticket/TicketForm.tsx` — `> 5` → `> 3`, 에러 메시지 통일
  - `TicketModal.tsx`는 이미 `>= 3`으로 올바르게 구현됨

### ~~C-2. 알림 배지 표시 형식 불일치~~ — 해결 완료

- **확정 스펙:** 미읽은 알림 99개 초과 시 "99+" 표시
- **수정:** `src/components/layout/Header.tsx` — `unreadCount > 9 ? '9+'` → `unreadCount > 99 ? '99+'`

---

## 구현 완료 확인 항목

| 카테고리 | 상태 |
|---------|------|
| Phase 1 전체 (FR-001~FR-013) | ✅ |
| Phase 2 알림/댓글/고급필터 (FR-102~107) | ✅ (FR-105 라벨 복사 포함) |
| 팀 워크스페이스 멤버 초대/역할/제거 | ✅ |
| VIEWER 권한 제한 (티켓 생성/수정/삭제/DnD 차단) | ✅ |
| 티켓 한도 경고 (개인 270/300, 팀 900/1000) | ✅ |
| 인앱 알림 14가지 트리거 | ✅ |
| WBS/간트 차트 | ✅ |
| 번다운 차트 | ✅ |
| 분석 차트 8종 (CFD, Cycle Time, Velocity 등) | ✅ |
| 휴지통 (소프트 삭제 + 복구) | ✅ |
| 워크스페이스 전환 (WorkspaceSwitcher) | ✅ |
| 참여 신청 / 초대 링크 API + JoinRequestList UI | ✅ |

---

*재점검일: 2026-03-18 / 전체 해결 완료: 2026-03-18*
