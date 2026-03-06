# API Contracts: Onboarding Wizard & Workspace Flow

**Feature**: 001-onboarding-wizard
**Phase**: 1 — Design
**Date**: 2026-03-05

All existing API routes are unchanged. Only new routes are defined here.

---

## New API Routes

### 1. PATCH /api/users/type

**Purpose**: Save user's onboarding type selection (personal or workspace).

**Auth**: Required (401 if not authenticated)

**Request body**:
```json
{
  "userType": "USER" | "WORKSPACE"
}
```

**Zod schema** (add to `src/lib/validations.ts`):
```typescript
export const patchUserTypeSchema = z.object({
  userType: z.enum(['USER', 'WORKSPACE']),
});
```

**Success response** `200 OK`:
```json
{
  "user": {
    "id": "google-sub-id",
    "userType": "USER"
  }
}
```

**On `userType = 'USER'`** (personal selection):
- Set `users.user_type = 'USER'`
- Create PERSONAL workspace if none exists (move logic from auth.ts signIn)
- Create OWNER member record
- Create default labels
- Response includes `workspaceId` for client-side redirect

**Success response for personal** `200 OK`:
```json
{
  "user": { "id": "...", "userType": "USER" },
  "workspace": { "id": 42 }
}
```

**On `userType = 'WORKSPACE'`** (workspace selection):
- Set `users.user_type = 'WORKSPACE'`
- Do NOT create any workspace
- Response `workspace` field is null

**Errors**:
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Invalid userType value |
| 401 | `UNAUTHORIZED` | No session |
| 500 | `INTERNAL_ERROR` | DB error |

---

### 2. GET /api/workspaces/search

**Purpose**: Search for publicly searchable workspaces by name.

**Auth**: Required (401 if not authenticated)

**Query parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | Yes | Workspace name search term (min 1 char, max 50 chars) |

**Example**: `GET /api/workspaces/search?q=acme`

**Success response** `200 OK`:
```json
{
  "workspaces": [
    {
      "id": 12,
      "name": "Acme Corp",
      "description": "Our main workspace",
      "memberCount": 5
    }
  ]
}
```

**Query behavior**:
- Case-insensitive ILIKE search on `workspaces.name`
- Only returns workspaces where `is_searchable = TRUE` AND `type = 'TEAM'`
- Returns at most 20 results
- Does NOT expose owner email, owner ID, or any member personal information

**Errors**:
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | `q` missing or > 50 chars |
| 401 | `UNAUTHORIZED` | No session |
| 500 | `INTERNAL_ERROR` | DB error |

---

### 3. POST /api/workspaces/[id]/join-requests

**Purpose**: Submit a join request for a workspace.

**Auth**: Required (401 if not authenticated)

**Path parameters**: `id` — workspace ID (integer)

**Request body**:
```json
{
  "message": "Hello, I'd like to join!"  // optional
}
```

**Zod schema**:
```typescript
export const postJoinRequestSchema = z.object({
  message: z.string().max(500).optional(),
});
```

**Success response** `201 Created`:
```json
{
  "joinRequest": {
    "id": 7,
    "workspaceId": 12,
    "userId": "google-sub-id",
    "status": "PENDING",
    "createdAt": "2026-03-05T10:00:00Z"
  }
}
```

**Validation rules**:
- Workspace must exist
- Requester must NOT already be a member of the workspace
- No existing PENDING request from same user to same workspace (returns 409)
- PERSONAL workspaces cannot receive join requests (returns 403)

**Errors**:
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Invalid message |
| 401 | `UNAUTHORIZED` | No session |
| 403 | `FORBIDDEN` | Workspace is PERSONAL type |
| 404 | `WORKSPACE_NOT_FOUND` | Workspace doesn't exist |
| 409 | `ALREADY_REQUESTED` | Pending request already exists |
| 409 | `ALREADY_MEMBER` | User is already a member |
| 500 | `INTERNAL_ERROR` | DB error |

---

### 4. GET /api/workspaces/[id]/join-requests

**Purpose**: List pending join requests for a workspace. OWNER only.

**Auth**: Required. OWNER role required (403 otherwise).

**Path parameters**: `id` — workspace ID (integer)

**Query parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | Filter by status. Default: `PENDING`. Values: `PENDING`, `APPROVED`, `REJECTED` |

**Success response** `200 OK`:
```json
{
  "joinRequests": [
    {
      "id": 7,
      "workspaceId": 12,
      "userId": "google-sub-id",
      "userName": "홍길동",
      "userEmail": "hong@example.com",
      "userAvatarUrl": "https://...",
      "message": "Hello!",
      "status": "PENDING",
      "createdAt": "2026-03-05T10:00:00Z"
    }
  ]
}
```

**Errors**:
| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHORIZED` | No session |
| 403 | `FORBIDDEN` | Not OWNER of workspace |
| 404 | `WORKSPACE_NOT_FOUND` | Workspace doesn't exist |
| 500 | `INTERNAL_ERROR` | DB error |

---

### 5. PATCH /api/workspaces/[id]/join-requests/[reqId]

**Purpose**: Approve or reject a join request. OWNER only. Approval is transactional.

**Auth**: Required. OWNER role required (403 otherwise).

**Path parameters**:
- `id` — workspace ID (integer)
- `reqId` — join request ID (integer)

**Request body**:
```json
{
  "action": "APPROVE" | "REJECT"
}
```

**Zod schema**:
```typescript
export const patchJoinRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
});
```

**On APPROVE** — transactional:
1. Set `workspace_join_requests.status = 'APPROVED'`, `reviewed_by = memberId`, `reviewed_at = now()`
2. Insert row into `members` (userId, workspaceId, displayName from user.name, role='MEMBER', color=auto-assigned)

**Success response (APPROVE)** `200 OK`:
```json
{
  "joinRequest": {
    "id": 7,
    "status": "APPROVED"
  },
  "member": {
    "id": 25,
    "userId": "google-sub-id",
    "workspaceId": 12,
    "displayName": "홍길동",
    "role": "MEMBER"
  }
}
```

**On REJECT**:
1. Set `workspace_join_requests.status = 'REJECTED'`, `reviewed_by`, `reviewed_at`
2. No member row created

**Success response (REJECT)** `200 OK`:
```json
{
  "joinRequest": {
    "id": 7,
    "status": "REJECTED"
  }
}
```

**Errors**:
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Invalid action value |
| 401 | `UNAUTHORIZED` | No session |
| 403 | `FORBIDDEN` | Not OWNER of workspace |
| 404 | `WORKSPACE_NOT_FOUND` | Workspace doesn't exist |
| 404 | `REQUEST_NOT_FOUND` | Join request doesn't exist in this workspace |
| 409 | `ALREADY_PROCESSED` | Request is not in PENDING status |
| 500 | `INTERNAL_ERROR` | DB error or transaction failure |

---

## Modified API Routes

### auth.ts — session callback additions

The NextAuth session callback is modified to include `userType`:

```typescript
// In session callback:
const [dbUser] = await db
  .select({ id: users.id, userType: users.userType })
  .from(users)
  .where(eq(users.id, token.sub))
  .limit(1);

(session.user).userType = dbUser?.userType ?? null;
```

### app/page.tsx — smart redirect

The root page server component is modified to redirect based on `userType`:

```typescript
const userType = (session.user as { userType?: string | null }).userType ?? null;

if (userType === null) redirect('/onboarding');
if (userType === 'WORKSPACE') {
  // find first workspace membership
  const firstWorkspace = ...; // query members join workspaces
  if (firstWorkspace) redirect(`/team/${firstWorkspace.id}`);
  else redirect('/onboarding/workspace');
}
// userType === 'USER' → fall through to render personal board
```

---

## Reused API Routes (No Changes)

| Method | Path | Reuse Purpose |
|--------|------|---------------|
| `POST` | `/api/workspaces` | Create workspace (used by WorkspaceCreator) |
| `GET` | `/api/invites/[token]` | Preview invite before accepting |
| `POST` | `/api/invites/[token]/accept` | Auto-accept invite link in WorkspaceFinder |
| `POST` | `/api/workspaces/[id]/invites` | Owner creates invite link |
| `GET` | `/api/workspaces/[id]/invites` | Owner lists invite links |
