# Tika - Claude Code 프로젝트 가이드

## 1. 프로젝트 개요

Tika는 티켓 기반 칸반 보드 할 일 관리 애플리케이션이다. 개인 사용자가 할 일을 티켓으로 생성하고, 4단계 워크플로우(Backlog → TODO → In Progress → Done)의 칸반 보드에서 드래그 앤 드롭으로 관리할 수 있다. Phase1의 가장 큰 기능은 업무의 크기에 따라 Goal>(User) Story>Feature>Task로 Goal 을 이루기 위한 더 작은 단위의 action item 티켓을 만들고 계획대로 실행하는것에 초첨을 둔다.

**주요 기능:**

- 티켓 CRUD (생성, 조회, 수정, 삭제)
- 칸반 보드 4개 고정 칼럼 (Backlog, TODO, In Progress, Done)
- 드래그 앤 드롭 칼럼 간 이동 및 순서 변경
- 우선순위(LOW/MEDIUM/HIGH/CRITICAL) 및 마감일 관리
- 마감일 초과 시각적 경고 표시
- 완료 시간 자동 기록

**현재 버전:** 0.1.0 (MVP, 단일 사용자)

---

## 2. 기술 스택

### 프론트엔드

| 기술         | 버전 | 용도                              |
| ------------ | ---- | --------------------------------- |
| Next.js      | 15   | App Router 기반 풀스택 프레임워크 |
| React        | 19   | UI 라이브러리                     |
| TypeScript   | 5.7  | 정적 타입 시스템                  |
| Tailwind CSS | 4    | 유틸리티 기반 스타일링            |
| @dnd-kit     | 6.x  | 드래그 앤 드롭                    |
| Zod          | 3.24 | 런타임 유효성 검증                |

### 백엔드 / DB

| 기술                   | 버전 | 용도                    |
| ---------------------- | ---- | ----------------------- |
| Next.js Route Handlers | -    | REST API                |
| Drizzle ORM            | 0.38 | ORM 및 쿼리 빌더        |
| Vercel Postgres (Neon) | -    | PostgreSQL 데이터베이스 |
| drizzle-kit            | 0.30 | 마이그레이션 도구       |
| NextAuth.js            | 5.x  | Google OAuth 인증, 세션 관리 |

### 개발 도구

| 기술                   | 버전 | 용도                            |
| ---------------------- | ---- | ------------------------------- |
| ESLint                 | 9    | 코드 린트                       |
| Prettier               | 3.4  | 코드 포맷팅                     |
| Jest                   | 29.7 | 유닛 테스트                     |
| @testing-library/react | 16   | 컴포넌트 테스트                 |
| tsx                    | 4.19 | TypeScript 실행 (seed 스크립트) |

### 배포

- **플랫폼:** Vercel
- **환경변수:**
  - `POSTGRES_URL` — Vercel Postgres 연결 문자열
  - `NEXTAUTH_SECRET` — NextAuth 비밀 키
  - `NEXTAUTH_URL` — NextAuth 콜백 URL (예: https://tika.vercel.app)
  - `GOOGLE_CLIENT_ID` — Google OAuth 클라이언트 ID
  - `GOOGLE_CLIENT_SECRET` — Google OAuth 클라이언트 시크릿

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
# .env.local에 POSTGRES_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 설정
npm run db:generate            # 마이그레이션 생성
npm run db:migrate             # 마이그레이션 적용
npm run db:seed                # (선택) 시드 데이터
npm run dev                    # 개발 서버 시작
```

---

## 4. 디렉토리 구조

```
tika/
├── app/                                  # Next.js App Router (라우팅 레이어)
│   ├── api/
│   │   ├── tickets/                      # 티켓 API
│   │   │   ├── route.ts                  # GET /api/tickets, POST /api/tickets
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts              # GET, PATCH, DELETE /api/tickets/:id
│   │   │   │   └── checklist/            # (FR-008) 체크리스트 API
│   │   │   │       ├── route.ts          # POST /api/tickets/:id/checklist
│   │   │   │       └── [itemId]/route.ts # PATCH, DELETE
│   │   │   └── reorder/route.ts          # PATCH /api/tickets/reorder
│   │   ├── labels/                       # (FR-009) 라벨 API
│   │   │   ├── route.ts                  # GET, POST /api/labels
│   │   │   └── [id]/route.ts            # PATCH, DELETE /api/labels/:id
│   │   ├── issues/                       # (FR-010) 이슈 계층 API
│   │   │   ├── route.ts                  # GET, POST /api/issues
│   │   │   └── [id]/route.ts            # PATCH, DELETE /api/issues/:id
│   │   ├── members/                      # (FR-011) 멤버 API
│   │   │   ├── route.ts                  # GET /api/members (Phase 1: 본인만)
│   │   │   └── [id]/route.ts            # Phase 4에서 활성화
│   │   ├── workspaces/                   # (FR-012) 워크스페이스 API
│   │   │   └── route.ts                  # GET /api/workspaces
│   │   └── auth/[...nextauth]/route.ts  # (FR-013) NextAuth 핸들러
│   ├── login/page.tsx                    # (FR-013) 로그인 페이지
│   ├── settings/page.tsx                 # (Phase 2) 설정 페이지
│   ├── layout.tsx                        # 루트 HTML 레이아웃
│   ├── page.tsx                          # 메인 페이지 (서버 컴포넌트)
│   └── globals.css                       # 글로벌 스타일
│
├── src/                                  # 애플리케이션 소스 코드
│   ├── components/                       # React 컴포넌트
│   │   ├── board/                        # 칸반 보드 컴포넌트
│   │   │   ├── BoardContainer.tsx        # 보드 최상위 클라이언트 컨테이너
│   │   │   ├── Board.tsx                 # 4칼럼 그리드 레이아웃
│   │   │   ├── Column.tsx                # 단일 칼럼 (Droppable)
│   │   │   └── TicketCard.tsx            # 카드 컴포넌트 (Draggable)
│   │   ├── ticket/                       # 티켓 관련 UI
│   │   │   ├── TicketForm.tsx            # 생성/수정 폼
│   │   │   ├── TicketModal.tsx           # 상세 보기 모달
│   │   │   └── ChecklistSection.tsx      # (FR-008) 체크리스트 UI
│   │   ├── label/                        # (FR-009) 라벨 컴포넌트
│   │   │   ├── LabelBadge.tsx            # 라벨 뱃지
│   │   │   └── LabelSelector.tsx         # 라벨 선택/생성기
│   │   ├── issue/                        # (FR-010) 이슈 계층 컴포넌트
│   │   │   └── IssueBreadcrumb.tsx       # 이슈 브레드크럼
│   │   └── ui/                           # 공통 UI 컴포넌트
│   │       ├── Button.tsx                # 범용 버튼
│   │       ├── Badge.tsx                 # 우선순위 뱃지
│   │       ├── Modal.tsx                 # 모달 컨테이너
│   │       ├── ConfirmDialog.tsx         # 삭제 확인 다이얼로그
│   │       ├── Avatar.tsx                # (FR-011) 담당자 아바타
│   │       └── FilterBar.tsx             # 필터 바
│   │
│   ├── db/                               # 데이터베이스 레이어
│   │   ├── index.ts                      # Drizzle 인스턴스 생성
│   │   ├── schema.ts                     # Drizzle 테이블 정의 (8개 테이블)
│   │   ├── queries/                      # 데이터베이스 쿼리 함수
│   │   │   ├── tickets.ts               # 티켓 CRUD 쿼리
│   │   │   ├── checklist.ts             # (FR-008) 체크리스트 쿼리
│   │   │   ├── labels.ts                # (FR-009) 라벨 쿼리
│   │   │   ├── issues.ts                # (FR-010) 이슈 쿼리
│   │   │   └── members.ts               # (FR-011) 멤버 쿼리
│   │   └── seed.ts                       # 시드 데이터 스크립트
│   │
│   ├── hooks/                            # 커스텀 React 훅
│   │   ├── useTickets.ts                 # 보드 상태 관리 훅
│   │   ├── useLabels.ts                  # (FR-009) 라벨 상태 훅
│   │   └── useIssues.ts                  # (FR-010) 이슈 상태 훅
│   │
│   ├── lib/                              # 유틸리티 및 헬퍼
│   │   ├── constants.ts                  # 상수 (색상, 제한값, 간격)
│   │   ├── validations.ts               # Zod 검증 스키마
│   │   └── utils.ts                      # 헬퍼 함수 (그룹핑, 마감일 체크)
│   │
│   └── types/                            # TypeScript 타입 정의
│       └── index.ts                      # 공유 타입 (중앙 집중)
│
├── docs/                                 # 프로젝트 문서
│   ├── PRD.md                            # 제품 요구사항
│   ├── TRD.md                            # 기술 요구사항 (이 문서)
│   ├── REQUIREMENTS.md                   # 상세 요구사항 명세 (v0.2.0)
│   ├── API_SPEC.md                       # API 명세서
│   ├── DATA_MODEL.md                     # 데이터 모델
│   ├── COMPONENT_SPEC.md                 # 컴포넌트 명세
│   ├── SCREEN_SPEC.md                    # 화면 정의서
│   ├── TEST_CASES.md                     # 테스트 케이스
│   ├── front/                            # 프론트엔드 디자인 참조
│   │   ├── tika-main.html               # HTML 프로토타입
│   │   ├── DESIGN_SYSTEM.md             # 디자인 시스템 v2.0
│   │   ├── UI_COMPONENT_GUIDE.md        # UI 컴포넌트 가이드
│   │   └── COLOR.json                    # 색상 팔레트
│   ├── enterprise/                       # 확장 계획
│   │   ├── feature-expansion-roadmap.md  # Phase 2+ 기능 분석
│   │   └── operations-guide.md           # 운영 가이드
│   └── phase/                            # Phase 3~5 설계
│       ├── REQUIREMENTS-Phase3.md
│       ├── REQUIREMENTS-Phase4.md
│       └── REQUIREMENTS-Phase5.md
│
├── migrations/                           # Drizzle ORM 마이그레이션 (자동 생성)
│
├── __tests__/                            # 테스트 파일
│   ├── api/                              # API 테스트
│   └── components/                       # 컴포넌트 테스트
│
├── .claude/                              # Claude Code 설정
│   ├── CLAUDE.md                         # 프로젝트 가이드
│   ├── settings.json                     # 팀 공유 설정
│   ├── commands/                         # 슬래시 명령어
│   ├── agents/                           # 에이전트 프롬프트
│   └── rules/                            # 자동 적용 규칙
│
├── .env.example                          # 환경 변수 템플릿
├── drizzle.config.ts                     # Drizzle Kit 설정
├── next.config.ts                        # Next.js 설정
├── tsconfig.json                         # TypeScript 설정
├── jest.config.ts                        # Jest 설정
├── .prettierrc                           # Prettier 설정
└── package.json                          # 의존성 및 스크립트
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

| 대상            | 규칙                     | 예시                                |
| --------------- | ------------------------ | ----------------------------------- |
| 컴포넌트        | PascalCase               | `BoardContainer`, `TicketCard`      |
| 컴포넌트 파일   | PascalCase.tsx           | `BoardContainer.tsx`                |
| 훅              | camelCase + `use` 접두사 | `useTickets`                        |
| 훅 파일         | camelCase.ts             | `useTickets.ts`                     |
| 함수/변수       | camelCase                | `groupTicketsByStatus`, `isOverdue` |
| 상수            | UPPER_SNAKE_CASE         | `POSITION_GAP`, `TITLE_MAX_LENGTH`  |
| 타입/인터페이스 | PascalCase               | `TicketStatus`, `BoardData`         |
| DB 칼럼         | snake_case               | `due_date`, `created_at`            |
| API 응답 필드   | camelCase                | `dueDate`, `createdAt`              |

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

Phase 1 테이블 구성 (8개):

| 테이블 | 설명 | 관계 |
|--------|------|------|
| users | Google OAuth 사용자 | 인증 엔티티 |
| workspaces | 워크스페이스 | users 1:N (owner_id FK) |
| tickets | 티켓 (칸반 카드) | workspaces 1:N (workspace_id FK) |
| checklist_items | 체크리스트 항목 | tickets 1:N (ON DELETE CASCADE) |
| labels | 라벨 정의 | workspaces 1:N (workspace_id FK), UNIQUE(workspace_id, name) |
| ticket_labels | 티켓-라벨 매핑 | M:N (tickets, labels, ON DELETE CASCADE) |
| issues | 이슈 계층 (Goal/Story/Feature/Task) | workspaces 1:N, self-referencing (ON DELETE SET NULL) |
| members | 멤버 (담당자) | users 1:N, workspaces 1:N, UNIQUE(user_id, workspace_id) |

### tickets 테이블

| 칼럼 | 타입 | 제약 | 기본값 | 설명 |
|------|------|------|--------|------|
| id | SERIAL | PK | - | 고유 ID |
| workspace_id | INT | NOT NULL, FK → workspaces(id) | - | 소속 워크스페이스 |
| title | VARCHAR(200) | NOT NULL | - | 제목 (1~200자) |
| description | TEXT | NULLABLE | NULL | 설명 (최대 1000자) |
| type | VARCHAR(10) | NOT NULL | - | 타입: GOAL, STORY, FEATURE, TASK |
| status | VARCHAR(20) | NOT NULL | 'BACKLOG' | 상태: BACKLOG, TODO, IN_PROGRESS, DONE |
| priority | VARCHAR(10) | NOT NULL | 'MEDIUM' | 우선순위: LOW, MEDIUM, HIGH, CRITICAL |
| position | INTEGER | NOT NULL | 0 | 칼럼 내 정렬 순서 |
| due_date | DATE | NULLABLE | NULL | 마감일 (YYYY-MM-DD) |
| issue_id | INT | NULLABLE, FK → issues(id) ON DELETE SET NULL | NULL | 상위 이슈 |
| assignee_id | INT | NULLABLE, FK → members(id) ON DELETE SET NULL | NULL | 담당자 |
| completed_at | TIMESTAMPTZ | NULLABLE | NULL | 완료 시각 |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | 수정 시각 |

**인덱스:** `idx_tickets_status_position` → (status, position), `idx_tickets_due_date` → (due_date)

> 상세 스키마 (users, workspaces, checklist_items, labels, ticket_labels, issues, members): DATA_MODEL.md 및 REQUIREMENTS.md FR-008~FR-013 참조

---

## 8. API 엔드포인트 요약

모든 API 요청은 세션 검증 필수 (미인증 시 401 UNAUTHORIZED).

| 메서드 | 경로 | 상태코드 | 설명 | 관련 FR |
|--------|------|----------|------|---------|
| POST | /api/tickets | 201 | 티켓 생성 | FR-001 |
| GET | /api/tickets | 200 | 전체 티켓 조회 (보드 데이터) | FR-002 |
| GET | /api/tickets/:id | 200 | 단일 티켓 조회 | FR-003 |
| PATCH | /api/tickets/:id | 200 | 티켓 수정 | FR-004 |
| DELETE | /api/tickets/:id | 204 | 티켓 삭제 | FR-005 |
| PATCH | /api/tickets/reorder | 200 | 드래그앤드롭 순서 변경 | FR-006 |
| POST | /api/tickets/:id/checklist | 201 | 체크리스트 항목 추가 | FR-008 |
| PATCH | /api/tickets/:id/checklist/:itemId | 200 | 체크리스트 항목 수정/토글 | FR-008 |
| DELETE | /api/tickets/:id/checklist/:itemId | 204 | 체크리스트 항목 삭제 | FR-008 |
| GET | /api/labels | 200 | 전체 라벨 목록 | FR-009 |
| POST | /api/labels | 201 | 라벨 생성 | FR-009 |
| PATCH | /api/labels/:id | 200 | 라벨 수정 | FR-009 |
| DELETE | /api/labels/:id | 204 | 라벨 삭제 | FR-009 |
| GET | /api/issues | 200 | 전체 이슈 계층 목록 | FR-010 |
| POST | /api/issues | 201 | 이슈 생성 | FR-010 |
| PATCH | /api/issues/:id | 200 | 이슈 수정 | FR-010 |
| DELETE | /api/issues/:id | 204 | 이슈 삭제 | FR-010 |
| GET | /api/members | 200 | 멤버 목록 (Phase 1: 본인만) | FR-011 |
| GET | /api/workspaces | 200 | 현재 사용자 워크스페이스 목록 | FR-012 |
| — | /api/auth/* | — | NextAuth 자동 라우트 (signin, callback, signout, session) | FR-013 |

> 상세 요청/응답 사양: API_SPEC.md 참조

**에러 응답 형식:**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "설명 메시지"
  }
}
```

**에러 코드:** `UNAUTHORIZED` (401), `VALIDATION_ERROR` (400), `TICKET_NOT_FOUND` (404), `INTERNAL_ERROR` (500)
