# Research: Team Collaboration — Phase 0

**Date**: 2026-03-04 | **Branch**: `001-team-collaboration`

---

## Decision 1: RBAC 미들웨어 위치 및 패턴

**Decision**: `src/lib/permissions.ts` 신규 파일에 `requireRole(userId, workspaceId, minimumRole)` 헬퍼 함수 구현

**Rationale**:
- 기존 22개 API 라우트가 수동 auth 체크 패턴(`const workspaceId = session.user.workspaceId`)을 공유한다.
- 팀 API는 세션 workspaceId 대신 URL param workspaceId를 사용해야 하므로 별도 헬퍼가 필요하다.
- 미들웨어가 아닌 헬퍼 함수로 구현하면 Next.js App Router의 route handler 패턴과 일치한다.

**Alternatives considered**:
- Next.js `middleware.ts` 전역 미들웨어: edge runtime 제약으로 Drizzle DB 쿼리 불가 → 거부
- Higher-order function wrapper: 기존 패턴과 상이하여 학습 비용 증가 → 거부

**Implementation**:
```typescript
// src/lib/permissions.ts
export type TeamRole = 'OWNER' | 'MEMBER' | 'VIEWER';
const ROLE_RANK: Record<TeamRole, number> = { OWNER: 3, MEMBER: 2, VIEWER: 1 };

export async function requireRole(
  userId: string,
  workspaceId: number,
  minimum: TeamRole,
): Promise<{ member: Member } | NextResponse> {
  const member = await getMemberByUserId(userId, workspaceId);
  if (!member) return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  if (ROLE_RANK[member.role as TeamRole] < ROLE_RANK[minimum])
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  return { member };
}
```

---

## Decision 2: 세션 workspaceId 처리 전략

**Decision**: 기존 `session.user.workspaceId` (개인 보드용) 유지 + 팀 API는 URL param 사용

**Rationale**:
- `src/lib/auth.ts`의 `session` 콜백은 현재 소유 워크스페이스 1개만 조회한다.
- 팀 페이지(`/team/[workspaceId]`)는 URL param의 workspaceId를 신뢰하고 `requireRole`로 멤버십을 검증한다.
- 개인 보드(`/dev`, `/`)의 22개 API 라우트는 세션 workspaceId를 그대로 사용한다 (하위 호환 유지).

**Alternatives considered**:
- 세션에 `workspaces[]` 배열 추가: 매 요청마다 전체 워크스페이스 목록 로드 → 불필요한 DB 부하
- JWT에 전체 워크스페이스 목록 포함: JWT 크기 증가 + 실시간 권한 변경 반영 불가 → 거부

---

## Decision 3: 다중 담당자(Multi-assignee) 저장 전략

**Decision**: `ticket_assignees` M:N 테이블 추가 + `tickets.assignee_id` 컬럼 유지 (하위 호환)

**Rationale**:
- 기존 22개 API가 `assigneeId`를 직접 참조하므로 컬럼 삭제 시 전면 수정 필요하다.
- 팀 티켓은 `ticket_assignees`에서 담당자 목록을 조회하고, 개인 보드는 `assigneeId`를 계속 사용한다.
- `TicketWithMeta` 타입에 `assignees: Member[]` 필드를 추가하여 팀 API 응답에서 제공한다.

---

## Decision 4: Analytics 계산 전략

**Decision**: 실시간 집계 (스냅샷 테이블 없음)

**Rationale**:
- NFR-301 목표: 워크스페이스당 1,000 티켓, 50 멤버. 이 규모는 집계 쿼리로 충분하다.
- Drizzle ORM으로 번다운(날짜별 완료 티켓), CFD(날짜별 상태별 티켓), 벨로시티(스프린트별 완료 포인트) 모두 GROUP BY + COUNT로 계산 가능하다.
- 스냅샷 테이블은 데이터 동기화 복잡도를 높이고 YAGNI 원칙에 위배된다.

---

## Decision 5: Gantt/WBS 차트 렌더링

**Decision**: 순수 SVG + React refs (외부 라이브러리 없음)

**Rationale**:
- Constitution V: 새 라이브러리 도입 시 사용자 명시적 승인 필요.
- HTML 프로토타입(team-wbs.html)이 3-패널 레이아웃(좌측 트리, 중앙 타임라인 그리드, 우측 메타)으로 설계되어 있어 SVG/DOM 방식으로 구현 가능하다.
- `GanttChart.tsx`는 `useRef`로 SVG 요소를 조작하고, 가로 스크롤은 CSS `overflow-x: auto`로 처리한다.

---

## Decision 6: 번다운 차트 토글 (티켓 수 / 스토리 포인트)

**Decision**: 기본 Y축 = 잔여 티켓 수. 스프린트에 story_points_total > 0이면 토글 UI 노출.

**Rationale**:
- 스토리 포인트가 없는 팀도 번다운을 즉시 사용 가능하게 해야 한다 (clarification Q2 결과).
- API는 두 값 모두 반환하고 (`remainingTickets`, `remainingPoints`), 클라이언트에서 토글로 전환한다.

---

## Decision 7: 초대 링크 이메일 귀속

**Decision**: `workspace_invites.email` 컬럼으로 초대 대상 이메일 고정. 수락 시 로그인 계정 이메일과 대조.

**Rationale**:
- clarification Q4 결과: 대상 이메일 고정 방식 선택.
- `GET /api/invites/[token]`은 인증 없이도 초대 미리보기 정보를 제공한다 (이메일 전체는 마스킹).
- `POST /api/invites/[token]/accept`에서 `session.user.email === invite.email` 검증.

---

## Decision 8: role 값 마이그레이션

**Decision**: Drizzle 마이그레이션 SQL에 UPDATE 쿼리 포함하여 기존 `'admin'` → `'OWNER'`, `'member'` → `'MEMBER'`로 일괄 변경.

**Rationale**:
- `members.role` 컬럼의 기존 데이터를 코드와 일치시켜야 한다.
- 마이그레이션 파일은 `db:generate` 후 수동으로 커스텀 SQL을 추가한다.
- `validations.ts`, `types/index.ts`, 모든 role 비교 코드를 함께 수정한다.

---

## Resolved NEEDS CLARIFICATION

| 항목 | 결정 |
|------|------|
| 스프린트 완료 미완료 티켓 처리 | OWNER가 티켓별 수동 선택 (다음 스프린트 또는 백로그) |
| 번다운 Y축 기준 | 티켓 수 기본, 스토리 포인트 있으면 토글 |
| 미로그인 초대 링크 UX | 미리보기 → 로그인 → 자동 복귀 |
| 초대 토큰 정책 | 대상 이메일 귀속, 타 계정 수락 차단 |
| 워크스페이스 생성 제한 | OWNER 기준 최대 3개 |
