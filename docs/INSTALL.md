# Tika 셀프 호스팅 설치 가이드

> Vercel + Neon(PostgreSQL) + GitHub 환경 기준으로 작성되었습니다.

---

## 1. 사전 준비

| 항목 | 설명 |
|------|------|
| GitHub 계정 | 코드 호스팅 및 GitHub Actions Cron 실행 |
| Vercel 계정 | 앱 배포 ([vercel.com](https://vercel.com)) |
| Neon 계정 | PostgreSQL 서버리스 DB ([neon.tech](https://neon.tech)) |
| Google Cloud 계정 | OAuth 2.0 인증 |

---

## 2. 데이터베이스 설정 (Neon)

1. [console.neon.tech](https://console.neon.tech) → 새 프로젝트 생성
2. **Connection string** 복사 → `POSTGRES_URL` 환경변수에 사용
3. DB 마이그레이션:

```bash
npm install
cp .env.example .env.local
# .env.local에 POSTGRES_URL 입력 후:
npm run db:migrate
```

---

## 3. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. **OAuth 2.0 클라이언트 ID** 생성 (Web application)
3. **Authorized redirect URIs** 추가:
   - 로컬: `http://localhost:3000/api/auth/callback/google`
   - 프로덕션: `https://your-domain.com/api/auth/callback/google`
4. Client ID / Client Secret 복사

---

## 4. 환경변수 설정

### 로컬 개발 (`.env.local`)

```env
POSTGRES_URL=postgresql://user:password@host/dbname?sslmode=require

NEXTAUTH_SECRET=                  # openssl rand -base64 32 으로 생성
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

CRON_SECRET=                      # openssl rand -base64 32 으로 생성 (크론 인증 토큰)

SLACK_WEBHOOK_URL=                # 문의 폼 → Slack 알림 (선택)
```

### Vercel 환경변수

Vercel 대시보드 → 프로젝트 → **Settings > Environment Variables**에 위 항목을 모두 등록합니다.
`NEXTAUTH_URL`은 프로덕션 도메인으로 변경합니다 (예: `https://your-domain.vercel.app`).

---

## 5. Vercel 배포

```bash
# Vercel CLI 사용 시
npm i -g vercel
vercel --prod
```

또는 GitHub 저장소를 Vercel에 Import하면 Push마다 자동 배포됩니다.

---

## 6. GitHub Actions Cron — 마감일 D-1 알림

매일 **KST 09:00 (UTC 00:00)** 에 자동으로 D-1 알림을 발송하는 GitHub Actions 워크플로우가 포함되어 있습니다.

### 파일 위치

```
.github/workflows/daily-notify.yml
```

### 동작

| 단계 | 내용 |
|------|------|
| 크론 스케줄 | `0 0 * * *` (매일 UTC 00:00 = KST 09:00) |
| D-1 알림 | `GET /api/cron/notify-due` 호출 → 내일 마감 티켓 담당자에게 인앱 + Slack/Telegram 알림 발송 |
| 알림 정리 | `GET /api/cron/cleanup-notifications` 호출 → 7일 지난 알림 로그 삭제 |

### GitHub Repository Secrets 등록

저장소 → **Settings > Secrets and variables > Actions > New repository secret**

| Secret 이름 | 값 |
|------------|-----|
| `APP_URL` | 배포된 앱 URL (예: `https://your-domain.vercel.app`) |
| `CRON_SECRET` | `.env.local`의 `CRON_SECRET`과 **동일한 값** |

> `CRON_SECRET`은 로컬/Vercel/GitHub Secrets 세 곳 모두 동일한 값이어야 합니다.

### 수동 트리거 (테스트)

GitHub → Actions 탭 → **Daily D-1 Notification** → **Run workflow** 버튼으로 즉시 실행 가능합니다.

### API 직접 호출 (curl)

```bash
curl -X GET "https://your-domain.com/api/cron/notify-due" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

응답 예시:
```json
{ "processed": 3, "sent": 3, "failed": 0 }
```

---

## 7. 알림 채널 연동 (선택)

설정 완료 후 워크스페이스 설정 → **알림** 탭에서 Slack / Telegram 채널을 추가할 수 있습니다.

| 채널 | 필요 정보 |
|------|----------|
| Slack | Incoming Webhook URL |
| Telegram | Bot Token + Chat ID |

---

## 8. 로컬 개발 시작

```bash
npm install
cp .env.example .env.local   # 환경변수 설정
npm run db:migrate            # DB 마이그레이션
npm run db:seed               # (선택) 샘플 데이터
npm run dev                   # http://localhost:3000
```
