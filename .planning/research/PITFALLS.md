# Domain Pitfalls

**Domain:** AI ticket automation — encrypted API key storage, Gemini API integration, bulk ticket creation
**Project:** Tika v0.3 (AI Ticket Automation milestone)
**Researched:** 2026-04-11
**Confidence:** HIGH (most claims verified against official docs, CVE disclosures, and Node.js crypto documentation)

---

## Critical Pitfalls

Critical mistakes that cause security breaches, data corruption, or require complete rewrites.

---

### Pitfall 1: AES-256-GCM Nonce (IV) Reuse

**What goes wrong:**
Two different Gemini API key encryptions use the same 12-byte IV. This completely breaks GCM's authenticated encryption: an attacker who can observe two ciphertexts can recover the keystream and forge authentication tags on arbitrary ciphertexts. Full plaintext recovery of both messages becomes possible via XOR.

**Why it happens:**
Developers copy a `crypto.randomBytes(12)` call from a tutorial but place it outside the encryption function, accidentally reusing the same buffer across multiple calls. Or they persist the IV in a constant (e.g., derived from the workspace ID) thinking "only one key per workspace, so reuse is fine."

**Tika-specific context:**
Each workspace has one system Gemini API key. A key rotation (update) event encrypts the new key — if the update handler reuses the previous stored IV, both the old and new ciphertext are compromised. This is especially dangerous because Tika stores `encryptedKey || iv || authTag` in the same DB column.

**Consequences:**
- Attacker who reads the DB column recovers the raw Gemini API key (billing abuse, quota theft).
- GCM authentication tag forgery — the integrity guarantee of AES-GCM is entirely lost.
- No visible error at runtime; the encryption "works" and returns data normally.

**Prevention:**
Generate a fresh `crypto.randomBytes(12)` inside the encrypt function on every call — never pass IV as a parameter or reuse it. Structure:

```typescript
function encryptApiKey(plaintext: string, masterKey: Buffer): string {
  const iv = crypto.randomBytes(12); // MUST be inside the function, new every call
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  // ...
  return JSON.stringify({ iv: iv.toString('hex'), ciphertext, tag });
}
```

**Detection (warning signs):**
- IV stored in DB row and reused on UPDATE (check migration for an `iv` column that doesn't change on update).
- Unit tests that call encrypt twice and check IVs are different — failing or missing this test.

**Phase that must address this:** Phase 1 (API key storage implementation).

---

### Pitfall 2: ENCRYPTION_KEY Absent or Weak at Runtime

**What goes wrong:**
The `ENCRYPTION_KEY` environment variable is missing in production (Vercel), empty, or too short. The decryption step at Gemini API call time throws an unhandled exception. Worse: the code falls back to a hardcoded dev key, encrypting production data with a key committed to git.

**Why it happens:**
Vercel environment variables are set per-environment; developers set them locally in `.env.local` but forget to set them in Vercel dashboard for `production` or `preview`. A fallback like `process.env.ENCRYPTION_KEY ?? 'dev-secret-key'` silently poisons production.

**Tika-specific context:**
The `PROJECT.md` spec says `ENCRYPTION_KEY` must be a server environment variable. If this variable is absent at the moment a MEMBER/VIEWER triggers any code path that reads the API key (even indirectly), the entire analysis endpoint crashes with a 500. No graceful fallback possible because there is no fallback — the data is unrecoverable without the original key.

**Consequences:**
- Production API key permanently unrecoverable if `ENCRYPTION_KEY` changes without re-encrypting existing rows.
- If a dev key is used in production, any developer with repo access can decrypt the Gemini API key from a DB backup.

**Prevention:**
- Validate `ENCRYPTION_KEY` at server startup (module load time): `if (!process.env.ENCRYPTION_KEY || Buffer.from(process.env.ENCRYPTION_KEY, 'hex').length !== 32) throw new Error('ENCRYPTION_KEY missing or invalid length')`.
- Never provide a default value. A startup crash is better than silently using a weak key.
- Document the key generation command in `.env.example`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- Key rotation procedure: decrypt all stored keys with old key → re-encrypt with new key → swap env var atomically. Without this, all stored keys become permanently unreadable after rotation.

**Detection (warning signs):**
- `process.env.ENCRYPTION_KEY ?? 'fallback'` anywhere in the codebase.
- Vercel deployment logs showing 500 on the first AI analysis attempt.
- `.env.example` missing `ENCRYPTION_KEY` entry.

**Phase that must address this:** Phase 1 (environment setup and startup validation).

---

### Pitfall 3: Gemini API Call Inside Vercel Serverless Function Hits Timeout

**What goes wrong:**
The AI analysis endpoint calls Gemini API synchronously from a Next.js Route Handler. Gemini 2.5 Flash (thinking models) regularly takes 30-120 seconds for large inputs. Vercel Hobby plan caps serverless functions at 60 seconds; Pro plan defaults to 15 seconds (configurable up to 300 seconds). Large markdown files on the free tier reliably time out, producing a 504 with no partial result.

**Why it happens:**
Next.js Route Handlers are standard serverless functions on Vercel. There is no background job system in the current Tika architecture (no WebSocket, no queue). Developers assume the function will "just work" because Gemini API calls succeed in local dev (no timeout).

**Tika-specific context:**
Tika is deployed on Vercel. The analysis flow is: client uploads MD file → POST `/api/ai/analyze` → server calls Gemini → parses response → bulk inserts tickets. This entire chain is synchronous. A 10KB markdown file with 80+ checklist items can take 45-90 seconds on Gemini 2.5 Flash.

**Consequences:**
- User sees a spinner that ends in an error. No tickets are created.
- If the DB insert began before the timeout, a partial write may have occurred (mitigated by transaction use).
- On retry, user pays double token cost.

**Prevention:**
- Set `export const maxDuration = 300` in the route file (requires Vercel Pro plan).
- Add explicit `AbortSignal` timeout on the Gemini fetch: `signal: AbortSignal.timeout(240_000)` to allow graceful error before Vercel hard-kills the function.
- Add client-side polling with a reasonable timeout indicator in the UI (show "Analysis may take up to 2 minutes" warning).
- For Hobby plan: enforce a hard token limit (e.g., 8,000 input tokens / ~32KB of text) to keep calls under 30 seconds.

**Detection (warning signs):**
- Response time in Vercel function logs exceeding 10 seconds during local testing with large files.
- `504 Gateway Timeout` in Vercel deployment logs.
- Missing `maxDuration` export in the route handler file.

**Phase that must address this:** Phase 2 (Gemini API integration).

---

### Pitfall 4: RBAC Not Re-Checked at the API Key Retrieval/Use Layer

**What goes wrong:**
The settings UI enforces OWNER-only access via frontend route guards and component rendering logic. However, the actual `/api/ai/analyze` endpoint (which internally fetches and decrypts the API key) only checks `TEAM_ROLE.MEMBER` or omits the RBAC check entirely, assuming the UI already blocked non-owners.

**Why it happens:**
The feature design says "OWNER sets the key, everyone can use AI analysis." This makes developers add OWNER-only checks only on the key management endpoints (`/api/ai/keys`) but not on the analysis endpoint. The Gemini key usage (decrypt + call) happens inside the analysis handler, never explicitly checked.

**Tika-specific context:**
Existing `requireRole` pattern in `src/lib/permissions.ts` is sound — but it must be called with the correct minimum role. The analysis endpoint should be accessible by MEMBER and above (VIEWER is read-only), but the decrypted key must never be returned to the client — only used server-side. The critical mistake is returning the decrypted key or encrypted blob in any API response.

**Consequences:**
- A VIEWER with network inspection tools can call the analysis endpoint directly (bypassing UI).
- If the encrypted key is accidentally included in any API response (e.g., workspace settings endpoint returns `notificationChannels` row that includes `aiConfig`), the client can attempt decryption offline.

**Prevention:**
- Apply `requireRole(userId, workspaceId, TEAM_ROLE.MEMBER)` on the analysis endpoint.
- Apply `requireRole(userId, workspaceId, TEAM_ROLE.OWNER)` on all key CRUD endpoints.
- The `encryptedKey`, `iv`, and `authTag` fields must never appear in any API response — add explicit field exclusion in the DB query, not just in the serializer.
- Audit: `grep -r "encryptedKey\|apiKey\|geminiKey" app/api/` to verify no response leaks.

**Detection (warning signs):**
- Any API endpoint that returns workspace settings data also returning fields from the `workspace_ai_config` table.
- Missing `requireRole` call in the analysis route handler.
- Frontend RBAC check without a corresponding server-side check in the handler.

**Phase that must address this:** Phase 1 (key management) and Phase 2 (analysis endpoint).

---

### Pitfall 5: CVE-2025-29927 — Next.js Middleware Authorization Bypass

**What goes wrong:**
An attacker sends a crafted `x-middleware-subrequest` header to bypass Next.js middleware auth checks. If OWNER-only routes are protected only via middleware (not in the Route Handler itself), any unauthenticated request with this header reaches the handler.

**Why it happens:**
The vulnerability (CVSS 9.1, fixed in Next.js 14.2.25 and 15.2.3) affected all versions from 11.x to 15.x. Teams that updated Next.js after the March 2025 disclosure are protected, but the architectural lesson remains: middleware-only auth is never sufficient.

**Tika-specific context:**
Tika's existing RBAC pattern correctly applies `requireRole` inside each Route Handler (not middleware-only). The new AI key management routes must follow the same pattern. The risk is a developer who adds a quick `/api/ai/keys` route that checks auth via middleware but skips the in-handler `requireRole` call.

**Consequences:**
- Complete authentication bypass for the AI key management endpoint.
- Attacker can retrieve, update, or delete the Gemini API key for any workspace.

**Prevention:**
- Ensure Next.js >= 15.2.3 is installed (verify `package.json`).
- Follow existing Tika convention: every Route Handler that mutates data calls `requireRole` explicitly, regardless of middleware.
- Never rely on middleware as the sole auth gate for sensitive endpoints.

**Detection (warning signs):**
- `next` version in `package.json` below 15.2.3.
- Any new Route Handler missing the `auth()` + `requireRole()` two-step at the top of the handler.

**Phase that must address this:** Phase 1 (security setup), applies to all phases.

---

## Moderate Pitfalls

Mistakes that cause incorrect behavior, data inconsistency, or poor UX — but do not cause security breaches.

---

### Pitfall 6: AI Returns Semantically Valid JSON but Tickets Are Malformed

**What goes wrong:**
Gemini's structured output (`responseMimeType: 'application/json'`) guarantees syntactically valid JSON matching the schema. It does NOT guarantee semantically correct values. A ticket title may be `null`, an array field may be empty, a `type` field may be a valid enum value that doesn't match the intended hierarchy level (e.g., every ticket returns as `TASK`, no `GOAL` or `STORY`).

**Why it happens:**
The Gemini API documentation explicitly states: "Structured output does not guarantee that values are semantically correct." The schema enforces shape but not meaning. Complex prompts with ambiguous markdown structure produce inconsistent hierarchy mapping.

**Tika-specific context:**
The `createTicketSchema` in `src/lib/validations.ts` requires `title` to be non-empty and max 200 chars. The `type` field must be `GOAL|STORY|FEATURE|TASK`. If Gemini returns a title longer than 200 chars or an empty title, the existing Zod validation will reject it and the entire bulk creation fails.

**Consequences:**
- If bulk create uses a single DB transaction (correct approach), one malformed ticket causes complete rollback — user sees "0 tickets created" after a 60-second wait.
- If bulk create does NOT use a transaction (incorrect approach), 40 of 50 tickets are created, the board is half-populated with an inconsistent hierarchy, and the user has no way to know which tickets were skipped.

**Prevention:**
- Validate every ticket from the AI response against `createTicketSchema` before opening the DB transaction. Collect all validation errors first, return them to the user, and create nothing.
- Enforce title length in the AI prompt: explicitly tell Gemini "title must be under 200 characters".
- Truncate titles defensively server-side as a last resort (prefer prompt engineering over silent truncation).
- Add a Zod pre-parse transformer that trims whitespace and enforces max length on AI-generated titles.
- Return a structured result to the client: `{ created: N, skipped: M, errors: [...] }`.

**Detection (warning signs):**
- Gemini prompt does not include explicit field length constraints.
- Bulk create handler does not validate before opening the transaction.
- No test covering the "Gemini returns malformed JSON" path.

**Phase that must address this:** Phase 2 (Gemini integration + parsing layer).

---

### Pitfall 7: Bulk Ticket Insert Without DB Transaction Causes Partial Hierarchy

**What goes wrong:**
Creating 20 tickets (1 Goal, 3 Stories, 8 Features, 8 Tasks) in a loop without a transaction. If the process fails at ticket #14, the first 13 tickets are permanently committed. The Goal and Stories have no Tasks under them. The user does not see an obvious error and tries again, creating duplicate partial hierarchies.

**Why it happens:**
The existing `ticketService.create()` in `src/server/services/ticketService.ts` creates single tickets without a transaction wrapper. Developers iterate and call it in a loop, assuming optimistic success.

**Tika-specific context:**
Tika uses Drizzle ORM which supports `db.transaction(async (tx) => { ... })`. The `reorder` service already uses transactions correctly. The AI bulk creation service must do the same: insert all tickets within one transaction, capture all `parentId` relationships only after all IDs are resolved.

**Consequences:**
- Orphaned tickets with `parentId` pointing to a ticket that was never created (if parent failed mid-transaction).
- Ticket count limit (`TICKET_MAX_PER_WORKSPACE`) might be partially consumed by failed bulk inserts if checked outside the transaction.

**Prevention:**
- Wrap all bulk inserts in a single `db.transaction()`.
- Resolve ticket IDs in two passes: first insert all parent-less tickets (Goal, then Story/Feature in dependency order), collect returned IDs, then insert children with correct `parentId`.
- Check and reserve the ticket count limit before the transaction to avoid wasting DB round-trips inside the transaction.

**Detection (warning signs):**
- Bulk create service calls `ticketService.create()` in a `for` loop without a wrapping transaction.
- Unit test that simulates a failure at ticket #N and verifies 0 tickets were committed.

**Phase that must address this:** Phase 2 (bulk creation service).

---

### Pitfall 8: Token Cost Explosion from Large Markdown Files

**What goes wrong:**
A user uploads a 500KB markdown export from Notion with embedded base64 images, HTML tables, and thousands of lines. The Gemini API call consumes 300,000+ input tokens. At Gemini 2.0 Flash pricing ($0.10/1M tokens), a single request costs ~$0.03 — acceptable in isolation, but a workspace with multiple members repeating this daily produces unexpected billing.

More critically: the Gemini API has per-minute token limits (TPM). Free tier is ~250,000 TPM. A single 300K-token file exceeds the free tier TPM in one request, triggering a 429 error.

**Why it happens:**
`PROJECT.MD` specifies "긴 문서 업로드 시 토큰 소모 경고 표시" (show token warning on long uploads), but there is no hard upper limit specified. Without a server-side limit, the file size guard (currently `MAX_FILE_SIZE = 10MB` in attachments route) allows files far larger than practical for LLM input.

**Tika-specific context:**
The attachment upload handler already has a 10MB limit. But 10MB of markdown text is approximately 2.5 million tokens — 2500x the Gemini free tier TPM limit. The new AI analysis endpoint needs a separate, much lower limit.

**Prevention:**
- Hard-limit markdown input to ~100KB (roughly 25,000 tokens) for the analysis endpoint — this is separate from the 10MB attachment limit.
- Use Gemini's `countTokens` API before the main `generateContent` call to get the exact token count.
- Return a 400 error with estimated cost if the token count exceeds the threshold, requiring explicit user confirmation.
- Never pass binary data (images, PDFs) through the markdown analysis path — strip non-text content before tokenization.

**Detection (warning signs):**
- Analysis endpoint applies the same `MAX_FILE_SIZE = 10MB` limit from the attachment route.
- No `countTokens` pre-check before the Gemini call.
- No server-side byte limit distinct from the attachment file size limit.

**Phase that must address this:** Phase 2 (Gemini integration) and Phase 1 UI (token warning).

---

### Pitfall 9: API Key Masking Leaks Key Length or Actual Value

**What goes wrong:**
The spec requires masking as "앞 5자 + `*` × 나머지 길이 + 뒤 5자." If the server computes this mask and returns it in the GET endpoint response, it inadvertently reveals the key's exact length. More critically: if the GET response returns the raw encrypted blob (ciphertext + IV + tag) so the frontend can "show" something, an attacker with DB read access can attempt offline decryption.

**Why it happens:**
Developers return the masked representation computed from the decrypted key on every GET request. This means the server decrypts the key on every admin page load — unnecessary key material handling.

**Tika-specific context:**
The masking format "앞 5자 + `*` × 나머지 길이 + 뒤 5자" reveals exact key length (e.g., a 51-character key produces 41 asterisks). Google API keys are consistently 39 characters (`AIza...`), so the mask reveals almost nothing. Compute and store the masked representation at write time, never decrypt at read time for display.

**Prevention:**
- Compute and store the masked string in a separate DB column (`maskedKey`) at the time the key is first saved or updated.
- The GET endpoint returns only `maskedKey` — never the ciphertext, IV, tag, or decrypted value.
- The decrypted key is only ever accessed in the server-side service that calls Gemini — never returned to any client response.

**Detection (warning signs):**
- GET `/api/workspaces/[id]/ai-config` response body contains `encryptedKey`, `iv`, `tag`, or `ciphertext`.
- Server decrypts the key inside a GET handler (any decrypt call in a read-only handler is a red flag).

**Phase that must address this:** Phase 1 (key management API).

---

### Pitfall 10: Ticket Position Collision During Bulk Insert

**What goes wrong:**
The existing `ticketService.calculatePosition()` computes `minPosition - 1024` for each new BACKLOG ticket. In a bulk insert of 20 tickets created sequentially, all 20 calls to `calculatePosition` see the same initial `minPosition` (because the transaction hasn't committed yet), and all 20 tickets receive `position = 0 - 1024 = -1024`. The board displays all 20 tickets stacked at the same position with undefined ordering.

**Why it happens:**
`calculatePosition` queries the DB for the current minimum position. Inside a transaction, previously inserted rows within the same transaction are visible — but only if the ORM passes the transaction context (`tx`) to the query. If the bulk insert calls the existing `ticketService.create()` (which uses `db` not `tx`), it reads the committed state before the transaction, not the in-progress inserts.

**Tika-specific context:**
Existing `ticketService.calculatePosition` uses `db` (global connection). The bulk insert service must either: (a) use a sequence counter offset instead of a DB query inside the transaction, or (b) pre-calculate all positions before opening the transaction.

**Prevention:**
- For bulk inserts, pre-calculate positions as an offset sequence: `basePosition - (1024 * i)` for index `i`, where `basePosition` is fetched once before the transaction loop starts.
- Do NOT call `calculatePosition()` inside the transaction loop for bulk operations.

**Detection (warning signs):**
- Bulk insert service calls `calculatePosition()` in a loop inside a transaction.
- Board renders with multiple tickets at `position = -1024` after a bulk AI import.

**Phase that must address this:** Phase 2 (bulk creation service).

---

## Minor Pitfalls

Low severity, manageable with basic care.

---

### Pitfall 11: Gemini API 429 Not Retried With Exponential Backoff

**What goes wrong:**
A single workspace hits the Gemini free-tier RPM (15 RPM for Gemini 2.0 Flash) or TPM limit. The analysis endpoint returns a 429 immediately with no retry logic. The client receives a generic 500 error with no indication that retrying after 60 seconds would succeed.

**Prevention:**
- Distinguish 429 responses from Gemini and return a specific error code (`AI_RATE_LIMITED`) with a `retryAfter` field.
- Consider a single server-side retry with 1-second delay for transient 429s (not suitable for TPM-exhausted 429s).
- Surface the specific reason in the UI: "AI service is temporarily at capacity. Please try again in 60 seconds."

**Phase that must address this:** Phase 2 (error handling).

---

### Pitfall 12: Existing Ticket Limit Enforcement Not Applied to Bulk AI Import

**What goes wrong:**
`POST /api/tickets` checks `TICKET_MAX_PER_WORKSPACE` before each single ticket creation. The new bulk import endpoint bypasses this by inserting directly or calling a different service path. A user with a 490/500 ticket workspace imports 50 AI-generated tickets, pushing the count to 540 — exceeding the limit silently.

**Prevention:**
- Pre-check available capacity before opening the bulk insert transaction: `capacity = maxTickets - currentCount`. If `capacity < requestedCount`, return a 400 error explaining the shortfall.
- Apply the same `TICKET_MAX_PER_WORKSPACE` / `TICKET_MAX_TEAM_WORKSPACE` constants from `src/lib/constants.ts`.

**Phase that must address this:** Phase 2 (bulk creation service).

---

### Pitfall 13: Non-ASCII Filename in FormData Upload Fails Parsing

**What goes wrong:**
A user uploads a markdown file with a Korean or Japanese filename (e.g., `업무계획.md`). Next.js 15 has a known bug (GitHub issue #76893) where `Failed to parse body as FormData` is thrown for non-ASCII filenames in multipart requests on certain versions.

**Prevention:**
- On the client side, rename the file to a sanitized ASCII name before upload: `new File([blob], 'analysis.md', { type: 'text/markdown' })`.
- Read file content as text on the client and send it as a plain `application/json` body (not FormData), avoiding multipart parsing entirely for text files.

**Phase that must address this:** Phase 1 UI (upload component).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| API key storage DB schema | Missing `maskedKey` column — forces decrypt on every display | Add `masked_key` column at schema design time |
| ENCRYPTION_KEY environment setup | Not documented in `.env.example` → empty in production | Add startup validation + `.env.example` entry |
| Gemini API integration | Synchronous call times out on Vercel | Set `maxDuration = 300`, add AbortSignal |
| Structured output parsing | AI returns title > 200 chars → Zod rejects entire batch | Validate all before transaction, not inside |
| Bulk ticket creation | Position collision in same-transaction batch | Pre-calculate positions outside transaction |
| Token size guard | Markdown file size ≠ token count | Enforce byte limit AND pre-check with countTokens |
| Admin settings UI | Frontend-only OWNER guard without handler check | requireRole(OWNER) in every key management handler |
| Key rotation | Changing ENCRYPTION_KEY without re-encrypting DB rows | Document rotation procedure; no-fallback startup validation |
| CVE-2025-29927 | Middleware-only auth for new AI routes | Verify Next.js >= 15.2.3; add handler-level requireRole |

---

## Sources

- [Attacks on GCM with Repeated Nonces (elttam)](https://www.elttam.com/blog/key-recovery-attacks-on-gcm/) — HIGH confidence
- [Node.js crypto.timingSafeEqual documentation](https://nodejs.org/api/crypto.html) — HIGH confidence
- [Gemini API Rate Limits (official)](https://ai.google.dev/gemini-api/docs/rate-limits) — HIGH confidence
- [Gemini API Structured Output limitations (official)](https://ai.google.dev/gemini-api/docs/structured-output) — HIGH confidence
- [CVE-2025-29927: Next.js Middleware Authorization Bypass (ProjectDiscovery)](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass) — HIGH confidence
- [Vercel Function Duration Limits (official)](https://vercel.com/docs/functions/configuring-functions/duration) — HIGH confidence
- [Next.js 15 large file upload binary data drop (GitHub #86985)](https://github.com/vercel/next.js/discussions/86985) — MEDIUM confidence
- [Next.js 15 non-ASCII FormData filename bug (GitHub #76893)](https://github.com/vercel/next.js/issues/76893) — MEDIUM confidence
- [Drizzle ORM Transactions (official)](https://orm.drizzle.team/docs/transactions) — HIGH confidence
- [Gemini API Pricing (official)](https://ai.google.dev/gemini-api/docs/pricing) — HIGH confidence
- [AES Encryption Key Management Best Practices (Key Wrapping)](https://dev.ubiqsecurity.com/docs/key-mgmt-best-practices) — MEDIUM confidence
- [Gemini 2.5 Flash timeout 120s issue (Google Dev Forum)](https://discuss.ai.google.dev/t/gemini-2-5-flash-api-request-timeouting-after-120-seconds/80305) — MEDIUM confidence
