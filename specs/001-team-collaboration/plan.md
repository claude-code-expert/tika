# Implementation Plan: Team Collaboration Workspace

**Branch**: `001-team-collaboration` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)

---

## Summary

팀 워크스페이스 협업 기능(Phase 4)을 구현한다. RBAC(OWNER/MEMBER/VIEWER) 권한 체계, 이메일 귀속 초대 링크, 다중 담당자, 스프린트 라이프사이클, 5개 팀 화면(대시보드·WBS·멤버 워크로드·분석·번다운)을 SDD 방식으로 설계 후 구현한다. 기존 개인 보드 22개 API와의 하위 호환을 유지한다.

---

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: Next.js 15 App Router, Drizzle ORM 0.38, Zod 3.24, NextAuth.js v5, Tailwind CSS 4, @dnd-kit 6.x
**Storage**: Vercel Postgres (Neon) — PostgreSQL
**Testing**: Jest 29.7, @testing-library/react 16
**Target Platform**: Vercel (Node.js serverless)
**Performance Goals**: 팀 대시보드 5초 이내 렌더링 (1,000 티켓·50 멤버), 스프린트 상태 전이 후 1초 이내 통계 반영
**Constraints**: 외부 차트 라이브러리 도입 불가, 새 npm 패키지 추가 시 사용자 명시적 승인 필요
**Scale/Scope**: 워크스페이스당 1,000 티켓·50 멤버, 사용자당 팀 워크스페이스 최대 3개

---

## Constitution Check

| Principle | Status | Notes |
|-----------|:------:|-------|
| I. Spec-Driven Development | ✅ | spec.md → clarify → plan.md 순서 준수 |
| II. Type Safety | ✅ | Zod 스키마 + strict 타입, `as const` 맵만 사용 |
| III. Security-First | ✅ | `requireRole()` 헬퍼로 모든 팀 API 진입부 RBAC 검증 |
| IV. Data Safety | ✅ | schema.ts 변경 전 사용자 확인, 마이그레이션만 사용 |
| V. YAGNI | ✅ | 신규 라이브러리 없음, SVG 차트 직접 구현 |
| VI. Optimistic UI | ✅ | 기존 useTickets 패턴 재사용, 팀 컴포넌트도 동일 패턴 |

**위반 없음. 구현 진행 가능.**

---

## Project Structure

### Documentation (this feature)

```text
specs/001-team-collaboration/
├── spec.md              ✅ 완료
├── research.md          ✅ 완료
├── data-model.md        ✅ 완료
├── quickstart.md        ✅ 완료
├── contracts/
│   └── api.md           ✅ 완료
├── checklists/
│   └── requirements.md  ✅ 완료
├── plan.md              ← 이 파일
└── tasks.md             (다음 단계: /speckit.tasks)
```

### Source Code (신규/수정 파일)

```text
src/
├── types/
│   └── index.ts                 MODIFY — TEAM_ROLE, SPRINT_STATUS, INVITE_STATUS 추가
├── lib/
│   ├── permissions.ts           NEW    — requireRole() RBAC 헬퍼
│   └── validations.ts           MODIFY — updateMemberRoleSchema enum 수정, 신규 스키마
├── db/
│   ├── schema.ts                MODIFY — 3개 테이블 신규, 3개 테이블 컬럼 추가 (사용자 확인 필수)
│   └── queries/
│       ├── members.ts           MODIFY — role 값 수정, getUserWorkspaces() 추가
│       ├── workspaces.ts        MODIFY — getWorkspacesByMemberId() 추가
│       ├── sprints.ts           NEW    — Sprint CRUD + 상태 전이
│       ├── invites.ts           NEW    — Invite CRUD + token 조회
│       ├── ticketAssignees.ts   NEW    — 다중 담당자 M:N 쿼리
│       └── analytics.ts         NEW    — 번다운/CFD/벨로시티/사이클타임 집계
└── components/
    ├── layout/
    │   └── TeamShell.tsx        NEW    — 팀 전용 AppShell (DnD 없음)
    ├── team/
    │   ├── TeamSidebar.tsx      NEW
    │   ├── WorkspaceSwitcher.tsx NEW
    │   ├── SprintBanner.tsx     NEW
    │   ├── DeadlineOverview.tsx NEW
    │   ├── GoalProgressRow.tsx  NEW
    │   ├── WbsMiniCard.tsx      NEW
    │   ├── WorkloadHeatmap.tsx  NEW
    │   ├── MemberDetailCard.tsx NEW
    │   ├── InviteModal.tsx      NEW
    │   ├── GanttChart.tsx       NEW    — 순수 SVG/DOM
    │   └── charts/
    │       ├── BurndownChart.tsx        NEW
    │       ├── BurndownChartFull.tsx    NEW
    │       ├── ProgressDonut.tsx        NEW
    │       ├── CumulativeFlowDiagram.tsx NEW
    │       ├── VelocityChart.tsx        NEW
    │       ├── CycleTimeAnalysis.tsx    NEW
    │       ├── TypeDistributionChart.tsx NEW
    │       ├── LabelAnalyticsCard.tsx   NEW
    │       ├── TrendChart.tsx           NEW
    │       ├── PriorityStatusMatrix.tsx NEW
    │       └── DailyLogTable.tsx        NEW
    ├── board/
    │   └── TicketCard.tsx       MODIFY — 다중 담당자 아바타 스택, 스프린트 뱃지
    └── ticket/
        └── TicketForm.tsx       MODIFY — 스프린트 셀렉터, 스토리 포인트, 다중 담당자

app/
├── api/
│   ├── workspaces/
│   │   ├── route.ts             MODIFY — POST 추가, GET 범위 확장
│   │   └── [id]/
│   │       ├── route.ts         MODIFY — PATCH/DELETE 추가
│   │       ├── members/
│   │       │   ├── route.ts     NEW
│   │       │   ├── me/route.ts  NEW
│   │       │   ├── workload/route.ts NEW
│   │       │   └── [memberId]/route.ts NEW
│   │       ├── invites/
│   │       │   ├── route.ts     NEW
│   │       │   └── [inviteId]/route.ts NEW
│   │       ├── sprints/
│   │       │   ├── route.ts     NEW
│   │       │   └── [sid]/
│   │       │       ├── route.ts       NEW
│   │       │       ├── activate/route.ts NEW
│   │       │       └── complete/route.ts NEW
│   │       └── analytics/
│   │           ├── burndown/route.ts  NEW
│   │           ├── cfd/route.ts       NEW
│   │           ├── velocity/route.ts  NEW
│   │           ├── cycle-time/route.ts NEW
│   │           └── labels/route.ts    NEW
│   ├── invites/
│   │   └── [token]/
│   │       ├── route.ts         NEW (인증 불필요)
│   │       ├── accept/route.ts  NEW
│   │       └── reject/route.ts  NEW
│   └── cron/route.ts            MODIFY — 초대 만료 처리 추가
├── team/
│   └── [workspaceId]/
│       ├── page.tsx             NEW — 팀 대시보드
│       ├── members/page.tsx     NEW — 멤버 워크로드
│       ├── analytics/page.tsx   NEW
│       ├── burndown/page.tsx    NEW
│       └── wbs/page.tsx         NEW
└── invite/
    └── [token]/page.tsx         NEW — 초대 수락 페이지

__tests__/
├── lib/
│   └── permissions.test.ts      NEW — RBAC 26개 조합
└── api/
    ├── workspaces/              NEW
    ├── invites/                 NEW
    └── sprints/                 NEW
```

---

## Implementation Phases

### Phase A: 기반 (DB + 타입 + RBAC)
선행 필요. 이후 모든 단계가 의존.

1. `src/db/schema.ts` 수정 (사용자 확인 후)
2. `npm run db:generate` → 마이그레이션 SQL에 role UPDATE 쿼리 추가
3. `npm run db:migrate` 실행
4. `src/types/index.ts` — TEAM_ROLE, SPRINT_STATUS, INVITE_STATUS, 기존 타입 확장
5. `src/lib/validations.ts` — enum 수정 + 신규 스키마
6. `src/lib/permissions.ts` — requireRole() 헬퍼 신규

### Phase B: DB 쿼리 레이어
Phase A 완료 후 병렬 가능.

7. `src/db/queries/members.ts` — role 값 수정, getUserWorkspaces()
8. `src/db/queries/workspaces.ts` — getWorkspacesByMemberId()
9. `src/db/queries/sprints.ts` — Sprint CRUD + activate/complete
10. `src/db/queries/invites.ts` — Invite CRUD + token 조회
11. `src/db/queries/ticketAssignees.ts` — 다중 담당자 M:N
12. `src/db/queries/analytics.ts` — 집계 쿼리 5종

### Phase C: Workspace + Member + Invite API
Phase B 완료 후.

13. `app/api/workspaces/route.ts` — POST/GET 확장
14. `app/api/workspaces/[id]/route.ts` — PATCH/DELETE
15. `app/api/workspaces/[id]/members/*.ts` — 멤버 관리 4개 라우트
16. `app/api/workspaces/[id]/invites/*.ts` — 초대 관리 2개 라우트
17. `app/api/invites/[token]/*.ts` — 초대 수락/거절 3개 라우트
18. `app/api/cron/route.ts` — 초대 만료 처리 추가

### Phase D: Sprint API
Phase B 완료 후 Phase C와 병렬 가능.

19. `app/api/workspaces/[id]/sprints/*.ts` — 스프린트 CRUD + activate/complete

### Phase E: Analytics API
Phase B 완료 후.

20. `app/api/workspaces/[id]/analytics/*.ts` — analytics 5개 라우트
21. `app/api/workspaces/[id]/members/workload/route.ts`

### Phase F: 팀 레이아웃 + 페이지
Phase C 완료 후.

22. `src/components/layout/TeamShell.tsx`
23. `src/components/team/TeamSidebar.tsx`, `WorkspaceSwitcher.tsx`
24. `src/components/ui/RoleBadge.tsx`
25. `app/team/[workspaceId]/page.tsx` (대시보드)
26. `app/team/[workspaceId]/members/page.tsx`
27. `app/team/[workspaceId]/analytics/page.tsx`
28. `app/team/[workspaceId]/burndown/page.tsx`
29. `app/team/[workspaceId]/wbs/page.tsx`
30. `app/invite/[token]/page.tsx`

### Phase G: 팀 컴포넌트 + 차트
Phase E, F 완료 후.

31. 기본 컴포넌트: SprintBanner, DeadlineOverview, GoalProgressRow, WbsMiniCard
32. 멤버 컴포넌트: WorkloadHeatmap, MemberDetailCard
33. 초대 컴포넌트: InviteModal
34. 차트: BurndownChart, ProgressDonut, TrendChart, PriorityStatusMatrix
35. 차트: CumulativeFlowDiagram, VelocityChart, CycleTimeAnalysis
36. 차트: TypeDistributionChart, LabelAnalyticsCard, DailyLogTable
37. GanttChart (SVG, 마지막 구현)

### Phase H: 기존 컴포넌트 확장 + 테스트
Phase G 완료 후.

38. `TicketCard.tsx` — 다중 담당자 아바타 스택
39. `TicketForm.tsx` — 스프린트 셀렉터, 스토리 포인트, 다중 담당자
40. `__tests__/lib/permissions.test.ts` — RBAC 26개 조합
41. `__tests__/api/workspaces/*.test.ts` — API 통합 테스트
42. `npm test && npm run lint && npm run build`

---

## Key Design Decisions

| 결정 | 선택 | 이유 |
|------|------|------|
| RBAC 구현 방식 | `requireRole()` 헬퍼 함수 | Next.js middleware edge 제약 우회, 기존 패턴 일치 |
| 워크스페이스 컨텍스트 | URL param 기반 | 세션 복잡도 최소화, 개인 보드 하위 호환 |
| 다중 담당자 | `ticket_assignees` 추가 + `assignee_id` 유지 | 기존 22개 API 하위 호환 |
| Analytics 전략 | 실시간 집계 | 1,000 티켓 규모에서 충분, 스냅샷 불필요 |
| Gantt 차트 | 순수 SVG/DOM | Constitution V — 외부 라이브러리 금지 |
| 번다운 기준 | 티켓 수 기본 + 스토리 포인트 토글 | 포인트 미사용 팀도 즉시 사용 가능 |
| 초대 토큰 | 이메일 귀속 | 보안: 의도치 않은 멤버 합류 차단 |
| 수영 레인/WIP | 보류 | Board 전면 재작성 필요, 프로토타입 없음 |

---

## Complexity Tracking

*Constitution 위반 없음 — 이 섹션은 비워둠.*

---

## Verification Checklist

- [ ] `npm run db:migrate` 성공, role UPDATE 쿼리 적용 확인
- [ ] `npm test` — RBAC 26개 조합 모두 통과
- [ ] VIEWER로 티켓 생성 시도 → 403 확인
- [ ] OWNER가 아닌 사용자가 스프린트 생성 시도 → 403 확인
- [ ] 초대 링크를 타 이메일 계정으로 수락 시도 → 403 확인
- [ ] ACTIVE 스프린트 2개 동시 생성 시도 → 409 확인
- [ ] 스프린트 완료 다이얼로그에서 미완료 티켓 목록 표시 및 이동 처리 확인
- [ ] 번다운 차트 티켓 수 / 스토리 포인트 토글 동작 확인
- [ ] 5개 팀 페이지가 HTML 프로토타입과 동일한 레이아웃으로 렌더링
- [ ] `npm run lint && npm run build` 에러 없음
