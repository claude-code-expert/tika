# API Contract: Issues

**Base path**: `/api/issues`
**Auth**: 세션 필수. 워크스페이스 자동 스코핑.

---

## GET /api/issues — 이슈 계층 전체 조회

**Success**: `200 OK`
```json
{
  "issues": [
    {
      "id": 1, "name": "MVP 출시", "type": "GOAL", "parentId": null,
      "children": [
        { "id": 2, "name": "칸반 보드", "type": "STORY", "parentId": 1,
          "children": [{ "id": 3, "name": "드래그앤드롭", "type": "FEATURE", "parentId": 2 }]
        }
      ]
    }
  ]
}
```

---

## POST /api/issues — 이슈 생성

**Request Body**:
```json
{
  "name": "string (1~100자, required)",
  "type": "GOAL | STORY | FEATURE (required)",
  "parentId": "number | null (optional)"
}
```

**Success**: `201 Created`

---

## PATCH /api/issues/:id — 이슈 수정

**Request Body**:
```json
{
  "name": "string (optional)",
  "parentId": "number | null (optional, null → 연결 해제)"
}
```

**Success**: `200 OK`

---

## DELETE /api/issues/:id — 이슈 삭제

**Success**: `204 No Content`
**Business Logic**:
- 하위 이슈의 parent_id → NULL (SET NULL)
- 연결된 티켓의 issue_id → NULL (SET NULL)
