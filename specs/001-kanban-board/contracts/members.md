# API Contract: Members & Workspaces

---

## GET /api/members — 멤버 목록

**Auth**: 세션 필수.

**Success**: `200 OK`
```json
{
  "members": [
    { "id": 1, "userId": "google-sub", "displayName": "홍길동", "color": "#7EB4A2" }
  ]
}
```

**Notes**: Phase 1에서는 본인 멤버 1개만 반환.

---

## GET /api/workspaces — 워크스페이스 목록

**Auth**: 세션 필수.

**Success**: `200 OK`
```json
{
  "workspaces": [
    { "id": 1, "name": "내 워크스페이스", "ownerId": "google-sub" }
  ]
}
```

**Notes**: Phase 1에서는 1개 워크스페이스만 반환.

---

## Error Response Format

```json
{
  "error": {
    "code": "UNAUTHORIZED | INTERNAL_ERROR",
    "message": "설명 메시지"
  }
}
```
