# Tasks: 워크스페이스 설정 페이지 (002-workspace-settings)

**Input**: Design documents from `/specs/002-workspace-settings/`
**References**: `docs/TABLE_DEFINITION.md`, `docs/IMPLEMENTATION_STATUS.md` (T-008 완전 구현)
**Branch**: `002-workspace-settings`

**Organization**: 4개 User Story 순서로 태스크 구성 (P1 → P4). 각 Story는 독립적으로 구현 및 테스트 가능.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 어느 User Story에 속하는지 (US1~US4)
- 파일 경로 필수 포함

---

## Phase 1: Setup — DB 스키마 변경 (사용자 확인 필수)

**Purpose**: 3개 스키마 변경 적용 (workspaces.description, members.role, notification_channels 신규)

> ⚠️ **CRITICAL**: `src/db/schema.ts` 수정 전 사용자 확인 필수 (CLAUDE.md 규칙). 이 Phase가 완료되어야 모든 User Story 구현 가능.

- [ ] T001 **[USER CONFIRMATION REQUIRED]** 사용자에게 스키마 변경 3건 확인 요청:
  (1) `workspaces` 테이블에 `description TEXT` 컬럼 추가
  (2) `members` 테이블에 `role VARCHAR(10) NOT NULL DEFAULT 'member'` 컬럼 추가
  (3) `notification_channels` 신규 테이블 생성
  확인 후 `src/db/schema.ts` 수정

- [ ] T002 `npm run db:generate` 실행하여 마이그레이션 파일 자동 생성 (→ `migrations/0002_*.sql` 예상)

- [ ] T003 생성된 마이그레이션 파일 검토 후 `npm run db:migrate` 실행하여 DB 적용
  (마이그레이션에 기존 소유자 role 'admin' 업데이트 쿼리 포함 여부 확인)

**Checkpoint**: DB 스키마 적용 완료 — 이후 모든 Phase 진행 가능

---

## Phase 2: Foundational — 타입·검증·쿼리·공통 레이아웃

**Purpose**: 모든 User Story가 공유하는 타입 정의, Zod 스키마, DB 쿼리, 설정 레이아웃 쉘

> ⚠️ **CRITICAL**: Phase 1 완료 후 시작. 이 Phase가 완료되어야 각 User Story 독립 구현 가능.

- [ ] T004 [P] `src/types/index.ts` 업데이트:
  - `MEMBER_ROLE` as const 맵 및 `MemberRole` 타입 추가
  - `Member` 인터페이스에 `role: MemberRole` 필드 추가
  - `Workspace` 인터페이스에 `description: string | null` 필드 추가
  - `LabelWithCount` 인터페이스 추가 (`extends Label`, `ticketCount: number`)
  - `MemberWithEmail` 인터페이스 추가 (`extends Member`, `email: string`)
  - `NOTIFICATION_CHANNEL_TYPE` as const 맵, `NotificationChannelType` 타입 추가
  - `NotificationChannel`, `SlackConfig`, `TelegramConfig` 인터페이스 추가

- [ ] T005 [P] `src/lib/validations.ts` 업데이트:
  - `updateWorkspaceSchema` 추가 (name 1~50자, description 0~200자, 최소 1개 필드 refine)
  - `upsertNotificationChannelSchema` 추가 (type enum, config union, enabled boolean, CONFIG_REQUIRED 검증)
  - `updateMemberRoleSchema` 추가 (role enum: 'admin' | 'member')

- [ ] T006 [P] `src/db/queries/workspaces.ts` 신규 파일 생성:
  - `getWorkspaceById(id: number): Promise<Workspace | null>`
  - `updateWorkspace(id: number, data): Promise<Workspace | null>`

- [ ] T007 [P] `src/db/queries/labels.ts` 업데이트:
  - `getLabelsByWorkspaceWithCount(workspaceId: number): Promise<LabelWithCount[]>` 추가
  (ticketLabels LEFT JOIN, COUNT 집계)

- [ ] T008 `src/components/settings/SettingsShell.tsx` 신규 파일 생성:
  - 좌측 4탭 네비게이션 (일반/알림 채널/라벨 관리/멤버 관리)
  - `activeSection` useState 상태 관리
  - Toast 상태 및 `showToast(message, type)` 함수 (3초 자동 소멸)
  - `settings.html` 기준 레이아웃 (side-nav 220px + settings-content)
  - children prop으로 각 섹션 컴포넌트 수용

- [ ] T009 `src/components/layout/Header.tsx` 수정:
  - 설정 버튼(`button`) → `Link href="/settings"` (next/link) 로 변경
  - 기존 button 스타일 유지, as prop 방식으로 Link에 적용

**Checkpoint**: 공통 기반 완료 — US1~US4 독립 구현 가능

---

## Phase 3: User Story 1 — 라벨 관리 (Priority: P1) 🎯 MVP

**Goal**: 설정 페이지에서 라벨 CRUD 완전 동작 (기존 API 재사용, UI 신규)

**Independent Test**: 설정 페이지 `/settings`에서 라벨 생성(이름+색상) → 목록 확인 → 편집 → 삭제 확인 다이얼로그 + 삭제 전체 흐름 테스트. 라벨 20개 한도, 중복명 오류 Toast 표시 확인.

- [ ] T010 [US1] `src/components/settings/LabelSection.tsx` 신규 파일 생성:
  - `GET /api/labels` 호출하여 `LabelWithCount[]` 목록 조회
  - 라벨 카운터 헤더 (`N / 20`)
  - "새 라벨 추가" 버튼 → `creator-box` 인라인 폼 (이름 입력 + 색상 팔레트 10개 + 미리보기 chip + 추가/취소)
  - 라벨 목록 (color dot, 이름, hex, 사용 티켓 수, 편집/삭제 버튼)
  - 인라인 편집 모드 (편집 클릭 시 label-edit-row로 전환)
  - 삭제 확인 다이얼로그 (영향 티켓 수 표시)
  - Optimistic UI: 생성/수정/삭제 즉시 반영, API 실패 시 롤백
  - `showToast` prop 연결

- [ ] T011 [US1] `app/settings/page.tsx` 신규 파일 생성:
  - Server Component, `auth()` 세션 확인 → 미인증 시 `/login` redirect
  - `SettingsShell` + `GeneralSection` + `NotificationSection` + `LabelSection` + `MemberSection` 통합 렌더링
  - 기본 활성 섹션: `'general'`
  - `settings.html` 헤더 구조 반영 (로고 Link + "설정" 타이틀 + 아바타)

**Checkpoint**: `/settings` 접속 후 라벨 관리 섹션에서 전체 CRUD 동작 확인

---

## Phase 4: User Story 2 — 알림 채널 설정 (Priority: P2)

**Goal**: Slack/Telegram Webhook URL 저장, ON/OFF 토글, 테스트 발송 기능

**Independent Test**: 알림 채널 섹션에서 Slack Webhook URL 입력 → 저장 → 테스트 발송 클릭 → 성공/실패 피드백 확인. 토글 OFF → 저장 → 새로고침 후 OFF 상태 유지 확인.

- [ ] T012 [P] [US2] `src/db/queries/notificationChannels.ts` 신규 파일 생성:
  - `getNotificationChannels(workspaceId: number): Promise<NotificationChannel[]>`
  - `upsertNotificationChannel(workspaceId, type, data): Promise<NotificationChannel>`
  (INSERT ... ON CONFLICT (workspace_id, type) DO UPDATE)

- [ ] T013 [P] [US2] `app/api/notifications/route.ts` 신규 파일 생성:
  - `GET`: 세션 확인 → `getNotificationChannels(workspaceId)` → config JSON.parse → 반환

- [ ] T014 [US2] `app/api/notifications/[type]/route.ts` 신규 파일 생성:
  - `PUT`: 세션 확인 → Zod 검증 (`upsertNotificationChannelSchema`) → CONFIG_REQUIRED 검증 (enabled=true & config empty) → `upsertNotificationChannel` → 반환

- [ ] T015 [US2] `app/api/notifications/[type]/test/route.ts` 신규 파일 생성:
  - `POST`: 세션 확인 → DB에서 해당 타입 채널 설정 조회 → NOT_CONFIGURED 체크
  - Slack: `fetch(webhookUrl, { method:'POST', body: JSON.stringify({text:'[Tika 테스트] 알림 채널이 정상적으로 연결되었습니다!'}) })`, 5초 타임아웃
  - Telegram: `fetch('https://api.telegram.org/bot{token}/sendMessage', { body: {chat_id, text} })`, 5초 타임아웃
  - 성공: `{success: true}` / 실패: 502 EXTERNAL_ERROR

- [ ] T016 [US2] `src/components/settings/NotificationSection.tsx` 신규 파일 생성:
  - `GET /api/notifications` → Slack/Telegram 초기 상태 로드
  - Slack 카드: Toggle ON/OFF + Webhook URL 입력 + "테스트 발송" 버튼 + "저장" 버튼
  - Telegram 카드: Toggle ON/OFF + Bot Token + Chat ID 입력 + "테스트 발송" + "저장"
  - 테스트 발송 버튼: 로딩(spinner) → 성공(초록) → 실패(빨강) → 5초 후 원복
  - `PUT /api/notifications/{type}` 호출로 저장
  - `showToast` prop 연결

**Checkpoint**: 알림 채널 섹션에서 Slack/Telegram 설정 저장 및 테스트 발송 동작

---

## Phase 5: User Story 3 — 멤버 관리 (Priority: P3)

**Goal**: 멤버 목록 조회(이메일+역할 포함), 역할 변경, 멤버 제거, 초대 UI (Phase 1: UI만)

**Independent Test**: 멤버 관리 섹션에서 현재 사용자(admin 역할)가 표시됨. 마지막 admin 제거/역할 낮추기 시도 → Toast 오류 확인. 초대 폼 입력 → "준비 중" Toast 확인.

- [ ] T017 [US3] `src/db/queries/members.ts` 업데이트:
  - `getMembersByWorkspace` → `users` 테이블 JOIN하여 `MemberWithEmail[]` 반환 (email 포함)
  - `updateMemberRole(id: number, workspaceId: number, role: MemberRole): Promise<Member | null>` 추가
  - `removeMember(id: number, workspaceId: number): Promise<boolean>` 추가
  - `getAdminCount(workspaceId: number): Promise<number>` 추가

- [ ] T018 [US3] `app/api/members/[id]/route.ts` 신규 파일 생성:
  - `PATCH`: 세션 확인 → Zod 검증 (`updateMemberRoleSchema`) → `getAdminCount` 체크 (role='member'로 낮출 때 마지막 admin이면 409 LAST_ADMIN) → `updateMemberRole` → 반환
  - `DELETE`: 세션 확인 → `getAdminCount` 체크 (해당 멤버가 admin이면서 카운트=1이면 409 LAST_ADMIN) → `removeMember` → 204 반환

- [ ] T019 [US3] `src/components/settings/MemberSection.tsx` 신규 파일 생성:
  - `GET /api/members` → `MemberWithEmail[]` 목록 조회
  - 멤버 카운터 헤더
  - "멤버 초대" 버튼 → 이메일 입력 폼 (Phase 1: 클릭 시 "초대 기능은 준비 중입니다" Toast)
  - 멤버 목록: 아바타(color), 이름, 이메일, role 뱃지(admin=보라/member=회색), 가입일
  - 역할 변경 버튼 → 확인 다이얼로그 → `PATCH /api/members/{id}`
  - 제거 버튼 → 확인 다이얼로그 → `DELETE /api/members/{id}`
  - Optimistic UI + 실패 시 롤백
  - `showToast` prop 연결

**Checkpoint**: 멤버 관리 섹션에서 목록 조회, 역할 변경, 제거 동작. 마지막 admin 보호 오류 확인.

---

## Phase 6: User Story 4 — 일반 설정 (Priority: P4)

**Goal**: 워크스페이스 이름/설명 저장, 환경 설정 UI 표시, 위험 영역 UI 표시 (실제 동작 없음)

**Independent Test**: 일반 설정 섹션에서 워크스페이스 이름 변경 → 저장 → Toast → 새로고침 후 유지 확인. 빈 이름 저장 시 오류 Toast. 위험 영역 버튼 클릭 → "준비 중" 안내.

- [ ] T020 [US4] `app/api/workspaces/[id]/route.ts` 신규 파일 생성:
  - `PATCH`: 세션 확인 → 워크스페이스 소유자 확인 (workspaceId 불일치 시 403 FORBIDDEN) → Zod 검증 (`updateWorkspaceSchema`) → `updateWorkspace` → 반환

- [ ] T021 [US4] `src/components/settings/GeneralSection.tsx` 신규 파일 생성:
  - `GET /api/workspaces` → 현재 워크스페이스 정보 로드 (name, description)
  - 프로젝트 정보 카드: 이름(1~50자) + 설명 textarea(0~200자) + 저장 버튼
    → `PATCH /api/workspaces/{id}` 호출
  - 환경 설정 카드: 시간대/언어/날짜 형식/주간 시작일 select (Phase 1: 저장 버튼 disabled)
  - 위험 영역: 초기화/삭제 버튼 (클릭 시 확인 다이얼로그 → "이 기능은 준비 중입니다" Toast로 처리)
  - `showToast` prop 연결

**Checkpoint**: 일반 설정 섹션에서 이름/설명 수정 저장 동작. 환경 설정 UI 표시.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: 문서 업데이트, 전체 통합 검증

- [ ] T022 [P] `docs/TABLE_DEFINITION.md` 업데이트:
  - workspaces 테이블 description 칼럼 행 추가
  - members 테이블 role 칼럼 행 추가
  - notification_channels 테이블 섹션 신규 추가 (9번)
  - ER 다이어그램 업데이트

- [ ] T023 [P] `docs/IMPLEMENTATION_STATUS.md` 업데이트:
  - T-008 설정 페이지 → 완료 처리
  - 신규 API 엔드포인트 목록 추가 (PATCH /api/workspaces/[id], /api/notifications/*, PATCH/DELETE /api/members/[id])

- [ ] T024 `npm run test` 실행하여 기존 200개 테스트 통과 확인
  (신규 코드는 기존 API/컴포넌트 계약을 변경하지 않으므로 기존 테스트 유지 확인)

- [ ] T025 `npm run lint` 실행하여 ESLint 오류 없음 확인, `npm run build` 빌드 성공 확인

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Schema) → Phase 2 (Foundation) → Phase 3 (US1 Labels) ─┐
                                         → Phase 4 (US2 Notify) ─┼→ Phase 7 (Polish)
                                         → Phase 5 (US3 Members) ─┤
                                         → Phase 6 (US4 General) ─┘
```

- **Phase 1**: 즉시 시작 (단, 사용자 확인 T001 필수)
- **Phase 2**: Phase 1 완료 후 — **모든 User Story를 블록**
- **Phase 3~6**: Phase 2 완료 후 병렬 진행 가능 (독립적)
- **Phase 7**: Phase 3~6 모두 완료 후

### User Story 내부 의존성

- **US1** (T010 → T011): LabelSection → page.tsx 통합
- **US2** (T012,T013 병렬 → T014 → T015 → T016): query/GET 병렬 → PUT → test → UI
- **US3** (T017 → T018 → T019): query → API → UI
- **US4** (T020 → T021): API → UI

### 병렬 실행 기회

- T004, T005, T006, T007, T008, T009 — Phase 2 전체 병렬 가능
- T012, T013 — Phase 4 초반 병렬
- T022, T023 — Phase 7 병렬

---

## Parallel Execution Examples

### Phase 2 전체 병렬

```bash
# 동시 실행 가능:
Task T004: "Update src/types/index.ts"
Task T005: "Update src/lib/validations.ts"
Task T006: "Create src/db/queries/workspaces.ts"
Task T007: "Update src/db/queries/labels.ts"
Task T008: "Create src/components/settings/SettingsShell.tsx"
Task T009: "Update src/components/layout/Header.tsx"
```

### Phase 3~6 병렬 (Phase 2 완료 후)

```bash
# 각 User Story를 동시에 작업 가능:
Developer A: Phase 3 (US1 Labels)
Developer B: Phase 4 (US2 Notifications)
Developer C: Phase 5 (US3 Members)
Developer D: Phase 6 (US4 General)
```

---

## Implementation Strategy

### MVP First (User Story 1 — 라벨 관리만)

1. Phase 1 완료 (Schema)
2. Phase 2 완료 (Foundation)
3. Phase 3 완료 (US1)
4. **STOP & VALIDATE**: `/settings` 라벨 관리 섹션 E2E 테스트
5. 즉시 배포 가능 (기존 API 재사용이므로 리스크 낮음)

### 전체 구현 (권장)

1. Phase 1 → Phase 2 → Phase 3~6 (병렬) → Phase 7
2. 각 Phase 완료 후 독립 테스트
3. IMPLEMENTATION_STATUS.md T-008 완료 처리

---

## Notes

- **[P]**: 서로 다른 파일 작업, 의존성 없음 → 병렬 실행 가능
- `src/db/schema.ts` 수정은 반드시 **사용자 확인 후** 진행 (T001)
- `migrations/` 파일은 `npm run db:generate`로만 생성 (수동 편집 금지)
- `.env.local` 파일 수정 불필요 (기존 `POSTGRES_URL` 그대로 사용)
- 신규 npm 패키지 없음 (Slack/Telegram은 fetch API로 직접 호출)
- 설정 페이지 UI는 `public/demo/settings.html` 기준으로 구현
- Phase 1 전체 태스크: **25개** (T001~T025)
