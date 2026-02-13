# 기술 연구: POST /api/tickets 구현

**기능**: Create Ticket API (001-create-ticket-api)
**날짜**: 2026-02-13
**목적**: 기술적 불확실성 해소 및 아키텍처 결정 사항 문서화

---

## 1. Next.js Route Handler와 Zod 검증

### 결정사항
Route Handler에서 Zod 검증 시 명시적 에러 처리를 위해 `safeParse()` 메서드 사용

### 근거
- **타입 안전성**: `safeParse()`는 예외를 던지지 않고 `{ success: boolean, data?: T, error?: ZodError }` discriminated union 반환
- **제어 흐름**: `parse()`와 try/catch 조합보다 명확한 제어 흐름 제공
- **에러 처리**: HTTP 응답 반환 전 커스텀 에러 응답 형식화 가능
- **프로덕션 준비**: 서버리스 환경에서 처리되지 않은 예외 방지

### 구현 패턴

```typescript
// app/api/tickets/route.ts
export async function POST(request: Request) {
  // 1. 요청 본문 파싱
  const body = await request.json();

  // 2. safeParse로 검증
  const result = createTicketSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error.message
        }
      },
      { status: 400 }
    );
  }

  // 3. result.data가 CreateTicketInput 타입으로 추론됨
  const ticket = await ticketService.create(result.data);

  // 4. 성공 응답
  return Response.json(ticket, { status: 201 });
}
```

### 검토한 대안
- **`parse()`와 try/catch 사용**: 덜 명시적인 제어 흐름과 처리되지 않은 예외 위험으로 거부
- **커스텀 검증 함수**: Zod가 더 나은 타입 추론과 재사용성을 제공하므로 거부
- **서드파티 라이브러리** (예: `next-zod-route`): MVP에서 의존성 최소화를 위해 거부

### 핵심 실천사항
- Route Handler에서 항상 `parse()` 대신 `safeParse()` 사용
- 모든 외부 입력 검증 (body, params, query strings)
- 일관된 에러 형식 반환: `{ error: { code, message } }`
- 적절한 HTTP 상태 코드 사용: 201 (생성됨), 400 (검증 실패), 404 (찾을 수 없음), 500 (내부 오류)

---

## 2. 서비스 레이어 분리 패턴

### 결정사항
직접 데이터베이스 import를 사용하는 객체 기반 서비스 모듈 패턴 사용

### 근거
- **단순성**: MVP에 복잡한 의존성 주입 프레임워크 불필요
- **테스트 용이성**: Jest의 `jest.mock()`으로 쉽게 모킹 가능
- **타입 안전성**: 최소한의 보일러플레이트로 완전한 TypeScript 지원
- **관심사 분리**: API 레이어와 비즈니스 로직 간 명확한 경계
- **확장성**: 복잡도 증가 시 클래스 기반 DI로 진화 가능

### 아키텍처 패턴

```text
Route Handlers (app/api/)        ← 얇은 조율 레이어
       ↓                           - 입력 검증 (Zod)
       |                           - 서비스 호출
       |                           - 에러를 HTTP 응답으로 변환
       ↓
Service Layer (src/server/services/)  ← 비즈니스 로직
       ↓                           - Position 계산
       |                           - 날짜/상태 관리
       |                           - 데이터베이스 작업
       |                           - 도메인 에러 throw
       ↓
Database (src/server/db/)        ← 데이터 영속성
                                  - Drizzle ORM 쿼리
                                  - 트랜잭션 관리
```

### 구현 구조

```typescript
// src/server/services/ticketService.ts
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import type { CreateTicketInput, Ticket } from '@/shared/types';

export const ticketService = {
  async create(input: CreateTicketInput): Promise<Ticket> {
    // 비즈니스 로직
    const position = await this.calculatePosition(TICKET_STATUS.BACKLOG);

    // 데이터베이스 작업
    const [ticket] = await db
      .insert(tickets)
      .values({ ...input, position })
      .returning();

    return toTicket(ticket);
  },

  async calculatePosition(status: string): Promise<number> {
    const result = await db
      .select({ min: min(tickets.position) })
      .from(tickets)
      .where(eq(tickets.status, status));

    return (result[0]?.min ?? 0) - 1024;
  },
};
```

### 에러 전파 패턴

**서비스 레이어**: 도메인 특화 에러 throw
```typescript
// src/shared/errors/index.ts
export class TicketNotFoundError extends Error {
  constructor(id: number) {
    super(`티켓을 찾을 수 없습니다`);
    this.name = 'TicketNotFoundError';
  }
}

// 서비스 메서드
async findById(id: number): Promise<Ticket> {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, id),
  });

  if (!ticket) {
    throw new TicketNotFoundError(id);
  }

  return toTicket(ticket);
}
```

**Route Handler**: HTTP 응답으로 변환
```typescript
try {
  const ticket = await ticketService.findById(id);
  return Response.json(ticket);
} catch (error) {
  if (error instanceof TicketNotFoundError) {
    return Response.json(
      { error: { code: 'TICKET_NOT_FOUND', message: error.message } },
      { status: 404 }
    );
  }

  return Response.json(
    { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
    { status: 500 }
  );
}
```

### 검토한 대안
- **함수 기반 export**: 더 단순하지만 객체 기반 접근법보다 덜 체계적
- **클래스 기반 DI**: 더 유연하지만 MVP에 불필요한 복잡성 추가
- **Route Handler에서 직접 DB 접근**: 낮은 테스트 용이성과 관심사 분리 위반으로 거부

### 책임 분담

| 레이어 | 책임 | 피해야 할 것 |
|-------|------|-------------|
| Route Handler | - 입력 검증<br>- 서비스 호출<br>- HTTP 응답 형식화 | - 비즈니스 로직<br>- 직접 DB 쿼리<br>- 복잡한 계산 |
| Service Layer | - 비즈니스 로직<br>- 데이터 변환<br>- DB 작업<br>- 도메인 에러 | - HTTP 관심사<br>- 요청 파싱<br>- 응답 형식화 |

---

## 3. Position 계산 알고리즘

### 결정사항
gap ≤ 1일 때 재정렬하는 정수 기반 fractional indexing 사용

### 근거
- **단순성**: 정수 연산이 직관적이고 성능이 좋음
- **가독성**: 디버깅이 쉬움 (0, 1024, 2048 같은 position)
- **데이터베이스 효율성**: 인덱스가 있는 정수 컬럼이 잘 작동
- **MVP 적합성**: 단일 사용자 칸반 보드에 충분한 정밀도
- **명세 일치**: DATA_MODEL.md 명세와 일치 (1024 간격)

### 핵심 알고리즘

```typescript
// 두 항목 사이 삽입
function insertBetween(prevPosition: number, nextPosition: number): number {
  const gap = nextPosition - prevPosition;

  // 재정렬 필요 여부 확인
  if (gap <= 1) {
    throw new Error('REBALANCE_REQUIRED');
  }

  return Math.floor((prevPosition + nextPosition) / 2);
}

// 맨 앞 삽입
function insertAtBeginning(firstPosition: number): number {
  return firstPosition - 1024;
}

// 맨 뒤 삽입
function insertAtEnd(lastPosition: number): number {
  return lastPosition + 1024;
}

// 빈 리스트
function getInitialPosition(): number {
  return 0;
}
```

### 재정렬 전략

**트리거**: 인접한 position 간 gap ≤ 1

**알고리즘**:
1. position 순서로 칼럼의 모든 티켓 조회
2. 1024 간격으로 position 재할당: `[0, 1024, 2048, 3072, ...]`
3. 원자성 보장을 위해 트랜잭션에서 업데이트

```typescript
async rebalanceColumn(status: string): Promise<void> {
  return await db.transaction(async (tx) => {
    // 1. 칼럼의 모든 티켓 조회
    const tickets = await tx
      .select()
      .from(tickets)
      .where(eq(tickets.status, status))
      .orderBy(asc(tickets.position));

    // 2. 1024 간격으로 재할당
    const REBALANCE_GAP = 1024;
    for (let i = 0; i < tickets.length; i++) {
      await tx
        .update(tickets)
        .set({ position: i * REBALANCE_GAP })
        .where(eq(tickets.id, tickets[i].id));
    }
  });
}
```

### 엣지 케이스 처리

| 시나리오 | 해결 방법 | Position 계산 |
|---------|---------|--------------|
| 빈 칼럼 | 0 반환 | `0` |
| 최상단 삽입 | 첫 번째 position - 1024 | `firstPos - 1024` |
| 최하단 삽입 | 마지막 position + 1024 | `lastPos + 1024` |
| 사이 삽입 | 이웃의 평균 | `floor((prev + next) / 2)` |
| Gap ≤ 1 | 재정렬 트리거 | 1024 간격으로 재분배 |

### 정밀도 한계

**정수 (32비트 부호있음)**:
- 범위: -2,147,483,648 ~ 2,147,483,647
- 소진: 같은 위치에 ~30회 연속 삽입
- **해결책**: gap ≤ 1일 때 재정렬

**향후 고려사항**:
- 협업 기능 추가 시 → 문자열 기반 fractional indexing(LexoRank)으로 마이그레이션
- 재정렬이 빈번해지면 → gap 크기 증가 또는 float64 사용
- 성능 문제 시 → `(status, position)` 복합 인덱스 추가

### 검토한 대안
- **실수 기반**: 더 높은 정밀도(53비트)지만 반올림 오류 발생
- **문자열 기반**(LexoRank): 사실상 무한 정밀도이지만 MVP에 복잡함
- **UUID 기반**: 의미있는 정렬 불가능으로 거부

### 테스트 전략
- 빈 리스트 테스트 → position 0
- 맨 앞 삽입 테스트 → 음수 또는 더 낮은 값
- 맨 뒤 삽입 테스트 → 더 높은 값
- 사이 삽입 테스트 → 평균 계산
- 재정렬 트리거 및 실행 테스트
- 동시 삽입 테스트 (향후)

---

## 4. Drizzle ORM 트랜잭션 관리

### 결정사항
서비스 레이어에서 원자적 작업을 위해 Drizzle의 `db.transaction()` API 사용

### 근거
- **데이터 무결성**: 다단계 작업의 전부 또는 전무 실행 보장
- **일관성**: 재정렬(여러 티켓 업데이트)에 중요
- **롤백**: 에러 시 자동 롤백으로 부분 업데이트 방지
- **타입 안전성**: 트랜잭션 객체(`tx`)가 `db`와 동일한 API 보유

### 패턴

```typescript
async reorder(input: ReorderTicketInput): Promise<{ ticket: Ticket; affected: any[] }> {
  return await db.transaction(async (tx) => {
    // 1. 대상 티켓 읽기
    const [ticket] = await tx
      .select()
      .from(tickets)
      .where(eq(tickets.id, input.ticketId))
      .limit(1);

    if (!ticket) {
      throw new TicketNotFoundError(input.ticketId);
    }

    // 2. 재정렬 필요 여부 확인
    if (needsRebalancing) {
      await rebalancePositions(tx, input.status);
    }

    // 3. 대상 티켓 업데이트
    const [updated] = await tx
      .update(tickets)
      .set({ status: input.status, position: input.position })
      .where(eq(tickets.id, input.ticketId))
      .returning();

    return { ticket: toTicket(updated), affected: [] };
  });
}
```

### 트랜잭션 타입 정의

```typescript
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
```

---

## 5. 구현 파일 구조

### 생성할 파일

```
src/server/
├── services/
│   ├── ticketService.ts       # 주요 비즈니스 로직
│   └── index.ts               # 서비스 export
├── utils/
│   └── errorHandler.ts        # 중앙화된 에러 처리
└── db/
    └── types.ts               # 데이터베이스 타입 정의

src/shared/
├── errors/
│   └── index.ts               # 도메인 에러 클래스
└── validations/
    └── ticket.ts              # Zod 스키마 (이미 존재)

app/api/tickets/
└── route.ts                   # POST 핸들러

__tests__/
├── services/
│   └── ticketService.test.ts  # 서비스 단위 테스트
└── api/
    └── tickets.test.ts        # API 통합 테스트
```

---

## 요약

### 핵심 결정사항
1. **검증**: Route Handler에서 Zod `safeParse()` 사용
2. **아키텍처**: 에러 전파를 포함한 객체 기반 서비스 레이어
3. **Position**: 재정렬을 포함한 정수 fractional indexing
4. **트랜잭션**: 원자적 작업을 위한 Drizzle의 `db.transaction()`

### 구현 우선순위
1. 공유 에러 클래스 생성
2. position 계산을 포함한 ticketService.create() 구현
3. Zod 검증을 포함한 Route Handler 구현
4. reorder 작업을 위한 트랜잭션 지원 추가
5. 포괄적인 테스트 작성

### 리스크 및 완화방안
- **리스크**: ~30회 삽입 후 정수 position 소진
  - **완화방안**: gap ≤ 1일 때 재정렬 구현
- **리스크**: 서비스 레이어 복잡도 증가
  - **완화방안**: 서비스 집중 유지, 필요시 헬퍼 추출
- **리스크**: 사용자에게 불명확한 검증 에러 메시지
  - **완화방안**: Zod에서 커스텀 한글 에러 메시지 사용

---

**연구 완료**: Phase 1 (설계 및 계약) 준비 완료
