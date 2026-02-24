# API Contract: Tickets

**Base path**: `/api/tickets`
**Auth**: 모든 엔드포인트에 세션 필수. 미인증 시 401.
**Scope**: 현재 세션 사용자의 워크스페이스로 자동 필터링.

---

## POST /api/tickets — 티켓 생성

**Request Body**:
```json
{
  "title": "string (1~200자, required)",
  "description": "string | null (max 1000자, optional)",
  "type": "GOAL | STORY | FEATURE | TASK (optional, default: TASK)",
  "priority": "LOW | MEDIUM | HIGH | CRITICAL (optional, default: MEDIUM)",
  "dueDate": "YYYY-MM-DD | null (오늘 이후, optional)",
  "issueId": "number | null (optional)",
  "assigneeId": "number | null (optional)",
  "checklist": ["string (1~200자)"],
  "labelIds": ["number"]
}
```

**Success**: `201 Created`
```json
{ "ticket": { /* TicketWithMeta */ } }
```

**Errors**:
- `400 VALIDATION_ERROR` — 입력값 오류
- `400 TICKET_LIMIT_EXCEEDED` — 워크스페이스 티켓 300개 초과
- `401 UNAUTHORIZED`

**Business Logic**:
1. workspace_id 결정 (세션 user_id → 워크스페이스 조회)
2. 300개 제한 COUNT 체크
3. position = min(BACKLOG positions) - 1024 (BACKLOG 비어있으면 0)
4. 트랜잭션: tickets 삽입 → checklist_items 삽입 → ticket_labels 삽입

---

## GET /api/tickets — 보드 전체 조회

**Query Parameters**: 없음 (워크스페이스 자동 스코핑)

**Success**: `200 OK`
```json
{
  "board": {
    "BACKLOG": [/* TicketWithMeta[] - position ASC */],
    "TODO": [/* TicketWithMeta[] */],
    "IN_PROGRESS": [/* TicketWithMeta[] */],
    "DONE": [/* TicketWithMeta[] */]
  },
  "total": 42
}
```

**Notes**:
- `isOverdue` 파생 필드: due_date < 오늘 AND status != DONE
- 각 티켓에 labels, checklistItems, issue, assignee 포함

---

## GET /api/tickets/:id — 단일 티켓 조회

**Success**: `200 OK`
```json
{ "ticket": { /* TicketWithMeta */ } }
```

**Errors**:
- `401 UNAUTHORIZED`
- `404 TICKET_NOT_FOUND`

---

## PATCH /api/tickets/:id — 티켓 수정

**Request Body** (부분 업데이트, 전송된 필드만 업데이트):
```json
{
  "title": "string (1~200자, optional)",
  "description": "string | null (optional, null → 삭제)",
  "priority": "LOW | MEDIUM | HIGH | CRITICAL (optional)",
  "dueDate": "YYYY-MM-DD | null (optional, null → 삭제)",
  "issueId": "number | null (optional, null → 연결 해제)",
  "assigneeId": "number | null (optional, null → 미배정)",
  "labelIds": "number[] | null (optional, null/[] → 전체 해제)"
}
```

**Success**: `200 OK`
```json
{ "ticket": { /* TicketWithMeta */ } }
```

**Notes**:
- `null` 전송 = "해당 값 삭제/초기화"
- 필드 미전송 = "현재 값 유지"

---

## DELETE /api/tickets/:id — 티켓 삭제

**Success**: `204 No Content`

**Business Logic**: 하드 삭제. checklist_items는 CASCADE 자동 삭제.

---

## PATCH /api/tickets/reorder — 드래그앤드롭 순서 변경

**Request Body**:
```json
{
  "ticketId": "number (required)",
  "status": "BACKLOG | TODO | IN_PROGRESS | DONE (required)",
  "position": "number (0-based 인덱스, required)"
}
```

**Success**: `200 OK`
```json
{
  "ticket": { /* 업데이트된 티켓 */ },
  "affected": [/* position 재계산된 다른 티켓들 */]
}
```

**Business Logic**:
1. 클라이언트의 0-based 인덱스를 gap-based position 값으로 변환
2. status 변경 포함 시 completed_at 처리
3. 트랜잭션으로 원자성 보장
4. gap 소진 시 해당 칼럼 전체 position 재계산

---

## Error Response Format

```json
{
  "error": {
    "code": "UNAUTHORIZED | VALIDATION_ERROR | TICKET_NOT_FOUND | TICKET_LIMIT_EXCEEDED | INTERNAL_ERROR",
    "message": "사용자 읽기 가능한 설명 메시지"
  }
}
```
