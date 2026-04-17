# Codebase Concerns

**Analysis Date:** 2026-04-11

## Technical Debt

| Area | Issue | Severity | File(s) |
|------|-------|----------|---------|
| **Component Size** | TicketModal is 1,283 lines — monolithic component with mixed concerns (form, display, deletion, comments, checklists) | high | `src/components/ticket/TicketModal.tsx` |
| **Component Size** | TicketDetailPage is 1,017 lines — excessive complexity combining layout, state, and multiple sub-features | high | `src/components/ticket/TicketDetailPage.tsx` |
| **Component Size** | Header is 830 lines — sidebar, workspace switcher, profile modal all bundled together | high | `src/components/layout/Header.tsx` |
| **Incomplete Seed Data** | `seedSampleTickets` has a placeholder `// TODO` comment at line 130 with no implementation notes | low | `src/db/seed.ts:130` |
| **Query Complexity** | `getBoardData` fetches 6 separate parallel queries but reconstructs data in-memory with maps — no pagination, full scan every time | medium | `src/db/queries/tickets.ts:66-92` |
| **Inline Styles** | TicketModal uses extensive inline styles for icon buttons, tooltips, and hover effects instead of Tailwind or CSS modules | medium | `src/components/ticket/TicketModal.tsx:30-100` |
| **NextAuth Beta** | Using `next-auth@5.0.0-beta.30` — beta version carries risk of breaking changes | medium | `package.json:34` |
| **Type Casting** | Frequent unsafe type casts with `as unknown as Record<string, unknown>` pattern bypasses type safety | medium | `src/lib/auth.ts:40`, `app/api/tickets/route.ts:40` |

## Known Bugs / Issues

| Issue | Description | File(s) |
|-------|-------------|---------|
| **Race Condition Risk in Reorder** | `rebalanceColumn` uses `Promise.all()` with sequential DB updates — concurrent reorder requests can cause position collisions | `app/api/tickets/reorder/route.ts:20-27` |
| **Optimistic Update Stale Snapshot** | `useTickets.reorder()` captures board state at call time, but if user performs multiple rapid drags, snapshot at index 143 may be outdated | medium | `src/hooks/useTickets.ts:121-144` |
| **File Attachment Public by Default** | Files uploaded to Vercel Blob use `access: 'public'` — any person with URL can download without authentication | high | `app/api/tickets/[id]/attachments/route.ts:89` |
| **No File Type Validation** | Attachment upload accepts any MIME type; no content validation beyond size (10MB) | medium | `app/api/tickets/[id]/attachments/route.ts:82-98` |
| **Soft Delete Not Enforced Everywhere** | `deleted` flag exists but some queries don't filter it; risk of exposing soft-deleted data via related queries | medium | `src/db/queries/tickets.ts` — inconsistent use of `eq(tickets.deleted, false)` |

## Security Concerns

| Concern | Description | File(s) |
|---------|-------------|---------|
| **Unprotected File Retrieval** | GET `/api/tickets/[id]/attachments` returns all attachments without verifying user is workspace member | high | `app/api/tickets/[id]/attachments/route.ts:10-40` |
| **Vercel Blob Public Access** | Attachment URLs are publicly accessible; any authenticated user in any workspace can potentially access another workspace's files if URL is leaked | high | `app/api/tickets/[id]/attachments/route.ts:89` |
| **Cross-Workspace Ticket Access** | `/api/tickets?workspaceId=X` allows users to fetch tickets from workspaces they're not in if they guess the ID (minimal RBAC check) | medium | `app/api/tickets/route.ts:29-43` |
| **Session User Type Casting** | Repeated unsafe casts `(session.user as unknown as Record<string, unknown>)` bypass type safety in auth checks | medium | `app/api/tickets/route.ts:40`, `src/lib/auth.ts` |
| **Bulk Delete Without Confirmation** | `/api/tickets/trash` DELETE endpoint accepts array of IDs with minimal validation — no double-check on user ownership | medium | `app/api/tickets/trash/route.ts:20-26` |

## Performance Concerns

| Concern | Description | File(s) |
|---------|-------------|---------|
| **N+1 Queries Risk** | `getBoardData` fetches all tickets, then for each relation (labels, checklists, assignees) makes separate queries — scales poorly with workspace size | medium | `src/db/queries/tickets.ts:66-92` |
| **In-Memory Data Reconstruction** | Board data reconstructed via JavaScript maps instead of SQL joins; memory usage scales with ticket count | medium | `src/db/queries/tickets.ts:95-140` |
| **No Pagination** | `/api/tickets` returns all board tickets in one response — unbounded payload size for large workspaces | medium | `app/api/tickets/route.ts:54-55` |
| **Analytics Queries** | `getBurndownData`, `getCfdData`, `getVelocityData` fetch all historical sprint data in-memory then compute; no caching | medium | `src/db/queries/analytics.ts` |
| **Full-Text Search Missing** | Large workspace with many tickets — no full-text search or indexing strategy | low | `src/db/schema.ts` |
| **Large Component Renders** | TicketModal (1,283 lines) re-renders on every prop change; no memoization strategy visible | medium | `src/components/ticket/TicketModal.tsx` |
| **Dashboard Heavy Fetch** | Header component (830 lines) likely fetches workspace data on every render without query caching | medium | `src/components/layout/Header.tsx` |

## Fragile Areas

| Area | Why Fragile | File(s) |
|------|------------|---------|
| **Position-Based Reordering** | POSITION_GAP model uses integer positions to maintain order; rebalancing logic is complex and prone to gaps shrinking below threshold; concurrent drag operations can violate invariants | `app/api/tickets/reorder/route.ts`, `src/db/queries/tickets.ts` |
| **Session State Management** | `buildSessionUser()` queries DB on every session callback; concurrent modifications to members table can cause stale reads | `src/lib/auth.ts:38-71` |
| **Checklist Cascade Delete** | Checklists cascade-delete with tickets, but no verification that deletion actually succeeded | `src/db/schema.ts:138-146` |
| **Label Soft References** | `ticketLabels` junction table has no cascade delete rule — orphaned records if parent deleted incorrectly | `src/db/schema.ts` — check ticketLabels definition |
| **Notification Delivery Race** | `sendInAppNotification` inserts notifications async with `.catch()` silently swallowing errors; no retry logic | `app/api/tickets/reorder/route.ts:207` |
| **Multi-Assignee Consistency** | Assignees stored in separate `ticketAssignees` table; no constraint ensuring consistency between `assigneeId` (legacy) and `ticketAssignees` (new) | `src/db/schema.ts:107`, `src/db/queries/ticketAssignees.ts` |
| **Workspace Type Changes** | No migration logic if workspace type changes from PERSONAL → TEAM or vice versa; data structure expectations differ | `src/lib/auth.ts:7-23` |

## Missing Pieces

| Missing | Impact | Notes |
|---------|--------|-------|
| **Transactional Constraints** | Multiple operations (reorder + notifications + date updates) happen in sequence without transaction — risk of partial failure | Risk: High |
| **Audit Logging** | No audit trail of who changed what, when — compliance/debugging impossible | Risk: Medium |
| **Request Deduplication** | Rapid duplicate requests (e.g., double-click reorder) have no idempotency checks — duplicate updates possible | Risk: Medium |
| **Soft Delete Cleanup** | Old soft-deleted tickets never purged; table bloats indefinitely | Risk: Low |
| **Concurrent Edit Handling** | No optimistic locking or conflict detection — last-write-wins can silently lose changes | Risk: Medium |
| **File Encryption** | Uploaded files stored unencrypted in Vercel Blob — no privacy for sensitive attachments | Risk: Medium |
| **Rate Limiting** | No rate limiting on API endpoints — malicious users can spam reorder, create tickets, etc. | Risk: Medium |

## Dependency Risks

| Package | Risk | Notes |
|---------|------|-------|
| **next-auth@5.0.0-beta.30** | Beta version — breaking changes possible, not recommended for production | Consider upgrading to stable 5.x once released |
| **@dnd-kit/core@6.3.0** | Large complex library for drag-drop; can have performance issues with many items | Monitor for alternative or lightweight solutions if DnD becomes bottleneck |
| **@vercel/blob@2.3.3** | Vendor lock-in to Vercel infrastructure; no multi-region support yet | Be aware of regional latency for large file uploads |
| **drizzle-orm@0.38.0** | Active development; occasional breaking changes between minor versions | Pin to exact version, test before upgrading |

## Test Coverage Gaps

| Untested Area | What's Not Tested | Risk | File(s) |
|---|---|---|---|
| **Concurrent Reorder** | Multiple simultaneous drag operations on same column | High | `app/api/tickets/reorder/route.ts` |
| **File Attachment Boundaries** | Edge cases: exact 10MB files, rapid upload sequences, network interruption mid-upload | Medium | `app/api/tickets/[id]/attachments/route.ts` |
| **Cross-Workspace RBAC** | User from workspace A trying to access workspace B's tickets | Medium | `app/api/tickets/route.ts:28-43` |
| **Soft Delete Cleanup** | Orphaned records after soft delete; search results including soft-deleted | Medium | `src/db/queries/tickets.ts` |
| **Session Invalidation** | User deleted from DB during active session; session callback behavior | Medium | `src/lib/auth.ts:38-71` |
| **Notification Preferences** | Bulk operations that respect user preferences; disabled notification types | Medium | `src/lib/notifications.ts:45-48` |
| **Analytics Accuracy** | Period burndown with timezone shifts, leap years, daylight saving | Medium | `src/db/queries/analytics.ts:42-91` |
| **Sprint Completion State** | Tickets moved to DONE outside sprint; sprint completion behavior | Low | `src/db/schema.ts:70-86` |

## Notes

**Priority Recommendations:**

1. **Immediate (Week 1):** Fix file attachment access control (`app/api/tickets/[id]/attachments/route.ts` — add workspace membership check)
2. **High (Week 2-3):** Refactor large components (TicketModal, Header, TicketDetailPage) into composable pieces
3. **High (Week 2-3):** Add transactional wrapper around reorder + notifications + date updates
4. **Medium (Week 3-4):** Implement pagination for board data fetch
5. **Medium (Week 4):** Add request deduplication/idempotency tracking for destructive operations
6. **Low (Ongoing):** Monitor NextAuth beta for stable 5.x release and upgrade

**Code Quality Issues:**

- Type safety needs improvement — reduce unsafe `as unknown` casts by improving session user interface
- Inline styles should be replaced with Tailwind utilities or extracted component styles
- Large components (>500 lines) should be refactored into sub-components with clear responsibilities
- SQL queries should use Drizzle joins instead of in-memory map reconstruction

**Scaling Concerns:**

- At 1,000+ tickets per workspace, board fetch and analytics become slow
- No caching strategy for frequently accessed data (board, workspace members)
- Notification delivery is fire-and-forget; no queue or retry mechanism

