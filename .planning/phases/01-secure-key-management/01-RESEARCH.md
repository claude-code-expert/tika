# Phase 1: Secure Key Management - Research

**Researched:** 2026-04-11
**Domain:** AES-256-GCM 암호화, Drizzle ORM upsert, Next.js RBAC, Gemini API probe, SettingsShell 확장
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 워크스페이스별 키 — workspace_settings 테이블 (workspaceId FK → workspaces.id, cascade delete). 컬럼 4개 분리: `gemini_key_ciphertext`, `gemini_key_iv`, `gemini_key_tag`, `masked_key`.
- **D-02:** DB 테이블: `workspace_settings`. 컬럼: `gemini_key_ciphertext`, `gemini_key_iv`, `gemini_key_tag`, `masked_key`.
- **D-03:** 기존 `/settings` 페이지 내 `SettingsShell`에 새 섹션 추가. `SectionKey: 'ai-key'` 추가. URL: `/settings?section=ai-key`.
- **D-04:** OWNER에게만 해당 탭이 visible. `VIEWER_ALLOWED_SECTIONS`에서 제외. MEMBER도 제외 (OWNER 전용).
- **D-05:** 저장 블락 — 유효성 검증(Gemini probe) 통과한 키만 DB에 저장. probe 실패 시 인라인 에러 메시지 표시, 저장 자체가 이루어지지 않음.
- **D-06:** Gemini probe는 최소한의 요청 (예: `models.list()` 또는 빈 content generate). 저장 성공 시에만 DB upsert 실행.
- **D-07:** 키 저장 성공 직후 토스트에 "복사" 버튼 포함. 토스트가 닫히면 다시 복사 불가. 이후 화면에는 마스킹만 표시.
- **D-08:** 마스킹 형식: 앞 5자 + `*` × (전체 길이 - 10) + 뒤 5자. 원본 길이와 동일.
- **D-09:** AES-256-GCM, Node.js 내장 `crypto` 모듈 전용. 외부 라이브러리 없음.
- **D-10:** `ENCRYPTION_KEY` 환경변수 (64자 hex = 32 bytes). 서버 시작 시 검증 — 부재 또는 잘못된 길이면 즉시 throw. fallback 없음.
- **D-11:** IV는 `crypto.randomBytes(12)` — `encryptApiKey()` 함수 내부에서 매 호출마다 새로 생성. 재사용 절대 금지.

### Claude's Discretion

- Gemini probe 구체적인 API 호출 방식 (어떤 endpoint를 최소 비용으로 호출할지)
- 토스트 디자인 세부 사항 (색상, 아이콘 등 기존 스타일 따름)
- DB 쿼리 파일 위치 (`src/db/queries/workspaceSettings.ts` — 기존 패턴 따름)

### Deferred Ideas (OUT OF SCOPE)

- MEMBER도 읽기 전용으로 마스킹 키 확인 가능 — 현재 OWNER 전용으로 결정됨
- API 키 로테이션 이력 추적 — 현재 미정, 출시 후 고려
- 키 사용 통계 (API 호출 횟수 등) — Phase 2 이후
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| KEY-01 | OWNER는 시스템 전역 Gemini API 키를 설정 화면에서 등록할 수 있다 | POST `/api/settings/gemini-key` + GeminiKeySection 폼 |
| KEY-02 | 등록된 API 키는 AES-256-GCM으로 암호화되어 DB에 저장된다 (plaintext 저장 금지) | `encryptionService.ts` — Node.js native crypto 패턴 검증 완료 |
| KEY-03 | OWNER는 저장된 키를 "앞 5자 + `*` × 나머지 길이 + 뒤 5자" 형태로 확인할 수 있다 | `masked_key` 컬럼 저장 시점 계산 + GET 응답에 `maskedKey`만 반환 |
| KEY-04 | OWNER는 저장된 키를 수정(교체)할 수 있다 | POST upsert + REPLACE_MODE 상태 기계 |
| KEY-05 | OWNER는 저장된 키를 삭제할 수 있다 | DELETE `/api/settings/gemini-key` + ConfirmDialog |
| KEY-06 | 키 저장 시 Gemini API에 probe 요청으로 키 유효성이 검증된다 | `@google/genai` `ai.models.list({pageSize:1})` — 토큰 소비 없음 |
| KEY-07 | MEMBER/VIEWER에게는 API 키 관련 메뉴가 완전히 숨겨진다 (disabled 아닌 hidden) | SettingsShell `role === 'OWNER'` guard + URL redirect |
| NAV-02 | OWNER만 API 키 설정 페이지에 접근할 수 있다 (API 레벨 RBAC 포함) | `requireRole(OWNER)` in all key handlers |
</phase_requirements>

---

## Summary

Phase 1은 기존 `/settings` 페이지에 OWNER 전용 AI 설정 섹션을 추가하고, Gemini API 키를 AES-256-GCM으로 암호화하여 `workspace_settings` 테이블에 저장하는 작업이다. 기존 코드베이스의 패턴(SettingsShell, requireRole, Drizzle upsert)이 완벽히 확립되어 있어 이 패턴들을 직접 확장하면 된다.

핵심 보안 원칙은 3가지다: (1) IV는 매 암호화마다 새로 생성(재사용 절대 금지), (2) ENCRYPTION_KEY 부재 시 서버 시작 즉시 crash, (3) GET 응답에 ciphertext/iv/tag 절대 미포함. 세 가지 모두 기존 PITFALLS.md P1~P4에서 상세히 분석되었으며 코드 패턴으로 검증 완료했다.

Gemini probe는 `ai.models.list({pageSize:1})`를 사용한다. 토큰을 소비하지 않는 가장 가벼운 API 호출이며, 유효하지 않은 키는 HTTP 400 + `API_KEY_INVALID`를 반환한다. 현재 installed Next.js는 15.5.12로 CVE-2025-29927(15.2.3에서 패치)보다 높아 안전하다.

**Primary recommendation:** `encryptionService.ts` → `workspaceSettings.ts` 쿼리 → API 라우트 → UI 순서로 bottom-up 빌드. 각 레이어가 완성될 때까지 위 레이어 작업 시작하지 않는다.

---

## Project Constraints (from CLAUDE.md)

| Directive | Source | Impact on This Phase |
|-----------|--------|----------------------|
| `db:generate`, `db:migrate`, `db:push` 는 사용자 명시적 요청 없이 절대 실행 금지 | safety.md | DB 스키마 추가 후 사용자 승인 받고 마이그레이션 실행 |
| `src/db/schema.ts` 수정 전 사용자 확인 필수 | safety.md | workspace_settings 테이블 추가 전 확인 |
| API Route에서 직접 SQL 사용 금지 (Drizzle ORM 사용) | api-rules.md | 모든 DB 접근은 `src/db/queries/workspaceSettings.ts`에 분리 |
| 모든 API 입력은 Zod 스키마로 검증 | api-rules.md | `saveGeminiKeySchema` Zod 스키마 필수 |
| MEMBER도 포함하여 비-OWNER 역할에 인라인 에러가 아닌 403 반환 | api-rules.md | 모든 key 핸들러에 `requireRole(OWNER)` |
| 클라이언트 컴포넌트: `'use client'` 디렉티브 필수 | component-rules.md | `GeminiKeySection.tsx`에 필수 |
| Tailwind CSS 유틸리티 클래스만 사용 (인라인 style 허용 — 기존 SettingsShell 패턴) | component-rules.md | 기존 SettingsShell inline style 패턴 유지 |
| `.env.local` 직접 수정/생성 금지 | safety.md | ENCRYPTION_KEY 설정 방법 사용자에게 안내만 |

---

## Standard Stack

### Core (이 페이즈에서 사용)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `crypto` | built-in (v22.20.0) | AES-256-GCM 암호화/복호화 | D-09 결정. 외부 의존성 없음. `aes-256-gcm` 지원 확인 완료 [VERIFIED: local node] |
| `@google/genai` | `^1.49.0` (latest: 1.49.0) | Gemini probe + Phase 2 AI 분석 | `@google/generative-ai`는 2025-11-30 deprecated. SUMMARY.md 결정 [VERIFIED: npm registry] |
| `drizzle-orm` | `^0.38.0` (installed) | workspace_settings upsert | 기존 프로젝트 ORM. `onConflictDoUpdate` 패턴 codebase에 확인 [VERIFIED: codebase grep] |
| `zod` | `^3.24.0` (installed) | API 입력 검증 | 기존 프로젝트 validation 라이브러리 [VERIFIED: package.json] |
| `next-auth` | `^5.0.0-beta.30` (installed) | 세션/인증 | 기존 auth 시스템 [VERIFIED: package.json] |

### 설치 필요

```bash
npm install @google/genai
```

**현재 미설치 확인 완료:** `node_modules/@google/` 디렉토리 없음 [VERIFIED: local filesystem]

### 사용하지 않을 것

| 거부 대상 | 이유 |
|-----------|------|
| `crypto-js`, `node-forge` | D-09: Node.js native crypto only |
| `@google/generative-ai` | 2025-11-30 deprecated — `@google/genai` 사용 |
| Drizzle `bytea` 컬럼 | ORM 워크어라운드 필요 (issue #3902). hex `text` 컬럼 사용 |

---

## Architecture Patterns

### 빌드 순서 (bottom-up)

```
1. DB Schema       → src/db/schema.ts에 workspace_settings 테이블 추가
2. Migration       → db:generate + db:migrate (사용자 승인 필수)
3. Encryption Svc  → src/lib/encryptionService.ts (서버 전용)
4. DB Queries      → src/db/queries/workspaceSettings.ts
5. API Routes      → app/api/settings/gemini-key/route.ts (GET/POST/DELETE)
6. Types 확장      → src/components/settings/types.ts (SectionKey 추가)
7. UI Component    → src/components/settings/GeminiKeySection.tsx
8. Shell 수정      → src/components/settings/SettingsShell.tsx (ai-key 섹션 추가)
```

### Pattern 1: Drizzle workspace_settings 테이블 정의

기존 `notificationChannels` 테이블 패턴을 그대로 따른다. workspace당 1개 row (unique constraint on workspaceId).

```typescript
// Source: src/db/schema.ts 기존 패턴 (notificationChannels 참조)
export const workspaceSettings = pgTable(
  'workspace_settings',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .unique()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    geminiKeyCiphertext: text('gemini_key_ciphertext'),
    geminiKeyIv: text('gemini_key_iv'),
    geminiKeyTag: text('gemini_key_tag'),
    maskedKey: text('masked_key'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => nowKST()),
  },
  (table) => [index('idx_workspace_settings_workspace_id').on(table.workspaceId)],
);
```

**컬럼 타입 근거:** [VERIFIED: codebase] SUMMARY.md "Drizzle `bytea` 컬럼 금지 — hex `text` 사용" + 기존 schema.ts의 `text()` 패턴

### Pattern 2: AES-256-GCM encryptionService

```typescript
// Source: verified via Node.js v22.20.0 local test (b5)
// File: src/lib/encryptionService.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Module-load 시점 검증 — fallback 절대 없음 (D-10)
const RAW_KEY = process.env.ENCRYPTION_KEY;
if (!RAW_KEY || !/^[0-9a-fA-F]{64}$/.test(RAW_KEY)) {
  throw new Error(
    `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got length: ${RAW_KEY?.length ?? 0}`
  );
}
const MASTER_KEY = Buffer.from(RAW_KEY, 'hex');

export function encryptApiKey(plaintext: string): {
  ciphertext: string;
  iv: string;
  tag: string;
} {
  const iv = randomBytes(12); // D-11: MUST be inside function, new every call
  const cipher = createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decryptApiKey(ciphertext: string, iv: string, tag: string): string {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    MASTER_KEY,
    Buffer.from(iv, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

export function maskApiKey(key: string): string {
  // D-08: 앞 5자 + * × (length - 10) + 뒤 5자
  if (key.length <= 10) return '*'.repeat(key.length);
  return key.slice(0, 5) + '*'.repeat(key.length - 10) + key.slice(-5);
}
```

**주의:** `encryptionService.ts`는 서버 전용 모듈이다. 클라이언트에서 import 금지.

### Pattern 3: Drizzle upsert (workspace당 1개 row)

```typescript
// Source: src/db/queries/notificationChannels.ts 기존 upsert 패턴 [VERIFIED: codebase]
// File: src/db/queries/workspaceSettings.ts
export async function upsertGeminiKey(
  workspaceId: number,
  data: { ciphertext: string; iv: string; tag: string; maskedKey: string },
): Promise<void> {
  await db
    .insert(workspaceSettings)
    .values({
      workspaceId,
      geminiKeyCiphertext: data.ciphertext,
      geminiKeyIv: data.iv,
      geminiKeyTag: data.tag,
      maskedKey: data.maskedKey,
    })
    .onConflictDoUpdate({
      target: workspaceSettings.workspaceId,
      set: {
        geminiKeyCiphertext: data.ciphertext,
        geminiKeyIv: data.iv,
        geminiKeyTag: data.tag,
        maskedKey: data.maskedKey,
      },
    });
}

export async function getGeminiKeyMeta(
  workspaceId: number,
): Promise<{ maskedKey: string; updatedAt: string } | null> {
  const [row] = await db
    .select({
      maskedKey: workspaceSettings.maskedKey,
      updatedAt: workspaceSettings.updatedAt,
    })
    .from(workspaceSettings)
    .where(eq(workspaceSettings.workspaceId, workspaceId))
    .limit(1);
  if (!row?.maskedKey) return null;
  return { maskedKey: row.maskedKey, updatedAt: row.updatedAt.toISOString() };
}

// 복호화: Phase 2 AI 호출 시점에만 사용
export async function getDecryptedGeminiKey(workspaceId: number): Promise<string | null> {
  const [row] = await db
    .select({
      ciphertext: workspaceSettings.geminiKeyCiphertext,
      iv: workspaceSettings.geminiKeyIv,
      tag: workspaceSettings.geminiKeyTag,
    })
    .from(workspaceSettings)
    .where(eq(workspaceSettings.workspaceId, workspaceId))
    .limit(1);
  if (!row?.ciphertext || !row.iv || !row.tag) return null;
  return decryptApiKey(row.ciphertext, row.iv, row.tag);
}
```

### Pattern 4: API Route Handler (requireRole OWNER)

```typescript
// Source: app/api/tickets/route.ts 기존 패턴 [VERIFIED: codebase]
// File: app/api/settings/gemini-key/route.ts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 });

    const workspaceId = getWorkspaceId(session);
    if (!workspaceId) return /* 401 */;

    const userId = (session.user as Record<string, unknown>).id as string;
    const roleCheck = await requireRole(userId, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(roleCheck)) return roleCheck; // → 403

    const meta = await getGeminiKeyMeta(workspaceId);
    return NextResponse.json({ data: meta }); // maskedKey + updatedAt ONLY
  } catch (error) {
    console.error('GET /api/settings/gemini-key error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } }, { status: 500 });
  }
}
```

**CRITICAL:** GET 응답에 `ciphertext`, `iv`, `tag` 절대 미포함 (P4/P9 pitfall).

### Pattern 5: Gemini Probe (D-06 결정)

```typescript
// Source: @google/genai v1.49.0 + WebSearch 검증 [VERIFIED: npm registry + WebSearch]
// File: app/api/settings/gemini-key/route.ts (POST 핸들러 내부)
import { GoogleGenAI } from '@google/genai';

async function probeGeminiKey(apiKey: string): Promise<'valid' | 'invalid' | 'network_error'> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    // models.list({pageSize:1}) — 토큰 소비 없음, 가장 가벼운 probe
    const iter = await ai.models.list({ pageSize: 1 });
    const hasModels = iter.page.length > 0;
    return hasModels ? 'valid' : 'invalid';
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 400 || status === 403) {
      // HTTP 400 = API_KEY_INVALID, 403 = key exists but no permission
      return 'invalid';
    }
    // 네트워크 오류, Gemini 서버 오류 등
    return 'network_error';
  }
}
```

**probe 결과 처리:**
- `'valid'` → 암호화 후 DB upsert 실행
- `'invalid'` → 클라이언트에 인라인 에러 ("유효하지 않은 API 키입니다.") — 저장 안 함 (D-05)
- `'network_error'` → 클라이언트에 인라인 에러 ("키 유효성 확인에 실패했습니다. 네트워크 연결을 확인해주세요.") — 저장 안 함

### Pattern 6: SettingsShell 확장

```typescript
// Source: src/components/settings/SettingsShell.tsx 기존 코드 [VERIFIED: codebase]

// 1. types.ts 수정 — SectionKey union 확장
export type SectionKey = 'general' | 'notification-preferences' | 'labels' | 'ai-key';

// 2. SettingsShell.tsx 수정
// NAV_ITEMS: ai-key 항목 추가
{
  key: 'ai-key',
  label: 'AI 설정',
  icon: <svg>/* key icon from UI-SPEC */</svg>,
}

// visibleNavItems: OWNER에게만 ai-key 표시
const isOwner = role === 'OWNER';
const visibleNavItems = NAV_ITEMS.filter((item) => {
  if (item.key === 'ai-key') return isOwner; // OWNER only
  if (isViewer) return VIEWER_ALLOWED_SECTIONS.includes(item.key);
  return true;
});

// initialSection guard: non-OWNER가 ai-key URL 접근 시 redirect
const initialSection =
  (!isOwner && rawSection === 'ai-key') ? 'general' :
  (isViewer && !VIEWER_ALLOWED_SECTIONS.includes(rawSection)) ? 'general' :
  rawSection;

// sectionRenderers: ai-key 추가 (OWNER only)
...(isOwner && { 'ai-key': <GeminiKeySection showToast={showToastWithAction} workspaceId={workspaceId} /> })
```

### Pattern 7: Toast with Action Button (D-07)

현재 `showToast(message, type)` 는 액션 버튼을 지원하지 않는다. 확장 방안:

```typescript
// ToastState 확장 — SettingsShell.tsx
interface ToastState {
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void }; // NEW
}

// showToastWithAction 추가
function showToastWithAction(
  message: string,
  type: ToastType = 'success',
  action?: { label: string; onClick: () => void }
) {
  setToast({ message, type, action });
  setTimeout(() => setToast(null), action ? 8000 : 3000); // D-07: 8000ms for action toasts
}

// Toast 렌더링 — 액션 버튼 추가
{toast.action && (
  <button onClick={() => { toast.action!.onClick(); setToast(null); }}>
    {toast.action.label}
  </button>
)}
```

### Anti-Patterns to Avoid

- **IV 재사용:** `encryptApiKey()` 외부에서 IV 생성 후 파라미터로 전달하지 말 것 (P1)
- **ENCRYPTION_KEY fallback:** `process.env.ENCRYPTION_KEY ?? 'fallback'` 절대 금지 (P2)
- **GET 응답 누출:** ciphertext/iv/tag를 어떤 API 응답에도 포함하지 말 것 (P4/P9)
- **미들웨어 단독 인증:** Route Handler에서 `requireRole` 생략하지 말 것 (P5/CVE-2025-29927)
- **DB에서 decrypt:** 화면 표시 목적으로 GET 핸들러에서 복호화 금지 — `maskedKey` 컬럼 직접 반환 (P9)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AES-256-GCM 암호화 | 자체 XOR/base64 인코딩 | Node.js `crypto.createCipheriv` | GCM auth tag 포함 인증 암호화. IV 생성까지 처리 |
| RBAC 체크 | 직접 role 문자열 비교 | `requireRole()` from `src/lib/permissions.ts` | 이미 rank 비교 로직 포함. OWNER > MEMBER > VIEWER 처리 완료 |
| Upsert | DELETE + INSERT 두 쿼리 | Drizzle `onConflictDoUpdate` | 기존 notificationChannels 패턴. race condition 방지 |
| 마스킹 | 매 요청마다 복호화 후 마스킹 | 저장 시점에 `masked_key` 컬럼에 계산·저장 | 복호화 횟수 최소화. GET은 DB read only |

**Key insight:** 이 도메인에서 커스텀 암호화/인증 구현은 항상 edge case를 놓친다. GCM auth tag 검증 누락, IV 재사용, padding oracle 등. Node.js native crypto의 `aes-256-gcm`은 이를 모두 처리한다.

---

## Common Pitfalls

### Pitfall 1: AES-256-GCM IV 재사용 (CRITICAL — P1)

**What goes wrong:** 두 번의 `encryptApiKey()` 호출에서 동일 IV 사용 — GCM 완전 무력화, XOR으로 plaintext 복원 가능.
**Why it happens:** IV를 함수 외부에서 생성하거나 이전 저장 IV를 update 시 재사용.
**How to avoid:** `randomBytes(12)`는 반드시 `encryptApiKey()` 함수 body 첫 줄에.
**Warning signs:** DB의 `gemini_key_iv` 컬럼이 키 교체 후에도 동일한 값.

### Pitfall 2: ENCRYPTION_KEY 부재/오류 시 fallback (CRITICAL — P2)

**What goes wrong:** `process.env.ENCRYPTION_KEY ?? 'dev-secret'` — 프로덕션에서 dev key로 암호화. 누구나 복호화 가능.
**Why it happens:** 개발 편의를 위해 fallback 추가.
**How to avoid:** 모듈 로드 시점에 throw. Vercel 환경변수 미설정 = 서버 시작 crash (올바른 동작).
**Warning signs:** `encryptionService.ts`에 `??` 또는 `||` 있는 경우.

### Pitfall 3: GET 응답에 암호화 데이터 누출 (CRITICAL — P4/P9)

**What goes wrong:** GET `/api/settings/gemini-key` 응답에 `geminiKeyCiphertext` 포함 → 공격자가 오프라인 복호화 시도 가능.
**Why it happens:** DB row 전체를 직접 반환하는 코드.
**How to avoid:** DB 쿼리에서 `select({ maskedKey, updatedAt })`만 선택. 절대 ciphertext/iv/tag 조회 안 함.
**Warning signs:** `getGeminiKeyMeta()` 함수가 ciphertext 필드를 반환.

### Pitfall 4: Route Handler RBAC 누락 (SECURITY — P4/CVE-2025-29927)

**What goes wrong:** 설정 UI가 OWNER만 보이도록 해도, `/api/settings/gemini-key`에 직접 호출 가능.
**Why it happens:** "UI가 막았으니 API는 괜찮겠지" 착각.
**How to avoid:** 모든 key API 핸들러 상단에 `requireRole(userId, workspaceId, TEAM_ROLE.OWNER)` 필수.
**Warning signs:** Route Handler에 `requireRole` 없고 `auth()` 세션 체크만 있는 경우.

### Pitfall 5: Next.js 버전 확인 (CVE-2025-29927)

**현황:** 설치된 Next.js = **15.5.12** (패치 버전 15.2.3보다 높음) [VERIFIED: local node_modules]
**결론:** CVE-2025-29927 취약점 없음. 단, 이 패치 이전 버전으로 다운그레이드 금지.

### Pitfall 6: Toast action 구현 시 메모리 누수

**What goes wrong:** `showToastWithAction`에 `onClick`으로 plaintext key를 클로저로 캡처 — 토스트 닫힌 후에도 메모리에 잔존.
**How to avoid:** 토스트 닫힐 때 `setToast(null)` 호출로 참조 해제. `setTimeout` 콜백에서도 동일하게 처리.

---

## Code Examples

### AES-256-GCM 암호화 전체 사이클 (검증 완료)

```typescript
// Source: verified via Node.js v22.20.0 local test [VERIFIED: local execution]
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const key = randomBytes(32); // 32 bytes = 256 bits
const iv = randomBytes(12);  // 12 bytes = 96 bits (GCM 권장)
const plaintext = 'AIzaSyTest_Key_Example_1234567890';

// Encrypt
const cipher = createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag(); // 16 bytes auth tag

// Decrypt
const decipher = createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(tag);
const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
// decrypted === plaintext ✓
```

### ENCRYPTION_KEY 검증 (모듈 로드 시)

```typescript
// Source: verified via local test (b6) [VERIFIED: local execution]
const RAW_KEY = process.env.ENCRYPTION_KEY;
if (!RAW_KEY || !/^[0-9a-fA-F]{64}$/.test(RAW_KEY)) {
  throw new Error(`ENCRYPTION_KEY must be 64 hex characters. Got length: ${RAW_KEY?.length ?? 0}`);
}
// 키 생성 명령어 (사용자 안내용):
// node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 마스킹 함수

```typescript
// Source: verified via local test (b15) [VERIFIED: local execution]
// D-08: 앞 5자 + * × (length - 10) + 뒤 5자
function maskApiKey(key: string): string {
  if (key.length <= 10) return '*'.repeat(key.length);
  return key.slice(0, 5) + '*'.repeat(key.length - 10) + key.slice(-5);
}
// maskApiKey('AIzaSyTestKey1234567890abcdef12345') → 'AIzaS************************12345'
```

### GeminiKeySection 상태 기계

```typescript
// Source: UI-SPEC.md State machine [VERIFIED: UI-SPEC file]
type UIState =
  | 'IDLE_NO_KEY'
  | 'IDLE_HAS_KEY'
  | 'REPLACE_MODE'
  | 'SAVING'
  | 'DELETING'
  | 'DELETE_CONFIRM_OPEN';

// Transitions:
// IDLE_NO_KEY  → SAVING (submit) → IDLE_HAS_KEY (probe OK) | IDLE_NO_KEY + error (probe fail)
// IDLE_HAS_KEY → REPLACE_MODE (click 키 교체) | DELETE_CONFIRM_OPEN (click 삭제)
// REPLACE_MODE → SAVING (submit) | IDLE_HAS_KEY (cancel)
// DELETE_CONFIRM_OPEN → DELETING (confirm) | IDLE_HAS_KEY (cancel)
// DELETING → IDLE_NO_KEY
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@google/generative-ai` | `@google/genai` | 2025-11-30 (deprecated) | Import 경로 변경. `GoogleGenerativeAI` → `GoogleGenAI` |
| 단일 `encrypted_key` 컬럼 (ciphertext+iv+tag packed) | 4컬럼 분리 (`ciphertext`, `iv`, `tag`, `masked_key`) | D-02 결정 | ORM 직접 접근. Drizzle bytea 워크어라운드 불필요 |
| DB 표시용 복호화 | `masked_key` 컬럼 저장 | P9 pitfall 방지 | GET 핸들러에서 복호화 불필요 |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ai.models.list({pageSize:1})`가 토큰을 소비하지 않는다 | Standard Stack / Probe Pattern | 낮음 — 최악의 경우 미미한 API 비용. 대안: 빈 generateContent(minimalOutputTokens) | [ASSUMED: based on API semantics — models.list is metadata endpoint] |
| A2 | 유효하지 않은 Gemini API key는 HTTP 400을 반환한다 | Code Examples | 중간 — 403이나 다른 코드면 probe 로직 수정 필요. try-catch로 모든 에러 catch 가능 | [VERIFIED: WebSearch multiple sources - "400 API_KEY_INVALID"] |

---

## Open Questions (RESOLVED)

1. **ENCRYPTION_KEY 생성/배포 방법 사용자 교육**
   - What we know: 서버 시작 시 검증, fallback 없음
   - What's unclear: Vercel 대시보드에 설정 방법을 플래너가 Wave 0 태스크로 포함해야 하는지
   - Recommendation: Wave 0에 ENCRYPTION_KEY 생성 및 `.env.local` 설정 지침 태스크 포함
   - **RESOLVED:** Plan 01-01 Wave 1 Task 1에서 `.env.example`에 `ENCRYPTION_KEY` 생성 지침 및 주석 추가로 해결됨

2. **`workspace_settings` 테이블명**
   - What we know: D-02에서 `workspace_settings`로 결정됨
   - What's unclear: 향후 Phase 2 이후 다른 설정(AI 분석 설정 등)이 추가될 때 같은 테이블을 확장할지 별도 테이블을 만들 것인지
   - Recommendation: 지금은 D-02 그대로 진행. Phase 2에서 확장 필요시 컬럼 추가.
   - **RESOLVED:** D-02 결정대로 `workspace_settings` 테이블 사용. Phase 2 이후 확장 필요 시 컬럼 추가 방식으로 처리.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js crypto | AES-256-GCM | ✓ | v22.20.0 | — |
| `@google/genai` | Gemini probe | ✗ (미설치) | — | 설치 필요: `npm install @google/genai` |
| Drizzle ORM | workspace_settings upsert | ✓ | 0.38.x | — |
| PostgreSQL (Vercel) | DB 저장 | ✓ (프로덕션 기준) | — | — |
| Next.js | Route Handler | ✓ | 15.5.12 | — |

**Missing dependencies with no fallback:**
- `@google/genai` — Wave 0 첫 태스크로 설치 필요

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | NextAuth v5 (기존) + `auth()` 세션 체크 |
| V3 Session Management | yes (기존) | NextAuth JWT (기존 — 변경 없음) |
| V4 Access Control | yes | `requireRole(OWNER)` — 모든 key API 핸들러 |
| V5 Input Validation | yes | Zod `saveGeminiKeySchema` — API key 형식 검증 |
| V6 Cryptography | yes | Node.js native `crypto` AES-256-GCM — 절대 hand-roll 금지 |
| V8 Data Protection | yes | API 응답에 ciphertext/iv/tag 절대 미포함 |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| RBAC bypass via direct URL | Elevation of Privilege | `requireRole(OWNER)` in every handler (not middleware-only) |
| IV 재사용 → GCM 무력화 | Information Disclosure | `randomBytes(12)` inside `encryptApiKey()` every call |
| ENCRYPTION_KEY 없음 → 키 영구 손실 | Denial of Service | 모듈 로드 시점 throw, no fallback |
| GET 응답에 ciphertext 누출 | Information Disclosure | `select({maskedKey, updatedAt})` only |
| CVE-2025-29927 미들웨어 bypass | Spoofing | 핸들러 레벨 `requireRole` 필수. Next.js 15.5.12 ≥ 15.2.3 ✓ |
| 토스트 plaintext key 메모리 캐시 | Information Disclosure | `setToast(null)` on close, setTimeout cleanup |

---

## Sources

### Primary (HIGH confidence)
- Node.js v22.20.0 local execution (`crypto.getCiphers()`, AES-256-GCM round-trip test) — 암호화 패턴 검증
- `/Users/codevillain/Claude-Code-Expert/tika/src/db/schema.ts` — 기존 테이블 정의 패턴
- `/Users/codevillain/Claude-Code-Expert/tika/src/components/settings/SettingsShell.tsx` — 기존 SettingsShell 구조
- `/Users/codevillain/Claude-Code-Expert/tika/src/lib/permissions.ts` — requireRole 패턴
- `/Users/codevillain/Claude-Code-Expert/tika/src/db/queries/notificationChannels.ts` — upsert 패턴
- `/Users/codevillain/Claude-Code-Expert/tika/.planning/research/PITFALLS.md` — P1~P5 검증
- npm registry: `@google/genai@1.49.0` (latest), `next@15.5.12` (installed)

### Secondary (MEDIUM confidence)
- [Gemini API models.list endpoint documentation](https://ai.google.dev/api/models#v1beta.models.list) — models list 응답 구조
- [Gemini API 400 API_KEY_INVALID](https://discuss.ai.google.dev/t/400-api-key-not-valid-did-something-change-in-last-2-days/58949) — 무효 키 에러 코드 확인 (다수 사용자 보고)
- [Gemini TypeScript Cookbook - Models](https://fallendeity.github.io/gemini-ts-cookbook/quickstarts/Models.html) — `ai.models.list()` 사용법

### Tertiary (LOW confidence — assumed)
- `ai.models.list({pageSize:1})`가 토큰을 소비하지 않는다 — 공식 문서에 명시 없음. 메타데이터 엔드포인트 특성상 합리적 추정.

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — package.json, npm registry, local filesystem 모두 검증
- Architecture: HIGH — 기존 codebase 패턴 직접 읽어 확인
- Pitfalls: HIGH — PITFALLS.md 사전 연구 + 로컬 실행 검증
- Gemini Probe: MEDIUM — `ai.models.list()` API 의미론적 추론. 토큰 비소비 가정은 ASSUMED

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (Next.js, @google/genai 버전 변동 주시)
