# Tika

> Ticket-based Kanban Board for Personal Task Management

Goal > Story > Feature > Task 계층으로 업무를 분해하고, 칸반 보드에서 드래그 앤 드롭으로 관리하는 할 일 관리 앱.

---

## Features

### Kanban Board
- 3칼럼 보드 (TODO / In Progress / Done) + 사이드바 Backlog
- @dnd-kit 기반 드래그 앤 드롭 — 칼럼 간 이동, 칼럼 내 순서 변경
- 사이드바 ↔ 보드 양방향 드래그
- 사이드바 접기/펼치기 + 드래그 리사이즈 (200~400px)

### Ticket Management
- 티켓 CRUD (생성 / 조회 / 수정 / 삭제 / 복제)
- 4가지 타입: Goal, Story, Feature, Task
- 4단계 우선순위: Low, Medium, High, Critical
- 시작일 / 마감일 + 마감 초과 시각적 경고
- 체크리스트 (티켓당 최대 20개)
- 라벨/태그 (워크스페이스당 20개, 티켓당 5개)
- 이슈 계층 연결 (Goal > Story > Feature > Task)
- 담당자 배정, 완료 시 자동 시각 기록

### Search & Filter
- 헤더 실시간 검색 (제목/설명 필터링)
- 필터 칩 — 전체 / 이번 주 업무 / 일정 초과
- 라벨 기반 필터링
- 우선순위 + 날짜 범위 고급 필터

### Notifications
- Slack / Telegram 알림 채널 설정
- 마감일 D-1 자동 알림
- 알림 내역 페이지 + 읽음 처리
- 헤더 알림 벨 드롭다운 (미읽음 카운트 뱃지)

### Comments
- 티켓 내 댓글 작성 / 수정 / 삭제
- 멤버 아바타 표시

### User & Workspace
- Google OAuth 로그인 (NextAuth.js v5)
- 첫 로그인 시 워크스페이스 + 멤버 + 기본 라벨 자동 생성
- 프로필 설정 (이니셜 입력 + 아바타 색상 선택)
- 워크스페이스 설정 (이름 / 설명)
- 멤버 역할 관리 (admin / member)

### Responsive
- 모바일 사이드바 드로어 (슬라이드인 + 백드롭)
- 768px 미만 햄버거 메뉴
- 모달 Bottom Sheet (모바일)
- 보드 가로 스크롤

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 15 |
| Language | TypeScript (strict) | 5.7 |
| UI | React + Tailwind CSS | 19 / 4 |
| Drag & Drop | @dnd-kit | 6.x |
| ORM | Drizzle ORM | 0.38 |
| Database | PostgreSQL (Neon) | 14+ |
| Auth | NextAuth.js (Google OAuth) | 5.x |
| Validation | Zod | 3.24 |
| Test | Jest + Testing Library | 29 |
| Deploy | Vercel | — |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Google OAuth Client ID / Secret ([설정 가이드](#google-oauth-setup))

### Setup

```bash
npm install
cp .env.example .env.local
```

`.env.local` 편집:

```env
POSTGRES_URL=postgresql://username:password@localhost:5432/tika_dev
NEXTAUTH_SECRET=your-secret-here       # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

```bash
npm run db:migrate    # 마이그레이션 적용
npm run db:seed       # (선택) 시드 데이터
npm run dev           # http://localhost:3000
```

### Google OAuth Setup

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. OAuth 2.0 Client ID 생성 (Web application)
3. Authorized redirect URI 추가: `http://localhost:3000/api/auth/callback/google`
4. Client ID / Secret을 `.env.local`에 입력

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run test` | 테스트 실행 |
| `npm run test:coverage` | 커버리지 리포트 |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run db:generate` | 마이그레이션 파일 생성 |
| `npm run db:migrate` | 마이그레이션 적용 |
| `npm run db:studio` | Drizzle Studio (DB GUI) |
| `npm run db:seed` | 시드 데이터 삽입 |

---

## Project Structure

```
tika/
├── app/                        # Next.js App Router
│   ├── api/
│   │   ├── tickets/            # 티켓 CRUD + reorder + checklist + complete
│   │   ├── labels/             # 라벨 CRUD
│   │   ├── issues/             # 이슈 계층 CRUD
│   │   ├── members/            # 멤버 관리
│   │   ├── workspaces/         # 워크스페이스 설정
│   │   ├── notifications/      # 알림 채널 + 로그
│   │   └── auth/               # NextAuth 핸들러
│   ├── login/                  # 로그인 페이지
│   ├── settings/               # 설정 페이지
│   ├── notifications/          # 알림 내역 페이지
│   └── page.tsx                # 메인 보드
├── src/
│   ├── components/
│   │   ├── board/              # Board, Column, TicketCard
│   │   ├── ticket/             # TicketForm, TicketModal, ChecklistSection
│   │   ├── label/              # LabelBadge, LabelSelector
│   │   ├── issue/              # IssueBreadcrumb
│   │   ├── layout/             # Header, Sidebar, AppShell, Footer, ProfileModal
│   │   ├── settings/           # 설정 섹션 컴포넌트
│   │   └── ui/                 # Button, Badge, Modal, Avatar, FilterBar 등
│   ├── db/
│   │   ├── schema.ts           # 11개 테이블 정의
│   │   ├── queries/            # DB 쿼리 함수
│   │   └── seed.ts             # 시드 스크립트
│   ├── hooks/                  # useTickets, useLabels, useIssues
│   ├── lib/                    # auth, constants, validations, utils
│   └── types/                  # 공유 타입
├── migrations/                 # Drizzle 마이그레이션 SQL
├── __tests__/                  # Jest 테스트
└── docs/                       # 프로젝트 문서
```

---

## Database

11개 테이블: `users` · `workspaces` · `issues` · `members` · `tickets` · `checklist_items` · `labels` · `ticket_labels` · `notification_channels` · `notification_logs` · `comments`

상세 스키마: [docs/TABLE_DEFINITION.md](docs/TABLE_DEFINITION.md)

---

## Deploy (Vercel)

1. GitHub에 Push
2. [Vercel](https://vercel.com)에서 Import
3. Environment Variables 등록:

| 변수 | 설명 |
|------|------|
| `POSTGRES_URL` | Neon / Vercel Postgres 연결 문자열 |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32`로 생성 |
| `NEXTAUTH_URL` | 프로덕션 도메인 (예: `https://tika.example.com`) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |

4. Google Cloud Console에 프로덕션 redirect URI 추가:
   ```
   https://your-domain.com/api/auth/callback/google
   ```
5. Deploy + `npm run db:migrate` (프로덕션 DB 대상)

---

## Documentation

| 문서 | 설명 |
|------|------|
| [TABLE_DEFINITION.md](docs/TABLE_DEFINITION.md) | 테이블 정의서 |
| [IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) | 구현 현황 및 남은 업무 |
| [REQUIREMENTS.md](docs/REQUIREMENTS.md) | 상세 요구사항 명세 |
| [API_SPEC.md](docs/API_SPEC.md) | API 명세서 |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | 데이터 모델 |
| [COMPONENT_SPEC.md](docs/COMPONENT_SPEC.md) | 컴포넌트 명세 |
| [DESIGN_SYSTEM.md](docs/front/DESIGN_SYSTEM.md) | 디자인 시스템 |
| [PRD.md](docs/PRD.md) | 제품 요구사항 |
| [TRD.md](docs/TRD.md) | 기술 요구사항 |

---

## License

MIT
