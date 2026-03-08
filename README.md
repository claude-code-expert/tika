# Tika

Goal > Story > Feature > Task 계층으로 업무를 분해하고, 칸반 보드에서 드래그 앤 드롭으로 관리하는 티켓 기반 협업 도구.

---

## Features

- **칸반 보드** — Backlog 사이드바 + TODO / In Progress / Done 3칼럼, 드래그 앤 드롭
- **티켓 관리** — CRUD, 4가지 타입(Goal/Story/Feature/Task), 우선순위, 시작·마감일, 체크리스트, 라벨, 댓글, 담당자 배정
- **이슈 계층** — Goal → Story → Feature → Task 상하위 연결
- **팀 협업** — 워크스페이스 초대 링크(24h 만료), 역할 관리(OWNER/MEMBER/VIEWER), WBS/간트 차트, 팀 대시보드(번다운·워크로드·통계)
- **알림** — Slack / Telegram 채널 연동, 마감일 D-1 자동 알림, 헤더 벨 드롭다운
- **검색 & 필터** — 실시간 검색, 필터 칩, 라벨·우선순위·날짜 범위 고급 필터
- **인증** — Google OAuth (NextAuth.js v5), 온보딩 워크스페이스 선택

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
| Deploy | Vercel | — |

---

## Getting Started

```bash
npm install
cp .env.example .env.local
```

`.env.local` 편집:

```env
POSTGRES_URL=postgresql://...
NEXTAUTH_SECRET=          # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SLACK_WEBHOOK_URL=        # 문의 폼 → Slack 알림 (선택)
```

```bash
npm run db:migrate   # DB 마이그레이션 적용
npm run dev          # http://localhost:3000
```

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. OAuth 2.0 Client ID 생성 (Web application)
3. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run db:generate` | 마이그레이션 파일 생성 |
| `npm run db:migrate` | 마이그레이션 적용 |
| `npm run db:studio` | Drizzle Studio (DB GUI) |
| `npm run db:seed` | 시드 데이터 삽입 |
| `npm run test` | Jest 테스트 |

---

## Deploy (Vercel)

1. GitHub에 Push → Vercel Import
2. Environment Variables 등록 (위 `.env.local` 항목 동일)
3. Google Cloud Console에 프로덕션 redirect URI 추가:
   `https://your-domain.com/api/auth/callback/google`

---

## License

MIT
