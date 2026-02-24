# Tika - Technical Requirements Document (TRD)

> 버전: 2.0
> 최종 수정일: 2026-02-22

---

## 1. 시스템 아키텍처

### 1.1 Phase 1 아키텍처 (현재)

```
┌──────────────────────────────────────────────────────┐
│                      Vercel                           │
│                                                       │
│  ┌────────────┐   ┌───────────────┐   ┌───────────┐ │
│  │  Next.js   │   │  Next.js      │   │ NextAuth  │ │
│  │  Frontend  │──▶│  API Routes   │──▶│ v5        │ │
│  │  (React)   │   │  (Server)     │   │ (Auth)    │ │
│  └────────────┘   └──────┬────────┘   └─────┬─────┘ │
│                          │                    │       │
│                 ┌────────▼─────────┐   ┌─────▼─────┐ │
│                 │  Drizzle ORM     │   │  Google   │ │
│                 └────────┬─────────┘   │  OAuth    │ │
│                          │             └───────────┘ │
│                 ┌────────▼─────────┐                 │
│                 │ Vercel Postgres  │                  │
│                 │ (Neon)           │                  │
│                 └──────────────────┘                  │
│                                                       │
└──────────────────────────────────────────────────────┘
```

- **NextAuth v5**: Google OAuth 2.0, JWT 세션, httpOnly 쿠키
- **API Routes**: tickets, labels, issues, members, checklist, workspaces 엔드포인트 (세션 검증 필수)
- **Drizzle ORM**: 8개 테이블 관리 (users, workspaces, tickets, checklist_items, labels, ticket_labels, issues, members)

### 1.2 Phase 2 아키텍처 (예정)

Phase 1 아키텍처에 알림 인프라를 추가한다:

```
  Phase 1 아키텍처
  + ┌──────────────┐   ┌──────────────┐
    │ Vercel Cron  │   │ External     │
    │ (스케줄러)    │   │ Services     │
    └──────────────┘   │ - Slack API  │
                        │ - Telegram   │
                        └──────────────┘
```

- **Vercel Cron**: 매일 09:00 KST 마감일 D-1 알림 발송
- **External Services**: Slack Incoming Webhook, Telegram Bot API

### 1.3 모노레포 구조

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
| TypeScript | 5.7.x | 타입 안전성 |
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
| Zod | 3.24.x | 요청 데이터 검증 |
| NextAuth.js | 5.x | Google OAuth 인증, 세션 관리 |

### 2.3 개발 도구

| 기술 | 용도 |
|------|------|
| ESLint 9 | 린트 |
| Prettier 3.4 | 코드 포맷팅 (prettier-plugin-tailwindcss) |
| Jest 29.7 + React Testing Library 16 | 테스트 |
| drizzle-kit | DB 마이그레이션 |
| tsx 4.19 | TypeScript 실행 (seed 스크립트) |

### 2.4 Phase 2 추가 기술

| 기술 | 버전 | 용도 |
|------|------|------|
| Vercel Cron | — | 마감일 D-1 알림 스케줄러 |

---

## 3. 프로젝트 디렉토리 구조

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

### 4.3 Phase 1 테이블 구성

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

> 상세 스키마: DATA_MODEL.md 및 REQUIREMENTS.md FR-008~FR-011 참조

### 4.4 tickets 테이블 확장 칼럼

기본 tickets 테이블(id, title, description, status, priority, position, due_date, completed_at, created_at, updated_at)에 추가:

| 칼럼 | 타입 | 설명 |
|------|------|------|
| type | VARCHAR(10) NOT NULL | 티켓 타입: GOAL, STORY, FEATURE, TASK (필수, 생성 시 최초 선택) |
| issue_id | INT NULLABLE | FK → issues(id) ON DELETE SET NULL |
| assignee_id | INT NULLABLE | FK → members(id) ON DELETE SET NULL |

### 4.5 Phase 2 예상 추가 테이블

| 테이블 | 설명 |
|--------|------|
| notification_channels | Slack/Telegram 채널 설정 |
| notifications | 알림 발송 이력 |
| comments | 티켓 댓글 |

---

## 5. API 설계 원칙

### 5.1 REST API 규칙

- JSON 요청/응답
- HTTP 상태 코드 표준 준수 (200, 201, 204, 400, 404, 500)
- 에러 응답 형식 통일

### 5.2 에러 응답 형식

```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "티켓을 찾을 수 없습니다"
  }
}
```

| 에러 코드 | HTTP 상태 | 발생 조건 |
|-----------|----------|----------|
| UNAUTHORIZED | 401 | 미인증 요청 (세션 없음 또는 만료) |
| VALIDATION_ERROR | 400 | 입력값 제약조건 위반 |
| TICKET_NOT_FOUND | 404 | 존재하지 않는 엔티티 ID |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

### 5.3 요청 검증

모든 API 요청은 Zod 스키마로 검증한다. 검증 실패 시 400 Bad Request와 구체적인 에러 메시지를 반환한다.

### 5.4 Phase 1 API 엔드포인트 요약

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
| POST | /api/members | 201 | 멤버 등록 (Phase 4 활성화) | FR-011 |
| PATCH | /api/members/:id | 200 | 멤버 수정 (Phase 4 활성화) | FR-011 |
| DELETE | /api/members/:id | 204 | 멤버 삭제 (Phase 4 활성화) | FR-011 |
| GET | /api/workspaces | 200 | 현재 사용자 워크스페이스 목록 | FR-012 |
| — | /api/auth/* | — | NextAuth 자동 라우트 (signin, callback, signout, session) | FR-013 |

> 상세 요청/응답 사양: API_SPEC.md 참조

---

## 6. 프론트엔드 아키텍처

### 6.1 렌더링 전략

- **서버 컴포넌트**: 초기 보드 데이터 로드 (SSR)
- **클라이언트 컴포넌트**: 드래그앤드롭, 모달, 폼 인터랙션

### 6.2 상태 관리

- **서버 상태**: fetch + React 상태 (useState/useReducer)
- **커스텀 훅**: useTickets (보드), useLabels (라벨), useIssues (이슈 계층)
- **낙관적 업데이트**: 드래그앤드롭 시 즉시 UI 반영 → API 호출 → 실패 시 롤백
- 별도 상태 관리 라이브러리(Redux, Zustand 등)는 MVP에서 사용하지 않음

### 6.3 드래그앤드롭

- @dnd-kit 사용
- 칼럼 간 이동: 상태(status) 변경 + 순서(position) 업데이트
- 칼럼 내 이동: 순서(position)만 업데이트
- 터치 디바이스 지원 (200ms 딜레이)
- 낙관적 업데이트 + 실패 시 롤백

### 6.4 디자인 시스템 참조

| 자료 | 경로 | 설명 |
|------|------|------|
| 디자인 토큰 | `docs/front/DESIGN_SYSTEM.md` | 타이포그래피, 간격, 색상, 그림자, 레이아웃 |
| 컴포넌트 인벤토리 | `docs/front/UI_COMPONENT_GUIDE.md` | 전체 UI 컴포넌트 사양 |
| 색상 팔레트 | `docs/front/COLOR.json` | 구조화된 색상 토큰 |
| HTML 프로토타입 | `docs/front/tika-main.html` | 동작하는 단일 파일 프로토타입 |

---

## 7. 배포 설정

### 7.1 Vercel 배포

- GitHub 연동 자동 배포
- 프로덕션 브랜치: `main`
- 프리뷰 배포: PR 생성 시 자동

### 7.2 환경 변수

```bash
# Phase 1 (현재)
POSTGRES_URL=                    # Vercel Postgres 연결 문자열
NEXTAUTH_SECRET=                 # NextAuth 비밀 키
NEXTAUTH_URL=                    # NextAuth 콜백 URL (예: https://tika.vercel.app)
GOOGLE_CLIENT_ID=                # Google OAuth 클라이언트 ID
GOOGLE_CLIENT_SECRET=            # Google OAuth 클라이언트 시크릿

# Phase 2 (예정)
CRON_SECRET=                     # Vercel Cron 인증 토큰
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
| API 응답 시간 (p95) | < 200ms |
| 드래그앤드롭 반응 | 즉시 (낙관적 업데이트) |
| Lighthouse Performance | > 90 |

---

## 9. 보안 고려사항

### 9.1 Phase 1 (현재)

| 항목 | 전략 |
|------|------|
| 인증 | NextAuth.js v5, Google OAuth 2.0 (FR-013) |
| 세션 관리 | JWT 기반, httpOnly 쿠키 |
| CSRF 방지 | NextAuth.js 내장 CSRF 토큰 |
| 데이터 격리 | 모든 쿼리에 workspace_id 조건 추가 (FR-012) |
| OAuth 토큰 보호 | 서버 사이드 저장, 클라이언트 노출 금지 |
| API 보안 | 모든 API 요청에 세션 검증 적용, 미인증 시 401 |
| SQL Injection | Drizzle ORM 파라미터 바인딩 |
| XSS | React 자동 이스케이핑 + Zod 입력 검증 |
| HTTPS | Vercel 기본 제공 |
| 환경 변수 | DB 연결 정보 코드에 미포함, .env.local 분리 |

### 9.2 Phase 2 (예정)

| 항목 | 전략 |
|------|------|
| 추가 보안 강화 | Phase 1 인증/보안 기반 위에 확장 |
