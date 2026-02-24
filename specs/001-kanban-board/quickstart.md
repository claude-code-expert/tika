# Quickstart: Tika Phase 1 개발 환경 세팅

**Branch**: `001-kanban-board` | **Date**: 2026-02-23

---

## 사전 요건

- Node.js 22+, npm
- Vercel 계정 (Postgres 데이터베이스)
- Google Cloud Console 프로젝트 (OAuth 앱)

---

## 초기 세팅 순서

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정 (.env.local 직접 생성 — 에이전트 수정 금지)
cp .env.example .env.local
# 아래 값을 직접 입력:
# POSTGRES_URL=...           (Vercel Postgres 연결 문자열)
# NEXTAUTH_SECRET=...        (openssl rand -base64 32 로 생성)
# NEXTAUTH_URL=http://localhost:3000
# GOOGLE_CLIENT_ID=...       (Google Cloud Console)
# GOOGLE_CLIENT_SECRET=...   (Google Cloud Console)

# 3. DB 마이그레이션 (스키마 변경 후 반드시 실행)
npm run db:generate   # 마이그레이션 파일 생성
npm run db:migrate    # Vercel Postgres에 적용

# 4. (선택) 기본 라벨 시드
npm run db:seed

# 5. 개발 서버 시작
npm run dev           # http://localhost:3000
```

---

## Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. OAuth 2.0 Client ID 생성 (Web application)
3. Authorized redirect URIs에 추가:
   - `http://localhost:3000/api/auth/callback/google` (개발)
   - `https://your-app.vercel.app/api/auth/callback/google` (프로덕션)

---

## 개발 중 주요 명령어

```bash
npm run dev           # 개발 서버
npm run build         # 프로덕션 빌드 (타입 에러 체크)
npm run test          # Jest 테스트
npm run lint          # ESLint 검사
npm run format        # Prettier 포맷팅
npm run db:studio     # Drizzle Studio (DB GUI)
```

---

## 아키텍처 핵심 패턴

### 1. API Route 세션 검증 (모든 route에 필수)

```typescript
// app/api/tickets/route.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
      { status: 401 }
    );
  }
  // ... 워크스페이스 조회 후 로직
}
```

### 2. 낙관적 업데이트 패턴 (useTickets 훅)

```typescript
// 드래그앤드롭 낙관적 업데이트
const handleDragEnd = async (event: DragEndEvent) => {
  const prevBoard = board; // 롤백용 스냅샷
  setBoard(optimisticallyUpdatedBoard); // 즉시 UI 반영
  try {
    await reorderTicket({ ticketId, status, position });
  } catch {
    setBoard(prevBoard); // 실패 시 롤백
  }
};
```

### 3. Drizzle 워크스페이스 스코핑

```typescript
// src/db/queries/tickets.ts
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { tickets } from '@/db/schema';

export async function getTicketsByWorkspace(workspaceId: number) {
  return db.select().from(tickets)
    .where(eq(tickets.workspaceId, workspaceId))
    .orderBy(tickets.status, tickets.position);
}
```

---

## 구현 순서 (Milestones)

| 단계 | 내용 | 핵심 파일 |
|------|------|-----------|
| A | 인증 + 워크스페이스 + DB 스키마 | `src/lib/auth.ts`, `src/db/schema.ts` |
| B | 티켓 CRUD + 보드 뷰 | `app/api/tickets/`, `src/components/board/` |
| C | 드래그앤드롭 + 오버듀 | `src/components/board/BoardContainer.tsx`, `src/hooks/useTickets.ts` |
| D | 체크리스트 | `app/api/tickets/[id]/checklist/`, `src/components/ticket/ChecklistSection.tsx` |
| E | 라벨 | `app/api/labels/`, `src/components/label/` |
| F | 이슈 계층 + 담당자 | `app/api/issues/`, `app/api/members/` |
| G | 반응형 + 접근성 + Empty State | 전체 컴포넌트 |
