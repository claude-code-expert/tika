# Tika - API 명세서 (API_SPEC.md)

> Base URL: `/api`
> 인증: NextAuth.js v5 (Google OAuth) — 모든 API 요청에 세션 검증 필수
> Content-Type: application/json
> 버전: 2.0
> 최종 수정일: 2026-02-22

---

## 인증 및 워크스페이스 스코핑

### 세션 기반 인증
- 모든 API 요청은 NextAuth.js 세션 쿠키로 인증한다
- 미인증 요청 시 `401 Unauthorized` 응답 (`UNAUTHORIZED` 에러 코드)
- 세션에서 현재 사용자 ID와 워크스페이스 ID를 추출하여 사용

### 워크스페이스 스코핑
- 모든 데이터 조회/생성은 현재 사용자의 워크스페이스로 자동 스코핑
- tickets, labels, issues, members 쿼리 시 `WHERE workspace_id = ?` 자동 적용
- 다른 사용자의 워크스페이스 데이터 접근 불가

### 담당자 스코핑 (Phase 1)
- Phase 1에서 assigneeId는 본인(로그인 사용자의 member ID)만 허용
- 다른 멤버 ID 전송 시 `400 VALIDATION_ERROR`

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

| 에러 코드 | HTTP 상태 | 발생 조건 |
|-----------|----------|----------|
| UNAUTHORIZED | 401 | 미인증 요청 (세션 없음 또는 만료) |
| VALIDATION_ERROR | 400 | 입력값 제약조건 위반 |
| TICKET_NOT_FOUND | 404 | 존재하지 않는 티켓 ID |
| LABEL_NOT_FOUND | 404 | 존재하지 않는 라벨 ID |
| ISSUE_NOT_FOUND | 404 | 존재하지 않는 이슈 ID |
| MEMBER_NOT_FOUND | 404 | 존재하지 않는 멤버 ID |
| CHECKLIST_ITEM_NOT_FOUND | 404 | 존재하지 않는 체크리스트 항목 ID |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

---

# 1. 티켓 API

## POST /api/tickets

**설명**: 새 티켓 생성. 기본 status=BACKLOG, position=해당 칼럼 최솟값-1024

### Request Body

| 필드 | 타입 | 필수 | 제약조건 | 기본값 |
|------|------|------|----------|--------|
| title | string | **O** | 1~200자, 공백만 불가 | — |
| type | string | **O** | GOAL \| STORY \| FEATURE \| TASK | — |
| description | string | X | 최대 1,000자 | null |
| status | string | X | BACKLOG \| TODO \| IN_PROGRESS \| DONE | BACKLOG |
| priority | string | X | LOW \| MEDIUM \| HIGH \| CRITICAL | MEDIUM |
| dueDate | string | X | YYYY-MM-DD, 오늘 이후 | null |
| checklist | array | X | 최대 20개, 각 항목 1~200자 | [] |
| labelIds | number[] | X | 최대 5개, 유효 라벨 ID | [] |
| issueId | number | X | 유효 이슈 ID | null |
| assigneeId | number | X | 유효 멤버 ID. Phase 1: 자기 자신만 배정 가능 | null |

```json
{
  "title": "JWT 인증 API 구현",
  "type": "FEATURE",
  "description": "JWT 기반 인증 시스템 구현",
  "priority": "HIGH",
  "dueDate": "2026-03-01",
  "checklist": [
    { "text": "토큰 생성 로직 구현" },
    { "text": "미들웨어 작성" }
  ],
  "labelIds": [1, 2],
  "issueId": 3,
  "assigneeId": 1
}
```

### Response 201 Created

```json
{
  "ticket": {
    "id": 1,
    "workspaceId": 1,
    "title": "JWT 인증 API 구현",
    "type": "FEATURE",
    "description": "JWT 기반 인증 시스템 구현",
    "status": "BACKLOG",
    "priority": "HIGH",
    "position": -1024,
    "dueDate": "2026-03-01",
    "completedAt": null,
    "issueId": 3,
    "assigneeId": 1,
    "createdAt": "2026-02-21T09:00:00.000Z",
    "updatedAt": "2026-02-21T09:00:00.000Z",
    "isOverdue": false,
    "checklist": [
      { "id": 1, "ticketId": 1, "text": "토큰 생성 로직 구현", "isCompleted": false, "position": 0, "createdAt": "2026-02-21T09:00:00.000Z" },
      { "id": 2, "ticketId": 1, "text": "미들웨어 작성", "isCompleted": false, "position": 1, "createdAt": "2026-02-21T09:00:00.000Z" }
    ],
    "labels": [
      { "id": 1, "workspaceId": 1, "name": "Backend", "color": "#00c950", "createdAt": "2026-02-01T09:00:00.000Z" }
    ],
    "issue": {
      "id": 3,
      "workspaceId": 1,
      "name": "인증 API",
      "type": "FEATURE",
      "parentId": 2,
      "createdAt": "2026-02-01T09:00:00.000Z",
      "breadcrumb": [
        { "id": 1, "name": "MVP 출시", "type": "GOAL" },
        { "id": 2, "name": "사용자 인증 시스템", "type": "STORY" },
        { "id": 3, "name": "인증 API", "type": "FEATURE" }
      ]
    },
    "assignee": {
      "id": 1,
      "userId": "google-uid-001",
      "workspaceId": 1,
      "displayName": "홍길동",
      "color": "#7EB4A2",
      "createdAt": "2026-02-01T09:00:00.000Z"
    }
  }
}
```

### 검증 에러 메시지

| 조건 | 메시지 |
|------|--------|
| 타입 누락 | `"타입을 선택해주세요"` |
| 제목 누락 | `"제목을 입력해주세요"` |
| 제목 200자 초과 | `"제목은 200자 이내로 입력해주세요"` |
| 설명 1,000자 초과 | `"설명은 1,000자 이내로 입력해주세요"` |
| 잘못된 상태 | `"상태는 BACKLOG, TODO, IN_PROGRESS, DONE 중 선택해주세요"` |
| 잘못된 우선순위 | `"우선순위는 LOW, MEDIUM, HIGH, CRITICAL 중 선택해주세요"` |
| 과거 마감일 | `"마감일은 오늘 이후 날짜를 선택해주세요"` |
| 라벨 5개 초과 | `"라벨은 최대 5개까지 선택할 수 있습니다"` |
| 체크리스트 20개 초과 | `"체크리스트는 최대 20개까지 추가할 수 있습니다"` |

---

## GET /api/tickets

**설명**: 전체 티켓 목록 조회 (보드용). 각 칼럼별 position 오름차순 정렬.

### Response 200 OK

```json
{
  "board": {
    "BACKLOG": [
      {
        "id": 7,
        "workspaceId": 1,
        "title": "알림 기능 조사",
        "type": "STORY",
        "description": null,
        "status": "BACKLOG",
        "priority": "LOW",
        "position": 0,
        "dueDate": null,
        "completedAt": null,
        "issueId": null,
        "assigneeId": 1,
        "createdAt": "2026-02-01T09:00:00.000Z",
        "updatedAt": "2026-02-01T09:00:00.000Z",
        "isOverdue": false,
        "checklist": [
          { "id": 1, "ticketId": 7, "text": "Slack 연동 조사", "isCompleted": true, "position": 0, "createdAt": "2026-02-01T09:00:00.000Z" },
          { "id": 2, "ticketId": 7, "text": "Telegram Bot 조사", "isCompleted": false, "position": 1, "createdAt": "2026-02-01T09:00:00.000Z" }
        ],
        "labels": [
          { "id": 2, "workspaceId": 1, "name": "Backend", "color": "#00c950", "createdAt": "2026-02-01T09:00:00.000Z" }
        ],
        "issue": null,
        "assignee": {
          "id": 1,
          "userId": "google-uid-001",
          "workspaceId": 1,
          "displayName": "홍길동",
          "color": "#7EB4A2",
          "createdAt": "2026-02-01T09:00:00.000Z"
        }
      }
    ],
    "TODO": [],
    "IN_PROGRESS": [],
    "DONE": []
  },
  "total": 1
}
```

**isOverdue 계산**: `dueDate != null AND dueDate < 오늘 AND status != DONE`

---

## GET /api/tickets/:id

**설명**: 특정 티켓 상세 조회

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| id | number | 티켓 ID (양의 정수) |

### Response 200 OK

GET /api/tickets 응답의 개별 티켓 객체와 동일한 구조. `{ "ticket": { ... } }` 형식.

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 404 | TICKET_NOT_FOUND | 존재하지 않는 ID |

---

## PATCH /api/tickets/:id

**설명**: 티켓 정보 수정 (부분 업데이트 PATCH). 전송된 필드만 업데이트.

**null vs 미전송**: null = 해당 값을 지운다, 필드 미전송 = 건드리지 않는다.

### Request Body (모든 필드 선택)

| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| title | string | 1~200자 | 제목 변경 |
| description | string \| null | 최대 1,000자 | null 전송 시 삭제 |
| priority | string | LOW \| MEDIUM \| HIGH \| CRITICAL | 우선순위 변경 |
| dueDate | string \| null | YYYY-MM-DD, 오늘 이후 | null 전송 시 삭제 |
| labelIds | number[] \| null | 최대 5개 | null 또는 빈 배열 시 라벨 전체 해제 |
| issueId | number \| null | 유효 이슈 ID | null 전송 시 연결 해제 |
| assigneeId | number \| null | 유효 멤버 ID. Phase 1: 자기 자신만 | null 전송 시 미배정 처리 |

### Response 200 OK

수정된 티켓 전체 데이터 (`{ "ticket": { ... } }` 형식, GET /api/tickets/:id와 동일)

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 400 | VALIDATION_ERROR | 제약조건 위반 |
| 404 | TICKET_NOT_FOUND | 존재하지 않는 ID |

---

## DELETE /api/tickets/:id

**설명**: 티켓 삭제 (하드 삭제). 관련 checklist_items, ticket_labels CASCADE 삭제.

### Response 204 No Content

본문 없음

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 404 | TICKET_NOT_FOUND | 존재하지 않는 ID |

---

## PATCH /api/tickets/reorder

**설명**: 드래그앤드롭 시 티켓의 상태(칼럼)와 순서를 변경. 트랜잭션 처리.

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| ticketId | number | **O** | 이동할 티켓 ID |
| status | string | **O** | 대상 칼럼 (BACKLOG \| TODO \| IN_PROGRESS \| DONE) |
| position | number | **O** | 칼럼 내 표시 인덱스 (0-based). 서버가 gap-based로 변환 |

> **position 처리**: 클라이언트는 0-based 인덱스를 전송, 서버는 1024 간격 gap-based position으로 변환 저장.

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
    "status": "IN_PROGRESS",
    "position": 0,
    "completedAt": null,
    "updatedAt": "2026-02-21T10:30:00.000Z"
  },
  "affected": [
    { "id": 5, "position": 1024 },
    { "id": 8, "position": 2048 }
  ]
}
```

**비즈니스 로직**:
- DONE으로 이동 시 `completedAt = now()`
- DONE에서 다른 칼럼으로 이동 시 `completedAt = null`
- 영향받은 다른 티켓들의 position 재정렬

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 400 | VALIDATION_ERROR | 잘못된 status 값 |
| 404 | TICKET_NOT_FOUND | 존재하지 않는 ticketId |

---

# 2. 체크리스트 API

## POST /api/tickets/:id/checklist

**설명**: 티켓에 체크리스트 항목 추가. 최대 20개.

### Request Body

| 필드 | 타입 | 필수 | 제약조건 |
|------|------|------|----------|
| text | string | **O** | 1~200자 |

```json
{ "text": "단위 테스트 작성" }
```

### Response 201 Created

```json
{
  "item": {
    "id": 5,
    "ticketId": 1,
    "text": "단위 테스트 작성",
    "isCompleted": false,
    "position": 3,
    "createdAt": "2026-02-21T09:00:00.000Z"
  }
}
```

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 400 | VALIDATION_ERROR | 텍스트 누락 또는 20개 초과 |
| 404 | TICKET_NOT_FOUND | 존재하지 않는 티켓 ID |

---

## PATCH /api/tickets/:id/checklist/:itemId

**설명**: 체크리스트 항목 수정 또는 완료 상태 토글

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| text | string | X | 항목 텍스트 수정 |
| isCompleted | boolean | X | 완료 상태 토글 |

```json
{ "isCompleted": true }
```

### Response 200 OK

```json
{
  "item": {
    "id": 5,
    "ticketId": 1,
    "text": "단위 테스트 작성",
    "isCompleted": true,
    "position": 3,
    "createdAt": "2026-02-21T09:00:00.000Z"
  }
}
```

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 404 | TICKET_NOT_FOUND | 존재하지 않는 티켓 ID |
| 404 | CHECKLIST_ITEM_NOT_FOUND | 존재하지 않는 항목 ID |

---

## DELETE /api/tickets/:id/checklist/:itemId

**설명**: 체크리스트 항목 삭제

### Response 204 No Content

본문 없음

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 404 | TICKET_NOT_FOUND | 존재하지 않는 티켓 ID |
| 404 | CHECKLIST_ITEM_NOT_FOUND | 존재하지 않는 항목 ID |

---

# 3. 라벨 API

## GET /api/labels

**설명**: 현재 워크스페이스의 전체 라벨 목록 조회

### Response 200 OK

```json
{
  "labels": [
    { "id": 1, "workspaceId": 1, "name": "Frontend", "color": "#2b7fff", "createdAt": "2026-02-01T09:00:00.000Z" },
    { "id": 2, "workspaceId": 1, "name": "Backend", "color": "#00c950", "createdAt": "2026-02-01T09:00:00.000Z" },
    { "id": 3, "workspaceId": 1, "name": "Design", "color": "#ad46ff", "createdAt": "2026-02-01T09:00:00.000Z" },
    { "id": 4, "workspaceId": 1, "name": "Bug", "color": "#fb2c36", "createdAt": "2026-02-01T09:00:00.000Z" },
    { "id": 5, "workspaceId": 1, "name": "Docs", "color": "#ffac6d", "createdAt": "2026-02-01T09:00:00.000Z" },
    { "id": 6, "workspaceId": 1, "name": "Infra", "color": "#615fff", "createdAt": "2026-02-01T09:00:00.000Z" }
  ]
}
```

---

## POST /api/labels

**설명**: 새 라벨 생성. 워크스페이스당 최대 20개.

### Request Body

| 필드 | 타입 | 필수 | 제약조건 |
|------|------|------|----------|
| name | string | **O** | 1~20자, 워크스페이스 내 UNIQUE |
| color | string | **O** | HEX 색상 코드 (#RRGGBB) |

```json
{ "name": "Testing", "color": "#71e4bf" }
```

### Response 201 Created

```json
{
  "label": {
    "id": 7,
    "workspaceId": 1,
    "name": "Testing",
    "color": "#71e4bf",
    "createdAt": "2026-02-21T09:00:00.000Z"
  }
}
```

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 400 | VALIDATION_ERROR | 이름 누락, 워크스페이스 내 중복, 색상 형식 오류 또는 20개 초과 |

---

## PATCH /api/labels/:id

**설명**: 라벨 이름/색상 수정

### Request Body

| 필드 | 타입 | 필수 | 제약조건 |
|------|------|------|----------|
| name | string | X | 1~20자, 워크스페이스 내 UNIQUE |
| color | string | X | HEX 색상 코드 (#RRGGBB) |

### Response 200 OK

`{ "label": { ... } }` 형식 (POST /api/labels 응답과 동일 구조)

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 400 | VALIDATION_ERROR | 제약조건 위반 |
| 404 | LABEL_NOT_FOUND | 존재하지 않는 ID |

---

## DELETE /api/labels/:id

**설명**: 라벨 삭제. 해당 라벨이 부착된 모든 티켓에서 자동 제거 (ticket_labels CASCADE).

### Response 204 No Content

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 404 | LABEL_NOT_FOUND | 존재하지 않는 ID |

---

# 4. 이슈 API

## GET /api/issues

**설명**: 현재 워크스페이스의 전체 이슈 계층 목록 조회 (GOAL > STORY > FEATURE > TASK)

### Response 200 OK

```json
{
  "issues": [
    {
      "id": 1,
      "workspaceId": 1,
      "name": "MVP 출시",
      "type": "GOAL",
      "parentId": null,
      "createdAt": "2026-02-01T09:00:00.000Z",
      "children": [
        {
          "id": 2,
          "workspaceId": 1,
          "name": "사용자 인증 시스템",
          "type": "STORY",
          "parentId": 1,
          "createdAt": "2026-02-01T09:00:00.000Z",
          "children": [
            {
              "id": 3,
              "workspaceId": 1,
              "name": "인증 API",
              "type": "FEATURE",
              "parentId": 2,
              "createdAt": "2026-02-01T09:00:00.000Z",
              "children": [
                {
                  "id": 7,
                  "workspaceId": 1,
                  "name": "JWT 토큰 구현",
                  "type": "TASK",
                  "parentId": 3,
                  "createdAt": "2026-02-05T09:00:00.000Z",
                  "children": []
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## POST /api/issues

**설명**: 이슈 생성

### Request Body

| 필드 | 타입 | 필수 | 제약조건 |
|------|------|------|----------|
| name | string | **O** | 1~100자 |
| type | string | **O** | GOAL \| STORY \| FEATURE \| TASK |
| parentId | number | X | 유효 이슈 ID. 타입별 계층 규칙 준수 필수 (아래 참조) |

**parentId 계층 규칙**:

| 이슈 타입 | parentId 제약 |
|----------|--------------|
| GOAL | null 필수 (최상위) |
| STORY | 반드시 GOAL 타입 이슈의 ID |
| FEATURE | 반드시 STORY 타입 이슈의 ID |
| TASK | 반드시 FEATURE 타입 이슈의 ID |

```json
{ "name": "JWT 토큰 구현", "type": "TASK", "parentId": 3 }
```

### Response 201 Created

```json
{
  "issue": {
    "id": 7,
    "workspaceId": 1,
    "name": "JWT 토큰 구현",
    "type": "TASK",
    "parentId": 3,
    "createdAt": "2026-02-21T09:00:00.000Z"
  }
}
```

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 400 | VALIDATION_ERROR | 이름 누락, 잘못된 타입, parentId 계층 규칙 위반 |

---

## PATCH /api/issues/:id

**설명**: 이슈 이름/parentId 수정

### Request Body

| 필드 | 타입 | 필수 | 제약조건 |
|------|------|------|----------|
| name | string | X | 1~100자 |
| parentId | number \| null | X | 유효 이슈 ID, 타입별 계층 규칙 준수 |

### Response 200 OK

`{ "issue": { ... } }` 형식 (POST /api/issues 응답과 동일 구조)

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 400 | VALIDATION_ERROR | 제약조건 위반, parentId 계층 규칙 위반 |
| 404 | ISSUE_NOT_FOUND | 존재하지 않는 ID |

---

## DELETE /api/issues/:id

**설명**: 이슈 삭제. 하위 이슈의 parentId = null 처리 (ON DELETE SET NULL), 해당 이슈에 연결된 티켓의 issueId = null 처리 (ON DELETE SET NULL).

### Response 204 No Content

### 에러 응답

| 상태 코드 | 코드 | 조건 |
|----------|------|------|
| 404 | ISSUE_NOT_FOUND | 존재하지 않는 ID |

---

# 5. 멤버 API

> **Phase 1**: GET만 활성화 (로그인 시 자동 생성). POST/PATCH/DELETE는 Phase 4에서 팀 멤버 초대 기능으로 활성화 예정.

## GET /api/members

**설명**: 현재 워크스페이스의 멤버 목록 조회. Phase 1에서는 본인만 반환.

### Response 200 OK

```json
{
  "members": [
    {
      "id": 1,
      "userId": "google-uid-001",
      "workspaceId": 1,
      "displayName": "홍길동",
      "color": "#7EB4A2",
      "createdAt": "2026-02-01T09:00:00.000Z"
    }
  ]
}
```

---

## POST /api/members — Phase 4에서 활성화

**설명**: 멤버 등록 (Phase 4: 팀 멤버 초대). Phase 1에서는 로그인 시 자동 생성만 지원.

### Response 405 Method Not Allowed (Phase 1)

---

## PATCH /api/members/:id — Phase 4에서 활성화

**설명**: 멤버 정보 수정. Phase 1에서는 비활성화.

### Response 405 Method Not Allowed (Phase 1)

---

## DELETE /api/members/:id — Phase 4에서 활성화

**설명**: 멤버 삭제. Phase 1에서는 비활성화.

### Response 405 Method Not Allowed (Phase 1)

---

# 6. 워크스페이스 API

## GET /api/workspaces

**설명**: 현재 로그인 사용자의 워크스페이스 목록 조회.

### Response 200 OK

```json
{
  "workspaces": [
    {
      "id": 1,
      "name": "내 워크스페이스",
      "ownerId": "google-uid-001",
      "createdAt": "2026-02-01T09:00:00.000Z"
    }
  ]
}
```

---

# 7. 인증 API

NextAuth.js v5가 자동으로 생성하는 라우트. 직접 구현하지 않고 NextAuth 설정으로 관리한다.

| 경로 | 설명 |
|------|------|
| GET /api/auth/signin | 로그인 페이지 (Google OAuth 리다이렉트) |
| GET /api/auth/callback/google | Google OAuth 콜백 처리 |
| POST /api/auth/signout | 로그아웃 |
| GET /api/auth/session | 현재 세션 정보 조회 |

### 최초 로그인 시 자동 처리

1. Google OAuth 콜백에서 사용자 정보 수신
2. `users` 테이블에 사용자 레코드 생성 (이미 있으면 스킵)
3. `workspaces` 테이블에 기본 워크스페이스("내 워크스페이스") 생성
4. `members` 테이블에 멤버 레코드 자동 생성
5. 보드 페이지로 리다이렉트

---

# 8. API 엔드포인트 전체 요약

| 메서드 | 경로 | 상태코드 | 설명 | 관련 FR |
|--------|------|----------|------|---------|
| POST | /api/tickets | 201 | 티켓 생성 | FR-001 |
| GET | /api/tickets | 200 | 보드 데이터 조회 | FR-002 |
| GET | /api/tickets/:id | 200 | 티켓 상세 조회 | FR-003 |
| PATCH | /api/tickets/:id | 200 | 티켓 수정 | FR-004 |
| DELETE | /api/tickets/:id | 204 | 티켓 삭제 | FR-005 |
| PATCH | /api/tickets/reorder | 200 | 드래그앤드롭 이동 | FR-006 |
| POST | /api/tickets/:id/checklist | 201 | 체크리스트 항목 추가 | FR-008 |
| PATCH | /api/tickets/:id/checklist/:itemId | 200 | 항목 수정/토글 | FR-008 |
| DELETE | /api/tickets/:id/checklist/:itemId | 204 | 항목 삭제 | FR-008 |
| GET | /api/labels | 200 | 라벨 목록 | FR-009 |
| POST | /api/labels | 201 | 라벨 생성 | FR-009 |
| PATCH | /api/labels/:id | 200 | 라벨 수정 | FR-009 |
| DELETE | /api/labels/:id | 204 | 라벨 삭제 | FR-009 |
| GET | /api/issues | 200 | 이슈 계층 목록 | FR-010 |
| POST | /api/issues | 201 | 이슈 생성 | FR-010 |
| PATCH | /api/issues/:id | 200 | 이슈 수정 | FR-010 |
| DELETE | /api/issues/:id | 204 | 이슈 삭제 | FR-010 |
| GET | /api/members | 200 | 멤버 목록 (Phase 1: 본인만) | FR-011 |
| POST | /api/members | 405 | 멤버 등록 (Phase 4 활성화) | FR-011 |
| PATCH | /api/members/:id | 405 | 멤버 수정 (Phase 4 활성화) | FR-011 |
| DELETE | /api/members/:id | 405 | 멤버 삭제 (Phase 4 활성화) | FR-011 |
| GET | /api/workspaces | 200 | 워크스페이스 목록 | FR-012 |
| — | /api/auth/* | — | NextAuth 자동 라우트 | FR-013 |
