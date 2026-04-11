---
plan: 01-01
phase: 01-secure-key-management
status: complete
wave: 1
completed_at: 2026-04-11
---

# Plan 01-01 Summary: Foundation Layer

## What Was Built

암호화 서비스, DB 스키마, 쿼리 레이어, Zod 검증을 포함한 Gemini API 키 관리의 보안 기반 레이어.

## Tasks Completed

| Task | Status | Commit |
|------|--------|--------|
| Task 1: Encryption service, DB schema, query layer | ✓ Complete | b1c62a6 |
| Task 2: Zod validation + @google/genai install | ✓ Complete | c8c6176 |
| Task 3: DB push (workspace_settings table) | ✓ Complete | (user action) |

## Key Files Created

- `src/lib/encryptionService.ts` — AES-256-GCM 암호화/복호화/마스킹 서비스
- `src/db/queries/workspaceSettings.ts` — DB 쿼리 레이어 (getGeminiKeyMeta, upsertGeminiKey, deleteGeminiKey, getDecryptedGeminiKey)
- `src/db/schema.ts` — `workspace_settings` 테이블 정의 추가

## Key Files Modified

- `src/lib/validations.ts` — `saveGeminiKeySchema` / `SaveGeminiKeyInput` 추가
- `.env.example` — `ENCRYPTION_KEY` 플레이스홀더 추가
- `package.json` — `@google/genai@^1.49.0` 추가

## Security Properties Verified

- IV는 `randomBytes(12)`로 `encryptApiKey()` 함수 내부에서 매 호출마다 생성 (IV 재사용 방지)
- `ENCRYPTION_KEY` 부재 또는 형식 오류 시 모듈 로드 시점에 즉시 throw (폴백 없음)
- `getGeminiKeyMeta()`는 `maskedKey`와 `updatedAt`만 반환 — ciphertext/iv/tag 절대 노출 없음
- `upsertGeminiKey()`는 `onConflictDoUpdate`로 workspaceId 기준 upsert 수행

## DB State

- `workspace_settings` 테이블이 DB에 생성됨 (`npx drizzle-kit push` 완료)
- 컬럼: id, workspace_id (UNIQUE + CASCADE), gemini_key_ciphertext, gemini_key_iv, gemini_key_tag, masked_key, updated_at

## What This Enables

Plan 01-02 (API Routes)가 이 레이어를 사용하여:
- `getGeminiKeyMeta()` → GET 핸들러에서 마스킹된 키 반환
- `upsertGeminiKey()` → POST 핸들러에서 암호화 후 저장
- `deleteGeminiKey()` → DELETE 핸들러에서 키 삭제
- `getDecryptedGeminiKey()` → Gemini probe 검증 (Phase 2에서도 사용)

## Self-Check: PASSED
