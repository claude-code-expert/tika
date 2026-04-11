# Tika — AI Ticket Automation

## What This Is

Tika는 티켓 기반 칸반 보드 할 일 관리 SaaS 앱이다. 현재 Google OAuth 인증, 멀티 테넌트 워크스페이스, RBAC, 드래그 앤 드롭 칸반 보드, 알림, 댓글, 검색, 파일 첨부를 갖춘 v0.2.0 상태다. 이번 작업은 **MD 체크리스트를 업로드하면 Gemini AI가 분석해서 Goal → Story → Feature → Task 계층 구조 티켓을 자동 생성**하는 AI 자동화 기능을 추가한다.

## Core Value

사용자가 마크다운 체크리스트 하나만 올리면 업무 계획이 칸반 티켓으로 자동 분해된다.

## Requirements

### Validated

<!-- 기존 codebase에서 이미 구현되어 작동 중인 기능 -->

- ✓ 티켓 CRUD (생성, 조회, 수정, 삭제) — v0.1
- ✓ 칸반 보드 4개 고정 컬럼 (Backlog, TODO, In Progress, Done) — v0.1
- ✓ 드래그 앤 드롭 컬럼 이동 및 순서 변경 — v0.1
- ✓ 우선순위 (LOW / MEDIUM / HIGH / CRITICAL) 및 마감일 관리 — v0.1
- ✓ 마감일 초과 시각적 경고 — v0.1
- ✓ 완료 시간 자동 기록 — v0.1
- ✓ Goal → Story → Feature → Task 계층 구조 — v0.1
- ✓ Google OAuth 인증 (NextAuth v5) — v0.2
- ✓ 멀티 테넌트 워크스페이스 + RBAC (OWNER / MEMBER / VIEWER) — v0.2
- ✓ 인앱 알림 시스템 — v0.2
- ✓ 티켓 댓글 — v0.2
- ✓ 티켓 검색 — v0.2
- ✓ 파일 첨부 (Vercel Blob) — v0.2
- ✓ 이메일 초대 (Resend) — v0.2

### Active

<!-- 이번 마일스톤에서 구현할 기능 -->

- [ ] MD 체크리스트 파일 업로드 UI (메뉴 진입점 포함)
- [ ] Gemini API를 통한 체크리스트 분석 및 티켓 계층 구조 추출
- [ ] 분석 결과로부터 Goal / Story / Feature / Task 티켓 자동 생성 (Backlog 추가)
- [ ] 긴 문서 업로드 시 토큰 소모 경고 표시
- [ ] 시스템 전역 Gemini API 키 설정 화면 (OWNER 전용)
- [ ] API 키 AES-256-GCM 암호화 저장 + 사용 시점에만 복호화
- [ ] 키 마스킹 표시 (앞 5자 + `*` × 나머지 길이 + 뒤 5자)
- [ ] API 키 수정 / 삭제 기능 (OWNER 전용)
- [ ] MEMBER / VIEWER에게 AI 메뉴 완전 비노출

### Out of Scope

- Feature 2 Webhook + MCP 연동 — 이 마일스톤에서는 다루지 않음; 내부 문서에 별도 정리
- 사용자별(per-user) API 키 — 시스템 전역으로 결정됨
- 실시간 WebSocket 업데이트 — 현재 아키텍처가 폴링 기반
- Gemini 이외의 LLM 지원 — 1차 범위 외

## Context

**현재 코드베이스 상태:**
- Next.js 15 + App Router, TypeScript 5.7, Drizzle ORM, Vercel Postgres (Neon)
- 인증: NextAuth v5 + Google OAuth
- 역할: OWNER (워크스페이스 생성자) / MEMBER / VIEWER — `src/lib/permissions.ts`
- API 패턴: Zod 검증 → `src/db/queries/` 쿼리 → `src/server/services/` 서비스
- 파일 스토리지: Vercel Blob (첨부파일 선례 있음)
- 환경변수: Vercel 환경에서 관리

**AI 티켓 생성 흐름:**
1. OWNER가 설정 화면에서 Gemini API 키 등록 → AES-256-GCM으로 암호화 후 DB 저장
2. 사용자가 MD 파일 업로드 (길이 경고 포함)
3. 서버에서 API 키 복호화 → Gemini API 호출
4. 응답 파싱 → 계층 구조 티켓 생성 → Backlog 자동 추가

**마크다운 계층 파싱 규칙:**
- 큰 주제 섹션 → Goal
- 중간 묶음 (subsection / 그룹) → Story 또는 Feature
- 개별 체크 항목 (`- [ ]`) → Task
- 계층이 모두 있을 필요 없음 (Goal → Task 직결 가능)

## Constraints

- **Security**: API 키는 반드시 서버 환경변수(`ENCRYPTION_KEY`)로 암호화; 클라이언트에 노출 금지
- **Permissions**: OWNER만 API 키 설정 화면 접근; MEMBER/VIEWER에게 메뉴 비노출
- **Tech Stack**: Gemini API만 지원 (첫 릴리즈); 기존 Next.js/Drizzle 패턴 준수
- **DB Safety**: `db:generate` / `db:migrate` 는 사용자 명시 승인 후 실행
- **Existing Conventions**: Zod 검증, `src/db/queries/` 분리, API route 에러 형식 유지

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 시스템 전역 API 키 | 멀티 테넌트이지만 관리자가 1명인 운영 구조에 적합 | — Pending |
| AES-256-GCM 암호화 | Node.js 내장 `crypto` 모듈로 외부 의존성 없이 구현 가능; GCM은 인증된 암호화 | — Pending |
| Gemini API 직접 호출 (서버) | API 키 노출 방지; 클라이언트 측 호출 금지 | — Pending |
| OWNER = 워크스페이스 생성자 | 기존 RBAC 역할 체계(`OWNER`) 그대로 활용 | — Pending |
| 계층 유연성 | Goal → Task 직결 허용; AI 응답에 따라 중간 계층 없을 수 있음 | — Pending |

## Evolution

이 문서는 페이즈 전환 및 마일스톤 경계에서 업데이트한다.

**각 페이즈 완료 후:**
1. 무효화된 요구사항 → Out of Scope로 이동 (사유 포함)
2. 검증된 요구사항 → Validated로 이동 (페이즈 참조)
3. 새로 도출된 요구사항 → Active에 추가
4. 결정된 사항 → Key Decisions에 추가
5. "What This Is" 여전히 정확한가? → 드리프트 시 업데이트

---
*Last updated: 2026-04-11 after initialization*
