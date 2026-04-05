# Tika — Claude Code 프로젝트 가이드

> 버전: 0.3.0 | 최종 수정: 2026-03-28

---

## ⚙️ 운영 규칙 (Meta Rules)

**반복 문제 재발 시**: 단순 재시도 금지. 관련 소스 코드를 반드시 직접 읽고 근본 원인을 파악한 뒤 응답한다.

**세션 재시작 후**: `/compact` 완료 및 새 세션 시작 시 반드시 이 파일을 먼저 다시 읽어 프로젝트 컨텍스트를 복원한다.

@.claude/rules/safety.md

---

## 1. 프로젝트 개요

Tika는 티켓 기반 칸반 보드 할 일 관리 애플리케이션이다. 개인 사용자가 할 일을 티켓으로 생성하고, 4단계 워크플로우(Backlog → TODO → In Progress → Done)의 칸반 보드에서 드래그 앤 드롭으로 관리한다.

Phase 1의 핵심: 업무 크기에 따라 **Goal → Story → Feature → Task** 계층으로 분해하고, Goal을 이루기 위한 최소 단위 action item을 계획·실행하는 것에 집중한다.

**주요 기능:**

- 티켓 CRUD (생성, 조회, 수정, 삭제)
- 칸반 보드 4개 고정 칼럼 (Backlog, TODO, In Progress, Done)
- 드래그 앤 드롭 칼럼 간 이동 및 순서 변경
- 우선순위(LOW / MEDIUM / HIGH / CRITICAL) 및 마감일 관리
- 마감일 초과 시각적 경고 표시
- 완료 시간 자동 기록

**현재 버전:** 0.2.0 (SaaS — Google OAuth 인증, 알림, 댓글, 검색 완료)

---

## 2. 기술 스택

@docs/STACK.md 참고

### 배포

- **플랫폼:** Vercel
- **환경변수:**
  - `POSTGRES_URL` — Vercel Postgres 연결 문자열
  - `NEXTAUTH_SECRET` — NextAuth 비밀 키
  - `NEXTAUTH_URL` — NextAuth 콜백 URL (예: `https://tika-app.vercel.app`)
  - `GOOGLE_CLIENT_ID` — Google OAuth 클라이언트 ID
  - `GOOGLE_CLIENT_SECRET` — Google OAuth 클라이언트 시크릿

---

## 3. 핵심 명령어

### 개발 서버

```bash
npm run dev        # http://localhost:3000
```

### 빌드 및 프로덕션

```bash
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버 실행
```

### 테스트

```bash
npm run test             # Jest 1회 실행
npm run test:watch       # 감시 모드
npm run test:coverage    # 커버리지 리포트
```

### 린트 및 포맷팅

```bash
npm run lint       # ESLint 검사
npm run format     # Prettier 포맷팅
```

### 데이터베이스

```bash
npm run db:generate    # 마이그레이션 파일 생성 (스키마 변경 후)
npm run db:migrate     # 마이그레이션 적용
npm run db:push        # 스키마 직접 Push (마이그레이션 없이)
npm run db:studio      # Drizzle Studio (DB GUI)
npm run db:seed        # 시드 데이터 삽입
```

> ⚠️ `db:generate`, `db:migrate`, `db:push`는 **사용자 명시적 요청 없이 절대 실행 금지**
> → 상세 규칙: [SAFETY_RULES.md](.claude/SAFETY_RULES.md)

### 초기 세팅 순서

```bash
npm install
cp .env.example .env.local
# .env.local에 환경변수 5개 설정 (위 목록 참고)
npm run db:generate
npm run db:migrate
npm run db:seed        # (선택)
npm run dev
```

---

## 4. 디렉토리 구조 & Path Alias

> 전체 디렉토리 구조: [TRD.md](docs/TRD.md) 참조

**Path Alias:**

```typescript
@/*     → ./src/*    // 예: @/components/board/Board
```

**코드 배치 핵심 원칙:**

- 라우팅/API → `app/`
- 비즈니스 로직 → `src/`
- 공유 타입 → `src/types/index.ts` (중앙 관리)
- DB 관련 → `src/db/` (스키마, 쿼리, 시드)

---

## 5. 데이터베이스 스키마

> 전체 스키마 및 ERD: [DATA_MODEL.md](docs/DATA_MODEL.md) 참조

---

## 6. API 엔드포인트

> 상세 요청/응답 사양: [API_SPEC.md](docs/API_SPEC.md) 참조

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

---

## 7. 문서 참조 표

> → 문서 목록: [DOC_REFERENCE.md](.claude/DOC_REFERENCE.md)

---

## 8. Language & Response Policy

### 언어 사용 기준

| 대상                                  | 언어                                                            |
| ------------------------------------- | --------------------------------------------------------------- |
| 내부 추론 및 계획                     | English                                                         |
| 코드, 변수명, 주석, 로그, 에러 메시지 | English                                                         |
| Git 커밋 메시지                       | English (Conventional Commits: `feat:`, `fix:`, `refactor:` 등) |
| 사용자 응답 (설명, 요약, 질문)        | 한국어                                                          |
| 에러 보고 시                          | 한국어 설명 + 원문 에러 메시지는 English 유지                   |

### 작업 완료 후 응답 형식

작업을 완료한 뒤 반드시 한국어로 다음 항목을 요약한다:

1. **무엇을 변경했는지**
2. **왜 그렇게 했는지**
3. **주의할 점이 있는지**
