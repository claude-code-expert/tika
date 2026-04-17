# Architecture Patterns: AI Feature Integration

**Domain:** AI-powered ticket generation for existing Next.js 15 kanban SaaS
**Researched:** 2026-04-11
**Overall confidence:** HIGH (based on existing codebase + verified docs)

---

## Recommended Architecture

### New Components and Their Placement

The AI feature introduces 3 new server-side services, 1 new DB table, 2 new API route groups, and 2 new pages — all fitting cleanly into the existing layered architecture.

```
Client (Browser)
    |
    | FormData (MD file upload)
    v
app/workspace/[workspaceId]/ai-import/page.tsx          ← Upload UI (Client Component)
app/workspace/[workspaceId]/settings/ai/page.tsx        ← Key settings UI (Server Component + Client form)
    |
    | fetch()
    v
app/api/settings/gemini-key/route.ts                    ← OWNER-only key CRUD (GET/POST/DELETE)
app/api/ai/analyze-checklist/route.ts                   ← File upload + AI call (POST, streaming)
    |
    | calls
    v
src/server/services/encryptionService.ts                ← AES-256-GCM encrypt/decrypt
src/server/services/geminiService.ts                    ← Gemini API call, parse response
src/server/services/ticketService.ts  (existing)        ← Bulk ticket creation (extend)
    |
    | db.transaction()
    v
src/db/queries/workspaceSettings.ts (new)               ← workspace_settings table queries
src/db/queries/tickets.ts           (existing)          ← ticket inserts (reuse)
src/db/schema.ts                    (extend)            ← add workspace_settings table
```

---

## Question Answers

### Q1: workspace_settings vs app_settings — Where to store the API key?

**Decision: `workspace_settings` table (per-workspace)**

Rationale:
- The existing schema is workspace-scoped throughout. `tickets`, `members`, `labels`, `sprints`, `notification_channels` all reference `workspaces.id`.
- A global `app_settings` table would break the multi-tenant isolation model — if two OWNER users exist in separate workspaces, each workspace must manage its own Gemini key independently.
- `PROJECT.md` explicitly states "OWNER = 워크스페이스 생성자" and AI menus are controlled per RBAC role which is already workspace-scoped.
- `notification_channels` in the existing schema is the exact precedent: workspace-level config stored per `workspace_id`, with a JSON `config` column. Follow this pattern.

**Schema (add to `src/db/schema.ts`):**

```typescript
export const workspaceSettings = pgTable(
  'workspace_settings',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .unique()                                         // one row per workspace
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    geminiKeyCiphertext: text('gemini_key_ciphertext'), // AES-256-GCM encrypted, hex
    geminiKeyIv: text('gemini_key_iv'),                 // 12-byte IV, hex
    geminiKeyTag: text('gemini_key_tag'),               // 16-byte auth tag, hex
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => nowKST()),
  },
  (table) => [index('idx_workspace_settings_workspace_id').on(table.workspaceId)],
);
```

**Why three columns (ciphertext, iv, tag) not one JSON blob:**
- Enables future column-level queries (e.g., "when was the key last rotated?")
- Avoids JSON parsing in the hot path
- Mirrors best practice: each AES-GCM component stored separately

**Confidence:** HIGH — verified against existing `notification_channels` precedent in `src/db/schema.ts` and multi-tenant RBAC design in `src/lib/permissions.ts`.

---

### Q2: File size limits in Next.js 15 Route Handlers for the analyze-checklist route

**Decision: Use `request.formData()` in Route Handler (not Server Action). Set `proxyClientMaxBodySize` in `next.config.ts`.**

Background from investigation:
- Next.js 15 App Router Route Handlers call `request.formData()` directly with no built-in hard limit at the handler level.
- However, the Next.js proxy layer (Vercel deployment) defaults to 10 MB for body passthrough. This is configurable via `proxyClientMaxBodySize` in `next.config.ts`.
- Server Actions have a separate `serverActions.bodySizeLimit` config (default 1 MB). Do NOT use Server Actions for file upload here — use a Route Handler.
- Vercel Serverless Functions have a 4.5 MB request body limit by default. A raw MD checklist file will be text — even a 100-page document is < 500 KB. No special configuration needed for typical usage.

**Implementation in `next.config.ts`:**

```typescript
const nextConfig: NextConfig = {
  devIndicators: false,
  // Allow MD files up to 5 MB through the Vercel proxy layer
  experimental: {
    proxyClientMaxBodySize: '5mb',
  },
};
```

**In the Route Handler:**

```typescript
// app/api/ai/analyze-checklist/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) { /* 400 */ }

  const text = await file.text();  // reads entire file as UTF-8 string
  const fileSizeBytes = new TextEncoder().encode(text).length;

  // Warn client if token count likely high (rough heuristic: 1 token ≈ 4 chars)
  const estimatedTokens = Math.ceil(fileSizeBytes / 4);
  const TOKEN_WARNING_THRESHOLD = 8000;
  const tokenWarning = estimatedTokens > TOKEN_WARNING_THRESHOLD;

  // ... call geminiService
}
```

**File size validation (do before Gemini call):**

```typescript
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB hard limit — MD files only
if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
  return NextResponse.json(
    { error: { code: 'FILE_TOO_LARGE', message: '파일 크기는 1MB 이하여야 합니다' } },
    { status: 400 },
  );
}
```

**Confidence:** HIGH — verified via Next.js GitHub issue #57501 and official `proxyClientMaxBodySize` docs.

---

### Q3: Streaming Gemini responses — SSE, polling, or plain await?

**Decision: Plain `await` with progress indicator on client. Do NOT stream.**

Rationale:

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Plain await** | Simplest, no infrastructure change, aligns with existing no-realtime architecture | UX shows loading spinner until complete | **RECOMMENDED** |
| SSE streaming | Better perceived UX, chunks appear as generated | Next.js SSE buffering issues on Vercel; ResponseAborted errors (GitHub Discussion #61972); implementation complexity | Reject |
| Polling | Decoupled, works with any infra | Requires job queue, additional DB table, background worker — massive over-engineering for this feature | Reject |

**Supporting evidence:**
- `PROJECT.md` explicitly states "실시간 WebSocket 업데이트 — 현재 아키텍처가 폴링 기반" and "Out of Scope" for real-time.
- Vercel Serverless Functions have a 10-second timeout for Hobby tier (60s for Pro). Gemini analysis of a typical MD checklist (< 200 items) completes in 3-8 seconds — within limit.
- Existing architecture uses no streaming anywhere; SSE would be a new pattern requiring infrastructure knowledge the team hasn't established.

**If response time becomes a UX concern later:** the SSE pattern can be added as a Phase N+1 enhancement. The service layer (`geminiService.ts`) should be written to support both — return the full parsed result for now, expose `generateContentStream` variant later.

**Implementation pattern:**

```typescript
// src/server/services/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function analyzeChecklist(
  apiKey: string,
  markdownText: string,
): Promise<ParsedHierarchy> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = buildChecklistPrompt(markdownText);
  const result = await model.generateContent(prompt);  // plain await
  const responseText = result.response.text();

  return parseGeminiResponse(responseText);
}
```

**Confidence:** HIGH — verified against existing architecture constraints + Vercel timeout limits + Next.js SSE buffering issues documented in GitHub discussions.

---

### Q4: Ticket bulk-creation — transactional or queue-based?

**Decision: Single `db.transaction()` call. No queue.**

Rationale:
- Queues (BullMQ, pg-boss, Inngest) are warranted when: (a) operations take > 30 seconds, (b) work must survive server crashes, (c) partial success is acceptable. None of these apply here.
- Gemini returns a full JSON tree before ticket creation begins. All inserts happen after successful AI parsing.
- Drizzle ORM's `db.transaction()` guarantees atomic all-or-nothing. If any ticket insert fails, all roll back — correct behavior.
- Vercel Postgres (Neon) supports interactive transactions over the pooled WebSocket connection.

**Transaction structure:**

```typescript
// src/server/services/ticketService.ts (extend existing)
export async function bulkCreateFromHierarchy(
  workspaceId: number,
  hierarchy: ParsedHierarchy,
): Promise<BulkCreateResult> {
  const createdIds: Record<string, number> = {};  // tempId → real DB id

  await db.transaction(async (tx) => {
    // 1. Insert Goals first
    for (const goal of hierarchy.goals) {
      const position = await calculateNextPosition(tx, workspaceId, 'BACKLOG');
      const [row] = await tx.insert(tickets).values({
        workspaceId,
        title: goal.title,
        type: 'GOAL',
        status: 'BACKLOG',
        position,
      }).returning({ id: tickets.id });
      createdIds[goal.tempId] = row.id;
    }

    // 2. Insert Stories/Features/Tasks with resolved parentId
    for (const item of hierarchy.flatItems) {
      const parentId = item.parentTempId ? createdIds[item.parentTempId] : null;
      const position = await calculateNextPosition(tx, workspaceId, 'BACKLOG');
      const [row] = await tx.insert(tickets).values({
        workspaceId,
        title: item.title,
        type: item.type,           // 'STORY' | 'FEATURE' | 'TASK'
        status: 'BACKLOG',
        position,
        parentId,
      }).returning({ id: tickets.id });
      createdIds[item.tempId] = row.id;
    }
  });

  return { count: Object.keys(createdIds).length, ids: createdIds };
}
```

**Position calculation concern:** Calling `calculateNextPosition` inside a transaction loop can cause duplicate positions if done naively (each call queries the current min). Solution: calculate a base position before the transaction, then assign `basePosition - (index * 1000)` for each item — no per-item DB query needed.

**Confidence:** HIGH — verified via Drizzle transaction docs and existing `ticketService.ts` pattern.

---

### Q5: Gemini API key security in the API layer

**Decision: Decrypt at call-time in `geminiService.ts`. Never log, never return to client, never cache.**

Architecture enforces this at 3 boundaries:

**Boundary 1: Storage** — `encryptionService.ts` uses Node.js built-in `crypto` (no external dep) with AES-256-GCM. Master key lives in `ENCRYPTION_KEY` env var (32 bytes hex, set in Vercel dashboard, never in code or `.env.local` committed to git).

```typescript
// src/server/services/encryptionService.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encryptApiKey(plaintext: string): { ciphertext: string; iv: string; tag: string } {
  const iv = randomBytes(12);  // 96-bit IV — GCM requirement
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decryptApiKey(ciphertext: string, iv: string, tag: string): string {
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
```

**Boundary 2: API routes** — `GET /api/settings/gemini-key` NEVER returns the raw key. Returns only a masked representation: `${key.slice(0, 5)}${'*'.repeat(key.length - 10)}${key.slice(-5)}`.

**Boundary 3: Request handling** — `analyzeChecklist` route decrypts the key server-side, passes it directly to `geminiService.ts`, and the plain-text key is discarded after the function returns. No logging of the key value.

```typescript
// app/api/ai/analyze-checklist/route.ts
const settings = await getWorkspaceSettings(workspaceId);     // queries workspace_settings
if (!settings?.geminiKeyCiphertext) { /* 400 */ }

const apiKey = decryptApiKey(
  settings.geminiKeyCiphertext,
  settings.geminiKeyIv!,
  settings.geminiKeyTag!,
);
// apiKey is a local variable — never logged, never serialized
const result = await geminiService.analyzeChecklist(apiKey, markdownText);
```

**Middleware layer:** No changes to `middleware.ts` are needed for key security. The RBAC check in the Route Handler (`requireRole(userId, workspaceId, TEAM_ROLE.OWNER)`) is sufficient. Adding redundant middleware-level checks for a single route adds complexity without security benefit.

**Confidence:** HIGH — based on Node.js crypto module docs (stable API, unchanged since Node 12) and existing permissions.ts RBAC pattern.

---

## Component Boundaries

| Component | Responsibility | Input | Output | Communicates With |
|-----------|---------------|-------|--------|-------------------|
| `app/api/settings/gemini-key/route.ts` | OWNER-only key CRUD | Auth session + key plaintext | Masked key / success | `encryptionService`, `workspaceSettings` queries |
| `app/api/ai/analyze-checklist/route.ts` | File receive, AI orchestration | FormData (MD file) | Created ticket count + ids | `encryptionService`, `geminiService`, `ticketService` |
| `src/server/services/encryptionService.ts` | AES-256-GCM operations | Plaintext / ciphertext+iv+tag | Ciphertext+iv+tag / Plaintext | Node.js `crypto` only |
| `src/server/services/geminiService.ts` | Gemini API call + response parse | API key + markdown text | `ParsedHierarchy` struct | `@google/generative-ai` SDK |
| `src/server/services/ticketService.ts` (extend) | Bulk transactional ticket insert | `ParsedHierarchy` + workspaceId | Created ticket IDs | `src/db/queries/tickets.ts` |
| `src/db/queries/workspaceSettings.ts` (new) | workspace_settings CRUD queries | workspaceId / settings data | DB rows | Drizzle ORM + workspace_settings table |
| `src/components/settings/GeminiKeyForm.tsx` (new) | Key entry, masking display | User input | fetch to /api/settings/gemini-key | Server: settings/ai page |
| `src/components/ai/AIImportForm.tsx` (new) | File upload, result display | MD file | fetch to /api/ai/analyze-checklist | Server: ai-import page |

---

## Data Flow

### Flow 1: API Key Registration (OWNER)

```
OWNER → /workspace/[id]/settings/ai (page)
     → GeminiKeyForm (client component)
     → POST /api/settings/gemini-key { key: "AIza..." }
     → requireRole(OWNER) check
     → encryptionService.encryptApiKey(key) → { ciphertext, iv, tag }
     → workspaceSettings.upsert({ workspaceId, ciphertext, iv, tag })
     → Response: { maskedKey: "AIza...*****...Xk9" }
     → GeminiKeyForm shows masked key
```

### Flow 2: Checklist Import

```
User → /workspace/[id]/ai-import (page)
    → AIImportForm (client component, 'use client')
    → POST /api/ai/analyze-checklist FormData { file: File }
    → requireRole(MEMBER) check           ← MEMBER and above can import
    → request.formData() → file.text()
    → validate file size + type
    → workspaceSettings.getByWorkspaceId(workspaceId) → { ciphertext, iv, tag }
    → encryptionService.decryptApiKey(...)  → plain apiKey (server memory only)
    → geminiService.analyzeChecklist(apiKey, markdownText) → ParsedHierarchy
    → ticketService.bulkCreateFromHierarchy(workspaceId, hierarchy) → { count, ids }
    → Response: { count: 12, warning?: "토큰 소모량이 많습니다..." }
    → AIImportForm shows success + count
    → client calls router.refresh() to reload board
```

### Flow 3: Settings Page Access Control (MEMBER/VIEWER)

```
MEMBER → /workspace/[id]/settings/ai
       → Server Component fetches session → checks role
       → role !== OWNER → redirect to /workspace/[id] or 403 page
       (AI menu item hidden in sidebar via role check in layout)
```

---

## Suggested Build Order (Dependencies)

```
Phase 1: Foundation
  1. src/db/schema.ts          ← Add workspace_settings table
  2. db:generate + db:migrate  ← Apply migration
  3. src/db/queries/workspaceSettings.ts  ← CRUD queries

Phase 2: Encryption service (no external deps, testable in isolation)
  4. src/server/services/encryptionService.ts
  5. Add ENCRYPTION_KEY to .env.local + Vercel dashboard

Phase 3: Key management API
  6. app/api/settings/gemini-key/route.ts  ← GET/POST/DELETE, OWNER-only
  7. src/components/settings/GeminiKeyForm.tsx
  8. app/workspace/[workspaceId]/settings/ai/page.tsx

Phase 4: AI service (depends on encryption working)
  9. npm install @google/generative-ai
  10. src/server/services/geminiService.ts  ← Gemini call + parse
  11. Extend ticketService.ts with bulkCreateFromHierarchy

Phase 5: Import API + UI
  12. app/api/ai/analyze-checklist/route.ts
  13. src/components/ai/AIImportForm.tsx
  14. app/workspace/[workspaceId]/ai-import/page.tsx

Phase 6: Navigation integration
  15. Add AI menu item to sidebar (hidden for MEMBER/VIEWER)
  16. next.config.ts proxyClientMaxBodySize if needed
```

**Critical dependency chain:** schema → queries → encryptionService → key API → geminiService → analyze API. Each step is a hard prerequisite for the next. Build and test each layer in isolation before combining.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calling Gemini from Client-Side
**What:** Import `@google/generative-ai` in a Client Component, pass API key from env or fetch it first.
**Why bad:** API key exposed in browser; `NEXT_PUBLIC_` prefix required for client env vars would make it visible in page source.
**Instead:** Server-only Route Handler always. API key never touches the client.

### Anti-Pattern 2: Streaming Gemini via SSE (at this stage)
**What:** Implement `ReadableStream` SSE in the Route Handler to stream Gemini chunks to the client.
**Why bad:** Next.js on Vercel has documented SSE buffering issues (GitHub Discussion #48427, #61972). The architecture has no existing streaming precedent. Risk of `ResponseAborted` errors under Vercel's edge proxy.
**Instead:** Plain `await generateContent` returns in 3-8s for typical checklists. Add a progress spinner on the client. SSE can be added as enhancement after basic feature ships.

### Anti-Pattern 3: Queue-based ticket creation
**What:** Write parsed tickets to a job queue (BullMQ, Inngest), process asynchronously, poll for completion.
**Why bad:** Adds Redis or another DB dependency. Requires polling endpoint. Dramatically increases complexity for a synchronous operation that completes in < 2 seconds.
**Instead:** `db.transaction()` in the same request. All tickets insert or none do.

### Anti-Pattern 4: Storing encrypted key as a single base64 blob
**What:** Concatenate `iv + tag + ciphertext` into a single string in one DB column.
**Why bad:** Parsing required on every decrypt; opaque to DB tooling; harder to audit.
**Instead:** Three separate columns: `gemini_key_ciphertext`, `gemini_key_iv`, `gemini_key_tag`.

### Anti-Pattern 5: Using global app_settings table
**What:** Create a single-row `app_settings` table storing one Gemini API key for the whole application.
**Why bad:** Breaks multi-tenant isolation. All workspaces share one key — one OWNER controls access for all.
**Instead:** `workspace_settings` with a `unique` constraint on `workspace_id`. Each workspace manages its own key.

---

## Scalability Considerations

| Concern | Current (Phase) | Future |
|---------|----------------|--------|
| API key per workspace | `workspace_settings` table, 1 row/workspace | No change needed |
| Large MD files (> 1 MB) | Reject at validation; 1 MB covers ~800K chars | Streaming upload to Gemini Files API if needed |
| Many tickets from one import (> 100) | Single transaction, sequential inserts; acceptable for batch | Use `tx.insert().values([...])` batch insert syntax if latency becomes issue |
| Gemini rate limits | Per-workspace key; rate limit hit = user-visible error 429 | Add retry with exponential backoff in geminiService |
| Vercel function timeout | Gemini call + DB inserts < 30s typical; 60s Pro limit | If > 60s, split: Gemini call in one request, insert in separate action |

---

## Environment Variables to Add

| Variable | Purpose | Where |
|----------|---------|-------|
| `ENCRYPTION_KEY` | 32-byte hex master key for AES-256-GCM | Vercel dashboard (never `.env.example`) |
| (no `GEMINI_API_KEY` in env) | Per-workspace key stored encrypted in DB | n/a — stored in `workspace_settings` |

**Generating `ENCRYPTION_KEY`:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Sources

- Existing codebase: `src/db/schema.ts` (workspace_settings precedent via notification_channels), `src/lib/permissions.ts` (RBAC pattern), `src/server/services/ticketService.ts` (service layer pattern)
- Next.js App Router body size: [GitHub Issue #57501](https://github.com/vercel/next.js/issues/57501), [proxyClientMaxBodySize docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/proxyClientMaxBodySize)
- Next.js SSE issues on Vercel: [GitHub Discussion #48427](https://github.com/vercel/next.js/discussions/48427), [Discussion #61972](https://github.com/vercel/next.js/discussions/61972)
- Drizzle transactions: [orm.drizzle.team/docs/transactions](https://orm.drizzle.team/docs/transactions)
- Gemini streaming SDK: [ai.google.dev/gemini-api/docs/text-generation](https://ai.google.dev/gemini-api/docs/text-generation)
- Neon/Vercel connection pooling: [neon.com/docs/guides/vercel-connection-methods](https://neon.com/docs/guides/vercel-connection-methods)
