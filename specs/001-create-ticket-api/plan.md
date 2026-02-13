# 구현 계획: Create Ticket API

**브랜치**: `001-create-ticket-api` | **날짜**: 2026-02-13 | **명세**: [spec.md](./spec.md)
**입력**: `/specs/001-create-ticket-api/spec.md`의 기능 명세서

---

## 요약

BACKLOG 칼럼에 새 티켓을 생성하는 POST /api/tickets 엔드포인트 구현. 엔드포인트는 사용자 입력(제목, 설명, 우선순위, 날짜)을 받아 Zod로 검증하고, fractional indexing을 사용해 position을 계산하며, Drizzle ORM을 통해 PostgreSQL에 저장. 아키텍처는 관심사 분리를 따름: Route Handler(검증, HTTP) → Service Layer(비즈니스 로직) → Database(영속성).

**기술적 접근법:**
- Route Handler에서 입력 검증을 위한 Zod `safeParse()`
- 비즈니스 로직을 위한 객체 기반 서비스 모듈 패턴
- position 관리를 위한 정수 기반 fractional indexing with rebalancing
- 원자적 작업을 위한 Drizzle ORM 트랜잭션

---

## 기술 컨텍스트

**언어/버전**: TypeScript 5.7.3 (strict mode)
**주요 의존성**: Next.js 15.1.6 (App Router), React 19, Drizzle ORM 0.38.3, Zod 3.24.1, @dnd-kit/core 6.3.1
**저장소**: PostgreSQL (로컬은 node-postgres 8.18.0, 배포는 @vercel/postgres 0.10.0)
**테스팅**: Jest 29.7.0, React Testing Library 16.2.0, @testing-library/jest-dom 6.6.3
**대상 플랫폼**: 웹 애플리케이션 (Next.js SSR + CSR)
**프로젝트 타입**: 웹 (app/는 Next.js 라우트, src/server/는 백엔드, src/client/는 프론트엔드, src/shared/는 공통 코드용 모노레포)
**성능 목표**: 티켓 생성 응답 시간 < 3초, 100개 동시 요청 처리
**제약사항**: API 응답 시간 < 200ms (p95), 정수 position 정밀도 (~30회 삽입 전 재정렬)
**규모/범위**: 단일 사용자 MVP, 칼럼당 ~50개 티켓 최대, 4개 칼럼 (BACKLOG, TODO, IN_PROGRESS, DONE)

---

## Constitution 검증

*게이트: Phase 0 연구 전 통과 필수. Phase 1 설계 후 재검증.*

### 연구 전 검증 (모두 ✅ 통과)

| 원칙 | 요구사항 | 상태 | 증거 |
|-----|---------|------|------|
| **I. Specification-Driven Development** | 구현이 spec.md를 따름 | ✅ 통과 | 기능 명세가 모든 FR, 사용자 스토리, 성공 기준 정의 |
| **II. Type Safety** | TypeScript strict, `any` 금지 | ✅ 통과 | tsconfig.json에 strict: true, 계획에서 타입된 Zod 스키마 사용 |
| **III. Contract-First API** | API가 API_SPEC.md를 따름 | ✅ 통과 | POST /api/tickets 계약이 docs/API_SPEC.md와 contracts/post-tickets.openapi.yaml에 정의됨 |
| **IV. Validated Inputs** | 모든 입력을 Zod로 검증 | ✅ 통과 | src/shared/validations/ticket.ts의 createTicketSchema |
| **V. Separation of Concerns** | Route Handler → Service → DB | ✅ 통과 | 아키텍처: app/api/tickets/route.ts → src/server/services/ticketService.ts → src/server/db/ |
| **VI. Test-Driven Development** | 구현 전 테스트 작성 | ✅ 통과 | Quickstart.md가 Red-Green-Refactor 사이클을 따름 |

### 설계 후 검증 (모두 ✅ 통과)

| 원칙 | 구현 세부사항 | 상태 | 비고 |
|-----|-------------|------|-----|
| **I. SDD** | spec.md → research.md → data-model.md → quickstart.md | ✅ 통과 | 구현 전 모든 설계 산출물 생성 |
| **II. Type Safety** | Zod 스키마, TypeScript 인터페이스, `any` 미사용 | ✅ 통과 | CreateTicketInput, Ticket 타입 완전 정의 |
| **III. Contract-First** | 예제가 포함된 OpenAPI 3.0 계약 | ✅ 통과 | contracts/post-tickets.openapi.yaml이 요청/응답 정의 |
| **IV. Validated Inputs** | Route Handler에서 `safeParse()`로 Zod 검증 | ✅ 통과 | 에러 응답이 { error: { code, message } } 반환 |
| **V. Separation** | 3계층 아키텍처 강제 | ✅ 통과 | Route Handler에 비즈니스 로직 없음, Service에 HTTP 없음 |
| **VI. TDD** | 서비스와 route handler 전에 테스트 작성 | ✅ 통과 | quickstart.md Step 2(테스트)가 Step 3(서비스)보다 먼저 |

**판정**: ✅ 모든 constitution 원칙 충족. 구현 진행 준비 완료.

---

## 프로젝트 구조

### 문서 (이 기능)

```text
specs/001-create-ticket-api/
├── spec.md                    # 기능 명세서 (사용자 스토리, FR, 성공 기준)
├── plan.md                    # 이 파일 - 구현 계획
├── research.md                # Phase 0 - 기술 연구 및 아키텍처 결정 사항
├── data-model.md              # Phase 1 - 엔티티 정의 및 데이터베이스 스키마
├── quickstart.md              # Phase 1 - 단계별 구현 가이드
├── contracts/                 # Phase 1 - API 계약
│   └── post-tickets.openapi.yaml  # POST /api/tickets용 OpenAPI 3.0 명세
└── checklists/                # 품질 검증
    └── requirements.md        # 명세 품질 체크리스트 (완료)
```

### 소스 코드 (저장소 루트)

```text
# Next.js App Router와 계층화된 아키텍처

app/
├── api/
│   └── tickets/
│       └── route.ts           # POST 핸들러 (검증, HTTP 응답)
├── globals.css
├── layout.tsx
└── page.tsx

src/
├── server/                    # 백엔드 레이어
│   ├── db/
│   │   ├── index.ts           # Drizzle db 인스턴스
│   │   ├── schema.ts          # tickets 테이블 스키마 (이미 존재)
│   │   └── types.ts           # 데이터베이스 타입 정의 (Transaction, Database)
│   ├── services/
│   │   ├── ticketService.ts   # 비즈니스 로직 (create, calculatePosition)
│   │   └── index.ts           # 서비스 export
│   └── utils/
│       └── errorHandler.ts    # 중앙화된 에러 처리
├── client/                    # 프론트엔드 레이어 (이 기능에서 미사용)
│   ├── components/
│   ├── hooks/
│   └── api/
└── shared/                    # 프론트엔드와 백엔드 공유
    ├── types/
    │   └── index.ts           # CreateTicketInput, Ticket, TicketStatus, TicketPriority
    ├── validations/
    │   └── ticket.ts          # Zod 스키마 (createTicketSchema)
    └── errors/
        └── index.ts           # 도메인 에러 (TicketNotFoundError, ValidationError)

__tests__/
├── services/
│   └── ticketService.test.ts  # 서비스 레이어 단위 테스트
└── api/
    └── tickets.test.ts        # API 통합 테스트

docs/                          # 프로젝트 전체 문서
├── API_SPEC.md                # 전체 API 명세 (참조)
├── DATA_MODEL.md              # 전체 데이터 모델 (참조)
├── REQUIREMENTS.md            # 프로젝트 요구사항 (참조)
└── ...
```

**구조 결정**: 웹 애플리케이션 패턴 (템플릿의 옵션 2). Next.js App Router는 단일 모노레포에서 프론트엔드와 백엔드를 모두 제공. `app/api/`의 API 라우트, `src/server/`의 백엔드 로직, `src/client/`의 프론트엔드 로직, `src/shared/`의 공유 코드. 이 구조는 관련 코드를 함께 유지하면서 관심사 분리를 강제.

---

## 복잡도 추적

*constitution 위반 없음. 이 섹션 불필요.*

**정당화**: 모든 아키텍처 결정이 프로젝트 constitution과 일치. 특별한 예외 불필요.

---

## Phase 0: 개요 및 연구

### 연구 과제

1. **Zod 검증을 사용한 Next.js Route Handler** - 타입 안전한 검증으로 Route Handler를 구조화하는 방법
2. **서비스 레이어 분리** - Next.js에서 API 레이어와 비즈니스 로직을 분리하는 방법
3. **Position 계산 알고리즘** - 드래그앤드롭 순서를 위한 fractional indexing

### 연구 결과

[research.md](./research.md)에 포괄적인 연구 문서화. 핵심 결정사항:

#### 1. 검증 패턴
- **결정**: Route Handler에서 Zod `safeParse()` 사용 (`parse()` 아님)
- **근거**: 명시적 에러 처리, 예외 던지지 않음, 타입 안전한 discriminated union
- **패턴**:
  ```typescript
  const result = schema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: { code, message } }, { status: 400 });
  }
  // result.data가 타입됨
  ```

#### 2. 서비스 아키텍처
- **결정**: db를 직접 import하는 객체 기반 서비스 모듈
- **근거**: 단순함, 테스트 가능, MVP에 DI 프레임워크 불필요
- **패턴**:
  ```typescript
  export const ticketService = {
    async create(input: CreateTicketInput): Promise<Ticket> {
      const position = await this.calculatePosition(status);
      const [ticket] = await db.insert(tickets).values(...).returning();
      return toTicket(ticket);
    }
  };
  ```

#### 3. Position 계산
- **결정**: gap ≤ 1일 때 재정렬하는 정수 fractional indexing
- **근거**: 단순함, 성능, 가독성, MVP에 충분
- **알고리즘**:
  - 빈 칼럼 → position = 0
  - 최상단 삽입 → min(positions) - 1024
  - 최하단 삽입 → max(positions) + 1024
  - 사이 삽입 → floor((prev + next) / 2)
  - Gap ≤ 1일 때 재정렬 → 1024 간격으로 재분배

#### 4. 에러 전파
- **결정**: 서비스는 도메인 에러 throw, Route Handler는 HTTP 응답으로 변환
- **근거**: 명확한 분리, 테스트 가능한 에러, 일관된 API 응답
- **패턴**:
  ```typescript
  // 서비스
  if (!ticket) throw new TicketNotFoundError(id);

  // Route Handler
  catch (error) {
    if (error instanceof TicketNotFoundError) {
      return Response.json({ error: { code: 'TICKET_NOT_FOUND', message } }, { status: 404 });
    }
  }
  ```

**산출물**: ✅ [research.md](./research.md) 모든 불확실성 해소 완료

---

## Phase 1: 설계 및 계약

### 데이터 모델

**산출물**: ✅ [data-model.md](./data-model.md)

**핵심 엔티티**:

- **Ticket** (tickets 테이블)
  - 사용자 입력: title, description, priority, plannedStartDate, dueDate
  - 시스템 생성: id, status (BACKLOG), position (계산됨), startedAt (null), completedAt (null), createdAt, updatedAt

**비즈니스 규칙**:
1. 생성 시 status는 항상 BACKLOG로 설정
2. Position = min(BACKLOG positions) - 1024 (최상단 배치)
3. 새 티켓은 startedAt과 completedAt이 반드시 null
4. 제공되지 않으면 priority는 MEDIUM이 기본값
5. dueDate는 오늘 또는 이후여야 함

**데이터베이스 스키마**: 기존 `src/server/db/schema.ts` 사용 (tickets 테이블이 DATA_MODEL.md에 이미 정의됨)

### API 계약

**산출물**: ✅ [contracts/post-tickets.openapi.yaml](./contracts/post-tickets.openapi.yaml)

**엔드포인트**: POST /api/tickets

**요청**:
```json
{
  "title": "string (필수, 1-200자)",
  "description": "string (선택, 최대 1000자)",
  "priority": "LOW | MEDIUM | HIGH (선택, 기본값 MEDIUM)",
  "plannedStartDate": "string (선택, YYYY-MM-DD)",
  "dueDate": "string (선택, YYYY-MM-DD, 오늘 또는 이후)"
}
```

**응답 201 Created**:
```json
{
  "id": number,
  "title": string,
  "description": string | null,
  "status": "BACKLOG",
  "priority": "LOW" | "MEDIUM" | "HIGH",
  "position": number,
  "plannedStartDate": string | null,
  "dueDate": string | null,
  "startedAt": null,
  "completedAt": null,
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**응답 400 Bad Request**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "한글 오류 메시지"
  }
}
```

**에러 메시지** (API_SPEC.md에서):
- 빈 제목: "제목을 입력해주세요"
- 제목 너무 긺: "제목은 200자 이내로 입력해주세요"
- 공백만 있는 제목: "제목을 입력해주세요"
- 설명 너무 긺: "설명은 1000자 이내로 입력해주세요"
- 잘못된 priority: "우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요"
- 과거 dueDate: "종료예정일은 오늘 이후 날짜를 선택해주세요"

### Quickstart 가이드

**산출물**: ✅ [quickstart.md](./quickstart.md)

**구현 단계** (TDD):
1. 에러 클래스 설정 (5분)
2. 서비스 테스트 작성 (30분) - RED 단계
3. 서비스 구현 (45분) - GREEN 단계
4. API 테스트 작성 (20분) - RED 단계
5. Route Handler 구현 (15분) - GREEN 단계
6. 검증 (타입 체크, 테스트, 빌드, 수동 테스트) (10분)
7. 리팩토링 (선택) (15분) - REFACTOR 단계

**총 예상 시간**: 2-3시간

### Agent Context 업데이트

**산출물**: ✅ CLAUDE.md 업데이트됨

**추가된 기술**:
- TypeScript 5.7.3
- Next.js 15.1.6
- Drizzle ORM 0.38.3
- Zod 3.24.1
- PostgreSQL

---

## Phase 2: 구현 계획

*이 단계는 `/speckit.tasks` 명령으로 처리됨 (`/speckit.plan`의 일부 아님).*

`/speckit.tasks` 명령이 이 계획을 기반으로 원자적이고 순서가 정해진 구현 작업이 있는 `tasks.md`를 생성.

**예상 작업** (미리보기):
1. 도메인 에러 클래스 생성
2. 서비스 레이어 테스트 작성 (TDD Red)
3. ticketService.create() 구현
4. ticketService.calculatePosition() 구현
5. Route Handler 테스트 작성 (TDD Red)
6. POST /api/tickets Route Handler 구현
7. 전체 테스트 스위트 및 타입 체크 실행
8. curl로 수동 테스트
9. 리팩토링 및 코드 리뷰

---

## 검증 및 수용

### 구현 전 체크리스트

- [x] 기능 명세 검토 및 이해
- [x] API_SPEC.md 계약 이해
- [x] DATA_MODEL.md 검토
- [x] Constitution 원칙 검증
- [x] 기술적 불확실성 연구
- [x] 데이터 모델 정의
- [x] API 계약 생성
- [x] Quickstart 가이드 작성

### 구현 체크리스트 (/speckit.tasks용)

- [ ] 도메인 에러 생성 (TicketNotFoundError, ValidationError)
- [ ] 서비스 테스트 작성 (ticketService.test.ts)
- [ ] 서비스 구현 (ticketService.ts)
- [ ] API 테스트 작성 (tickets.test.ts)
- [ ] Route Handler 구현 (app/api/tickets/route.ts)
- [ ] 모든 테스트 통과
- [ ] 타입 체크 통과 (`npx tsc --noEmit`)
- [ ] 빌드 성공 (`npm run build`)
- [ ] 수동 테스트 완료

### 수용 기준 (spec.md에서)

**User Story 1 (P1) - Create Basic Ticket**:
- [ ] 제목만으로 POST하면 BACKLOG에 티켓 생성
- [ ] 전체 티켓 데이터와 함께 201 반환
- [ ] 티켓이 BACKLOG 칼럼 최상단에 나타남

**User Story 2 (P2) - Create Detailed Ticket**:
- [ ] 모든 필드로 POST하면 모든 값으로 티켓 생성
- [ ] 모든 선택 필드 수용 및 검증
- [ ] 제공되지 않으면 priority가 MEDIUM으로 기본 설정

**User Story 3 (P3) - Handle Invalid Input**:
- [ ] 빈 제목은 한글 에러 메시지와 함께 400 반환
- [ ] 200자 초과 제목은 400 반환
- [ ] 공백만 있는 제목은 400 반환
- [ ] 1000자 초과 설명은 400 반환
- [ ] 잘못된 priority는 400 반환
- [ ] 과거 dueDate는 400 반환

**성공 기준**:
- [ ] SC-001: 티켓 생성이 3초 이내 완료
- [ ] SC-002: 유효한 요청의 95% 성공률
- [ ] SC-003: 모든 검증 에러에 명확한 한글 메시지
- [ ] SC-004: 100개 동시 요청 처리
- [ ] SC-005: 새 티켓이 일관되게 BACKLOG 최상단에
- [ ] SC-006: Asia/Seoul 타임존의 타임스탬프
- [ ] SC-007: 에러 메시지가 API_SPEC.md와 정확히 일치

---

## 리스크 평가

| 리스크 | 가능성 | 영향 | 완화방안 |
|------|------|------|---------|
| Position 정수 소진 (>30회 삽입) | 낮음 | 중간 | gap ≤ 1일 때 재정렬 구현 |
| 동시 생성 경쟁 조건 | 중간 | 낮음 | PostgreSQL이 원자성 처리, 향후: 락 추가 |
| 사용자에게 불명확한 Zod 검증 에러 | 낮음 | 중간 | 스키마에 커스텀 한글 에러 메시지 |
| 서비스 레이어 복잡도 증가 | 낮음 | 낮음 | 집중 유지, 필요시 헬퍼 추출 |
| 날짜 검증 타임존 이슈 | 중간 | 중간 | 서버 타임존 일관되게 사용 (Asia/Seoul) |

---

## 의존성

**외부 의존성** (이미 package.json에 있음):
- next@15.1.6
- react@19.0.0
- drizzle-orm@0.38.3
- zod@3.24.1
- pg@8.18.0
- @vercel/postgres@0.10.0

**내부 의존성**:
- 기존 데이터베이스 스키마 (`src/server/db/schema.ts`)
- 기존 Zod 검증 스키마 (`src/shared/validations/ticket.ts`)
- 기존 공유 타입 (`src/shared/types/index.ts`)

**차단 요소**: 없음. 모든 의존성 사용 가능.

---

## 향후 고려사항

**이 기능의 범위 밖** (향후 작업으로 연기):

1. **Position 재정렬 API**: 자동 재정렬 미구현. 정수 정밀도 이슈 발생 시 추가.

2. **낙관적 락**: 동시 업데이트용 version 필드 없음. 경쟁 조건 문제 발생 시 추가.

3. **일괄 생성**: 대량 티켓 생성 API 없음. 사용자 워크플로우에 필요하면 추가.

4. **Undo/Redo**: 티켓 생성 실행 취소 지원 없음. 사용자 계정이 있는 Phase 2에 추가.

5. **문자열 기반 Fractional Indexing**: 협업 기능 추가 시 정수에서 LexoRank로 마이그레이션.

6. **포괄적인 에러 로깅**: 현재는 기본 console.error. 프로덕션에서 구조화된 로깅 추가 (예: Winston).

---

## 참조

- [기능 명세](./spec.md)
- [연구 문서](./research.md)
- [데이터 모델](./data-model.md)
- [API 계약](./contracts/post-tickets.openapi.yaml)
- [Quickstart 가이드](./quickstart.md)
- [프로젝트 API 명세](../../docs/API_SPEC.md)
- [프로젝트 데이터 모델](../../docs/DATA_MODEL.md)
- [프로젝트 Constitution](../../.specify/memory/constitution.md)
- [프로젝트 CLAUDE.md](../../CLAUDE.md)

---

**계획 상태**: ✅ 완료 및 `/speckit.tasks`로 구현 작업 생성 준비 완료
