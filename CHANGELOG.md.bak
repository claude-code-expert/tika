# Tika Development Changelog

> 이 문서는 Tika 프로젝트의 개발 히스토리를 기록합니다.
> 각 엔트리는 프롬프트, 변경사항, 영향받은 파일을 포함합니다.

## [develop] - 2026-04-05 SEO 최적화 전체 적용 + settings.json 훅 버그 수정

### 🎯 Prompts
1. "docs/seo 문서의 README.md 와 SEO_GUIDE.md seo-sample.tsx, page.tsx 를 참고해서 이 코드베이스의 검색엔진 최적화를 진행해"
2. "@.claude/settings.json 제대로 구성된건지 오류없는지 검사해"
3. "이 수정과 관련해서 훅 설정을 어떻게 해야 하는지 settings.json 상단에 주석으로 달아줘"
4. "전체 테스트 돌려서 에러 검증해"

### ✅ Changes
- **Added**: `metadataBase` 전역 설정 → OG/Twitter 이미지 URL 크롤러 전달 정상화 (`app/layout.tsx`)
- **Added**: Open Graph 이미지 (`/images/tika-hero.png`, 1376×768) 전역 적용 (`app/layout.tsx`)
- **Added**: Twitter Card `summary` → `summary_large_image` 업그레이드 (`app/layout.tsx`)
- **Added**: JSON-LD 구조화 데이터 — `WebApplication` + `Organization` 스키마 (`app/layout.tsx`)
- **Added**: 랜딩 페이지 SEO 전면 개선 — 키워드 중심 title, CTA 포함 description, canonical (`app/login/page.tsx`)
- **Added**: JSON-LD `FAQPage` 스키마 — 6개 FAQ 인라인 삽입, 구글 리치 스니펫 대응 (`app/login/page.tsx`)
- **Fixed**: 홈 페이지 title "로그인" → `{ absolute: 'Tika' }` (리다이렉트 페이지에 잘못된 title) (`app/page.tsx`)
- **Modified**: Sitemap 우선순위 재조정 — `/login` priority 1, `/` priority 0.5 (`app/sitemap.ts`)
- **Modified**: 팀 초대 페이지 title·description 개선 + OG 이미지 추가 (`app/invite/[token]/page.tsx`)
- **Modified**: 온보딩 title "온보딩" → "시작하기", description 개선 (`app/onboarding/page.tsx`)
- **Added**: 워크스페이스 생성 페이지 Metadata 신규 선언 (`app/onboarding/workspace/page.tsx`)
- **Fixed**: 알림 페이지 `Metadata` 타입 누락 + title 중복 (`| Tika`) 제거 (`app/notifications/page.tsx`)
- **Modified**: 설정·워크스페이스 전체 8개 페이지 description 구체화
- **Fixed**: `.claude/settings.json` 훅 3개 버그 수정
  - matcher 오류: `"bash"` → `"Bash"`, `"write_file|edit_file"` → `"Write|Edit"`
  - 입력 방식: `$CLAUDE_TOOL_INPUT` → `jq -r '.tool_input.command'` (stdin JSON)
  - git commit 우회 패턴: `^git commit` → `(^|\|\||&&|;)\s*git\s+(commit|push)`
- **Added**: settings.json 훅 작성 규칙 주석 (matcher 명명, stdin 읽기, 차단 방법 등)
- **Added**: SEO 설계 문서 (`docs/superpowers/specs/2026-04-05-seo-design.md`)
- **Added**: SEO 구현 계획 (`docs/superpowers/plans/2026-04-05-seo-implementation.md`)

### 📊 Test Results
- Total: 766/766 passed (100%)
- Suites: 51/51 passed

### 📁 Files Modified
- `app/layout.tsx` (+42, -4)
- `app/login/page.tsx` (+85, -2)
- `app/page.tsx` (+1, -2)
- `app/sitemap.ts` (+2, -3)
- `app/invite/[token]/page.tsx` (+5, -2)
- `app/onboarding/page.tsx` (+2, -2)
- `app/onboarding/workspace/page.tsx` (+6, -0)
- `app/notifications/page.tsx` (+3, -2)
- `app/settings/page.tsx` (+1, -1)
- `app/workspace/[workspaceId]/page.tsx` (+1, -1)
- `app/workspace/[workspaceId]/board/page.tsx` (+1, -1)
- `app/workspace/[workspaceId]/members/page.tsx` (+1, -1)
- `app/workspace/[workspaceId]/analytics/page.tsx` (+1, -1)
- `app/workspace/[workspaceId]/wbs/page.tsx` (+1, -1)
- `app/workspace/[workspaceId]/burndown/page.tsx` (+1, -1)
- `app/workspace/[workspaceId]/trash/page.tsx` (+1, -1)
- `app/workspace/[workspaceId]/[ticketId]/page.tsx` (+1, -1)
- `.claude/settings.json` (훅 버그 수정 + 주석 추가)
- `docs/superpowers/specs/2026-04-05-seo-design.md` (+172, -0)
- `docs/superpowers/plans/2026-04-05-seo-implementation.md` (신규)

---

## [develop] - 2026-03-14 VIEWER 권한 제한 단위 테스트 + 대시보드 컬러 시스템 + 수영 레인 배경 + BurndownChart UI 개선

### 🎯 Prompts
1. "@docs/front/COLOR.json 에 다음의 컬러들을 추가하는데, 대시보드 상단 박스 배경색으로 넣어줘. CSS는 한곳에서 관리해서 내가 직접 컬러를 수정할 수 있도록 해야해 #f4f9f7, #f2fbfa, #eff6ff, #fffbeb, #ecfdf4"
2. "#fdf3f3 @StatCard 기한 초과 이 영역 컬러 교체해"
3. "@WbsClient 이 영역도 대시보드처럼 컬러 적용해"
4. "@WbsClient select 이 영역 최소 너비 200px이고 텍스트가 길 때 늘어나도록"
5. "#fdf3f3 @WbsClient Goal 이 영역 배경색깔로 변경해 / #f9cdcd @WbsClient 전체 완료율 이 영역 컬러 교체해 / 전체 완료율 폰트 색깔은 블랙으로"
6. "@TeamShell analytics 이 영역도 대시보드, WBS에 적용한 색깔 순차적으로 적용해"
7. "@TeamShell members 이 영역 색상도 WBS랑 동일한 컬러로"
8. "@ColumnInner 이 안에 티켓들은 #eff6ff 배경색으로 / Done 영역 내부 티켓의 배경색은 #ecfdf4 / in progress에 내부 티켓 배경색은 #fffbeb로 각 스위밍 라인별로 배경색을 다르게 줄거야"
9. "@BurndownChart 실제/이상 이 영역과 라인이 차트 안에 침범했어. 차트 영역 밖에 우측 위로 자리하게 해"
10. "@BurndownChart 실제/이상 이 위치는 지우고 @BurndownPeriodChart 지난주/이번달/지난달 이 위치의 우측 정렬로 해줘"
11. "@BurndownPeriodChart 범례 크기를 지금보다 하나 더 크게 해"
12. "@BurndownChart Y축 숫자들이랑 누적흐름도 숫자가 크기가 달라. 누적흐름도 기준으로 동일하게 맞춰"
13. "@BurndownChart 차트 크기는 왜 줄어야 해 그냥 원래 사이즈로 맞춰 크기가 누적흐름도랑 다르잖아"
14. "@MiniStat 33% 이 폰트색 629584로 변경해"
15. "이제 develop에 머지해"
16. "/simplify"

### ✅ Changes

#### 단위 테스트 추가
- **Added**: VIEWER 댓글 POST 403 차단 테스트, MEMBER 201 성공, 비인증 401 (`__tests__/api/tickets-comments.test.ts`)
- **Added**: `warningMessage` 설정/초기화/미설정 3개 테스트 케이스 (`__tests__/hooks/useTickets.test.ts`)

#### 대시보드 컬러 시스템
- **Added**: CSS 커스텀 프로퍼티 7개 (`--color-dash-green/teal/blue/amber/mint/red/pink`) + 수영 레인 4개 (`--color-card-bg-backlog/todo/in-progress/done`) (`app/globals.css`)
- **Added**: `docs/front/COLOR.json` — `dashboard` 섹션 컬러 토큰 7개 추가
- **Modified**: 대시보드 StatCard/KpiCard/ProgressCard에 CSS var 배경 적용 (`app/workspace/[workspaceId]/page.tsx`)
- **Modified**: Analytics MiniStat 순차 컬러 적용, 전체완료율 폰트 `#629584` (`app/workspace/[workspaceId]/analytics/page.tsx`)
- **Modified**: Members 요약 통계 카드 컬러 적용 (`app/workspace/[workspaceId]/members/page.tsx`)
- **Modified**: WBS 통계 카드 컬러 적용, Goal→red, 전체완료율→pink; select 너비 max-content (`src/components/team/WbsClient.tsx`)

#### 수영 레인 (Column별 카드 배경)
- **Added**: `COLUMN_CARD_BG` 상수, `cardBg` prop 전달 (`src/components/board/Column.tsx`)
- **Added**: `cardBg?: string` prop, `cardBg ?? 'var(--color-card-bg)'` fallback (`src/components/board/TicketCard.tsx`)

#### BurndownChart UI 개선
- **Fixed**: React duplicate key 오류 — `yTicks.map((v) =>` → `(v, i) =>` index 키 사용 (`src/components/team/charts/BurndownChart.tsx`)
- **Fixed**: 범례가 SVG 안에서 차트를 침범하던 문제 → SVG 밖으로 이동
- **Fixed**: 차트 크기 viewBox width=600, height=200으로 CumulativeFlowDiagram과 일치
- **Modified**: 범례를 `BurndownPeriodChart` 툴바 우측 정렬로 이동, 폰트/라인 크기 증가 (`src/components/team/charts/BurndownPeriodChart.tsx`)

#### /simplify 정리
- **Fixed**: BurndownChart `data.length > 0 &&` 중복 가드 제거 (early return으로 이미 처리됨)
- **Fixed**: BurndownPeriodChart `dataMap` 중간 변수 제거 → `{ lastWeek, thisMonth, lastMonth }[period]` 인라인

### 📊 Test Results
- Total: 458/458 passed (100%)
- 신규: 7개 테스트 추가 (comments 5 + warningMessage 3, 기존 1개 대체)

### 📁 Files Modified
- `__tests__/api/tickets-comments.test.ts` (+148 lines, new)
- `__tests__/hooks/useTickets.test.ts` (+46 lines)
- `app/globals.css` (+170, -100 lines)
- `docs/front/COLOR.json` (+11 lines)
- `app/workspace/[workspaceId]/page.tsx` (+23, -18 lines)
- `app/workspace/[workspaceId]/analytics/page.tsx` (+20, -10 lines)
- `app/workspace/[workspaceId]/members/page.tsx` (+12, -6 lines)
- `src/components/team/WbsClient.tsx` (+14, -8 lines)
- `src/components/board/Column.tsx` (+9, -1 lines)
- `src/components/board/TicketCard.tsx` (+5, -2 lines)
- `src/components/team/charts/BurndownChart.tsx` (+45, -55 lines)
- `src/components/team/charts/BurndownPeriodChart.tsx` (+35, -25 lines)

### 🌿 Branch
- `feature/viewer-auth` → merged into `develop` (commit: 97f4f36)

---

## [develop] - 2026-03-13 성능 최적화(CRITICAL/HIGH) — buildSessionUser 병렬화, 쿼리 중복 제거, 인메모리 계산 전환, DB 인덱스 추가

### 🎯 Prompts
1. "각 모듈과 쿼리 API 처리 등을 탐색해서 화면에서 느린 요소들이나 메모리가 과하게 소모되는 이벤트들 식별하고 어떤 방향으로 개선해야 하는지 연구해봐 ultrathink"
2. "CRITICAL 부터 정리해."
3. "좋아 이제 High 구현해"
4. "다음 단계 진행해"
5. "1번 부터"
6. "2 번 진행하고, @.claude/CLAUDE.md 에 코딩컨벤션 및 개발 참조 사항이로 개발시 지금같은 상황이 벌어지지 않도록 개발 원칙 추가해"

### ✅ Changes

#### CRITICAL 최적화
- **Fixed**: `buildSessionUser` 3개 순차 DB 쿼리 → `Promise.all` 병렬 실행 (`src/lib/auth.ts`) — 모든 API 요청의 세션 인증 비용 1 round trip으로 감소
- **Fixed**: `PATCH /api/tickets/:id` — `updateTicket`과 `setAssignees` 병렬화, `getAssigneesByTicket` 중복 호출 제거(`existing.assignees` 재사용) (`app/api/tickets/[id]/route.ts`)
- **Fixed**: `DELETE /api/tickets/:id` — `getAssigneesByTicket` 중복 호출 제거 (`app/api/tickets/[id]/route.ts`)
- **Fixed**: `bulkCreateNotificationLogs` — 단건 반복 INSERT → 단일 bulk INSERT (`src/db/queries/notificationLogs.ts`)
- **Fixed**: cron `notify-due` — 채널당 메시지 K번 반복 발송 버그 수정 → 채널당 1회 발송, `Promise.allSettled` 병렬화 (`app/api/cron/notify-due/route.ts`)

#### HIGH 최적화
- **Added**: `computePeriodBurndown` export, `computeCycleTimeFromTickets` 인메모리 계산 함수 추가 (`src/db/queries/analytics.ts`)
- **Removed**: 대시보드 `getWbsTickets` 제거 — `boardData.board` flat에서 파생, `statusCounts` O(1) 접근으로 교체 (`app/workspace/[workspaceId]/page.tsx`)
- **Removed**: 분석 페이지 `getCycleTimeData`, `getMultiPeriodBurndownData` DB 쿼리 제거 → 인메모리 계산으로 대체 (`app/workspace/[workspaceId]/analytics/page.tsx`)
- **Added**: DB 인덱스 2개 — `idx_tickets_workspace_completed_at`, `idx_members_workspace_role` (`src/db/schema.ts`)

### 📊 Build Results
- `npm run lint`: ✅ 에러 0 (기존 unused-vars 경고만 유지)
- `npm run build`: ✅ 성공 — 27개 정적 페이지, 타입 에러 0

### 📁 Files Modified
- `src/lib/auth.ts` (+58, -16 lines)
- `app/api/cron/notify-due/route.ts` (+94, -56 lines)
- `app/api/tickets/[id]/route.ts` (+57, -40 lines)
- `src/db/queries/notificationLogs.ts` (+23, -0 lines)
- `src/db/queries/analytics.ts` (+23, -3 lines)
- `app/workspace/[workspaceId]/page.tsx` (+23, -16 lines)
- `app/workspace/[workspaceId]/analytics/page.tsx` (+28, -20 lines)
- `src/db/schema.ts` (+6, -1 lines)
- `migrations/meta/_journal.json` (+7, -0 lines)

---

## [develop] - 2026-03-13 13:08 (멤버 알림 MemberDrawer 연결 + 워크스페이스 참여 한도 + 라벨 단일 소스 + 랜딩 통계 수정)

### 🎯 Prompts
1. "멤버 승인, 조인 이런 알림들은 멤버관리 레이어창이 열려야 하는거 아냐?"
2. "개인이 개설할 수 있는팀 워크스페이스 갯수는 3개야. 마찬가지로 개인이 참여할 수 있는 워크스페이스도 3개여야해. 워크스페이스 추가 로직에서 내가 가입되어있는 TEAM 워크스페이스 갯수를 구해서 3개 초과시 더 이상 워크스페이스에 참여할 수 없습니다라는 경고 뿌려"
3. "CROSS JOIN (VALUES ...) 이거 자동 생성 라벨 기능이랑 데이터 다른거 같은데 / 라벨에 Analyze 가 없어? / 내가 분명 과거 지시에 Plan 이랑 Analyze 라벨이 기본값으로 있어야 한다고 했는데"
4. "seed, @src/lib/constants.ts 등 기본 데이터 셋에 포함해, 온보딩에 자동생성되는건 제외해. 사용자가 생성하는거지 자동생성은 세팅에서만 되어야 해"
5. "prod 메인 랜딩 페이지에 prod 워크스페이스는 3건인데, 총 2개팀, 1개의 워크스페이스가 사용중이라고만 나와. 왜 데이터가 다르지?"

### ✅ Changes
- **Fixed**: 멤버 알림(JOIN_REQUEST_RECEIVED, MEMBER_JOINED) 클릭 시 URL 이동 대신 MemberDrawer 열기 (`src/components/layout/Header.tsx`)
- **Added**: `getTeamWorkspaceMemberCount(userId)` — 사용자의 TEAM 워크스페이스 멤버 수 조회 (`src/db/queries/members.ts`)
- **Added**: 워크스페이스 참여 신청 시 3개 초과 차단 (`app/api/workspaces/[id]/join-requests/route.ts`)
- **Added**: 참여 신청 승인 시 3개 초과 방어 체크 (`app/api/workspaces/[id]/join-requests/[reqId]/route.ts`)
- **Added**: 초대 수락 시 3개 초과 차단 (`app/api/invites/[token]/accept/route.ts`)
- **Modified**: `DEFAULT_LABELS` 9개로 확장 (Plan, Frontend, Backend, Analyze, Test, Debug, Design, Infra, QA) (`src/lib/constants.ts`)
- **Removed**: `createPersonalWorkspace`에서 라벨 자동 생성 제거 (`src/lib/auth.ts`)
- **Modified**: `LabelSection` 로컬 템플릿 상수 제거 → `DEFAULT_LABELS` 단일 소스로 통합 (`src/components/settings/LabelSection.tsx`)
- **Added**: `scripts/reset.sql` — 테이블 전체 TRUNCATE RESTART IDENTITY
- **Added**: `scripts/seed.sql` — 실제 사용자(eDell/performizer@gmail.com) 기준 시드 (Goal→Story→Feature→Task)
- **Modified**: `scripts/reset-and-seed.sql` — 9개 라벨 반영
- **Fixed**: 랜딩 페이지 통계 문구 "2팀" → "2명" (totalUsers는 사용자 수임) (`app/login/page.tsx`)

### 📁 Files Modified
- `app/login/page.tsx` (+1, -1 lines)
- `src/components/settings/LabelSection.tsx` (+7, -14 lines)
- `src/lib/auth.ts` (+1, -10 lines)
- `src/lib/constants.ts` (+9, -6 lines)
- `scripts/reset.sql` (new)
- `scripts/seed.sql` (new)
- `scripts/reset-and-seed.sql` (label section updated)
- `src/db/queries/members.ts` (getTeamWorkspaceMemberCount added)
- `app/api/workspaces/[id]/join-requests/route.ts` (3개 한도 체크)
- `app/api/workspaces/[id]/join-requests/[reqId]/route.ts` (승인 시 방어 체크)
- `app/api/invites/[token]/accept/route.ts` (수락 시 한도 체크)
- `src/components/layout/Header.tsx` (알림 클릭 MemberDrawer 연결)

---

## [debug/workspace] - 2026-03-13 (VIEWER 제한 구현 + QA 리포트 + 라벨 자동 생성 템플릿)

### 🎯 Prompts
1. "5-2 온보딩 순차는 현재 유지하고 나머지 구현해"
2. "현재 작업한 QA 리포트: check_list_workspace.md 구현 현황 점검에 대한 구현 내역과 확인 방법 등을 정리한 QA_REPORT.md를 작성해. 이미 과거에 완성된거 말고 이번에 추가로 완성된 내역들에 대해서 설명하고 QA 점검을 어떻게 해야 할지 설명해야해 작성 완료되면 커밋하고 푸시해"
3. "QA_REPORT랑 @docs/check_list_notification.md @docs/check_list_workspace.md 랑 내용 비교해서 구현된 내역이 있으면 체크해"
4. "이제 로컬 데이터 리셋해 (전체 초기화 Drop + Migrate + Seed)"
5. "이 영역에 라벨 자동 생성 버튼 두고 생성 누르면 공통 모달로 기본 라벨을 생성하겠습니까? 띄운 후 확인을 누르면 다음의 라벨을 생성해 Plan, Frontend, Backend, Analize, Test, Debug, Design, Infra, QA 철자 잘못된거 있는지 검사해서 자동으로 라벨 생성하는 템플릿 기능 추가해"
6. "티켓에 사용할 라벨을 관리합니다. 최대 20개까지 생성할 수 있으며, 라벨 삭제 시 연결된 티켓에서 자동으로 제거됩니다. 이 기능 제대로 구현 된건지 확인해"
7. "현재 커밋된 debug/workspace 브랜치에서 docs/phase 는 커밋된거 같은데 이거 리모트에 들어가면 안돼. 리모트에서 삭제하는 방법은? (A: 로컬 유지, 리모트에서만 제거)"
8. "@<ConfirmDialog> 라벨은 테두리만 있는 룩앤필이 원칙이야. 내부 소스 확인해서 모양 맞추고, 대신 이 영역에서 클릭 시 선택/비활성화 되도록 한 뒤 선택된것만 insert 하도록 해줘"

### ✅ Changes

#### VIEWER 권한 제한 (check_list_workspace.md 4-2, 4-3, 4-4, 4-5, 4-6, 4-8)
- **Modified**: `app/api/tickets/[id]/comments/route.ts` — POST에 `requireRole(TEAM_ROLE.MEMBER)` 가드 추가 → VIEWER 댓글 작성 API 차단 (403)
- **Modified**: `app/workspace/[workspaceId]/members/page.tsx` — 서버 컴포넌트에서 VIEWER role 감지 시 보드로 redirect (URL 직접 접근 차단)
- **Modified**: `src/components/ticket/TicketModal.tsx` — `readOnly?: boolean` prop 추가; 우선순위/날짜/담당자/저장/삭제 모두 조건부 비활성화
- **Modified**: `src/components/board/BoardContainer.tsx` — `readOnly` prop 추가 → TicketModal에 전달
- **Modified**: `src/components/team/TeamBoardClient.tsx` — `role` prop 추가; DnD 센서 `distance: 9999` / `delay: 9999`로 VIEWER 드래그 차단; `BoardContainer`에 `readOnly={isViewer}` 전달
- **Modified**: `src/components/layout/TeamShell.tsx` — VIEWER 새 티켓 버튼 차단 (`if (role === 'VIEWER') return`); 티켓 생성 후 `warning` 필드 감지 → dismissible 경고 배너 표시

#### 티켓 한도 경고 배너 (check_list_workspace.md 1-5, 2-8)
- **Modified**: `src/hooks/useTickets.ts` — `createTicket` API 응답에서 `warning` 필드 읽어 `warningMessage` 상태 저장; `clearWarning` 노출
- **Modified**: `src/components/team/TeamBoardClient.tsx` — `warningMessage` 배너 렌더링 추가 (노란색 `#FEF3C7`, × 닫기 버튼)

#### QA 문서
- **Added**: `docs/QA_REPORT.md` — 이번 세션에서 새로 구현된 8개 항목 상세 설명 및 검증 방법 정리
- **Modified**: `docs/check_list_workspace.md` — 구현 완료 항목 `[ ]` → `[x]` 갱신 (4-2, 4-3, 4-4, 4-5, 4-6, 4-8, 1-5, 2-8)
- **Modified**: `docs/check_list_notification.md` — 구현 완료 항목 `[ ]` → `[x]` 갱신 (2개 미구현: 벨 배지 99+, Sprint 알림 설정 토글)

#### .gitignore / 리모트 정리
- **Modified**: `.gitignore` — `docs/phase/` 활성화 (이전: 주석 처리)
- **Removed** (from remote): `docs/phase/` 디렉토리 — `git rm --cached -r docs/phase/` 후 push, 로컬 파일은 유지

#### 라벨 자동 생성 템플릿 (LabelSection)
- **Modified**: `src/components/settings/LabelSection.tsx`
  - `DEFAULT_TEMPLATE_LABELS` 상수 추가 (Plan/Frontend/Backend/Analyze/Test/Debug/Design/Infra/QA — 철자 수정: "Analize" → "Analyze")
  - `ConfirmDialog`에 `confirmLabel?`, `confirmVariant?`, `children?` prop 확장
  - "기본 라벨 자동 생성" 버튼 추가 (`⚡` 아이콘, 그린 아웃라인 스타일)
  - 클릭 시 ConfirmDialog 열림 → 라벨 목록 클릭 토글 (선택/비선택)
  - 라벨 미리보기: LabelBadge와 동일한 테두리 전용 스타일 (`background: transparent`, `border: 1px solid color`)
  - `selectedTemplateNames: Set<string>` — 기본 전체 선택, 토글 시 Set 업데이트
  - 확인 버튼 레이블: `생성 (N개)` (선택 개수 실시간 반영)
  - `handleCreateTemplate`: 이미 존재하는 라벨 skip, 한도(20개) 초과 시 에러, 성공 시 toast

### 📁 Files Modified
- `app/api/tickets/[id]/comments/route.ts` (+5, -0 lines)
- `app/workspace/[workspaceId]/members/page.tsx` (+4, -1 lines)
- `src/components/ticket/TicketModal.tsx` (+30, -10 lines)
- `src/components/board/BoardContainer.tsx` (+6, -2 lines)
- `src/components/team/TeamBoardClient.tsx` (+35, -5 lines)
- `src/components/layout/TeamShell.tsx` (+25, -3 lines)
- `src/hooks/useTickets.ts` (+15, -5 lines)
- `docs/QA_REPORT.md` (+257, -0 lines) — **신규 생성**
- `docs/check_list_workspace.md` (+/- 체크박스 갱신)
- `docs/check_list_notification.md` (+/- 체크박스 갱신)
- `.gitignore` (+1, -1 lines)
- `src/components/settings/LabelSection.tsx` (+119, -10 lines)

---


## [develop] - 2026-03-11 (팀 보드 버그 수정 + UX 개선 + WIP 툴팁 + 주간 필터 + 데이터 삽입)

### 🎯 Prompts
1. "이전작업 다시 이어서"
2. "@<Modal> brew 라고 입력해도 검색결과가 안나와"
3. "@<Modal> 이 영역 복사 및 닫기는 우측 정렬"
4. "@<Modal> 여전히 brew 라고 입력해도 안나와"
5. "@<TicketCardInner> 상위 카테고리가 노출된 티켓에서 클릭시 상세 페이지로 이동"
6. "@<Modal> 담당자 추가 및 담당자 지정된 내역 박스는 이 영역에 100% 너비여야해"
7. "상세 보이길 경우 이 영역이 글의 길이 만큼 길어지고 나머지 영역은 밑으로 밀리는거야"
8. "@<TicketDetailPage> 이 영역도 글의 길이 만큼 넓어지고 나머지 영역은 밑으로 밀리고 스크롤"
9. "@<TicketDetailPage> and @<TeamSidebar> 이 영역의 높이가 맞도록 해줘"
10. "@<TicketCardInner> 오버시 밑줄 및 색상 변경 효과"
11. "@<Modal> 이것도 담당자 추가와 마찬가지로 같은 너비로 고정"
12. "각 티켓에 라벨 최소 한개 이상으로 추가해 데이터 인서트 해줘"
13. "@<Modal> tika-45번 티켓인데 G 영역은 선택하세요가 나오고 S 영역은 [G] 알림시스템 완성이 나와 f 영역은 리스트도 없어. 데이터 검증해봐"
14. "@<BacklogItem> 공간이 부족해질때 하나씩 라벨이 가려져야지 왜 밑으로 내려가지?"
15. "@<ColumnInner> 이 표시는 어떤 의미지?"
16. "@<ColumnInner> 마우스 오버시 공통 툴팁 보여줘야지 적정 칸반 티켓수 = 3, 현재 3건 초과 이런식으로"
17. "@<BoardFilterBar> 이 필터는 이번주에 Done인것과 + 이번주 금요일까지 완료해야 할 건이 나와야 해"
18. "@<BacklogPanel> and @<BoardFilterBar> 사이 간격이 15px 정도 벌어진건 붙일수 없어?"

### ✅ Changes

#### 드래그 앤 드롭 버그 수정 (팀 보드)
- **Fixed**: `app/api/tickets/reorder/route.ts` — `session.user.workspaceId`(primary)가 아닌 요청 본문의 `workspaceId`로 멤버십 검증 후 처리. 팀 보드에서 티켓 드래그 시 "티켓을 찾을 수 없습니다" 404 에러 해결
- **Modified**: `src/lib/validations.ts` — `reorderSchema`에 `workspaceId: z.number().int().positive().optional()` 추가
- **Modified**: `src/hooks/useTickets.ts` — `reorder()` 함수에 `workspaceId?: number` 파라미터 추가, 요청 본문에 포함
- **Modified**: `src/components/team/TeamBoardClient.tsx` — `handleDragEnd`에서 `workspaceId` 전달

#### 담당자 검색 수정 (TicketModal)
- **Fixed**: `app/api/members/route.ts` — `?workspaceId=N` 쿼리 파라미터 지원 추가. 팀 워크스페이스 멤버를 멤버십 검증 후 반환
- **Fixed**: `src/components/ticket/TicketModal.tsx` — 담당자 검색: Enter키 필요 → 입력 즉시 결과 표시 (`assigneeSearched` 상태 제거)
- **Fixed**: `src/components/ticket/TicketModal.tsx` — 멤버 fetch URL에 `ticket.workspaceId` 파라미터 추가 (세션의 primary workspace가 아닌 현재 티켓 워크스페이스 기준)

#### TicketModal UX 개선
- **Fixed**: `src/components/ticket/TicketModal.tsx` — 복사/닫기 버튼 `marginLeft: 'auto'`로 헤더 우측 정렬
- **Modified**: `src/components/ticket/TicketModal.tsx` — 담당자 영역 100% 너비 (칩 + 추가 버튼 모두 `width: '100%'`)
- **Modified**: `src/components/ticket/TicketModal.tsx` — 설명 textarea 자동 높이 (`descTextareaRef` + `scrollHeight` 기반 auto-resize)
- **Removed**: 미사용 `iconBtnBase` 스타일 객체 제거

#### TicketCard 개선
- **Added**: `src/components/board/TicketCard.tsx` — 상위 태그 클릭 시 부모 티켓 상세 페이지 이동 (`handleNavigateToParent`)
- **Modified**: `src/components/board/TicketCard.tsx` — 상위 태그 hover 시 밑줄 + 타입 색상 변경 효과
- **Modified**: `src/components/team/TeamBoardClient.tsx` — BacklogItem 라벨 `flexWrap: 'nowrap', overflow: 'hidden'` (공간 부족 시 라벨이 줄 바꿈 → 숨김으로 변경)

#### TicketDetailPage 개선
- **Modified**: `src/components/ticket/TicketDetailPage.tsx` — 설명 textarea 자동 높이 (`scrollHeight` auto-resize)
- **Modified**: `src/components/ticket/TicketDetailPage.tsx` — 헤더 고정 높이 48px (`height: 48, padding: '0 20px'`)

#### BreadcrumbPicker 버그 수정
- **Fixed**: `src/components/ticket/BreadcrumbPicker.tsx` — `useEffect` 조상 체인 탐색 로직: 인덱스 역순이 아닌 `ancestorTypes.indexOf(p.type)`으로 정확한 슬롯 배치 (tika-45 G/S/F 계층 오표시 수정)
- **Fixed**: `src/components/ticket/BreadcrumbPicker.tsx` — `useState` 초기값도 `parent.type` 인덱스 기반으로 수정

#### WIP 툴팁 (신규 공통 컴포넌트)
- **Added**: `src/components/ui/Tooltip.tsx` — 공통 호버 툴팁 (fixed positioning, 화살표, `position: 'top' | 'bottom'`)
- **Modified**: `src/components/board/Column.tsx` — IN_PROGRESS 초과 배지의 native `title` → `<Tooltip>` 교체 ("적정 칸반 티켓수 = 3, 현재 N건 초과")

#### 주간 필터 개선
- **Modified**: `src/hooks/useBoardFilter.ts` — "이번 주" 필터: 이번 주 완료(DONE) + 이번 주 금요일까지 마감 예정(미완료) 포함
- **Modified**: `src/components/board/BoardFilterBar.tsx` — 버튼 라벨 "이번 주 완료" → "이번 주"

#### 데이터 삽입
- **Modified**: `ticket.sql` — 워크스페이스 8번 전체 티켓에 라벨 1개 이상 추가 (labels + ticket_labels INSERT)

### 📁 Files Modified
- `app/api/members/route.ts` (+32 lines)
- `app/api/tickets/reorder/route.ts` (+41 lines)
- `src/lib/validations.ts` (+1 line)
- `src/hooks/useTickets.ts` (+4 lines)
- `src/components/team/TeamBoardClient.tsx` (+8 lines)
- `src/components/ticket/TicketModal.tsx` (+76, -대폭 정리)
- `src/components/board/TicketCard.tsx` (+18 lines)
- `src/components/ticket/TicketDetailPage.tsx` (+22 lines)
- `src/components/ticket/BreadcrumbPicker.tsx` (+20 lines)
- `src/components/ui/Tooltip.tsx` (신규, ~75 lines)
- `src/components/board/Column.tsx` (+24 lines)
- `src/hooks/useBoardFilter.ts` (+28 lines)
- `src/components/board/BoardFilterBar.tsx` (+2 lines)
- **총 23 files changed, +354 / -943 lines**

---

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
