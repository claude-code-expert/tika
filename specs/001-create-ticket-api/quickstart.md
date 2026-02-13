# 빠른 시작: POST /api/tickets 구현하기

**기능**: 001-create-ticket-api
**예상 소요 시간**: 2-3시간 (테스트 포함)
**전제 조건**: 프로젝트 설정 완료, 데이터베이스 실행 중

---

## 개요

이 가이드는 TDD(테스트 주도 개발) 및 [research.md](./research.md)에 정의된 아키텍처 패턴을 따라 POST /api/tickets 엔드포인트를 구현하는 과정을 안내합니다.

**구현 순서:**
1. 테스트 작성 (Red 단계)
2. 테스트를 통과하는 최소 코드 구현 (Green 단계)
3. 리팩터링 (Refactor 단계)

---

## Step 1: 에러 클래스 설정 (5분)

서비스 레이어를 위한 도메인별 에러 클래스를 생성합니다.

```bash
# 에러 디렉토리 생성
mkdir -p src/shared/errors
```

```typescript
// src/shared/errors/index.ts
export class TicketNotFoundError extends Error {
  constructor(id: number) {
    super(`티켓을 찾을 수 없습니다`);
    this.name = 'TicketNotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**체크포인트:** `npx tsc --noEmit`을 실행하여 타입 에러가 없는지 확인합니다.

---

## Step 2: 서비스 레이어 테스트 작성 (30분)

TDD를 따라 구현 **전에** 테스트를 작성합니다.

```bash
# 테스트 파일 생성
mkdir -p __tests__/services
touch __tests__/services/ticketService.test.ts
```

```typescript
// __tests__/services/ticketService.test.ts
import { ticketService } from '@/server/services/ticketService';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { TICKET_STATUS, TICKET_PRIORITY } from '@/shared/types';

describe('ticketService.create', () => {
  beforeEach(async () => {
    // Clean database before each test
    await db.delete(tickets);
  });

  afterAll(async () => {
    // Clean up after all tests
    await db.delete(tickets);
  });

  describe('FR-001: Create ticket with required fields', () => {
    test('creates ticket with title only', async () => {
      // Arrange
      const input = {
        title: 'Test Ticket',
      };

      // Act
      const ticket = await ticketService.create(input);

      // Assert
      expect(ticket).toMatchObject({
        title: 'Test Ticket',
        status: TICKET_STATUS.BACKLOG,
        priority: TICKET_PRIORITY.MEDIUM,
        description: null,
        plannedStartDate: null,
        dueDate: null,
        startedAt: null,
        completedAt: null,
      });
      expect(ticket.id).toBeDefined();
      expect(ticket.position).toBeDefined();
      expect(ticket.createdAt).toBeInstanceOf(Date);
      expect(ticket.updatedAt).toBeInstanceOf(Date);
    });

    test('creates ticket with all optional fields', async () => {
      // Arrange
      const input = {
        title: 'Complete Ticket',
        description: 'Detailed description',
        priority: TICKET_PRIORITY.HIGH as const,
        plannedStartDate: '2026-02-10',
        dueDate: '2026-02-15',
      };

      // Act
      const ticket = await ticketService.create(input);

      // Assert
      expect(ticket).toMatchObject({
        title: 'Complete Ticket',
        description: 'Detailed description',
        priority: TICKET_PRIORITY.HIGH,
        plannedStartDate: '2026-02-10',
        dueDate: '2026-02-15',
        status: TICKET_STATUS.BACKLOG,
      });
    });
  });

  describe('FR-009: Position calculation', () => {
    test('sets position to 0 for first ticket in empty BACKLOG', async () => {
      // Arrange
      const input = { title: 'First Ticket' };

      // Act
      const ticket = await ticketService.create(input);

      // Assert
      expect(ticket.position).toBe(0);
    });

    test('places new ticket at top of BACKLOG (min - 1024)', async () => {
      // Arrange
      const existing = await ticketService.create({ title: 'Existing' });
      const input = { title: 'New Ticket' };

      // Act
      const newTicket = await ticketService.create(input);

      // Assert
      expect(newTicket.position).toBe(existing.position - 1024);
    });

    test('maintains correct order with multiple tickets', async () => {
      // Arrange
      const ticket1 = await ticketService.create({ title: 'First' });
      const ticket2 = await ticketService.create({ title: 'Second' });
      const ticket3 = await ticketService.create({ title: 'Third' });

      // Assert: Most recent ticket has lowest position (appears at top)
      expect(ticket3.position).toBeLessThan(ticket2.position);
      expect(ticket2.position).toBeLessThan(ticket1.position);
    });
  });

  describe('FR-011: Workflow timestamps', () => {
    test('sets startedAt and completedAt to null', async () => {
      // Arrange
      const input = { title: 'Test Ticket' };

      // Act
      const ticket = await ticketService.create(input);

      // Assert
      expect(ticket.startedAt).toBeNull();
      expect(ticket.completedAt).toBeNull();
    });
  });
});
```

**체크포인트:** `npm test`를 실행하면 모든 테스트가 **실패**해야 합니다 (Red 단계). 이것은 정상입니다!

---

## Step 3: 서비스 레이어 구현 (45분)

이제 테스트를 통과시키기 위한 서비스를 구현합니다.

```bash
# 서비스 파일 생성
mkdir -p src/server/services
touch src/server/services/ticketService.ts
```

```typescript
// src/server/services/ticketService.ts
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import { eq, min } from 'drizzle-orm';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type CreateTicketInput,
  type Ticket,
  type TicketStatus,
} from '@/shared/types';

// Type conversion from database to domain
type DbTicket = typeof tickets.$inferSelect;

function toTicket(row: DbTicket): Ticket {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TicketStatus,
    priority: row.priority as Ticket['priority'],
    position: row.position,
    plannedStartDate: row.plannedStartDate,
    dueDate: row.dueDate,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const ticketService = {
  /**
   * FR-001: Create a new ticket in BACKLOG column
   */
  async create(input: CreateTicketInput): Promise<Ticket> {
    // Calculate position for BACKLOG column (new tickets at top)
    const position = await this.calculatePosition(TICKET_STATUS.BACKLOG);

    // Insert ticket with defaults
    const [row] = await db
      .insert(tickets)
      .values({
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? TICKET_PRIORITY.MEDIUM,
        plannedStartDate: input.plannedStartDate ?? null,
        dueDate: input.dueDate ?? null,
        status: TICKET_STATUS.BACKLOG,
        position,
        startedAt: null,
        completedAt: null,
      })
      .returning();

    return toTicket(row);
  },

  /**
   * Calculate position for new ticket in a column
   * Places new ticket at the top: min(position) - 1024
   */
  async calculatePosition(status: TicketStatus): Promise<number> {
    const result = await db
      .select({ minPosition: min(tickets.position) })
      .from(tickets)
      .where(eq(tickets.status, status));

    const minPosition = result[0]?.minPosition;

    // Empty column: start at 0
    // Non-empty: place above topmost ticket
    return minPosition !== null ? minPosition - 1024 : 0;
  },
};
```

```typescript
// src/server/services/index.ts
export { ticketService } from './ticketService';
```

**체크포인트:** `npm test`를 실행하면 테스트가 이제 **통과**해야 합니다 (Green 단계)!

---

## Step 4: Route Handler 테스트 작성 (20분)

API 레이어를 테스트합니다.

```bash
# API 테스트 파일 생성
mkdir -p __tests__/api
touch __tests__/api/tickets.test.ts
```

```typescript
// __tests__/api/tickets.test.ts
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';

describe('POST /api/tickets', () => {
  beforeEach(async () => {
    await db.delete(tickets);
  });

  afterAll(async () => {
    await db.delete(tickets);
  });

  describe('Success cases', () => {
    test('returns 201 and ticket data with title only', async () => {
      // Arrange
      const body = { title: 'Test Ticket' };

      // Act
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        title: 'Test Ticket',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        description: null,
      });
      expect(data.id).toBeDefined();
    });

    test('returns 201 with all optional fields', async () => {
      // Arrange
      const body = {
        title: 'Complete Ticket',
        description: 'Detailed description',
        priority: 'HIGH',
        plannedStartDate: '2026-02-10',
        dueDate: '2026-02-15',
      };

      // Act
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toMatchObject(body);
    });
  });

  describe('Validation errors (400)', () => {
    test('returns 400 when title is missing', async () => {
      // Arrange
      const body = { description: 'No title' };

      // Act
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('제목');
    });

    test('returns 400 when title exceeds 200 characters', async () => {
      // Arrange
      const body = { title: 'a'.repeat(201) };

      // Act
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('200자');
    });

    test('returns 400 when title is whitespace only', async () => {
      // Arrange
      const body = { title: '   ' };

      // Act
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 400 when description exceeds 1000 characters', async () => {
      // Arrange
      const body = {
        title: 'Valid Title',
        description: 'a'.repeat(1001),
      };

      // Act
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.message).toContain('1000자');
    });

    test('returns 400 when priority is invalid', async () => {
      // Arrange
      const body = {
        title: 'Valid Title',
        priority: 'URGENT', // Invalid
      };

      // Act
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.message).toContain('LOW, MEDIUM, HIGH');
    });

    test('returns 400 when dueDate is in the past', async () => {
      // Arrange
      const body = {
        title: 'Valid Title',
        dueDate: '2020-01-01', // Past date
      };

      // Act
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.message).toContain('오늘 이후');
    });
  });
});
```

**체크포인트:** `npm test`를 실행하면 API 테스트가 **실패**해야 합니다 (Route Handler가 아직 구현되지 않음).

---

## Step 5: Route Handler 구현 (15분)

API 엔드포인트를 생성합니다.

```bash
# Route Handler 생성
mkdir -p app/api/tickets
touch app/api/tickets/route.ts
```

```typescript
// app/api/tickets/route.ts
import { createTicketSchema } from '@/shared/validations/ticket';
import { ticketService } from '@/server/services';

export async function POST(request: Request) {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate with Zod
    const result = createTicketSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: result.error.errors[0].message,
          },
        },
        { status: 400 }
      );
    }

    // 3. Create ticket via service
    const ticket = await ticketService.create(result.data);

    // 4. Return success response
    return Response.json(ticket, { status: 201 });
  } catch (error) {
    // 5. Handle unexpected errors
    console.error('Unexpected error in POST /api/tickets:', error);

    return Response.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 내부 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}
```

**체크포인트:** `npm test`를 실행하면 모든 테스트가 **통과**해야 합니다!

---

## Step 6: 구현 검증 (10분)

### 6.1 타입 체크
```bash
npx tsc --noEmit
```
예상 결과: 에러 없음

### 6.2 모든 테스트 실행
```bash
npm test
```
예상 결과: 모든 테스트 통과

### 6.3 빌드 실행
```bash
npm run build
```
예상 결과: 빌드 성공

### 6.4 수동 테스트 (개발 서버)
```bash
npm run dev
```

```bash
# curl로 테스트
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title":"Manual Test Ticket","priority":"HIGH"}'
```

예상 응답 (201):
```json
{
  "id": 1,
  "title": "Manual Test Ticket",
  "status": "BACKLOG",
  "priority": "HIGH",
  "position": 0,
  ...
}
```

---

## Step 7: 리팩터링 (선택사항, 15분)

테스트가 통과하면 코드 품질을 위해 리팩터링합니다:

1. **에러 처리 추출**
   ```typescript
   // src/server/utils/errorHandler.ts
   export function handleApiError(error: unknown) {
     if (error instanceof TicketNotFoundError) {
       return Response.json(
         { error: { code: 'TICKET_NOT_FOUND', message: error.message } },
         { status: 404 }
       );
     }

     console.error('Unexpected error:', error);
     return Response.json(
       { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
       { status: 500 }
     );
   }
   ```

2. **Route Handler 단순화**
   ```typescript
   // app/api/tickets/route.ts
   import { handleApiError } from '@/server/utils/errorHandler';

   export async function POST(request: Request) {
     try {
       const body = await request.json();
       const result = createTicketSchema.safeParse(body);

       if (!result.success) {
         return Response.json(
           { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
           { status: 400 }
         );
       }

       const ticket = await ticketService.create(result.data);
       return Response.json(ticket, { status: 201 });
     } catch (error) {
       return handleApiError(error);
     }
   }
   ```

**체크포인트:** 리팩터링이 문제를 일으키지 않았는지 확인하기 위해 `npm test`를 다시 실행합니다.

---

## 체크리스트

- [ ] 도메인 에러 생성 완료 (`src/shared/errors/`)
- [ ] 서비스 테스트 작성 및 통과
- [ ] 서비스 레이어 구현 완료 (`src/server/services/ticketService.ts`)
- [ ] API 테스트 작성 및 통과
- [ ] Route Handler 구현 완료 (`app/api/tickets/route.ts`)
- [ ] 타입 체크 통과 (`npx tsc --noEmit`)
- [ ] 모든 테스트 통과 (`npm test`)
- [ ] 빌드 성공 (`npm run build`)
- [ ] curl을 사용한 수동 테스트 작동
- [ ] 코드 리팩터링 완료 (필요시)

---

## 일반적인 문제 및 해결 방법

### 문제: `toTicket()` 함수의 타입 에러
**해결:** 데이터베이스 타입이 도메인 타입과 일치하는지 확인합니다. 타입 단언을 신중하게 사용합니다.

### 문제: "Cannot connect to database" 테스트 실패
**해결:** `.env.local`에 올바른 `DATABASE_URL`이 있는지 확인하고 데이터베이스가 실행 중인지 확인합니다.

### 문제: Position 계산이 NaN을 반환함
**해결:** 빈 칼럼의 경우 `min()`이 null을 반환하는지 확인하고 `?? 0`으로 처리합니다.

### 문제: 검증 에러에 한글 메시지가 표시되지 않음
**해결:** Zod 스키마가 `errorMap`으로 커스텀 에러 메시지를 사용하는지 확인합니다.

---

## 다음 단계

이 기능을 완료한 후:

1. **검토**: spec.md를 확인하여 모든 기능 요구사항이 구현되었는지 확인합니다
2. **커밋**: 적절한 메시지로 git 커밋을 생성합니다
3. **문서화**: 변경 사항이 있는 경우 API_SPEC.md를 업데이트합니다
4. **배포**: 스테이징 환경에서 테스트합니다
5. **다음으로**: GET /api/tickets 엔드포인트를 구현합니다

---

## 리소스

- [기능 명세](./spec.md)
- [연구 문서](./research.md)
- [데이터 모델](./data-model.md)
- [API 계약](./contracts/post-tickets.openapi.yaml)
- [프로젝트 CLAUDE.md](../../CLAUDE.md)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [Zod 문서](https://zod.dev/)
