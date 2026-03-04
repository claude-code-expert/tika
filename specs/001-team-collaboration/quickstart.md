# Quickstart: Team Collaboration 개발 가이드

**Branch**: `001-team-collaboration`

---

## 전제 조건

- `develop` 브랜치의 Phase 1+2 기능이 모두 구현된 상태
- `.env.local`에 POSTGRES_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 설정됨

---

## 개발 순서

### Step 1: DB 스키마 변경

`src/db/schema.ts` 수정 (사용자 확인 후 진행):
1. `workspaces`에 `type` 컬럼 추가
2. `members`에 `invited_by`, `joined_at` 컬럼 추가, `role` default 변경
3. `tickets`에 `sprint_id`, `story_points` 추가
4. `sprints`, `workspace_invites`, `ticket_assignees` 테이블 신규 추가

마이그레이션 생성 및 적용:
```bash
npm run db:generate   # SQL 파일 확인
# migrations/ 에 생성된 파일에 역할 마이그레이션 SQL 수동 추가:
# UPDATE members SET role = 'OWNER' WHERE role = 'admin';
# UPDATE members SET role = 'MEMBER' WHERE role = 'member';
npm run db:migrate    # 적용
```

### Step 2: 타입 및 검증 업데이트

- `src/types/index.ts`: `TEAM_ROLE`, `SPRINT_STATUS`, `INVITE_STATUS` 추가, `MEMBER_ROLE` 수정
- `src/lib/validations.ts`: `updateMemberRoleSchema` enum 수정, 신규 스키마 추가
- `src/lib/permissions.ts`: `requireRole()` RBAC 헬퍼 신규 생성

### Step 3: DB 쿼리 레이어

- `src/db/queries/sprints.ts` 신규
- `src/db/queries/invites.ts` 신규
- `src/db/queries/ticketAssignees.ts` 신규
- `src/db/queries/analytics.ts` 신규
- `src/db/queries/members.ts` 수정 (role 값, 신규 쿼리)
- `src/db/queries/workspaces.ts` 수정 (`getWorkspacesByMemberId()`)

### Step 4: API 라우트 (25+ 엔드포인트)

`app/api/` 하위 신규 디렉토리 구조:
```
workspaces/[id]/
  members/route.ts, members/[memberId]/route.ts, members/me/route.ts
  invites/route.ts, invites/[inviteId]/route.ts
  sprints/route.ts, sprints/[sid]/route.ts
  sprints/[sid]/activate/route.ts, sprints/[sid]/complete/route.ts
  analytics/burndown/route.ts, analytics/cfd/route.ts
  analytics/velocity/route.ts, analytics/cycle-time/route.ts
  analytics/labels/route.ts, members/workload/route.ts
invites/[token]/route.ts, invites/[token]/accept/route.ts, invites/[token]/reject/route.ts
```

### Step 5: 팀 레이아웃 컴포넌트

- `src/components/layout/TeamShell.tsx`
- `src/components/team/TeamSidebar.tsx`
- `src/components/team/WorkspaceSwitcher.tsx`
- `src/components/ui/RoleBadge.tsx`

### Step 6: 팀 페이지 (5개 + 초대 페이지)

```
app/team/[workspaceId]/page.tsx          (대시보드)
app/team/[workspaceId]/members/page.tsx  (워크로드)
app/team/[workspaceId]/analytics/page.tsx
app/team/[workspaceId]/burndown/page.tsx
app/team/[workspaceId]/wbs/page.tsx
app/invite/[token]/page.tsx
```

### Step 7: 팀 컴포넌트

`src/components/team/` 하위 컴포넌트 및 차트 구현.
GanttChart는 의존성이 가장 복잡하므로 마지막에 구현.

### Step 8: 기존 컴포넌트 확장

- `TicketCard.tsx`: 다중 담당자 아바타 스택, 스프린트 뱃지
- `TicketForm.tsx`: 스프린트 셀렉터, 스토리 포인트 입력, 다중 담당자 셀렉터

### Step 9: 테스트

```bash
npm test              # 전체 Jest 테스트
npm run lint          # ESLint
npm run build         # TypeScript 빌드 확인
```

---

## 팀 페이지 접근 방법

개발 서버 실행 후:
- 개인 보드: `http://localhost:3000/dev`
- 팀 보드: `http://localhost:3000/team/[workspaceId]` (워크스페이스 생성 후)
- 초대 수락: `http://localhost:3000/invite/[token]`

---

## 핵심 설계 원칙

1. **URL param workspaceId**: 팀 API는 세션 `workspaceId`가 아닌 URL 파라미터 사용
2. **requireRole()**: 모든 팀 API 라우트 진입부에서 RBAC 검증
3. **하위 호환**: `tickets.assignee_id` 유지, 개인 보드 API 변경 최소화
4. **실시간 집계**: analytics는 스냅샷 없이 Drizzle 집계 쿼리로 처리
5. **SVG 차트**: 외부 라이브러리 없이 순수 React + SVG

---

## 참조 파일

| 파일 | 용도 |
|------|------|
| `public/demo/team/team.html` | 팀 대시보드 디자인 참조 |
| `public/demo/team/team-wbs.html` | WBS/Gantt 디자인 참조 |
| `public/demo/team/team-members.html` | 멤버 워크로드 디자인 참조 |
| `public/demo/team/team-analytics.html` | 분석 화면 디자인 참조 |
| `public/demo/team/team-burndown.html` | 번다운 차트 디자인 참조 |
| `docs/front/COLOR.json` | 색상 토큰 |
| `docs/front/DESIGN_SYSTEM.md` | 디자인 시스템 |
