# Technology Stack — AI Ticket Automation Additions

**Project:** Tika — AI Ticket Automation milestone
**Researched:** 2026-04-11
**Scope:** NEW dependencies only. Existing stack (Next.js 15, Drizzle ORM 0.38, Vercel Postgres, Zod 3.24) is not re-evaluated.

---

## Recommended Additions

### 1. Gemini API Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@google/genai` | `^1.48.0` | Gemini API client for server-side calls | Official GA SDK (May 2025). Replaces deprecated `@google/generative-ai` which ended support Nov 30 2025. Single package for both AI Studio and Vertex AI backends. |

**Model to use: `gemini-2.5-flash`**

Rationale:
- `gemini-2.5-flash` is positioned as the best price-performance model for high-volume, low-latency tasks — exactly the use case here (markdown analysis, structured output extraction).
- 2-million-token context window handles even very long markdown documents without truncation.
- `gemini-2.5-pro` is more capable but overkill for structured ticket extraction from markdown; cost-to-value ratio favors Flash.
- `gemini-2.0-flash` still valid but `2.5-flash` supersedes it with better benchmark results and the same pricing tier.
- **Do NOT use** `gemini-1.5-flash` — deprecated pricing tier, lower context window, worse benchmarks.

**Call pattern (Next.js API Route):**

```typescript
// app/api/ai/analyze/route.ts
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: decryptedKey });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: markdownText,
  config: {
    responseMimeType: 'application/json',
    systemInstruction: SYSTEM_PROMPT,
  },
});
```

**SDK vs REST:** Use the SDK. REST is maintenance overhead for token counting, retry logic, and response deserialization. The SDK handles all of this and is GA-stable.

**Confidence:** HIGH — verified against official Google AI docs and npm registry (v1.48.0 published April 2026).

---

### 2. AES-256-GCM Encryption

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js `crypto` (built-in) | Node 18+ (bundled with Next.js 15) | Encrypt/decrypt API key at rest | Zero new dependencies. `crypto.createCipheriv` / `createDecipheriv` with `aes-256-gcm` is the Node.js standard. GCM provides authenticated encryption — detects tampering without a separate HMAC. |

**Do NOT add:** `node-forge`, `crypto-js`, `aes-256-gcm` (npm), or any third-party encryption library. They add dependency surface area with no benefit over native `crypto` for this use case. `crypto-js` in particular is a browser shim and adds unnecessary weight in a server context.

**Implementation spec:**

```typescript
// src/lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;     // 96-bit IV — recommended for GCM
const KEY_BYTES = 32;    // 256-bit key

// ENCRYPTION_KEY env var must be 32-byte hex string (64 hex chars)
function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) throw new Error('ENCRYPTION_KEY must be 64 hex chars');
  return Buffer.from(hex, 'hex');
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Pack as: iv(12) + tag(16) + ciphertext — all hex-encoded in one string
  return Buffer.concat([iv, tag, encrypted]).toString('hex');
}

export function decrypt(stored: string): string {
  const key = getKey();
  const buf = Buffer.from(stored, 'hex');
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + 16);
  const ciphertext = buf.subarray(IV_BYTES + 16);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
```

**Storage format:** Single `text` column in PostgreSQL, storing hex-encoded `iv + authTag + ciphertext`. Packing all three into one field eliminates the need for separate columns and simplifies schema. Hex encoding avoids bytea driver complications with Drizzle.

**Key generation (one-time, run locally):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Store output as `ENCRYPTION_KEY` environment variable in Vercel.

**Confidence:** HIGH — Node.js official docs, no external source required.

---

### 3. Encrypted Secret Storage in PostgreSQL (Drizzle ORM)

**Column type: `text`** (not `bytea`)

Rationale:
- Drizzle ORM has limited native `bytea` support — requires a custom type workaround (tracked in drizzle-team/drizzle-orm issue #3902). Not worth the friction for a single field.
- Hex-encoded encrypted string fits naturally in `text`. Readable in Drizzle Studio. No driver encoding issues.
- `varchar(512)` is an acceptable alternative but `text` is simpler and has no performance difference for a single-row settings record.

**Schema design:**

```typescript
// src/db/schema.ts (addition)
export const workspaceAiSettings = pgTable('workspace_ai_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .unique()                              // one row per workspace
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  encryptedApiKey: text('encrypted_api_key').notNull(),  // hex: iv + tag + ciphertext
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

**Why `unique()` on `workspaceId`:** Enforces the "one system-wide API key per workspace" requirement at the DB level. Upsert on conflict is the write pattern.

**What NOT to store:** Never store the raw API key, the `ENCRYPTION_KEY` itself, or the IV/tag as separate columns — keep them packed in the single `encryptedApiKey` field so partial column reads cannot reconstruct the plaintext.

**Confidence:** HIGH for schema design rationale. MEDIUM for Drizzle `bytea` limitation (based on GitHub issue, could be fixed in later Drizzle versions — but `text` remains the safer choice regardless).

---

### 4. Markdown Parsing (Server-Side)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `remark` | `^15.0.0` | Markdown → AST (mdast) | Standard in the unified ecosystem. Produces typed AST nodes with `type`, `depth`, `children`. Handles heading hierarchy natively. |
| `remark-gfm` | `^4.0.1` | GitHub Flavored Markdown support | Required for `- [ ]` task list item parsing. Without this plugin, checkboxes are not recognized as `listItem` nodes with `checked` property. |

**Do NOT use:**
- `marked` — produces HTML strings, not AST. Requires regex post-processing to extract hierarchy. Wrong tool for structured extraction.
- `markdown-it` — same issue. HTML output, not a traversable tree.
- Custom regex parser — brittle, hard to maintain, will break on edge cases (nested lists, multiline items, escaped characters).

**Why remark wins for this use case:** The project needs to traverse heading depth (`#`, `##`, `###`) to build Goal/Story/Feature/Task hierarchy AND detect `- [ ]` checklist items. `remark` gives AST nodes where `heading.depth` maps directly to hierarchy level, and `remark-gfm` adds `listItem.checked` for task items. No custom parsing logic needed for the tree structure — just walk the AST.

**Parsing strategy (no additional library needed):**

```typescript
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';  // bundled with remark ecosystem

const tree = remark().use(remarkGfm).parse(markdownText);
// tree.children gives top-level nodes
// heading nodes: { type: 'heading', depth: 1|2|3, children: [{ type: 'text', value: '...' }] }
// list item nodes: { type: 'listItem', checked: true|false|null, children: [...] }
```

**Note on `unist-util-visit`:** Already transitively available via `remark`. Import explicitly for clarity but no separate install needed in most cases. Verify with `npm ls unist-util-visit` after installing remark.

**Confidence:** HIGH — remark/unified ecosystem is mature, actively maintained, compatible with Node.js 18+. Version numbers verified against npm registry.

---

## Installation

```bash
# New production dependencies
npm install @google/genai remark remark-gfm

# No new dev dependencies required
# Node.js built-in crypto covers encryption — no install needed
```

**New environment variables to add:**

| Variable | Required | Purpose |
|----------|----------|---------|
| `ENCRYPTION_KEY` | Yes | 64-char hex string (32 bytes). Generate once: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GEMINI_API_KEY` | No | Not stored in env — stored encrypted in DB per workspace. Set only for local dev testing. |

---

## Alternatives Considered

| Category | Recommended | Rejected | Reason Rejected |
|----------|-------------|----------|-----------------|
| Gemini SDK | `@google/genai` | `@google/generative-ai` | Deprecated Nov 30 2025, no new features |
| Gemini SDK | `@google/genai` | Vercel AI SDK (`@ai-sdk/google`) | Extra abstraction layer; Gemini-specific JSON mode and structured output is better controlled via native SDK |
| Encryption | Node.js `crypto` | `node-forge`, `crypto-js` | Browser shims, unnecessary weight, no benefit on server |
| Encryption | Node.js `crypto` | `@noble/ciphers` | No benefit over native for AES-256-GCM specifically |
| DB column | `text` (hex) | `bytea` | Drizzle bytea requires custom type workaround; hex in text is simpler with no performance cost for a single API key |
| MD parser | `remark` + `remark-gfm` | `marked`, `markdown-it` | HTML output only; cannot traverse AST for hierarchy |
| MD parser | `remark` + `remark-gfm` | Custom regex | Brittle, unmanageable edge cases |

---

## Sources

- [@google/genai npm](https://www.npmjs.com/package/@google/genai) — v1.48.0, last published 7 days ago (April 2026)
- [Gemini API Libraries — Google AI](https://ai.google.dev/gemini-api/docs/libraries) — `@google/genai` is the only recommended JS/TS package
- [Gemini Models — Google AI](https://ai.google.dev/gemini-api/docs/models) — gemini-2.5-flash positioned as best price-performance
- [googleapis/js-genai GitHub](https://github.com/googleapis/js-genai) — SDK targets Gemini 2.0+ features, examples use gemini-2.5-flash
- [Migrate to Google GenAI SDK](https://ai.google.dev/gemini-api/docs/migrate) — @google/generative-ai deprecated Nov 30 2025
- [Node.js crypto AES-256-GCM guide](https://medium.com/@tony.infisical/guide-to-nodes-crypto-module-for-encryption-decryption-65c077176980) — IV=12 bytes, key=32 bytes, tag required
- [Drizzle ORM PostgreSQL column types](https://orm.drizzle.team/docs/column-types/pg) — bytea supported natively in docs
- [Drizzle bytea custom type issue #3902](https://github.com/drizzle-team/drizzle-orm/issues/3902) — practical friction with bytea in current Drizzle
- [remark-gfm npm](https://www.npmjs.com/package/remark-gfm) — v4.0.1, compatible with remark@15+
- [remark GitHub](https://github.com/remarkjs/remark) — current release remark@15, Node.js 16+ compatible
