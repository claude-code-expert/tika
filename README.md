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

| Category    | Technology                 | Version |
| ----------- | -------------------------- | ------- |
| Framework   | Next.js (App Router)       | 15      |
| Language    | TypeScript (strict)        | 5.7     |
| UI          | React + Tailwind CSS       | 19 / 4  |
| Drag & Drop | @dnd-kit                   | 6.x     |
| ORM         | Drizzle ORM                | 0.38    |
| Database    | PostgreSQL (Neon)          | 14+     |
| Auth        | NextAuth.js (Google OAuth) | 5.x     |
| Validation  | Zod                        | 3.24    |
| Deploy      | Vercel                     | —       |

---

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run db:migrate   # DB 마이그레이션 적용
npm run dev          # http://localhost:3000
```

> 셀프 호스팅 전체 설치 절차(DB, OAuth, Cron, Vercel 배포)는 **[docs/INSTALL.md](docs/INSTALL.md)** 를 참고하세요.

### 필수 환경변수 (`.env.local`)

```env
POSTGRES_URL=postgresql://...
NEXTAUTH_SECRET=          # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CRON_SECRET=              # openssl rand -base64 32  ← 크론 인증 토큰(알림용)
SLACK_WEBHOOK_URL=        # 문의 폼 → Slack 알림 (선택)
```

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. OAuth 2.0 Client ID 생성 (Web application)
3. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### 마감일 D-1 자동 알림 (GitHub Actions Cron)

매일 **KST 09:00** (UTC 00:00)에 내일 마감인 티켓 담당자에게 인앱 알림을 자동 발송합니다.
워크플로우 파일: `.github/workflows/daily-notify.yml`

#### 동작 방식

```
매일 KST 09:00
      ↓
GitHub Actions 실행
      ↓
curl GET https://[APP_URL]/api/cron/notify-due
     Authorization: Bearer [CRON_SECRET]
      ↓
내일 마감 티켓 담당자에게 인앱 알림 발송
```

`CRON_SECRET`은 외부에서 이 API를 무단 호출하지 못하도록 막는 인증 토큰입니다.
`.env.local`, Vercel 환경변수, GitHub Secret **세 곳의 값이 모두 동일**해야 합니다.

#### 1단계 — CRON_SECRET 생성

아직 값이 없다면 터미널에서 생성합니다:

```bash
openssl rand -base64 32
```

출력된 값을 복사해 `.env.local`과 Vercel 환경변수에 `CRON_SECRET`으로 등록합니다.

#### 2단계 — GitHub Repository Secrets 등록

1. `https://github.com/{owner}/{repo}/settings/secrets/actions` 접속
2. **"New repository secret"** 버튼 클릭 → 첫 번째 시크릿 입력:

   ```
   Name:   APP_URL
   Secret: https://your-domain.vercel.app
   ```

   → **Add secret** 클릭

3. 다시 **"New repository secret"** 버튼 클릭 → 두 번째 시크릿 입력:

   ```
   Name:   CRON_SECRET
   Secret: (1단계에서 생성한 값, .env.local의 CRON_SECRET과 동일)
   ```

   → **Add secret** 클릭

4. 목록에 `APP_URL`, `CRON_SECRET` 두 개가 표시되면 완료

> ⚠️ **Environment secrets가 아닌 Repository secrets**에 추가해야 합니다.
> Settings → Secrets and variables → Actions 페이지의 **"Repository secrets"** 섹션을 확인하세요.

#### 수동 테스트

GitHub → Actions 탭 → **Daily D-1 Notification** 선택 → **Run workflow** 버튼으로 즉시 실행 가능합니다.

---

## Scripts

| Command               | Description             |
| --------------------- | ----------------------- |
| `npm run dev`         | 개발 서버               |
| `npm run build`       | 프로덕션 빌드           |
| `npm run lint`        | ESLint                  |
| `npm run format`      | Prettier                |
| `npm run db:generate` | 마이그레이션 파일 생성  |
| `npm run db:migrate`  | 마이그레이션 적용       |
| `npm run db:studio`   | Drizzle Studio (DB GUI) |
| `npm run db:seed`     | 시드 데이터 삽입        |
| `npm run test`        | Jest 테스트             |

---

## Deploy (Vercel)

1. GitHub에 Push → Vercel Import
2. Environment Variables 등록 (위 `.env.local` 항목 동일)
3. Google Cloud Console에 프로덕션 redirect URI 추가:
   `https://your-domain.com/api/auth/callback/google`

---

## License

MIT
