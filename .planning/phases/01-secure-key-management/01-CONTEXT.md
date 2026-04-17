# Phase 1: Secure Key Management - Context

**Gathered:** 2026-04-11  
**Status:** Ready for planning

<domain>
## Phase Boundary

OWNER가 워크스페이스별 Gemini API 키를 등록·수정·삭제할 수 있는 설정 화면을 구축하고, 키를 AES-256-GCM으로 암호화하여 DB에 안전하게 저장한다. MEMBER/VIEWER에게는 이 기능이 완전히 숨겨진다. 키는 사용 시점에만 복호화되며 API 응답에 절대 노출되지 않는다.

이 페이즈는 AI 분석 기능의 보안 기반이다. Phase 2 (AI Import Pipeline)가 이 페이즈에 의존한다.

</domain>

<decisions>
## Implementation Decisions

### API 키 스코프
- **D-01:** 워크스페이스별 키 — 각 워크스페이스 OWNER가 자기 공간용 Gemini 키를 설정한다. 플랫폼 전역 단일 키 아님.
- **D-02:** DB 테이블: `workspace_settings` (workspaceId FK → workspaces.id, cascade delete). 컬럼 4개 분리: `gemini_key_ciphertext`, `gemini_key_iv`, `gemini_key_tag`, `masked_key`.

### Settings 위치
- **D-03:** 기존 `/settings` 페이지 내 `SettingsShell`에 새 섹션 추가. `SectionKey: 'ai-key'` 추가. URL: `/settings?section=ai-key`.
- **D-04:** OWNER에게만 해당 탭이 visible. `VIEWER_ALLOWED_SECTIONS`에서 제외. MEMBER도 제외 (OWNER 전용).

### Probe 실패 처리
- **D-05:** 저장 블락 — 유효성 검증(Gemini probe) 통과한 키만 DB에 저장. probe 실패 시 인라인 에러 메시지 표시, 저장 자체가 이루어지지 않음.
- **D-06:** Gemini probe는 최소한의 요청 (예: `models.list()` 또는 빈 content generate). 저장 성공 시에만 DB upsert 실행.

### 저장 후 1회 복사 UX
- **D-07:** 키 저장 성공 직후 토스트에 "복사" 버튼 포함. 토스트가 닫히면 다시 복사 불가. 이후 화면에는 마스킹만 표시.
- **D-08:** 마스킹 형식: 앞 5자 + `*` × (전체 길이 - 10) + 뒤 5자. 원본 길이와 동일.

### 암호화 구현 (프로젝트 결정 사항 확인)
- **D-09:** AES-256-GCM, Node.js 내장 `crypto` 모듈 전용. 외부 라이브러리 없음.
- **D-10:** `ENCRYPTION_KEY` 환경변수 (64자 hex = 32 bytes). 서버 시작 시 검증 — 부재 또는 잘못된 길이면 즉시 throw. fallback 없음.
- **D-11:** IV는 `crypto.randomBytes(12)` — `encryptApiKey()` 함수 내부에서 매 호출마다 새로 생성. 재사용 절대 금지.

### Claude's Discretion
- Gemini probe 구체적인 API 호출 방식 (어떤 endpoint를 최소 비용으로 호출할지)
- 토스트 디자인 세부 사항 (색상, 아이콘 등 기존 스타일 따름)
- DB 쿼리 파일 위치 (`src/db/queries/workspaceSettings.ts` — 기존 패턴 따름)

</decisions>

<specifics>
## Specific Ideas

- 토스트에 복사 버튼: "저장됨 — 지금 복사하세요. 이 창을 닫으면 전체 키를 다시 볼 수 없습니다."
- 마스킹 예시: `AIzaS***...***xYZ12` (키가 39자면 앞 5자 + `*` × 29 + 뒤 5자)
- API 응답 GET `/api/settings/gemini-key`: `{ maskedKey: "AIzaS***xYZ12", updatedAt: "..." }` — ciphertext/iv/tag 절대 미반환

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 프로젝트 컨텍스트
- `.planning/PROJECT.md` — 전체 프로젝트 목표, 제약사항, Key Decisions
- `.planning/REQUIREMENTS.md` — KEY-01~07, NAV-02 요구사항 정의
- `.planning/research/SUMMARY.md` — 기술 스택 결정사항, Critical Pitfalls (P1~P5)

### 기존 코드베이스 패턴
- `src/components/settings/SettingsShell.tsx` — 섹션 기반 설정 패턴, VIEWER_ALLOWED_SECTIONS
- `src/lib/permissions.ts` — RBAC requireRole 패턴
- `src/db/schema.ts` — Drizzle ORM 테이블 정의 패턴
- `src/db/queries/` — DB 쿼리 레이어 패턴
- `app/api/tickets/route.ts` — API Route Handler 패턴 (Zod 검증, 에러 응답 형식)
- `.claude/rules/api-rules.md` — API 작성 규칙
- `.claude/rules/component-rules.md` — 컴포넌트 작성 규칙
- `.claude/CLAUDE.md` — 프로젝트 안전 규칙 (db:generate/migrate 사용자 승인 필수)

### 보안 참고사항
- `.planning/research/PITFALLS.md` — P1(IV 재사용), P2(ENCRYPTION_KEY fallback), P4(RBAC 미적용) 필독

</canonical_refs>

<deferred>
## Deferred Ideas

- MEMBER도 읽기 전용으로 마스킹 키 확인 가능 — 현재 OWNER 전용으로 결정됨
- API 키 로테이션 이력 추적 — 현재 미정, 출시 후 고려
- 키 사용 통계 (API 호출 횟수 등) — Phase 2 이후

</deferred>

---
*Phase: 01-secure-key-management*  
*Context gathered: 2026-04-11 via discuss-phase*
