# Tika Development Changelog

> 이 문서는 Tika 프로젝트의 개발 히스토리를 기록합니다.
> 각 엔트리는 프롬프트, 변경사항, 영향받은 파일을 포함합니다.

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
