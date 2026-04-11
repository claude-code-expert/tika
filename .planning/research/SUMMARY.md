# Research Summary — AI Ticket Automation

**Synthesized from:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md  
**Date:** 2026-04-11  
**Milestone:** Tika v0.3 — AI Ticket Automation

---

## 1. Stack Decisions

### 사용할 것

| 패키지 | 버전 | 목적 |
|--------|------|------|
| `@google/genai` | `^1.48.0` | Gemini API 공식 GA SDK (`@google/generative-ai` 2025-11-30 deprecated) |
| `remark` | `^15.0.0` | 마크다운 → AST 파싱 (헤딩 depth로 계층 추출) |
| `remark-gfm` | `^4.0.1` | GFM 지원 — `- [ ]` listItem.checked 파싱에 필수 |
| Node.js `crypto` | built-in | AES-256-GCM 암호화 — 외부 의존성 없음 |

**모델:** `gemini-2.5-flash` — 구조화 추출에 최적 가격/성능; 2M 토큰 컨텍스트 윈도우.

**추가 환경변수:**

| 변수 | 필수 | 비고 |
|------|------|------|
| `ENCRYPTION_KEY` | Yes | 64자 hex (32 bytes). 서버 시작 시 검증 — fallback 절대 금지 |

### 사용하지 말 것

| 거부 대상 | 이유 |
|-----------|------|
| `@google/generative-ai` | 2025-11-30 deprecated |
| Vercel AI SDK (`@ai-sdk/google`) | Gemini JSON mode/structured output 제어 저하 |
| `crypto-js`, `node-forge` | 서버에서 native crypto 대비 이점 없음 |
| `marked`, `markdown-it` | HTML 출력만 — AST 순회 불가 |
| Drizzle `bytea` 컬럼 | ORM 워크어라운드 필요 (issue #3902); hex `text` 사용 |

---

## 2. Table Stakes Features

1. OWNER 전용 API 키 설정 화면 — MEMBER/VIEWER에게 메뉴 항목 hidden (disable 아님)
2. AES-256-GCM 암호화 저장 + 사용 시점에만 복호화, 클라이언트 미반환
3. 키 마스킹 표시 — 앞 5자 + `***` + 뒤 5자, `masked_key` 별도 컬럼 저장
4. 저장 직후 1회 복사 버튼 — 이후 영구 마스킹
5. 저장 시 Gemini probe로 키 유효성 검사 + 인라인 오류
6. 4단계 업로드 플로우 — IDLE → PROCESSING → PREVIEW → SUCCESS/ERROR
7. 커밋 전 프리뷰 패널 — 체크박스 (기본 전체 선택) + "Create N tickets" CTA
8. 확인 다이얼로그 — "Create 12 tickets in Backlog?" 카운트 포함
9. 단일 트랜잭션 bulk DB 삽입 — 전체 성공 또는 전체 롤백
10. 성공 토스트 + 보드 이동
11. 토큰/파일 크기 가드 — 서버 100 KB hard limit, 클라이언트 50K chars 경고
12. 인라인 오류 + 재시도 — Gemini 오류 코드 표면화

---

## 3. Differentiators (scope 여유 시)

| 기능 | 복잡도 |
|------|--------|
| 프리뷰에서 인라인 제목 편집 | High |
| 실시간 토큰 예상치 카운터 | Medium |
| 마크다운 형식 힌트 툴팁 | Low |

**명시적 defer:** SSE 스트리밍, 멀티 LLM, 프리뷰 내 티켓 타입 편집, rollback/undo

---

## 4. Architecture Sequence (빌드 순서)

```
1. DB Schema       → workspace_settings 테이블 (4컬럼: ciphertext, iv, tag, masked_key)
2. Encryption Svc  → src/server/services/encryptionService.ts
3. DB Queries      → src/db/queries/workspaceSettings.ts
4. Key Mgmt API    → app/api/settings/gemini-key/route.ts (GET/POST/DELETE, OWNER only)
5. Key Mgmt UI     → GeminiKeyForm.tsx + settings/ai/page.tsx
6. Gemini Service  → src/server/services/geminiService.ts (analyzeChecklist)
7. Bulk Create     → ticketService.ts bulkCreateFromHierarchy (position 선계산)
8. Analysis API    → app/api/ai/analyze-checklist/route.ts (100KB limit, maxDuration=300)
9. Import UI       → AIImportForm.tsx + ai-import/page.tsx (4단계 상태 기계)
10. Navigation     → 사이드바 AI 메뉴 (OWNER/MEMBER only)
```

---

## 5. Critical Pitfalls

**P1 — IV 재사용 (SECURITY / Phase 1)**  
`crypto.randomBytes(12)`는 `encryptApiKey()` 내부에서 매 호출마다 새로 생성.  
재사용 시 GCM 완전 무력화 — XOR으로 plaintext 복원 가능.

**P2 — ENCRYPTION_KEY fallback (SECURITY / Phase 1)**  
키 부재 시 fallback 없이 즉시 throw. 모듈 로드 시점에 검증.  
Vercel 대시보드 미설정 = 서버 시작 crash (올바른 동작).

**P3 — Vercel Timeout (RELIABILITY / Phase 2)**  
Gemini 2.5 Flash = 30-120초 가능. Hobby = 60초 제한.  
`export const maxDuration = 300` (Pro 필요) + `AbortSignal.timeout(240_000)` + 100KB input limit.

**P4 — RBAC 미적용 API (SECURITY / Phase 1+2)**  
GET 응답에서 ciphertext/iv/tag 절대 미반환. 모든 key API에 `requireRole(OWNER)`.  
분석 API에 `requireRole(MEMBER)`.

**P5 — Bulk Insert Position 충돌 (DATA / Phase 2)**  
트랜잭션 루프 안에서 `calculatePosition()` 반복 호출 금지.  
트랜잭션 시작 전 `basePosition` 1회 조회 → `basePosition - (1024 * i)`.

**Bonus — Non-ASCII 파일명 FormData 오류 (UX / Phase 2)**  
한글 파일명 업로드 시 Next.js 15 파싱 오류. 클라이언트에서 `new File([blob], 'analysis.md')` 교체.

---

## 6. Open Questions (실행 전 결정 필요)

| 질문 | 권고 |
|------|------|
| DB 컬럼: 3개 분리 vs packed hex? | **4컬럼 채택** (ciphertext, iv, tag, masked_key) |
| Vercel 플랜 티어? | Pro 확인 필요 — Hobby라면 timeout 전략 변경 |
| 분석 엔드포인트 토큰 hard limit | **100 KB** 채택 (≈25K 토큰) |
| 프리뷰 UI: 별도 페이지 vs 모달? | **별도 `/ai-import` 페이지** 권고 |

---

*Synthesized: 2026-04-11*
