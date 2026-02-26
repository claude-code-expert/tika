# API Contract: Workspaces

## PATCH /api/workspaces/[id]

워크스페이스 이름 또는 설명을 수정한다.

### Authentication
세션 필수. 미인증 시 401 반환.

### Request

```
PATCH /api/workspaces/{id}
Content-Type: application/json
```

**Path params**: `id` — workspace integer ID

**Body** (최소 1개 필드 필요):
```json
{
  "name": "새 워크스페이스 이름",
  "description": "워크스페이스 설명 (최대 200자)"
}
```

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| name | string | 조건부 | 1~50자 |
| description | string \| null | 조건부 | 0~200자, null 허용 |

### Response

**200 OK**
```json
{
  "workspace": {
    "id": 1,
    "name": "새 워크스페이스 이름",
    "description": "워크스페이스 설명",
    "ownerId": "google-oauth-id",
    "createdAt": "2026-02-25T00:00:00.000Z"
  }
}
```

**400 VALIDATION_ERROR** — 필드 없음 또는 제약 위반
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "이름은 1~50자여야 합니다" } }
```

**403 FORBIDDEN** — 다른 사용자의 워크스페이스 수정 시도
```json
{ "error": { "code": "FORBIDDEN", "message": "이 워크스페이스를 수정할 권한이 없습니다" } }
```

**404 NOT_FOUND** — 워크스페이스가 존재하지 않음
```json
{ "error": { "code": "NOT_FOUND", "message": "워크스페이스를 찾을 수 없습니다" } }
```
