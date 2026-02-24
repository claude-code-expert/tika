# Research: Tika Phase 1 MVP

**Branch**: `001-kanban-board` | **Date**: 2026-02-23
**Purpose**: Phase 0 리서치 — 기술 결정 및 구현 패턴 문서화

---

## Decision 1: NextAuth.js v5 세션 관리 (Next.js 15 App Router)

**Decision**: `auth()` 함수 기반 서버 사이드 세션 접근, `session` 콜백으로 workspace_id를 세션에 포함

**Pattern**:
```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [GoogleProvider({ ... })],
  callbacks: {
    async session({ session, user }) {
      // 세션에 workspace_id + member_id 포함
      const member = await db.query.members.findFirst({
        where: (m, { eq }) => eq(m.userId, user.id),
      });
      session.user.id = user.id;
      session.user.workspaceId = member?.workspaceId;
      session.user.memberId = member?.id;
      return session;
    },
  },
});

// API Route에서 세션 접근
const session = await auth();
if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' }}, { status: 401 });

// 서버 컴포넌트에서
const session = await auth();

// 클라이언트 컴포넌트에서
const { data: session } = useSession();
```

**Rationale**: v5에서 `auth()` 함수 방식이 표준. Cookie 기반 세션이며 세션에 workspaceId를 포함해 매 요청마다 DB 조회를 줄임.

**Alternatives considered**:
- JWT 기반 세션: Enterprise 기능으로 이동, MVP에서는 불필요
- 세션에 workspaceId 미포함 후 매번 조회: 불필요한 쿼리 증가

---

## Decision 2: 첫 로그인 자동 프로비저닝 패턴

**Decision**: `signIn` 콜백에서 트랜잭션으로 user → workspace → member 자동 생성

**Pattern**:
```typescript
callbacks: {
  async signIn({ user, account }) {
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, user.email!),
    });

    if (!existing) {
      await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(users).values({
          id: account!.providerAccountId, // Google sub claim
          email: user.email!,
          name: user.name!,
          avatarUrl: user.image ?? null,
        }).returning();

        const [workspace] = await tx.insert(workspaces).values({
          name: '내 워크스페이스',
          ownerId: newUser.id,
        }).returning();

        await tx.insert(members).values({
          userId: newUser.id,
          workspaceId: workspace.id,
          displayName: newUser.name,
          color: '#7EB4A2',
        });

        // 기본 라벨 6개 삽입
        await tx.insert(labels).values(DEFAULT_LABELS.map(l => ({
          ...l, workspaceId: workspace.id
        })));
      });
    }
    return true;
  }
}
```

**Rationale**: 트랜잭션으로 원자성 보장. 워크스페이스 생성 실패 시 사용자만 고립되는 상황 방지. signIn 콜백 실패 시 `false` 반환 → 로그인 차단.

**Alternatives considered**:
- 별도 `/api/init` 엔드포인트 호출: 레이스 컨디션 가능성, 불필요한 복잡도

---

## Decision 3: Drizzle ORM + Vercel Postgres 연결 패턴

**Decision**: `max: 1` 연결 풀 (Vercel 서버리스 최적화) + 관련 데이터 배치 병렬 조회

**Pattern**:
```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 1,                        // 서버리스: Vercel이 HTTP 풀링 처리
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false }, // Vercel Postgres 필수
});

export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});
```

**관련 데이터 배치 로드 패턴 (N+1 방지)**:
```typescript
// src/db/queries/tickets.ts
export async function getBoardData(workspaceId: number): Promise<BoardData> {
  // 1. 티켓 전체 조회
  const allTickets = await db.select().from(tickets)
    .where(eq(tickets.workspaceId, workspaceId))
    .orderBy(asc(tickets.position));

  const ticketIds = allTickets.map(t => t.id);

  // 2. 관련 데이터 병렬 배치 조회
  const [allLabels, allChecklist, allMembers, allIssues] = await Promise.all([
    db.select({ ticketId: ticketLabels.ticketId, label: labels })
      .from(ticketLabels)
      .leftJoin(labels, eq(ticketLabels.labelId, labels.id))
      .where(inArray(ticketLabels.ticketId, ticketIds)),
    db.select().from(checklistItems)
      .where(inArray(checklistItems.ticketId, ticketIds))
      .orderBy(asc(checklistItems.position)),
    db.select().from(members).where(eq(members.workspaceId, workspaceId)),
    db.select().from(issues).where(eq(issues.workspaceId, workspaceId)),
  ]);

  // 3. 메모리에서 조인
  return groupTicketsByStatus(allTickets, { allLabels, allChecklist, allMembers, allIssues });
}
```

**Rationale**: Vercel 서버리스 환경에서 `max: 1`이 적합 (Vercel의 HTTP-level connection pooling과 충돌 없음). `Promise.all`로 N+1 쿼리 방지.

---

## Decision 4: @dnd-kit 낙관적 업데이트 패턴

**Decision**: 드롭 즉시 board state 업데이트 → API 호출 → 실패 시 스냅샷으로 롤백

**구조**:
```
DndContext (BoardContainer.tsx)  ← 전체 보드 컨텍스트
  └── Column (Column.tsx)        ← useDroppable (droppable zone)
      └── SortableContext         ← 칼럼 내 정렬 아이템 목록 선언
          └── TicketCard.tsx      ← useSortable (draggable + droppable)
  └── DragOverlay                 ← 드래그 중 커서에 렌더링되는 카드 복사본
```

**useTickets 훅 낙관적 업데이트**:
```typescript
const reorder = useCallback(async (ticketId, targetStatus, targetIndex) => {
  const snapshot = JSON.parse(JSON.stringify(board)); // 딥 카피 스냅샷

  // 즉시 UI 반영 (200ms 이내)
  setBoard(applyOptimisticMove(board, ticketId, targetStatus, targetIndex));

  try {
    await ticketApi.reorder({ ticketId, status: targetStatus, position: targetIndex });
  } catch {
    setBoard(snapshot); // 실패 시 원상복구
    // 에러 토스트 표시 (silent failure 금지 — Constitution VI)
  }
}, [board]);
```

**모바일 터치 지원**:
```typescript
const sensors = useSensors(
  useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
);
```

**Rationale**: Constitution VI — "Perceived performance is a core UX principle." 드롭 즉시 200ms 이내 반영이 명세의 SC-002 기준. DragOverlay는 DOM 흐름 외부에서 렌더링되어 퍼포먼스 최적.

---

## Decision 5: Gap-Based Position 알고리즘

**Decision**: GAP = 1024, 삽입 시 midpoint 계산, gap < 2 시 칼럼 전체 재배치

**알고리즘**:
```typescript
// src/lib/constants.ts
export const POSITION_GAP = 1024;
export const REBALANCE_THRESHOLD = 2;

// src/lib/utils.ts
export function calculatePosition(above: number | null, below: number | null): number {
  if (above === null && below === null) return 0;
  if (above === null) return below! - POSITION_GAP;
  if (below === null) return above! + POSITION_GAP;

  const gap = below! - above!;
  if (gap < REBALANCE_THRESHOLD) throw new Error('REBALANCE_REQUIRED');

  return Math.floor((above! + below!) / 2);
}

// 재배치 (서버 사이드)
export async function rebalanceColumn(workspaceId: number, status: TicketStatus) {
  const ordered = await db.select().from(tickets)
    .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.status, status)))
    .orderBy(asc(tickets.position));

  await db.transaction(async (tx) => {
    for (const [i, ticket] of ordered.entries()) {
      await tx.update(tickets)
        .set({ position: i * POSITION_GAP })
        .where(eq(tickets.id, ticket.id));
    }
  });
}
```

**새 티켓 position 계산 (Backlog 맨 위)**:
```typescript
const minPosition = await db.select({ min: min(tickets.position) })
  .from(tickets)
  .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.status, 'BACKLOG')));

const newPosition = (minPosition[0].min ?? POSITION_GAP) - POSITION_GAP;
// 빈 칼럼이면: POSITION_GAP - POSITION_GAP = 0
```

**Rationale**: 삽입 O(1) (재배치 없이 midpoint만 계산). 300개 티켓 기준으로도 log₂(300) ≈ 8회 정도의 연속 삽입 후에야 재배치 필요.

**Alternatives considered**:
- 순차 번호 (1,2,3): 삽입 시 모든 뒤 항목 재번호 → O(N) 업데이트
- Fractional indexing (문자열): 구현 복잡도 대비 효익 없음 (MVP 규모)

---

## 현재 코드베이스 vs 목표 상태

| 항목 | 현재 상태 | 목표 (Phase 1 완성) |
|------|-----------|---------------------|
| 인증 | 없음 | NextAuth v5 Google OAuth |
| 워크스페이스 | 없음 | 자동 생성 + 데이터 격리 |
| tickets 테이블 | 기본 필드 (planned_start_date, started_at 포함) | type, workspace_id, issue_id, assignee_id 추가, 불필요 칼럼 제거 |
| 추가 테이블 | 없음 | users, workspaces, checklist_items, labels, ticket_labels, issues, members (7개) |
| TICKET_PRIORITY | LOW/MEDIUM/HIGH (CRITICAL 누락) | LOW/MEDIUM/HIGH/CRITICAL |
| 디렉토리 구조 | src/client/, src/server/, src/shared/ | src/components/, src/db/, src/hooks/, src/lib/, src/types/ (CLAUDE.md 기준) |
| 드래그앤드롭 | 기본 구현 있음 | 모바일 터치 + 낙관적 업데이트 강화 |
