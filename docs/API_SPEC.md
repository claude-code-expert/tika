# Tika - API 명세서 (API_SPEC.md)

> Base URL: `/api`
> 인증: 없음 (MVP - 단일 사용자)
> Content-Type: application/json

---

## 공통 에러 응답 형식

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "사람이 읽을 수 있는 에러 메시지"
  }
}
```

---

## POST /api/tickets

**설명**: 새 티켓 생성

### Request Body

| 필드 | 타입 | 필수 | 제약조건 | 설명 |
|------|------|------|----------|------|
| title | string | O | 1~200자 | 티켓 제목 |
| description | string | X | 최대 1000자 | 상세 설명 |
| priority | string | X | LOW \| MEDIUM \| HIGH | 우선순위 (기본: MEDIUM) |
| dueDate | string | X | YYYY-MM-DD, 오늘 이후 | 마감일 |

```json
{
  "title": "API 설계 문서 작성",
  "description": "REST API 엔드포인트와 요청/응답 형식을 정의한다",
  "priority": "HIGH",
  "dueDate": "2026-02-15"
}
```

### Response 201 Created

```json
{
  "id": 1,
  "title": "API 설계 문서 작성",
  "description": "REST API 엔드포인트와 요청/응답 형식을 정의한다",
  "status": "BACKLOG",
  "priority": "HIGH",
  "position": -1024,
  "dueDate": "2026-02-15",
  "completedAt": null,
  "createdAt": "2026-02-01T09:00:00.000Z",
  "updatedAt": "2026-02-01T09:00:00.000Z"
}
```

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 400 | VALIDATION_ERROR | 필수 필드 누락 또는 제약조건 위반 |

---

## GET /api/tickets

**설명**: 전체 티켓 목록 조회 (보드용)

### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| (없음) | - | - | 전체 티켓을 칼럼별로 반환 |

### Response 200 OK

```json
{
  "board": {
    "BACKLOG": [
      {
        "id": 7,
        "title": "알림 기능 조사",
        "description": null,
        "status": "BACKLOG",
        "priority": "LOW",
        "position": 0,
        "dueDate": null,
        "completedAt": null,
        "createdAt": "2026-02-01T09:00:00.000Z",
        "updatedAt": "2026-02-01T09:00:00.000Z",
        "isOverdue": false
      }
    ],
    "TODO": [],
    "IN_PROGRESS": [],
    "DONE": []
  },
  "total": 1
}
```

**정렬**: 각 칼럼 내에서 position 오름차순

---

## GET /api/tickets/:id

**설명**: 특정 티켓 상세 조회

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| id | number | 티켓 ID |

### Response 200 OK

```json
{
  "id": 1,
  "title": "API 설계 문서 작성",
  "description": "REST API 엔드포인트와 요청/응답 형식을 정의한다",
  "status": "BACKLOG",
  "priority": "HIGH",
  "position": 0,
  "dueDate": "2026-02-15",
  "completedAt": null,
  "createdAt": "2026-02-01T09:00:00.000Z",
  "updatedAt": "2026-02-01T09:00:00.000Z",
  "isOverdue": false
}
```

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 404 | TICKET_NOT_FOUND | 존재하지 않는 ID |

---

## PATCH /api/tickets/:id

**설명**: 티켓 정보 수정 (부분 업데이트)

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| id | number | 티켓 ID |

### Request Body (모든 필드 선택)

| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| title | string | 1~200자 | 제목 변경 |
| description | string \| null | 최대 1000자 | 설명 변경. null이면 삭제 |
| priority | string | LOW \| MEDIUM \| HIGH | 우선순위 변경 |
| dueDate | string \| null | YYYY-MM-DD | 마감일 변경. null이면 삭제 |

```json
{
  "title": "API 설계 문서 작성 (수정)",
  "priority": "MEDIUM"
}
```

### Response 200 OK

수정된 티켓 전체 데이터 (GET /api/tickets/:id와 동일한 형식)

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 400 | VALIDATION_ERROR | 제약조건 위반 |
| 404 | TICKET_NOT_FOUND | 존재하지 않는 ID |

---

## DELETE /api/tickets/:id

**설명**: 티켓 삭제

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| id | number | 티켓 ID |

### Response 204 No Content

본문 없음

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 404 | TICKET_NOT_FOUND | 존재하지 않는 ID |

---

## PATCH /api/tickets/reorder

**설명**: 티켓의 상태(칼럼)와 순서를 변경한다. 드래그앤드롭 시 호출.

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| ticketId | number | O | 이동할 티켓 ID |
| status | string | O | 대상 칼럼 (BACKLOG \| TODO \| IN_PROGRESS \| DONE) |
| position | number | O | 칼럼 내 새 인덱스 (0부터 시작) |

```json
{
  "ticketId": 3,
  "status": "IN_PROGRESS",
  "position": 0
}
```

### Response 200 OK

```json
{
  "ticket": {
    "id": 3,
    "title": "API 설계 문서 작성",
    "status": "IN_PROGRESS",
    "position": 0,
    "completedAt": null,
    "updatedAt": "2026-02-01T10:30:00.000Z"
  },
  "affected": [
    { "id": 5, "position": 1024 },
    { "id": 8, "position": 2048 }
  ]
}
```

**affected**: 순서가 변경된 다른 티켓들의 ID와 새 position

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 400 | VALIDATION_ERROR | 잘못된 status 값 |
| 404 | TICKET_NOT_FOUND | 존재하지 않는 ticketId |

### 비즈니스 로직

1. 대상 티켓의 status와 position 업데이트
2. DONE으로 이동 시 completedAt = now()
3. DONE에서 나올 때 completedAt = null
4. 대상 칼럼의 다른 티켓 position 재정렬
5. 전체 작업을 트랜잭션으로 처리

---

## API 엔드포인트 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/tickets | 티켓 생성 |
| GET | /api/tickets | 전체 보드 조회 |
| GET | /api/tickets/:id | 티켓 상세 조회 |
| PATCH | /api/tickets/:id | 티켓 수정 |
| DELETE | /api/tickets/:id | 티켓 삭제 |
| PATCH | /api/tickets/reorder | 드래그앤드롭 순서/상태 변경 |
