# Feature Landscape: AI Ticket Automation

**Domain:** AI-powered kanban ticket generation from markdown documents
**Researched:** 2026-04-11
**Confidence:** MEDIUM-HIGH (UX patterns from multiple sources; Gemini specifics from official docs)

---

## Table Stakes

Features users expect. Missing any of these = the flow feels broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Step-by-step progress states during AI processing | Users need feedback: "uploading → analyzing → generating → done" — silence during async AI calls causes abandonment | Low | Four discrete states: idle, uploading, analyzing, done/error |
| Preview pane before committing tickets | AI output must be reviewable before it lands in Backlog — no "surprise 30 tickets just appeared" | Medium | Checklist-style preview with select/deselect per item |
| File size / token count warning | Gemini 2.5 Flash charges $0.30/M input tokens; large MD files should warn before calling the API | Low | Estimate tokens client-side (~4 chars/token), warn above ~50K chars |
| Inline error with retry | API call failure should surface the error message and offer a retry button — not a blank state | Low | Show Gemini error code if available; fallback to generic message |
| API key masking in settings UI | Showing a raw API key on screen is a security anti-pattern — users expect partial masking | Low | Display: first 5 chars + asterisks + last 5 chars (matches PROJECT.md spec) |
| One-time reveal on save | Industry standard (OpenAI, Stripe, Datadog): key is shown once immediately after save, masked forever after | Low | Copy-to-clipboard button shown only in the post-save confirmation state |
| OWNER-only access to AI settings | Admin-gated settings page is standard SaaS pattern — non-owners seeing it creates confusion and security risk | Low | Menu entry + settings section completely hidden from MEMBER/VIEWER |
| Confirm before bulk create | Creating 10–30 tickets is irreversible without manual cleanup — users need "Create N tickets" confirmation | Low | Count summary in confirm dialog: "Create 12 tickets in Backlog?" |
| Success toast with count | After committing, confirm how many tickets were created — reduces post-action confusion | Low | "12 tickets added to Backlog" toast |
| Flexible hierarchy (Goal → Task shortcut) | Not all markdown has 4 levels — force-fitting 4 levels breaks short checklists | Medium | Parser must support Goal → Task direct link; Story/Feature optional |

---

## Differentiators

Features that make this stand out. Users won't leave without them, but will prefer Tika over alternatives if these exist.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Select/deselect individual generated tickets in preview | Fine-grained control before commit: user can exclude irrelevant AI suggestions without editing the raw file | Medium | Checkbox per item in preview; "Select All / Deselect All" header toggle |
| Editable ticket fields inline in preview | User can fix AI-generated title or change ticket type before committing — no round-trip needed | High | Inline edit on title and ticket type (Goal/Story/Feature/Task) |
| Live token estimate counter | Show estimated token count as user types/pastes into the file upload area before submitting — prevents surprise costs | Medium | `charCount / 4` approximation displayed as "~X tokens"; highlight orange/red above threshold |
| Drag-to-reorder generated tickets in preview | Preview acts as mini pre-board — user can establish initial ordering before Backlog insertion | High | dnd-kit reorder within preview list; order preserved on create |
| AI key validity check on save | After OWNER saves API key, ping Gemini with a minimal probe request to confirm the key works | Medium | `generateContent({ contents: 'ping' })` with 1-token cap; show green checkmark or error inline |
| Markdown structure hint tooltip | Upload UI shows a collapsible "How to format your file" guide with a concrete MD example | Low | Teaches `# Goal`, `## Story`, `- [ ] Task` convention inline |

---

## Anti-Features

Things to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Per-user API key management | PROJECT.md explicitly resolved this: system-wide key is the right model for a single-admin workspace | One key per workspace, managed by OWNER only |
| Multi-LLM provider selector | Scope creep — adds config surface area, UI complexity, and test burden with no validated user demand | Gemini only for v1; add toggle in future milestone if users request it |
| Auto-create without preview | Removes user agency; AI output quality varies — silent bulk creation destroys trust | Always show preview step before any ticket is written to DB |
| Rollback / undo after create | Complex to implement correctly (soft-delete with TTL? batch delete API?); preview step makes it unnecessary | Solve at the preview step, not after commit |
| Real-time streaming AI output in preview | WebSocket/SSE adds infrastructure complexity; ticket generation is fast enough (< 5s for typical MD file) | Single request, spinner, reveal full result |
| File history / re-analyze past uploads | Adds storage complexity; one-shot upload model is simpler and sufficient | Upload each time; no server-side file retention after processing |
| Token billing dashboard | Out of scope; OWNER manages their own Gemini account billing | Surface only a pre-call token estimate warning |
| Gemini Fine-tuning or custom model config | No validated need; adds per-workspace config complexity | Use `gemini-2.5-flash` (or `gemini-2.0-flash`) with a fixed system prompt |
| Markdown editor built into UI | Users already have editors; adding one is scope creep | Accept `.md` file upload or paste-in textarea |

---

## Feature Dependencies

```
[OWNER sets Gemini API key] → [AI Upload UI is available to any role]
  └── [API key validity check] runs on save

[File Upload / Paste input] → [Client-side token estimate warning]
  └── [Submit to server] → [Server decrypts API key] → [Gemini API call]
    └── [Parse structured JSON response] → [Build preview tree]
      └── [User selects/deselects tickets] → [Confirm dialog] → [Bulk DB insert]
        └── [Success toast with count]

[DB insert] → tickets land in Backlog column with status = BACKLOG
  └── Inherits existing ticket CRUD / kanban rules

[RBAC check: OWNER only] → [AI Settings page visible]
  └── [MEMBER / VIEWER] → AI menu entry completely hidden (not just disabled)
```

---

## UX Pattern Detail: "Upload Doc → AI Generates Items" Flow

Based on research from Shape of AI (shapeof.ai), Jira AI guide (Atlassian), and PatternFly bulk selection patterns:

### Recommended 4-State Flow

```
State 1: IDLE
  - Drag-drop zone + "Upload .md file" button
  - "Paste markdown" textarea tab (alternative entry)
  - Token estimate counter updates live as text is entered
  - Warning banner appears if estimate > 50K tokens (~200KB file)

State 2: PROCESSING
  - Spinner or skeleton loader
  - Status label cycles: "Reading file..." → "Analyzing structure..." → "Generating tickets..."
  - Cancel button available (abort fetch)

State 3: PREVIEW
  - Tree view: Goal > Story > Feature > Task indented hierarchy
  - Checkbox per item (all checked by default)
  - Select All / Deselect All header controls
  - Editable title inline (differentiator)
  - Ticket type badge (Goal/Story/Feature/Task) with dropdown to change
  - "Create X tickets" CTA button (count updates as user checks/unchecks)
  - "Start over" button to discard and return to State 1

State 4: SUCCESS / ERROR
  - Success: toast "N tickets added to Backlog" + auto-navigate to Board
  - Error: inline error block with Gemini error message + "Try again" button
```

---

## UX Pattern Detail: Admin API Key Settings

Based on research from better-auth-ui component patterns, OpenAI admin key docs, MultitaskAI best practices:

### Recommended Key Management UX

```
Empty state:
  - "No API key configured" placeholder
  - "Add API Key" button (OWNER only, hidden from MEMBER/VIEWER)

Add flow:
  - Input field: type or paste key
  - "Save Key" button
  - On save: validate with Gemini probe → show "Key valid" or inline error
  - After save: key is masked immediately (first 5 + asterisks + last 5)
  - One-time copy button shown in post-save confirmation before masking

Active state (key exists):
  - Masked display: "AIzaS...xK9mP" 
  - "Replace Key" button → opens same Add flow, overwrites on save
  - "Delete Key" button → ConfirmDialog ("Deleting the key will disable AI features. Continue?")
  - No "reveal full key" toggle — security best practice; key is write-only after save

Key lifecycle note:
  - Gemini API keys do not expire server-side; rotation is manual
  - Show "Last updated: [date]" metadata for operator awareness
```

---

## UX Pattern Detail: Token / Cost Warnings

Based on Gemini 2.0/2.5 Flash pricing research:

### Recommended Warning Thresholds

```
Gemini 2.5 Flash: $0.30 per million input tokens
Rough estimate: 1 token ~= 4 characters in English

File size thresholds for warnings:
  - < 50K chars  (~12.5K tokens, ~$0.004): No warning
  - 50K–200K chars  (~50K tokens, ~$0.015): Yellow advisory "Large file — this may take longer"
  - > 200K chars  (~50K+ tokens, ~$0.015+): Orange warning "Very large file — consider trimming to relevant sections"
  - > 800K chars (~200K tokens, ~$0.06): Red hard warning + require acknowledgment checkbox before submit

Note: At $0.30/M tokens, even 1M token input costs $0.30 — cost warnings are advisory,
not blockers. Primary concern is response latency and Gemini rate limits (RPD: 500-1500/day free tier).
```

---

## MVP Recommendation

Build in this order for minimum viable but trustworthy release:

### Must ship (blockers):
1. OWNER-only API key settings screen with AES-256-GCM encrypted storage
2. Masked display + one-time copy pattern
3. API key validity probe on save
4. File upload UI with 4-state progress flow
5. Gemini structured output with Zod schema → JSON parse
6. Preview pane with select/deselect + confirm dialog
7. Bulk DB insert with success toast
8. MEMBER/VIEWER complete menu hide

### Ship if time allows:
9. Token estimate counter with yellow/orange/red thresholds
10. Inline title editing in preview
11. Markdown format hint tooltip

### Defer to next milestone:
- Editable ticket type in preview
- Drag-to-reorder in preview
- Paste textarea alternative input

---

## Sources

- [Shape of AI — AI UX Patterns catalog](https://www.shapeof.ai) (MEDIUM — catalog site, pattern taxonomy)
- [Gemini API Structured Output — official docs](https://ai.google.dev/gemini-api/docs/structured-output) (HIGH — official Google)
- [Gemini API Pricing — official docs](https://ai.google.dev/gemini-api/docs/pricing) (HIGH — official Google)
- [Jira AI feature guide — Atlassian](https://www.atlassian.com/software/jira/service-management/product-guide/tips-and-tricks/artificial-intelligence) (MEDIUM — official Atlassian)
- [Bulk Action UX guidelines — Eleken](https://www.eleken.co/blog-posts/bulk-actions-ux) (MEDIUM — design consultancy, well-sourced)
- [API Key Management Best Practices 2025 — MultitaskAI](https://multitaskai.com/blog/api-key-management-best-practices/) (MEDIUM — blog, corroborated by platform patterns)
- [better-auth-ui ApiKeysCard component patterns](https://better-auth-ui.com/components/api-keys-card) (MEDIUM — library implementation)
- [Datadog API & Application Keys — official docs](https://docs.datadoghq.com/account_management/api-app-keys/) (HIGH — reference for masking/one-time-reveal pattern)
- [PatternFly Bulk Selection patterns](https://www.patternfly.org/patterns/bulk-selection/) (HIGH — Red Hat design system, well-established)
- [AI-Driven UX Patterns for SaaS 2026 — Orbix](https://www.orbix.studio/blogs/ai-driven-ux-patterns-saas-2026) (LOW — single source, advisory only)
