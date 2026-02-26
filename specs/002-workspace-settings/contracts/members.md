# API Contract: Members (설정 페이지 확장)

## GET /api/members (기존 — 응답 확장)

기존 API 유지. 응답에 `email` 필드 추가 (users 테이블 JOIN).

### Response 변경

**200 OK** — 기존 대비 `email` 필드 추가
```json
{
  "members": [
    {
      "id": 1,
      "userId": "google-oauth-id",
      "workspaceId": 1,
      "role": "admin",
      "displayName": "홍길동",
      "email": "hong@example.com",
      "color": "#7EB4A2",
      "createdAt": "2026-02-25T00:00:00.000Z"
    }
  ]
}
```

**Breaking change 없음**: 기존 필드 유지, 신규 필드만 추가.

---

## PATCH /api/members/[id]

멤버 역할을 변경한다.

### Authentication
세션 필수. 미인증 시 401 반환.

### Request

```
PATCH /api/members/{id}
Content-Type: application/json
```

**Body**:
```json
{
  "role": "member"
}
```

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| role | "admin" \| "member" | ✓ | |

### 비즈니스 규칙

- 마지막 admin의 역할을 'member'로 낮출 수 없다 → 409 LAST_ADMIN
- 자기 자신의 역할 변경은 허용 (마지막 admin 규칙 적용)

### Response

**200 OK**
```json
{
  "member": {
    "id": 1,
    "userId": "...",
    "workspaceId": 1,
    "role": "member",
    "displayName": "홍길동",
    "email": "hong@example.com",
    "color": "#7EB4A2",
    "createdAt": "..."
  }
}
```

**404 NOT_FOUND**
```json
{ "error": { "code": "NOT_FOUND", "message": "멤버를 찾을 수 없습니다" } }
```

**409 LAST_ADMIN** — 마지막 관리자 역할 변경 시도
```json
{ "error": { "code": "LAST_ADMIN", "message": "워크스페이스에 관리자가 최소 1명이어야 합니다" } }
```

---

## DELETE /api/members/[id]

멤버를 워크스페이스에서 제거한다.

### Authentication
세션 필수. 미인증 시 401 반환.

### 비즈니스 규칙

- 워크스페이스의 마지막 admin은 제거할 수 없다 → 409 LAST_ADMIN

### Response

**204 No Content** — 성공

**404 NOT_FOUND**
```json
{ "error": { "code": "NOT_FOUND", "message": "멤버를 찾을 수 없습니다" } }
```

**409 LAST_ADMIN** — 마지막 관리자 제거 시도
```json
{ "error": { "code": "LAST_ADMIN", "message": "마지막 관리자는 제거할 수 없습니다" } }
```
