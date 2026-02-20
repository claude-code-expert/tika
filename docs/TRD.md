# Tika - Technical Requirements Document (TRD)

> 버전: 1.0 (MVP)
> 최종 수정일: 2026-02-01

---

## 1. 시스템 아키텍처

### 1.1 전체 구성

```
┌─────────────────────────────────────────────┐
│                  Vercel                      │
│                                             │
│  ┌─────────────┐    ┌──────────────────┐   │
│  │  Next.js    │    │  Next.js         │   │
│  │  Frontend   │───▶│  API Routes      │   │
│  │  (React)    │    │  (Server)        │   │
│  └─────────────┘    └────────┬─────────┘   │
│                              │              │
│                     ┌────────▼─────────┐   │
│                     │  Drizzle ORM     │   │
│                     └────────┬─────────┘   │
│                              │              │
│                     ┌────────▼─────────┐   │
│                     │ Vercel Postgres  │   │
│                     │ (Neon)           │   │
│                     └──────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### 1.2 모노레포 구조

Next.js App Router 기반 모노레포. 프론트엔드와 백엔드(API Routes)를 하나의 프로젝트에서 관리한다.

- **프론트엔드**: `app/` 디렉토리의 페이지 컴포넌트 + React 클라이언트 컴포넌트
- **백엔드**: `app/api/` 디렉토리의 Route Handlers
- **공유**: `src/` 디렉토리의 타입, 유틸리티, DB 스키마

---

## 2. 기술 스택 상세

### 2.1 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 15.x | 풀스택 프레임워크 (App Router) |
| React | 19.x | UI 렌더링 |
| TypeScript | 5.x | 타입 안전성 |
| Tailwind CSS | 4.x | 스타일링 |
| @dnd-kit/core | 6.x | 드래그앤드롭 |
| @dnd-kit/sortable | 8.x | 칼럼 내 정렬 |

### 2.2 백엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js API Routes | 15.x | REST API 엔드포인트 |
| Drizzle ORM | 0.38.x | DB 쿼리, 스키마 관리 |
| Drizzle Kit | 0.30.x | 마이그레이션 관리 |
| @vercel/postgres | latest | Vercel Postgres 연결 드라이버 |
| Zod | 3.x | 요청 데이터 검증 |

### 2.3 개발 도구

| 기술 | 용도 |
|------|------|
| ESLint | 린트 |
| Prettier | 코드 포맷팅 |
| Jest + React Testing Library | 테스트 |
| drizzle-kit | DB 마이그레이션 |

---

## 3. 프로젝트 디렉토리 구조

```
tika/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 메인 페이지 (칸반 보드)
│   ├── globals.css               # 글로벌 스타일
│   └── api/                      # API Routes (백엔드)
│       └── tickets/
│           ├── route.ts          # GET /api/tickets, POST /api/tickets
│           ├── [id]/
│           │   └── route.ts      # GET|PATCH|DELETE /api/tickets/:id
│           └── reorder/
│               └── route.ts      # PATCH /api/tickets/reorder
│
├── src/
│   ├── components/               # React 컴포넌트
│   │   ├── board/
│   │   │   ├── Board.tsx         # 칸반 보드 컨테이너
│   │   │   ├── Column.tsx        # 칼럼 (Backlog, TODO 등)
│   │   │   └── TicketCard.tsx    # 티켓 카드
│   │   ├── ticket/
│   │   │   ├── TicketModal.tsx   # 티켓 상세/수정 모달
│   │   │   └── TicketForm.tsx    # 티켓 생성 폼
│   │   └── ui/
│   │       ├── Button.tsx        # 공통 버튼
│   │       ├── Modal.tsx         # 공통 모달
│   │       ├── Badge.tsx         # 우선순위 뱃지
│   │       └── ConfirmDialog.tsx # 확인 다이얼로그
│   │
│   ├── db/
│   │   ├── index.ts              # Drizzle 클라이언트 초기화
│   │   ├── schema.ts             # DB 스키마 정의
│   │   └── queries/
│   │       └── tickets.ts        # 티켓 관련 쿼리 함수
│   │
│   ├── lib/
│   │   ├── validations.ts        # Zod 스키마 (요청 검증)
│   │   └── constants.ts          # 상수 (칼럼명, 우선순위 등)
│   │
│   ├── hooks/
│   │   └── useTickets.ts         # 티켓 데이터 커스텀 훅
│   │
│   └── types/
│       └── index.ts              # 공유 TypeScript 타입
│
├── migrations/                   # Drizzle 마이그레이션 파일
│   └── meta/
│
├── docs/                         # 프로젝트 문서
│   ├── PRD.md                    # 제품 요구사항
│   ├── TRD.md                    # 기술 요구사항 (이 문서)
│   ├── REQUIREMENTS.md           # 상세 요구사항 명세
│   ├── API_SPEC.md               # API 명세서
│   ├── DATA_MODEL.md             # 데이터 모델
│   ├── COMPONENT_SPEC.md         # 컴포넌트 명세
│   └── TEST_CASES.md             # 테스트 케이스
│
├── __tests__/                    # 테스트 파일
│   ├── api/
│   │   └── tickets.test.ts
│   └── components/
│       ├── Board.test.tsx
│       ├── Column.test.tsx
│       └── TicketCard.test.tsx
│
├── public/                       # 정적 파일
│
├── CLAUDE.md                     # Claude Code 프로젝트 설정
├── .env.local                    # 환경 변수 (Git 제외)
├── .env.example                  # 환경 변수 템플릿
├── drizzle.config.ts             # Drizzle Kit 설정
├── next.config.ts                # Next.js 설정
├── tailwind.config.ts            # Tailwind CSS 설정
├── tsconfig.json                 # TypeScript 설정
├── jest.config.ts                # Jest 설정
├── package.json
└── .gitignore
```

---

## 4. 데이터 계층

### 4.1 DB 연결

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/vercel-postgres';

export const db = drizzle();
```

Vercel Postgres는 `@vercel/postgres` 드라이버를 통해 연결하며, Drizzle이 이를 자동 감지한다.

### 4.2 마이그레이션 전략

- `drizzle-kit generate`로 마이그레이션 SQL 생성
- `drizzle-kit migrate`로 마이그레이션 적용
- 마이그레이션 파일은 Git에 포함하여 버전 관리

---

## 5. API 설계 원칙

### 5.1 REST API 규칙

- 기본 경로: `/api/tickets`
- JSON 요청/응답
- HTTP 상태 코드 표준 준수 (200, 201, 400, 404, 500)
- 에러 응답 형식 통일

### 5.2 에러 응답 형식

```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "Ticket not found"
  }
}
```

### 5.3 요청 검증

모든 API 요청은 Zod 스키마로 검증한다. 검증 실패 시 400 Bad Request와 구체적인 에러 메시지를 반환한다.

---

## 6. 프론트엔드 아키텍처

### 6.1 렌더링 전략

- **서버 컴포넌트**: 초기 보드 데이터 로드 (SSR)
- **클라이언트 컴포넌트**: 드래그앤드롭, 모달, 폼 인터랙션

### 6.2 상태 관리

- **서버 상태**: fetch + React 상태 (useState/useReducer)
- **낙관적 업데이트**: 드래그앤드롭 시 즉시 UI 반영 → API 호출 → 실패 시 롤백
- 별도 상태 관리 라이브러리(Redux, Zustand 등)는 MVP에서 사용하지 않음

### 6.3 드래그앤드롭

- @dnd-kit 사용
- 칼럼 간 이동: 상태(status) 변경 + 순서(position) 업데이트
- 칼럼 내 이동: 순서(position)만 업데이트
- 터치 디바이스 지원

---

## 7. 배포 설정

### 7.1 Vercel 배포

- GitHub 연동 자동 배포
- 프로덕션 브랜치: `main`
- 프리뷰 배포: PR 생성 시 자동

### 7.2 환경 변수

```bash
# .env.example
POSTGRES_URL=              # Vercel Postgres 연결 문자열
```

### 7.3 로컬 개발 환경

- `vercel env pull`로 환경 변수 동기화
- 또는 로컬 PostgreSQL + `.env.local` 수동 설정

---

## 8. 성능 기준

| 지표 | 목표 |
|------|------|
| First Contentful Paint | < 1.5초 |
| Largest Contentful Paint | < 2.5초 |
| API 응답 시간 | < 200ms |
| 드래그앤드롭 반응 | 즉시 (낙관적 업데이트) |
| Lighthouse 점수 | > 90 (Performance) |

---

## 9. 보안 고려사항 (MVP)

- SQL Injection 방지: Drizzle ORM 파라미터 바인딩
- XSS 방지: React 자동 이스케이핑 + 입력 검증
- HTTPS: Vercel 기본 제공
- 환경 변수: DB 연결 정보 코드에 미포함
