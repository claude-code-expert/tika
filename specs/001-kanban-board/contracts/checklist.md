# API Contract: Checklist

**Base path**: `/api/tickets/:id/checklist`
**Auth**: 세션 필수. 티켓 소유권(워크스페이스) 검증.

---

## POST /api/tickets/:id/checklist — 항목 추가

**Request Body**:
```json
{ "text": "string (1~200자, required)" }
```

**Success**: `201 Created`
```json
{ "item": { "id": 1, "ticketId": 42, "text": "...", "isCompleted": false, "position": 5 } }
```

**Errors**:
- `400 CHECKLIST_LIMIT_EXCEEDED` — 항목 20개 초과
- `400 VALIDATION_ERROR`
- `401 UNAUTHORIZED`
- `404 TICKET_NOT_FOUND`

---

## PATCH /api/tickets/:id/checklist/:itemId — 항목 수정/토글

**Request Body**:
```json
{
  "text": "string (optional)",
  "isCompleted": "boolean (optional)"
}
```

**Success**: `200 OK`
```json
{ "item": { /* ChecklistItem */ } }
```

---

## DELETE /api/tickets/:id/checklist/:itemId — 항목 삭제

**Success**: `204 No Content`
