# Tika - Claude Code 프로젝트 가이드

## 1. 프로젝트 개요

Tika는 티켓 기반 칸반 보드 할 일 관리 애플리케이션이다. 개인 사용자가 할 일을 티켓으로 생성하고, 4단계 워크플로우(Backlog → TODO → In Progress → Done)의 칸반 보드에서 드래그 앤 드롭으로 관리할 수 있다.

**주요 기능:**
- 티켓 CRUD (생성, 조회, 수정, 삭제)
- 칸반 보드 4개 고정 칼럼 (Backlog, TODO, In Progress, Done)
- 드래그 앤 드롭 칼럼 간 이동 및 순서 변경
- 우선순위(LOW/MEDIUM/HIGH) 및 마감일 관리
- 마감일 초과 시각적 경고 표시
- 완료 시간 자동 기록

**현재 버전:** 0.1.0 (MVP, 단일 사용자)

---

## 2. 기술 스택

### 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 15 | App Router 기반 풀스택 프레임워크 |
| React | 19 | UI 라이브러리 |
| TypeScript | 5.7 | 정적 타입 시스템 |
| Tailwind CSS | 4 | 유틸리티 기반 스타일링 |
| @dnd-kit | 6.x | 드래그 앤 드롭 |
| Zod | 3.24 | 런타임 유효성 검증 |

### 백엔드 / DB
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js Route Handlers | - | REST API |
| Drizzle ORM | 0.38 | ORM 및 쿼리 빌더 |
| Vercel Postgres (Neon) | - | PostgreSQL 데이터베이스 |
| drizzle-kit | 0.30 | 마이그레이션 도구 |

### 개발 도구
| 기술 | 버전 | 용도 |
|------|------|------|
| ESLint | 9 | 코드 린트 |
| Prettier | 3.4 | 코드 포맷팅 |
| Jest | 29.7 | 유닛 테스트 |
| @testing-library/react | 16 | 컴포넌트 테스트 |
| tsx | 4.19 | TypeScript 실행 (seed 스크립트) |

### 배포
- **플랫폼:** Vercel
- **환경변수:** `POSTGRES_URL` (Vercel Postgres 연결 문자열)

---

## 3. 핵심 명령어

### 개발 서버
```bash
npm run dev              # http://localhost:3000 에서 개발 서버 실행
```

### 빌드 및 프로덕션
```bash
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버 실행
```

### 테스트
```bash
npm run test             # Jest 테스트 1회 실행
npm run test:watch       # Jest 감시 모드
npm run test:coverage    # 테스트 커버리지 리포트 생성
```

### 린트 및 포맷팅
```bash
npm run lint             # ESLint 검사
npm run format           # Prettier 코드 포맷팅
```

### 데이터베이스
```bash
npm run db:generate      # Drizzle 마이그레이션 파일 생성 (스키마 변경 후)
npm run db:migrate       # 마이그레이션 적용
npm run db:push          # 스키마 직접 Push (마이그레이션 파일 없이)
npm run db:studio        # Drizzle Studio (DB GUI) 실행
npm run db:seed          # 시드 데이터 삽입
```

### 초기 세팅 순서
```bash
npm install                    # 의존성 설치
cp .env.example .env.local     # 환경변수 파일 생성
# .env.local에 POSTGRES_URL 설정
npm run db:generate            # 마이그레이션 생성
npm run db:migrate             # 마이그레이션 적용
npm run db:seed                # (선택) 시드 데이터
npm run dev                    # 개발 서버 시작
```

---

## 4. 디렉토리 구조

```
tika/
├── app/                          # Next.js App Router (라우팅 레이어)
│   ├── api/tickets/              # REST API 엔드포인트
│   │   ├── route.ts              # GET /api/tickets, POST /api/tickets
│   │   ├── [id]/route.ts         # GET, PATCH, DELETE /api/tickets/:id
│   │   └── reorder/route.ts      # PATCH /api/tickets/reorder
│   ├── layout.tsx                # 루트 HTML 레이아웃
│   ├── page.tsx                  # 메인 페이지 (서버 컴포넌트)
│   └── globals.css               # 글로벌 스타일
│
├── src/                          # 애플리케이션 소스 코드
│   ├── components/               # React 컴포넌트
│   │   ├── board/                # 칸반 보드 컴포넌트
│   │   │   ├── BoardContainer.tsx    # 보드 최상위 클라이언트 컨테이너
│   │   │   ├── Board.tsx             # 4칼럼 그리드 레이아웃
│   │   │   ├── Column.tsx            # 단일 칼럼 (Droppable)
│   │   │   └── TicketCard.tsx        # 카드 컴포넌트 (Draggable)
│   │   ├── ticket/               # 티켓 관련 UI
│   │   │   ├── TicketForm.tsx        # 생성/수정 폼
│   │   │   └── TicketModal.tsx       # 상세 보기 모달
│   │   └── ui/                   # 공통 UI 컴포넌트
│   │       ├── Button.tsx            # 범용 버튼
│   │       ├── Badge.tsx             # 우선순위 뱃지
│   │       ├── Modal.tsx             # 모달 컨테이너
│   │       └── ConfirmDialog.tsx     # 삭제 확인 다이얼로그
│   │
│   ├── db/                       # 데이터베이스 레이어
│   │   ├── schema.ts             # Drizzle 테이블 정의
│   │   ├── index.ts              # Drizzle 인스턴스 생성
│   │   ├── queries/              # 데이터베이스 쿼리 함수
│   │   │   └── tickets.ts        # 티켓 CRUD 쿼리
│   │   └── seed.ts               # 시드 데이터 스크립트
│   │
│   ├── hooks/                    # 커스텀 React 훅
│   │   └── useTickets.ts         # 보드 상태 관리 훅
│   │
│   ├── lib/                      # 유틸리티 및 헬퍼
│   │   ├── constants.ts          # 상수 (색상, 제한값, 간격)
│   │   ├── validations.ts        # Zod 검증 스키마
│   │   └── utils.ts              # 헬퍼 함수 (그룹핑, 마감일 체크)
│   │
│   └── types/                    # TypeScript 타입 정의
│       └── index.ts              # 공유 타입 (중앙 집중)
│
├── docs/                         # 프로젝트 문서
│   ├── PRD.md                    # 제품 요구사항
│   ├── TRD.md                    # 기술 요구사항
│   ├── REQUIREMENTS.md           # 상세 요구사항
│   ├── API_SPEC.md               # API 명세서
│   ├── DATA_MODEL.md             # 데이터 모델 및 ERD
│   ├── COMPONENT_SPEC.md         # 컴포넌트 아키텍처
│   └── TEST_CASES.md             # 테스트 시나리오
│
├── migrations/                   # Drizzle ORM 마이그레이션 (자동 생성)
├── __tests__/                    # 테스트 파일
│   ├── api/                      # API 테스트
│   └── components/               # 컴포넌트 테스트
│
├── .claude/                      # Claude Code 설정
│   ├── CLAUDE.md                 # 이 파일 (프로젝트 가이드)
│   ├── settings.json             # 팀 공유 설정
│   ├── commands/                 # 슬래시 명령어
│   ├── agents/                   # 에이전트 프롬프트
│   └── rules/                    # 자동 적용 규칙
│
├── drizzle.config.ts             # Drizzle Kit 설정
├── tsconfig.json                 # TypeScript 설정
├── jest.config.ts                # Jest 테스트 설정
├── .prettierrc                   # Prettier 설정
└── package.json                  # 의존성 및 스크립트
```

### 코드 배치 규칙
- **라우팅/API:** `app/` 디렉토리에 배치 (Next.js App Router 규칙)
- **비즈니스 로직:** `src/` 디렉토리 하위에 배치
- **컴포넌트:** `src/components/{도메인}/` 형태로 그룹핑
- **공통 UI:** `src/components/ui/` 에 재사용 가능한 컴포넌트 배치
- **DB 관련:** `src/db/` 에 스키마, 쿼리, 시드 데이터 집중
- **타입:** `src/types/index.ts` 에 공유 타입 중앙 관리
- **유틸리티:** `src/lib/` 에 상수, 검증, 헬퍼 함수 배치
- **테스트:** `__tests__/` 하위에 소스 구조를 미러링하여 배치

### Path Alias
```typescript
@/*     → ./src/*       // 예: @/components/board/Board
@/app/* → ./app/*       // 예: @/app/api/tickets/route
```

---

## 5. 코딩 규칙

### 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `BoardContainer`, `TicketCard` |
| 컴포넌트 파일 | PascalCase.tsx | `BoardContainer.tsx` |
| 훅 | camelCase + `use` 접두사 | `useTickets` |
| 훅 파일 | camelCase.ts | `useTickets.ts` |
| 함수/변수 | camelCase | `groupTicketsByStatus`, `isOverdue` |
| 상수 | UPPER_SNAKE_CASE | `POSITION_GAP`, `TITLE_MAX_LENGTH` |
| 타입/인터페이스 | PascalCase | `TicketStatus`, `BoardData` |
| DB 칼럼 | snake_case | `due_date`, `created_at` |
| API 응답 필드 | camelCase | `dueDate`, `createdAt` |

### Prettier 설정 (`.prettierrc`)
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### TypeScript 규칙
- **Strict 모드** 활성화 (`"strict": true`)
- 공유 타입은 `src/types/index.ts`에 중앙 관리
- `as const` 단언으로 enum 대체 (예: `TICKET_STATUS`)
- Zod로 런타임 유효성 검증 (API 입력)
- 타입 추론 가능한 곳에서는 명시적 타입 생략, API 계약에는 명시적 타입 사용

### React 패턴
- 클라이언트 컴포넌트에 `'use client'` 디렉티브 명시
- 서버 컴포넌트에서 초기 데이터 fetch → 클라이언트 컴포넌트로 전달
- 상태 관리는 커스텀 훅(`useTickets`)으로 중앙화
- Optimistic UI 업데이트 + 실패 시 롤백 패턴 적용

### Tailwind CSS 규칙
- 유틸리티 퍼스트 방식, 별도 CSS 파일 사용 지양
- `prettier-plugin-tailwindcss`로 클래스 자동 정렬
- 반응형: 모바일 퍼스트 (`sm`, `lg` 브레이크포인트)

### Git 커밋 메시지
- 한국어 또는 영어 사용 가능
- 변경 목적을 간결하게 기술 (1-2문장)

---

## 6. 금지 사항과 예외 규칙

## 🚨 절대 금지 사항 (CRITICAL - 반드시 준수)

### 🔴 데이터베이스 관련 절대 금지 사항
```bash
# 데이터베이스 파괴적 명령어 - 절대 사용 금지 (사용자 명시적 요청 없이)

# SQL 파괴적 명령어 - 절대 금지
DROP TABLE                 # ❌ 절대 금지
DROP DATABASE             # ❌ 절대 금지
DELETE FROM               # ⚠️ WHERE 절 없이 사용 금지
TRUNCATE                  # ❌ 절대 금지
ALTER TABLE DROP          # ⚠️ 사용자 허가 필요
```

### 🔴 데이터베이스 작업 필수 규칙
1. **데이터 삭제/리셋 전 반드시 사용자에게 명시적 허가 요청**
2. **백업 없이 데이터 삭제 절대 금지**
3. **테스트 데이터가 있는 상태에서 리셋 금지**
4. **SQL 수정으로 해결 가능한 문제는 데이터베이스 리셋 금지**
5. **프로덕션 데이터베이스는 어떤 경우에도 자동 수정 금지**

### 🔴 Git 위험 명령어 - 절대 사용 금지
```bash
git push --force          # ❌ 절대 금지
git reset --hard          # ❌ 절대 금지
git commit --no-verify    # ❌ 절대 금지
```

### 🔴 npm 위험 명령어
```bash
npm audit fix --force     # ❌ 절대 금지
```

### 라이브러리 버전 고정 (변경 금지)
- 합당한 이유 없이 자주 라이브러리를 변경하면 안됌. 초기 셋팅 후 문제가 있을 경우에 허가 요청 후 변경 가능

### 기본 기술 스택 이외의 라이브러리, 프레임워크, 언어 도입은 지양
- 어쩔수 없이 해야 할 경우 해야 하는 이유와 검토 의견을 낸 뒤 명시적으로 허가 요청할것

### 파일 수정/삭제 관련 규칙
- **`src/db/schema.ts` 수정 시 반드시 사용자 확인 후 진행** (DB 스키마 변경은 마이그레이션에 영향)
- **`drizzle.config.ts`, `next.config.ts` 등 핵심 설정 파일 수정 시 사용자 확인 필수**
- **`package.json`의 dependencies 변경 시 사용자 허가 필요**
- **`.env.local` 파일 직접 수정/생성 금지** (환경변수는 사용자가 직접 관리)
- **`migrations/` 디렉토리 내 파일 수동 편집 금지** (drizzle-kit으로만 생성)
- **`docs/` 문서 삭제 금지** (수정은 가능하나 삭제 시 사용자 확인 필요)

---

## 7. 데이터베이스 스키마 참고

### tickets 테이블 (유일한 테이블)

| 칼럼 | 타입 | 제약 | 기본값 | 설명 |
|------|------|------|--------|------|
| id | SERIAL | PK, AUTO INCREMENT | - | 고유 ID |
| title | VARCHAR(200) | NOT NULL | - | 제목 (1~200자) |
| description | TEXT | NULLABLE | NULL | 설명 (최대 1000자) |
| status | VARCHAR(20) | NOT NULL | 'BACKLOG' | 상태: BACKLOG, TODO, IN_PROGRESS, DONE |
| priority | VARCHAR(10) | NOT NULL | 'MEDIUM' | 우선순위: LOW, MEDIUM, HIGH, CRITICAL |
| position | INTEGER | NOT NULL | 0 | 칼럼 내 정렬 순서 |
| due_date | DATE | NULLABLE | NULL | 마감일 (YYYY-MM-DD) |
| completed_at | TIMESTAMPTZ | NULLABLE | NULL | 완료 시각 |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | 수정 시각 |

**인덱스:**
- `idx_tickets_status_position` → (status, position)
- `idx_tickets_due_date` → (due_date)

---

## 8. API 엔드포인트 요약

| 메서드 | 경로 | 상태코드 | 설명 |
|--------|------|----------|------|
| POST | /api/tickets | 201 | 티켓 생성 |
| GET | /api/tickets | 200 | 전체 티켓 조회 (보드 데이터) |
| GET | /api/tickets/:id | 200 | 단일 티켓 조회 |
| PATCH | /api/tickets/:id | 200 | 티켓 수정 |
| DELETE | /api/tickets/:id | 204 | 티켓 삭제 |
| PATCH | /api/tickets/reorder | 200 | 드래그 앤 드롭 순서 변경 |

**에러 응답 형식:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "설명 메시지"
  }
}
```

**에러 코드:** `VALIDATION_ERROR` (400), `TICKET_NOT_FOUND` (404), `INTERNAL_ERROR` (500)
