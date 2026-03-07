# API Contracts: Team Collaboration

**Branch**: `001-team-collaboration` | **Date**: 2026-03-04

공통 규칙:
- 모든 엔드포인트는 세션 검증 필수. 미인증 → 401 `UNAUTHORIZED`
- RBAC 불충분 → 403 `FORBIDDEN`
- 입력 검증 실패 → 400 `VALIDATION_ERROR`
- 리소스 미존재 → 404 `NOT_FOUND`
- 에러 응답 형식: `{ "error": { "code": "ERROR_CODE", "message": "설명" } }`

---

## Workspace API

### GET /api/workspaces
사용자가 멤버로 속한 모든 워크스페이스 목록 (PERSONAL + TEAM 포함)

**Auth**: 로그인 필요
**Response 200**:
```json
{
  "workspaces": [
    {
      "id": 1,
      "name": "내 워크스페이스",
      "description": null,
      "ownerId": "google-sub",
      "type": "PERSONAL",
      "role": "OWNER",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/workspaces
팀 워크스페이스 생성 (OWNER당 최대 3개)

**Auth**: 로그인 필요
**Request**:
```json
{ "name": "팀 이름", "description": "설명 (선택)", "type": "TEAM" }
```
**Response 201**: `{ "workspace": { ...Workspace } }`
**Errors**: 409 `WORKSPACE_LIMIT_EXCEEDED` (3개 초과)

---

### PATCH /api/workspaces/[id]
워크스페이스 이름/설명 수정 (OWNER 전용)

**RBAC**: OWNER
**Request**: `{ "name"?: "새 이름", "description"?: "새 설명" }`
**Response 200**: `{ "workspace": { ...Workspace } }`

---

### DELETE /api/workspaces/[id]
워크스페이스 삭제 (이름 재입력 확인 필요)

**RBAC**: OWNER
**Request**: `{ "confirmName": "워크스페이스 이름" }` — spec의 이름과 일치해야 함
**Response 204**: No body
**Errors**: 400 `NAME_MISMATCH`

---

## Members API

### GET /api/workspaces/[id]/members
워크스페이스 멤버 목록

**RBAC**: VIEWER 이상
**Response 200**:
```json
{
  "members": [
    {
      "id": 1,
      "userId": "google-sub",
      "workspaceId": 1,
      "displayName": "홍길동",
      "color": "#7EB4A2",
      "role": "OWNER",
      "email": "user@example.com",
      "joinedAt": "2026-01-01T00:00:00Z",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### PATCH /api/workspaces/[id]/members/[memberId]
멤버 역할 변경

**RBAC**: OWNER
**Request**: `{ "role": "MEMBER" | "VIEWER" | "OWNER" }`
**Response 200**: `{ "member": { ...MemberWithEmail } }`
**Errors**: 409 `LAST_OWNER` (마지막 OWNER 강등 불가)

---

### DELETE /api/workspaces/[id]/members/[memberId]
멤버 강제 제거 (OWNER만 가능, OWNER 본인 제거 불가)

**RBAC**: OWNER
**Response 204**: No body
**Errors**: 400 `CANNOT_REMOVE_SELF`

---

### DELETE /api/workspaces/[id]/members/me
본인 탈퇴

**RBAC**: MEMBER 또는 VIEWER (OWNER는 불가)
**Response 204**: No body
**Errors**: 400 `OWNER_CANNOT_LEAVE` (OWNER는 워크스페이스 삭제로 처리)

---

## Invites API

### GET /api/workspaces/[id]/invites
초대 목록 조회 (PENDING 상태 포함)

**RBAC**: OWNER
**Response 200**: `{ "invites": [ { ...WorkspaceInvite } ] }`

---

### POST /api/workspaces/[id]/invites
초대 생성

**RBAC**: OWNER
**Request**: `{ "email": "user@example.com", "role": "MEMBER" | "VIEWER" }`
**Response 201**:
```json
{
  "invite": {
    "id": 1,
    "token": "uuid-v4",
    "email": "user@example.com",
    "role": "MEMBER",
    "status": "PENDING",
    "expiresAt": "2026-03-11T00:00:00Z",
    "inviteUrl": "/invite/uuid-v4"
  }
}
```
**Errors**: 409 `ALREADY_MEMBER` (이미 멤버), 409 `PENDING_INVITE_EXISTS` (동일 이메일 PENDING 초대 존재)

---

### DELETE /api/workspaces/[id]/invites/[inviteId]
초대 취소 (PENDING 상태만)

**RBAC**: OWNER
**Response 204**: No body
**Errors**: 400 `INVITE_NOT_PENDING`

---

### GET /api/invites/[token]
초대 미리보기 (인증 불필요 — 미로그인 사용자 대상)

**Auth**: 불필요
**Response 200**:
```json
{
  "invite": {
    "workspaceName": "팀 이름",
    "inviterName": "홍길동",
    "role": "MEMBER",
    "status": "PENDING",
    "expiresAt": "2026-03-11T00:00:00Z",
    "emailHint": "u***@example.com"
  }
}
```
**Errors**: 404 `INVITE_NOT_FOUND`, 400 `INVITE_EXPIRED`

---

### POST /api/invites/[token]/accept
초대 수락 (로그인 + 이메일 일치 필수)

**Auth**: 로그인 필요
**Response 200**: `{ "workspaceId": 1, "role": "MEMBER" }`
**Errors**: 403 `EMAIL_MISMATCH`, 400 `INVITE_EXPIRED`, 409 `ALREADY_MEMBER`

---

### POST /api/invites/[token]/reject
초대 거절

**Auth**: 로그인 필요
**Response 200**: `{ "status": "REJECTED" }`
**Errors**: 400 `INVITE_NOT_PENDING`

---

## Sprints API

### GET /api/workspaces/[id]/sprints
스프린트 목록 (최신순)

**RBAC**: VIEWER 이상
**Response 200**: `{ "sprints": [ { ...Sprint, ticketCount: number } ] }`

---

### POST /api/workspaces/[id]/sprints
스프린트 생성

**RBAC**: OWNER
**Request**:
```json
{
  "name": "Sprint 1",
  "goal": "목표 설명 (선택)",
  "startDate": "2026-03-01",
  "endDate": "2026-03-14"
}
```
**Response 201**: `{ "sprint": { ...Sprint } }`

---

### PATCH /api/workspaces/[id]/sprints/[sid]
스프린트 정보 수정 (PLANNED 또는 ACTIVE)

**RBAC**: OWNER
**Request**: `{ "name"?: "새 이름", "goal"?: "새 목표", "startDate"?: "날짜", "endDate"?: "날짜" }`
**Response 200**: `{ "sprint": { ...Sprint } }`

---

### DELETE /api/workspaces/[id]/sprints/[sid]
스프린트 삭제 (PLANNED 상태만)

**RBAC**: OWNER
**Response 204**: No body
**Errors**: 400 `SPRINT_NOT_DELETABLE` (ACTIVE/COMPLETED/CANCELLED 상태)

---

### POST /api/workspaces/[id]/sprints/[sid]/activate
PLANNED → ACTIVE 상태 전이

**RBAC**: OWNER
**Response 200**: `{ "sprint": { ...Sprint, status: "ACTIVE" } }`
**Errors**: 409 `ACTIVE_SPRINT_EXISTS`

---

### POST /api/workspaces/[id]/sprints/[sid]/complete
ACTIVE → COMPLETED 상태 전이 (미완료 티켓 처리 포함)

**RBAC**: OWNER
**Request**:
```json
{
  "ticketMoves": [
    { "ticketId": 1, "destination": "backlog" },
    { "ticketId": 2, "destination": "sprint", "targetSprintId": 3 }
  ]
}
```
**Response 200**: `{ "sprint": { ...Sprint, status: "COMPLETED" }, "movedCount": 2 }`

---

## Analytics API

모든 analytics 엔드포인트: **RBAC** VIEWER 이상, `?from=YYYY-MM-DD&to=YYYY-MM-DD` 필터 지원.

### GET /api/workspaces/[id]/analytics/burndown
```json
{
  "meta": { "sprintId": 1, "sprintName": "Sprint 1", "storyPointsTotal": 40 },
  "data": [
    { "date": "2026-03-01", "remainingTickets": 20, "remainingPoints": 40, "idealTickets": 20 }
  ]
}
```

### GET /api/workspaces/[id]/analytics/cfd
```json
{
  "data": [
    { "date": "2026-03-01", "backlog": 10, "todo": 5, "inProgress": 3, "done": 2 }
  ]
}
```

### GET /api/workspaces/[id]/analytics/velocity
```json
{
  "sprints": [
    { "sprintId": 1, "name": "Sprint 1", "completedPoints": 32, "plannedPoints": 40 }
  ]
}
```

### GET /api/workspaces/[id]/analytics/cycle-time
```json
{
  "average": 3.2,
  "median": 2.5,
  "distribution": [ { "days": 1, "count": 5 }, { "days": 2, "count": 8 } ]
}
```

### GET /api/workspaces/[id]/analytics/labels
```json
{
  "labels": [ { "name": "버그", "color": "#EF4444", "count": 12, "percentage": 30 } ]
}
```

### GET /api/workspaces/[id]/members/workload
```json
{
  "members": [
    {
      "memberId": 1,
      "displayName": "홍길동",
      "role": "OWNER",
      "assigned": 8,
      "inProgress": 3,
      "completed": 5,
      "byStatus": { "BACKLOG": 0, "TODO": 3, "IN_PROGRESS": 3, "DONE": 5 }
    }
  ]
}
```
