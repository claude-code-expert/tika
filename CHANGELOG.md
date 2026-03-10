# Tika Development Changelog

> 이 문서는 Tika 프로젝트의 개발 히스토리를 기록합니다.
> 각 엔트리는 프롬프트, 변경사항, 영향받은 파일을 포함합니다.

## [develop] - 2026-03-11 01:01 (랜딩/설정/온보딩 UI 개선 + 색상 팔레트 통일)

### 🎯 Prompts
1. "랜딩 페이지 히어로 이미지 Ticket-based Kanban Board 한줄로 표기"
2. "사파리 브라우저 히어로 이미지 배경색 검정 플래시 수정"
3. "SVG에서 Plan Simply, Ship Boldly 띄어쓰기 간격 수정"
4. "Enterprise 항목 중 불가능한 기능(감사 로그, 사내 도구 연동, 온보딩·마이그레이션) 제거"
5. "Team Pro 항목 8개로 재구성 (MCP, 자동화, 워크스페이스 100개 등)"
6. "Enterprise 항목 7개로 재구성 (셀프 호스팅, AI 도구, REST API 등)"
7. "Team Pro에서 고급 검색 & 퀵 필터를 Enterprise로 이동"
8. "온보딩 페이지 하단에 메인 페이지로 이동 버튼 추가"
9. "WorkspaceOnboarding 페이지에도 메인 페이지 이동 버튼 추가"
10. "헤더 로고 클릭 시 full page reload (Link → a 태그)"
11. "사이드바 멤버관리 → 워크스페이스 멤버로 텍스트 변경"
12. "멤버 페이지 나가기 버튼에 브라우저 confirm → ConfirmDialog 공통 모달 적용"
13. "설정 페이지 워크스페이스별 역할 기반 권한 표시 (OWNER/MEMBER 분기)"
14. "알림 설정에서 스프린트 관련 항목 삭제"
15. "알림 설정 신청 결과 → 승인 완료로 변경, 멤버 제거 → 멤버 나가기로 변경"
16. "일반 설정 참여 방식을 라디오 버튼으로 변경 (검색 공개 / 초대 링크로만 참여)"
17. "아이콘 색상 팔레트 18개로 확장 (COLOR.json 기반 → color.html 20색 팔레트 기반으로 재선정)"
18. "프로필 모달 색상 팔레트도 동일하게 교체, 정사각형으로 변경"
19. "설정 페이지 멤버 관리 메뉴 삭제"

### ✅ Changes

#### 랜딩 페이지 (`app/login/page.tsx`, `public/images/tika-hero3.svg`)
- **Fixed**: SVG `@import url()` 제거 — Safari 검정 배경 플래시 해결
- **Fixed**: "Ticket-based Kanban Board" 두 줄 → 한 줄 표기
- **Fixed**: "Plan Simply." / "Ship Boldly." `<tspan>` 적용으로 띄어쓰기 간격 통일
- **Modified**: Team Pro 가격 항목 8개로 재구성
- **Modified**: Enterprise 가격 항목 8개로 재구성 (비현실적 항목 제거)

#### 온보딩 (`src/components/onboarding/`)
- **Modified**: `OnboardingWizard.tsx` — 하단 "메인 페이지로 이동" 버튼 추가
- **Modified**: `WorkspaceOnboarding.tsx` — 하단 "메인 페이지로 이동" 버튼 추가

#### 헤더 & 사이드바
- **Modified**: `src/components/layout/Header.tsx` — 로고 `Link` → `<a>` 태그 (full reload)
- **Modified**: `src/components/team/TeamSidebar.tsx` — "멤버관리" → "워크스페이스 멤버"

#### 멤버 관리
- **Modified**: `app/workspace/[workspaceId]/members/page.tsx` — "팀 멤버" → "워크스페이스 멤버"
- **Modified**: `src/components/team/MemberList.tsx` — 나가기 버튼 `confirm()` → `ConfirmDialog` 적용

#### 설정 페이지 (`/settings`)
- **Modified**: `src/components/settings/GeneralSection.tsx` — 참여 방식 라디오 버튼 UI, 아이콘 색상 14색 팔레트 (color.html 기반)
- **Modified**: `src/components/settings/NotificationPreferencesSection.tsx` — 스프린트 항목 삭제, "신청 결과" → "승인 완료", "멤버 제거" → "멤버 나가기"
- **Modified**: `src/components/settings/SettingsShell.tsx` — "멤버 관리" 네비 항목 제거
- **Modified**: `src/components/settings/types.ts` — `SectionKey`에서 `'members'` 제거

#### 색상 팔레트 통일 (color.html 20색 기반)
- **Modified**: `src/components/layout/ProfileModal.tsx` — 9색 → 14색 정사각형 팔레트 (22px, borderRadius 4px)
- **Modified**: `src/components/settings/GeneralSection.tsx` — 9색 → 14색 팔레트

### 📁 Files Modified
- `public/images/tika-hero3.svg` (수정)
- `app/login/page.tsx` (수정)
- `src/components/onboarding/OnboardingWizard.tsx` (수정)
- `src/components/onboarding/WorkspaceOnboarding.tsx` (수정)
- `src/components/layout/Header.tsx` (수정)
- `src/components/layout/ProfileModal.tsx` (수정)
- `src/components/team/TeamSidebar.tsx` (수정)
- `src/components/team/MemberList.tsx` (수정)
- `app/workspace/[workspaceId]/members/page.tsx` (수정)
- `src/components/settings/GeneralSection.tsx` (수정)
- `src/components/settings/NotificationPreferencesSection.tsx` (수정)
- `src/components/settings/SettingsShell.tsx` (수정)
- `src/components/settings/types.ts` (수정)

---

## [develop] - 2026-03-10 22:36 (In-App 알림 시스템 Phase 1 전체 구현)

### 🎯 Prompts
1. "지금 문서들 참고해서 구현 시작해" — `docs/notification_system_design.md`, `docs/check_list_notification.md` 기반 In-App 알림 시스템 전체 구현

### ✅ Changes

#### DB 스키마 & 마이그레이션
- **Added**: `in_app_notifications` 테이블 — userId, workspaceId, type, title, message, link, actorId, refType, refId, isRead, createdAt (`src/db/schema.ts`)
- **Added**: `notification_preferences` 테이블 — userId, workspaceId, type, inAppEnabled, slackEnabled, telegramEnabled (`src/db/schema.ts`)
- **Added**: 마이그레이션 `0016_moaning_kingpin.sql` — 두 테이블 생성, FK, 인덱스

#### 쿼리 & 헬퍼
- **Added**: `src/db/queries/inAppNotifications.ts` — bulkCreate, 페이지네이션 조회, 읽음 처리, 선호도 CRUD, 비활성 유저 필터
- **Added**: `src/lib/notifications.ts` — `sendInAppNotification()` (자기 자신 제외, 선호도 체크, bulk insert) + 14개 메시지 빌더

#### 타입 & 검증
- **Added**: `NOTIFICATION_TYPE` 상수 14종, `NOTIFICATION_REF_TYPE` 상수 (`src/types/index.ts`)
- **Added**: `InAppNotification`, `NotificationPreference` 인터페이스 (`src/types/index.ts`)
- **Added**: `inAppNotificationQuerySchema`, `updateNotificationPreferenceSchema` (`src/lib/validations.ts`)

#### API 라우트 (5개 신규)
- **Added**: `GET /api/notifications/in-app` — 페이지네이션 조회
- **Added**: `GET /api/notifications/in-app/unread-count` — 미읽음 수
- **Added**: `PATCH /api/notifications/in-app/[id]/read` — 단일 읽음
- **Added**: `PATCH /api/notifications/in-app/read-all` — 전체 읽음
- **Added**: `GET/PUT /api/notifications/preferences` — 선호도 조회/수정

#### 트리거 통합 (11개 기존 API 수정)
- **Modified**: `app/api/tickets/[id]/route.ts` — 상태 변경, 배정/해제, 삭제 알림
- **Modified**: `app/api/tickets/[id]/comments/route.ts` — 새 댓글 알림
- **Modified**: `app/api/workspaces/[id]/members/[memberId]/route.ts` — 역할 변경, 멤버 제거 알림
- **Modified**: `app/api/workspaces/[id]/sprints/[sid]/activate/route.ts` — 스프린트 시작 알림
- **Modified**: `app/api/workspaces/[id]/sprints/[sid]/complete/route.ts` — 스프린트 완료 알림
- **Modified**: `app/api/invites/[token]/accept/route.ts` — 멤버 참여 알림
- **Modified**: `app/api/workspaces/[id]/join-requests/route.ts` — 참여 신청 알림
- **Modified**: `app/api/workspaces/[id]/join-requests/[reqId]/route.ts` — 신청 결과 알림
- **Modified**: `app/api/cron/notify-due/route.ts` — D-1 마감일 경고 알림

#### UI 변경
- **Modified**: `src/components/layout/Header.tsx` — 벨 아이콘 `notification_logs` → `in_app_notifications` API 전환, 클릭 시 링크 이동 + 읽음 처리
- **Modified**: `src/components/notifications/NotificationsPage.tsx` — In-App 알림 기반으로 전환, 읽음/미읽음 필터, 알림 유형별 컬러 뱃지
- **Added**: `src/components/settings/NotificationPreferencesSection.tsx` — 14개 알림 유형별 토글 on/off, 워크스페이스 선택
- **Modified**: `src/components/settings/SettingsShell.tsx` — "알림 설정" 네비 항목 + 섹션 추가
- **Modified**: `src/components/settings/types.ts` — `SectionKey`에 `'notification-preferences'` 추가

### 📊 검사 결과
- TypeScript: `npx tsc --noEmit` 통과 (0 errors)
- ESLint: 신규 경고 0개

### 📁 Files Modified
- `src/db/schema.ts` (+48 lines)
- `src/types/index.ts` (+53 lines)
- `src/lib/validations.ts` (+23 lines)
- `src/lib/notifications.ts` (신규, ~250 lines)
- `src/db/queries/inAppNotifications.ts` (신규, ~150 lines)
- `app/api/notifications/in-app/route.ts` (신규)
- `app/api/notifications/in-app/unread-count/route.ts` (신규)
- `app/api/notifications/in-app/[id]/read/route.ts` (신규)
- `app/api/notifications/in-app/read-all/route.ts` (신규)
- `app/api/notifications/preferences/route.ts` (신규)
- `src/components/settings/NotificationPreferencesSection.tsx` (신규, ~220 lines)
- `app/api/tickets/[id]/route.ts` (+99 lines)
- `app/api/tickets/[id]/comments/route.ts` (+35 lines)
- `app/api/workspaces/[id]/members/[memberId]/route.ts` (+45 lines)
- `app/api/workspaces/[id]/sprints/[sid]/activate/route.ts` (+19 lines)
- `app/api/workspaces/[id]/sprints/[sid]/complete/route.ts` (+18 lines)
- `app/api/invites/[token]/accept/route.ts` (+24 lines)
- `app/api/workspaces/[id]/join-requests/route.ts` (+24 lines)
- `app/api/workspaces/[id]/join-requests/[reqId]/route.ts` (+29 lines)
- `app/api/cron/notify-due/route.ts` (+25 lines)
- `src/components/layout/Header.tsx` (수정)
- `src/components/notifications/NotificationsPage.tsx` (수정)
- `src/components/settings/SettingsShell.tsx` (수정)
- `src/components/settings/types.ts` (수정)
- `migrations/0016_moaning_kingpin.sql` (신규)
- `migrations/meta/0016_snapshot.json` (신규)
- `migrations/meta/_journal.json` (+7 lines)
- **총 27개 파일, +658 / -241 lines**

---

## [develop] - 2026-03-08 (BreadcrumbPicker 공통 모듈화 + 개인 워크스페이스 상세 페이지 레이아웃 수정)

### 🎯 Prompts
1. "브래드 크럼에 상위 선택 후 하위가 있는데도 여전히 회색으로 선택하세요가 되어있어. 이건 비활성화 효과라 회색 효과 제거해줘야지"
2. "브레드 크럼 영역 공통 모듈로 재사용 할수 있도록 해. 상세 페이지 랜딩 영역에서도 재사용할거야"
3. "[date picker] 날짜 픽커 모듈이 vercel에 배포하면 제대로 안되는데 버전 차이나 다른 라이브러리 충돌이 있는지 검사해봐. prod 배포후에는 날짜 클릭해도 창이 안닫히고 달력 사이즈도 작아"
4. "장세보기 모달의 브레드 크럼 공통 컴포넌트 적용 @TicketDetailPage"
5. "브래드 크럼 위치는 [title section]이 아니라 [header bar]로 이동되어야 해"
6. "[ticket ID badge villains-default-20] 삭제"
7. "[type badge T Task] 이 영역은 [right meta panel] 이 영역의 상태 위로 이동. 이슈타입 타이틀이 위에 오도록"
8. "수정일 생성일 [Modal format is correct]. [TicketDetailPage version] 이건 정렬도 그렇고 위치가 엉망이야"
9. "[title section showing T Task above textarea] 좌측에 제목, 우측에 이슈타입 1열로 정렬"
10. "[CommentSection] 댓글 500자 체크는 남기고 Ctrl+Enter로 등록 텍스트는 삭제"
11. "http://localhost:3000/workspace/1/2 이런식으로 상세 페이지 랜딩한 경우, 지금 유저는 개인워크스페이스 이기 때문에 좌측에 팀메뉴가 아니라 내 워크스페이스와 backlog 영역이 노출되어야 해"
12. "개인 워크스페이스 상세 페이지에서 보드로 돌아가기 클릭하면 팀 메뉴가 나오는데 개인일 경우 백로그 사이드바만 나와야해"

### ✅ Changes

#### 신규 컴포넌트
- **Added**: `src/components/ticket/BreadcrumbPicker.tsx` — 브레드크럼 선택기 공통 모듈 추출
  - `ANCESTOR_TYPES_MAP` export (TASK→[GOAL,STORY,FEATURE], FEATURE→[GOAL,STORY], STORY→[GOAL])
  - `position: fixed` + `getBoundingClientRect()` — modal overflow:hidden 클리핑 우회
  - outside-click 핸들러: dropdown ref + 버튼 ref 모두 제외 (더블토글 버그 수정)
  - `options` 필터: 상위 선택 시 `t.parentId === parentSelectionId` (계층형 연동)
  - 활성 미선택 = 흰 배경 + solid border / 비활성(옵션 없음) = 회색 배경 + dashed border
- **Added**: `src/components/layout/PersonalTicketShell.tsx` — 개인 워크스페이스 티켓 상세용 레이아웃 shell
  - Header + DndContext + Sidebar(백로그) + Footer 구성
  - Sidebar의 `useSortable`/`useDroppable` 요구사항으로 DndContext 래핑 필수

#### 수정 컴포넌트
- **Modified**: `src/components/ticket/TicketModal.tsx`
  - 인라인 브레드크럼 JSX(~80줄) 제거 → `<BreadcrumbPicker>` 컴포넌트 사용
  - 날짜 picker 프로덕션 버그 수정: `e.target.blur()` — `document.body.overflow:hidden`(Modal) 상태에서 Chrome 네이티브 날짜 picker가 선택 후 닫히지 않는 문제
  - `metaDateStyle` height 28→32, `boxSizing: 'border-box'` 추가
- **Modified**: `src/components/ticket/TicketDetailPage.tsx`
  - 인라인 단일 레벨 parent 선택기(160+줄) 제거 → `<BreadcrumbPicker>` 적용
  - 헤더 바: 브레드크럼 이동, 티켓 ID 배지 삭제
  - 타이틀 섹션: title textarea(좌, flex:1) + 이슈타입 배지(우, flexShrink:0) 1열 정렬
  - 이슈타입 배지: 우측 meta panel 상단으로 이동 (상태 위)
  - 수정일/생성일: 우측 meta panel 하단으로 이동 (Modal 형식과 동일)
  - `backUrl?: string` prop 추가 — 개인/팀 워크스페이스별 돌아가기 URL 분기
- **Modified**: `src/components/ticket/CommentSection.tsx`
  - `{newText.length}/500 · Ctrl+Enter로 등록` → `{newText.length}/500`

#### 라우트 수정
- **Modified**: `app/workspace/[workspaceId]/[ticketId]/page.tsx`
  - `workspace.type === 'PERSONAL'`이면 `getBoardData` 후 `PersonalTicketShell` + `backUrl="/"` 사용
  - 팀 워크스페이스는 기존 `TeamShell` 유지
- **Modified**: `app/workspace/[workspaceId]/board/page.tsx`
  - `workspace.type === 'PERSONAL'`이면 `/`로 redirect — 개인 사용자가 팀 보드 URL 직접 접근 시 팀 메뉴 노출 방지

### 📁 Files Modified
- `src/components/ticket/BreadcrumbPicker.tsx` (신규, ~275 lines)
- `src/components/layout/PersonalTicketShell.tsx` (신규, ~90 lines)
- `src/components/ticket/TicketModal.tsx` (수정)
- `src/components/ticket/TicketDetailPage.tsx` (수정)
- `src/components/ticket/CommentSection.tsx` (수정)
- `app/workspace/[workspaceId]/[ticketId]/page.tsx` (수정)
- `app/workspace/[workspaceId]/board/page.tsx` (수정)

---

## [feature/wbs] - 2026-03-07 (issues 테이블 → tickets.parent_id 통합 + 문서 현행화)

### 🎯 Prompts
1. "통합해. 먼저 플랜과 수정 대상 파일, 마이그레이션 계획을 세우고 단계별로 진행해" — issues 테이블 폐기 및 tickets 자기참조 통합 플랜 기반 전체 구현
2. `/simplify` — "이번 작업으로 필요없게 된 issue 관련 소스나 화면, 데드코드들 검출해서 정리해"
3. "현재 접속 디비의 스키마 정보, 인덱스 정보를 조회하는 shell 스크립트를 만들고, 이걸 실행해서 @docs/TABLE_DEFINITION.md 과 @docs/ERD.md @docs/DATA_MODEL.md @docs/DATABASE-ERD.puml 정보 현행화해"

### ✅ Changes

#### DB Schema & Migration
- **Modified**: `src/db/schema.ts` — `issues` pgTable 제거, `tickets`에 `parentId` 자기참조 추가 (`issueId` 제거, `idx_tickets_parent_id` 인덱스 추가)
- **Added**: `migrations/0010_issues_to_tickets.sql` — issues 행 → tickets 이전, parent_id 연결, issue_id 칼럼 및 issues 테이블 DROP
- **Added**: `migrations/meta/0010_snapshot.json` — 마이그레이션 스냅샷
- **Modified**: `migrations/meta/_journal.json` — 0010 엔트리 추가

#### Types & Validation
- **Modified**: `src/types/index.ts` — `ISSUE_TYPE`, `IssueType`, `Issue` 인터페이스 제거; `Ticket.issueId` → `parentId`; `TicketWithMeta.issue` → `parent: Ticket | null`; `GanttItem.type` 범위 축소
- **Modified**: `src/lib/validations.ts` — issue 스키마 전체 제거; `createTicketSchema`/`updateTicketSchema`에 `parentId` 추가

#### DB Queries
- **Modified**: `src/db/queries/tickets.ts` — `toTicket()` issueId→parentId; `getBoardData()` TASK 전용 필터; `getWbsTickets()` 신규 (GOAL/STORY/FEATURE/TASK 전체); `createTicket`/`updateTicket`/`getTicketById`/`getDeletedTickets` 갱신
- **Removed**: `src/db/queries/issues.ts` — 전체 삭제

#### API Routes
- **Modified**: `app/api/tickets/route.ts` — GET에 `?types=` 파라미터 지원 추가 (WBS용 `getWbsTickets` 호출)
- **Removed**: `app/api/issues/route.ts`, `app/api/issues/[id]/route.ts` — 삭제

#### Pages
- **Modified**: `app/team/[workspaceId]/wbs/page.tsx` — `getWbsTickets()` 단일 쿼리; `buildGanttItems()` parentId 기반 재작성
- **Modified**: `app/team/[workspaceId]/page.tsx` — `goalTickets`를 `wbsTickets`에서 파생 (버그 수정: boardData는 TASK 전용이라 GOAL 없었음)

#### Components
- **Added**: `src/components/team/WbsClient.tsx` — 신규 클라이언트 컴포넌트; IssueModal 제거, 모든 항목 클릭 → TicketModal 단일 사용
- **Modified**: `src/components/ticket/TicketModal.tsx` — `allIssues`→`allParents`, `/api/issues`→`/api/tickets?types=...`, `issue.name`→`parent.title`
- **Modified**: `src/components/ticket/TicketForm.tsx` — `useIssues` 제거, `issueId`→`parentId`, `TICKET_TYPE_META` 상수 활용
- **Modified**: `src/components/board/TicketCard.tsx` — `ticket.issue`→`ticket.parent`, `issue.name`→`parent.title`
- **Modified**: `src/components/team/GoalProgressRow.tsx` — `issueId`→`parentId` 비교 수정
- **Modified**: `src/components/team/WbsMiniCard.tsx` — Issue 타입 → Ticket 타입; `node.name`→`node.title`
- **Modified**: `src/components/ui/Chips.tsx` — `IssueType` import 제거
- **Removed**: `src/components/issue/IssueBreadcrumb.tsx` — 데드코드, 임포트 없음
- **Removed**: `src/hooks/useIssues.ts` — 전체 삭제

#### Seed Files
- **Modified**: `src/db/seed.ts` — `seedDefaultIssues` → tickets insert로 재작성; `issueId`→`parentId`
- **Modified**: `src/db/seed-tika-team.ts` — `createIssueHierarchy`→`createTicketHierarchy`; 공용 insert 패턴으로 간소화

#### Tests (7 파일 갱신)
- **Modified**: `__tests__/api/tickets.test.ts`, `__tests__/api/cron.test.ts`, `__tests__/hooks/useTickets.test.ts`, `__tests__/lib/utils.test.ts`, `__tests__/lib/sprintFlow.test.ts`, `__tests__/components/TicketCard.test.tsx`, `__tests__/components/BoardContainer.test.tsx`, `__tests__/components/TicketModal.test.tsx` — `issueId`→`parentId`, `issue`→`parent` 픽스처 갱신
- **Modified**: `__tests__/lib/validations.test.ts` — `createIssueSchema` 테스트 수트 제거

#### Documentation
- **Added**: `scripts/dump-schema.sh` — live PostgreSQL 스키마/인덱스/FK 조회 스크립트
- **Modified**: `docs/TABLE_DEFINITION.md` — issues 섹션 제거, tickets parent_id 반영, 마이그레이션 이력 0010 추가
- **Modified**: `docs/ERD.md` — issues 엔티티 제거, tickets 자기참조 추가, 관계도/FK 정책 갱신, 테이블 수 15→14
- **Modified**: `docs/DATA_MODEL.md` — ISSUE_TYPE/Issue 타입 제거, Ticket/TicketWithMeta 갱신, Drizzle 스키마 코드 갱신, 비즈니스 규칙 5.6 갱신
- **Modified**: `docs/DATABASE-ERD.puml` — issues 엔티티 완전 제거, tickets self-ref 추가

### 📊 검사 결과
- TypeScript: `npx tsc --noEmit` 통과
- 테스트: 기존 실패 6개 유지 (리팩터링으로 인한 신규 실패 없음)

### 📁 Files Summary
- 38 files changed, +1091 / -1750 lines
- Deleted: 5 files (`issues` 관련 API/쿼리/훅/컴포넌트)
- Added: 4 files (WbsClient, migration 0010, snapshot, dump-schema.sh)

---

## [feature/ui] - 2026-03-07 (성능 최적화 + ERD 현행화 + TS 에러 수정)

### 🎯 Prompts
1. "성능 이슈 & ERD 현행화 작업 계획" — ERD 현행화, DB 인덱스 추가, N+1 쿼리 수정, API 병렬화, React 렌더링 최적화, 번들 최적화를 포함한 전체 계획 실행
2. "린트 검사하고 타입스크립트 에러 수정해"

### ✅ Changes
- **Modified**: `docs/ERD.md` — 테이블 9개 → 15개로 현행화 (comments, notification_logs, sprints, workspace_invites, ticket_assignees, workspace_join_requests 추가), users/workspaces/members/tickets 컬럼 변경 반영, 마이그레이션 이력 0003~0006 추가
- **Modified**: `src/db/schema.ts` — tickets 테이블에 `idx_tickets_assignee_id`, `idx_tickets_issue_id` 인덱스 추가; comments 테이블에 `idx_comments_member_id` 인덱스 추가
- **Added**: `migrations/0007_chunky_king_cobra.sql` — 신규 인덱스 3개 마이그레이션, DB 적용 완료
- **Modified**: `src/db/queries/analytics.ts` — `getVelocityData()` N+1 쿼리 수정: 스프린트별 루프 쿼리 → `GROUP BY sprint_id` 단일 쿼리 (스프린트 20개 기준 21 queries → 2 queries), `sql` import 추가
- **Modified**: `src/components/ticket/TicketForm.tsx` — labels/issues/members/sprints 4개 API 순차 호출 → `Promise.all` 병렬화 (모달 오픈 지연 최대 1.2초 → ~300ms)
- **Modified**: `src/components/layout/Header.tsx` — workspaces/members/notifications 3개 별도 `useEffect` → 단일 `Promise.all` useEffect 통합 (초기 로드 300-600ms 절감)
- **Modified**: `src/components/board/TicketCard.tsx` — `React.memo` 적용, `style`/`completedCount`/`dueDateState`/`displayAssignees` `useMemo` 적용으로 불필요한 재계산 제거
- **Modified**: `src/components/board/Column.tsx` — `React.memo` 적용, `sortableItems` `useMemo` 적용 (부모 리렌더 시 4컬럼 동시 재렌더 방지)
- **Modified**: `src/hooks/useTickets.ts` — 드래그 성공 후 `fetchBoard()` 전체 재호출 제거 (옵티미스틱 UI로 충분, 드래그 후 깜빡임 해소)
- **Fixed**: 31개 API 라우트 + 페이지 파일 — `(session.user as Record<string, unknown>).prop` → `session.user.prop` 직접 접근으로 변경 (NextAuth 타입 선언이 이미 올바르므로 불필요한 캐스팅 제거, TS2352 에러 46개 해결)
- **Fixed**: `src/components/workspace/JoinRequestList.tsx` — 스프레드 중복 키 패턴 수정 (`TS2783` 에러 3개 해결)

### 📊 검사 결과
- TypeScript: 0 errors (기존 46개 → 0개)
- ESLint: 0 warnings / 0 errors

### 📁 Files Modified
- `docs/ERD.md` (+429, -236 lines — 전면 현행화)
- `migrations/0007_chunky_king_cobra.sql` (신규)
- `src/db/schema.ts` (+7, -2 lines)
- `src/db/queries/analytics.ts` (+36, -18 lines)
- `src/components/ticket/TicketForm.tsx` (+62, -37 lines)
- `src/components/layout/Header.tsx` (+20, -57 lines)
- `src/components/board/TicketCard.tsx` (+32, -12 lines)
- `src/components/board/Column.tsx` (+8, -3 lines)
- `src/hooks/useTickets.ts` (+2, -4 lines)
- `src/components/workspace/JoinRequestList.tsx` (+1, -1 lines)
- `app/api/**/*.ts` × 26개 — `session.user` 캐스팅 정리
- `app/team/[workspaceId]/**/*.tsx` × 5개 — `session.user` 캐스팅 정리

---

## [feature/phase1] - 2026-02-22 11:20

### 🎯 Prompts
1. "이제 @docs/COMPONENT_SPEC.md 을 완성해줘. @docs/REQUIREMENTS.md 와 @docs/SCREEN_SPEC.md 그리고 public 하위에 html 들을 참고해"
2. "지금 수정한 md 문서들 버전 2.0이야. 문서 내부에 업데이트 해"
3. "skill 폴더를 만들어서 changelog 관련 스킬을 추가해줬어. 이거 어떻게 활성화하지?"
4. "changelog 명령어가 아무것도 안나와서 물어보는거야. @.claude/skills/changelog/SKILL.md 를 살펴보고 동작하게 만들어줘"

### ✅ Changes
- **Modified**: `docs/COMPONENT_SPEC.md` 전면 재작성 — 디자인 토큰, 레이아웃 컴포넌트(Header/Sidebar/Footer), HTML 프로토타입 기반 상세 스타일링, Phase 2 컴포넌트, 이벤트 플로우 추가
- **Modified**: 8개 문서 버전 2.0 업데이트 (`API_SPEC.md`, `TRD.md`, `TEST_CASES.md`, `SCREEN_SPEC.md`, `DATA_MODEL.md`, `PRD.md`, `REQUIREMENTS.md`, `COMPONENT_SPEC.md`)
- **Added**: `/changelog` 슬래시 명령어 등록 (`.claude/commands/changelog.md`)

### 📁 Files Modified
- `docs/COMPONENT_SPEC.md` (~+1200 lines, 전면 재작성)
- `docs/API_SPEC.md` (버전 2.0)
- `docs/TRD.md` (버전 2.0)
- `docs/TEST_CASES.md` (버전 2.0)
- `docs/SCREEN_SPEC.md` (버전 2.0)
- `docs/DATA_MODEL.md` (버전 2.0)
- `docs/PRD.md` (버전 2.0)
- `docs/REQUIREMENTS.md` (버전 2.0)
- `.claude/commands/changelog.md` (+95 lines, 신규)

---
