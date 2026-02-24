# API Contract: Labels

**Base path**: `/api/labels`
**Auth**: 세션 필수. 워크스페이스 자동 스코핑.

---

## GET /api/labels — 라벨 목록

**Success**: `200 OK`
```json
{ "labels": [{ "id": 1, "name": "Frontend", "color": "#2b7fff" }] }
```

---

## POST /api/labels — 라벨 생성

**Request Body**:
```json
{
  "name": "string (1~20자, required)",
  "color": "string (#RRGGBB, required)"
}
```

**Success**: `201 Created`
```json
{ "label": { /* Label */ } }
```

**Errors**:
- `400 LABEL_LIMIT_EXCEEDED` — 워크스페이스 라벨 20개 초과
- `400 LABEL_NAME_DUPLICATE` — 같은 이름의 라벨 존재
- `400 VALIDATION_ERROR`

---

## PATCH /api/labels/:id — 라벨 수정

**Request Body**:
```json
{
  "name": "string (optional)",
  "color": "string (#RRGGBB, optional)"
}
```

**Success**: `200 OK`

---

## DELETE /api/labels/:id — 라벨 삭제

**Success**: `204 No Content`
**Business Logic**: ticket_labels CASCADE → 부착된 티켓에서 자동 제거
