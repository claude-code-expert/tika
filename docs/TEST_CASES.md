# Tika - 테스트 케이스 정의 (TEST_CASES.md)

> TDD 사이클에 따라 테스트를 먼저 작성하고 구현한다.
> 테스트 프레임워크: Jest + React Testing Library
> 버전: 2.0
> 최종 수정일: 2026-02-22

---

## 테스트 범위 요약

| 영역 | 대상 | 케이스 수 |
|------|------|-----------|
| 인증 | Google OAuth 로그인/로그아웃, 미인증 차단, 데이터 격리 | TC-AUTH-001~005 |
| 워크스페이스 | 자동 생성, 멤버 자동 등록 | TC-WS-001~003 |
| API | 티켓, 체크리스트, 라벨, 이슈, 멤버 | TC-API-001~010 |
| 컴포넌트 | BoardContainer, TicketCard, Column, TicketForm, TicketModal, ChecklistSection, LabelSelector, IssueBreadcrumb, FilterBar | TC-COMP-001~009 |
| 통합 | 드래그앤드롭, CRUD 흐름, 필터링 | TC-INT-001~003 |

---

## 1. 인증 테스트 (Phase 1)

### TC-AUTH-001: Google OAuth 로그인

| ID | 시나리오 | 조건 | 기대 결과 |
|----|----------|------|-----------|
| AUTH-001-1 | 정상 로그인 | 유효한 Google 계정 | 세션 생성, `/` 리다이렉트 |
| AUTH-001-2 | 첫 로그인 | 신규 Google 계정 | user 레코드 생성, 기본 워크스페이스 자동 생성, member 자동 등록 |
| AUTH-001-3 | 재로그인 | 기존 Google 계정 | 기존 user/workspace 유지, 새 세션 생성 |
| AUTH-001-4 | 로그아웃 | 인증된 세션 | 세션 삭제, `/login` 리다이렉트 |
| AUTH-001-5 | OAuth 실패 | 인증 거부/에러 | 에러 메시지 표시, `/login` 유지 |

---

### TC-AUTH-002: 미인증 API 차단

| ID | 시나리오 | 조건 | 기대 결과 |
|----|----------|------|-----------|
| AUTH-002-1 | GET /api/tickets 미인증 | 세션 없음 | 401, UNAUTHORIZED |
| AUTH-002-2 | POST /api/tickets 미인증 | 세션 없음 | 401, UNAUTHORIZED |
| AUTH-002-3 | PATCH /api/tickets/:id 미인증 | 세션 없음 | 401, UNAUTHORIZED |
| AUTH-002-4 | DELETE /api/tickets/:id 미인증 | 세션 없음 | 401, UNAUTHORIZED |
| AUTH-002-5 | PATCH /api/tickets/reorder 미인증 | 세션 없음 | 401, UNAUTHORIZED |
| AUTH-002-6 | GET /api/labels 미인증 | 세션 없음 | 401, UNAUTHORIZED |
| AUTH-002-7 | POST /api/labels 미인증 | 세션 없음 | 401, UNAUTHORIZED |
| AUTH-002-8 | GET /api/issues 미인증 | 세션 없음 | 401, UNAUTHORIZED |
| AUTH-002-9 | POST /api/issues 미인증 | 세션 없음 | 401, UNAUTHORIZED |
| AUTH-002-10 | GET /api/members 미인증 | 세션 없음 | 401, UNAUTHORIZED |
| AUTH-002-11 | GET /api/workspaces 미인증 | 세션 없음 | 401, UNAUTHORIZED |

---

### TC-AUTH-003: 워크스페이스 데이터 격리

| ID | 시나리오 | 조건 | 기대 결과 |
|----|----------|------|-----------|
| AUTH-003-1 | 다른 워크스페이스 티켓 조회 불가 | 사용자 A가 사용자 B의 workspace_id 티켓 접근 | 빈 결과 반환 (타 워크스페이스 데이터 노출 안됨) |
| AUTH-003-2 | 다른 워크스페이스 라벨 조회 불가 | 사용자 A가 사용자 B의 라벨 접근 | 빈 결과 |
| AUTH-003-3 | 다른 워크스페이스 이슈 조회 불가 | 사용자 A가 사용자 B의 이슈 접근 | 빈 결과 |
| AUTH-003-4 | 티켓 생성 시 workspace_id 자동 설정 | 티켓 생성 | 세션 사용자의 workspace_id 자동 반영 |
| AUTH-003-5 | 라벨 생성 시 workspace_id 자동 설정 | 라벨 생성 | 세션 사용자의 workspace_id 자동 반영 |

---

## 2. 워크스페이스 테스트 (Phase 1)

### TC-WS-001: 워크스페이스 자동 생성

| ID | 시나리오 | 조건 | 기대 결과 |
|----|----------|------|-----------|
| WS-001-1 | 첫 로그인 시 생성 | 신규 사용자 OAuth 성공 | workspaces 테이블에 레코드 생성 (name="내 워크스페이스", owner_id=user.id) |
| WS-001-2 | 재로그인 시 중복 생성 방지 | 기존 사용자 재로그인 | 워크스페이스 추가 생성 없음 |
| WS-001-3 | GET /api/workspaces | 인증된 사용자 | 200, 본인 워크스페이스 목록 반환 |

---

### TC-WS-002: 멤버 자동 등록

| ID | 시나리오 | 조건 | 기대 결과 |
|----|----------|------|-----------|
| WS-002-1 | 첫 로그인 시 멤버 등록 | 신규 사용자 OAuth 성공 | members 테이블에 레코드 생성 (user_id=user.id, workspace_id=workspace.id, display_name=user.name) |
| WS-002-2 | 중복 멤버 방지 | 기존 사용자 재로그인 | UNIQUE(user_id, workspace_id)로 중복 방지, 멤버 추가 생성 없음 |
| WS-002-3 | GET /api/members Phase 1 | 인증된 사용자 | 200, 본인만 포함된 멤버 배열 |

---

### TC-WS-003: 멤버 API Phase 1 제한

| ID | 시나리오 | 조건 | 기대 결과 |
|----|----------|------|-----------|
| WS-003-1 | POST /api/members 차단 | Phase 1 | 405, METHOD_NOT_ALLOWED |
| WS-003-2 | PATCH /api/members/:id 차단 | Phase 1 | 405, METHOD_NOT_ALLOWED |
| WS-003-3 | DELETE /api/members/:id 차단 | Phase 1 | 405, METHOD_NOT_ALLOWED |

---

## 3. API 테스트 (백엔드)

### TC-API-001: POST /api/tickets — 티켓 생성

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| 001-1 | 필수 필드만으로 생성 | `{ title: "테스트", type: "TASK" }` | 201, status=BACKLOG, priority=MEDIUM |
| 001-2 | 전체 필드로 생성 | `{ title, type, description, priority: "HIGH", dueDate, labelIds, issueId, assigneeId, checklist }` | 201, 모든 필드 반영 |
| 001-3 | 타입 누락 | `{ title: "ok" }` | 400, VALIDATION_ERROR |
| 001-4 | 제목 누락 | `{ type: "TASK" }` | 400, VALIDATION_ERROR |
| 001-5 | 빈 제목 | `{ title: "", type: "TASK" }` | 400, VALIDATION_ERROR |
| 001-6 | 제목 200자 초과 | `{ title: "a".repeat(201), type: "TASK" }` | 400, VALIDATION_ERROR |
| 001-7 | 설명 1,000자 초과 | `{ title: "ok", type: "TASK", description: "a".repeat(1001) }` | 400, VALIDATION_ERROR |
| 001-8 | 잘못된 우선순위 | `{ title: "ok", type: "TASK", priority: "URGENT" }` | 400, VALIDATION_ERROR |
| 001-9 | 과거 마감일 | `{ title: "ok", type: "TASK", dueDate: "2020-01-01" }` | 400, VALIDATION_ERROR |
| 001-10 | 라벨 5개 초과 | `{ title: "ok", type: "TASK", labelIds: [1,2,3,4,5,6] }` | 400, VALIDATION_ERROR |
| 001-11 | 체크리스트 20개 초과 | checklist 배열 21개 | 400, VALIDATION_ERROR |
| 001-12 | CRITICAL 우선순위 | `{ title: "ok", type: "TASK", priority: "CRITICAL" }` | 201, priority=CRITICAL |
| 001-13 | position 자동 할당 | 연속 2개 생성 | 나중 생성된 것의 position이 더 작음 (맨 위 배치) |
| 001-14 | 응답에 checklist 포함 | checklist 2개 전송 | 201, 응답에 checklist 배열 포함 |
| 001-15 | 응답에 labels 포함 | labelIds 전송 | 201, 응답에 labels 배열 포함 |
| 001-16 | 응답에 assignee 포함 | assigneeId 전송 | 201, 응답에 assignee 객체 포함 |
| 001-17 | 명시적 status 지정 | `{ title: "ok", type: "TASK", status: "TODO" }` | 201, status=TODO |
| 001-18 | 잘못된 status 값 | `{ title: "ok", type: "TASK", status: "PENDING" }` | 400, VALIDATION_ERROR |

---

### TC-API-002: GET /api/tickets — 보드 조회

| ID | 시나리오 | 조건 | 기대 결과 |
|----|----------|------|-----------|
| 002-1 | 빈 보드 조회 | 티켓 없음 | 200, 4개 빈 배열, total=0 |
| 002-2 | 데이터 있는 보드 | 여러 상태의 티켓 존재 | 200, 상태별 그룹화 |
| 002-3 | 칼럼 내 정렬 | 같은 칼럼에 여러 티켓 | position 오름차순 |
| 002-4 | isOverdue 계산 | 마감일 지난 미완료 티켓 | isOverdue = true |
| 002-5 | DONE은 오버듀 아님 | 마감일 지난 DONE 티켓 | isOverdue = false |
| 002-6 | 마감일 없음은 오버듀 아님 | dueDate=null | isOverdue = false |
| 002-7 | 오늘 마감일은 오버듀 아님 | dueDate=오늘 | isOverdue = false |
| 002-8 | 응답에 checklist 포함 | 체크리스트 있는 티켓 | 각 티켓에 checklist 배열 포함 |
| 002-9 | 응답에 labels 포함 | 라벨 있는 티켓 | 각 티켓에 labels 배열 포함 |
| 002-10 | 응답에 assignee 포함 | 담당자 있는 티켓 | 각 티켓에 assignee 객체 포함 |
| 002-11 | total 카운트 | 티켓 9개 | total = 9 |

---

### TC-API-003: GET /api/tickets/:id — 상세 조회

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| 003-1 | 존재하는 티켓 | 유효한 id | 200, 티켓 전체 데이터 (isOverdue 포함) |
| 003-2 | 없는 티켓 | 존재하지 않는 id | 404, TICKET_NOT_FOUND |
| 003-3 | 잘못된 id 형식 | `"abc"` | 400, VALIDATION_ERROR |
| 003-4 | checklist 포함 확인 | 체크리스트 있는 티켓 | checklist 배열 포함 |
| 003-5 | labels 포함 확인 | 라벨 있는 티켓 | labels 배열 포함 |
| 003-6 | issue breadcrumb 포함 | 이슈 연결된 티켓 | issue.breadcrumb 배열 포함 |

---

### TC-API-004: PATCH /api/tickets/:id — 티켓 수정

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| 004-1 | 제목만 수정 | `{ title: "새 제목" }` | 200, 제목 변경, 나머지 유지 |
| 004-2 | 우선순위 변경 | `{ priority: "CRITICAL" }` | 200, priority 변경 |
| 004-3 | 설명 삭제 | `{ description: null }` | 200, description=null |
| 004-4 | 마감일 삭제 | `{ dueDate: null }` | 200, dueDate=null |
| 004-5 | 라벨 변경 | `{ labelIds: [1, 2] }` | 200, labels 교체 |
| 004-6 | 라벨 전체 해제 | `{ labelIds: null }` | 200, labels=[] |
| 004-7 | 이슈 연결 해제 | `{ issueId: null }` | 200, issueId=null |
| 004-8 | 담당자 해제 | `{ assigneeId: null }` | 200, assigneeId=null |
| 004-9 | 없는 티켓 수정 | 존재하지 않는 id | 404, TICKET_NOT_FOUND |
| 004-10 | updatedAt 갱신 | 아무 필드 수정 | updatedAt 변경 확인 |
| 004-11 | 미전송 필드 유지 | `{ title: "새 제목" }` | priority, dueDate 등 기존값 유지 |

---

### TC-API-005: DELETE /api/tickets/:id — 티켓 삭제

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| 005-1 | 정상 삭제 | 유효한 id | 204, 재조회 시 404 |
| 005-2 | 없는 티켓 삭제 | 존재하지 않는 id | 404, TICKET_NOT_FOUND |
| 005-3 | checklist CASCADE | 체크리스트 있는 티켓 삭제 | checklist_items도 삭제 확인 |
| 005-4 | ticket_labels CASCADE | 라벨 있는 티켓 삭제 | ticket_labels 레코드도 삭제 확인 |

---

### TC-API-006: PATCH /api/tickets/reorder — 드래그앤드롭

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| 006-1 | 칼럼 간 이동 | BACKLOG → TODO | status=TODO, position 갱신 |
| 006-2 | 같은 칼럼 내 순서 변경 | position만 변경 | status 유지, position 변경 |
| 006-3 | DONE으로 이동 | → DONE | completedAt 자동 설정 |
| 006-4 | DONE에서 나가기 | DONE → TODO | completedAt = null |
| 006-5 | 다른 티켓 position 영향 | 중간에 삽입 | affected 배열에 영향받는 티켓 포함 |
| 006-6 | 잘못된 status | `"INVALID"` | 400, VALIDATION_ERROR |
| 006-7 | 없는 티켓 이동 | 존재하지 않는 ticketId | 404, TICKET_NOT_FOUND |
| 006-8 | 빈 칼럼으로 이동 | 빈 칼럼에 첫 번째로 삽입 | position = 0 |
| 006-9 | 트랜잭션 원자성 | DB 오류 시뮬레이션 | 부분 업데이트 없이 전체 롤백 |

---

### TC-API-007: 체크리스트 API

| ID | 엔드포인트 | 시나리오 | 입력 | 기대 결과 |
|----|-----------|----------|------|-----------|
| 007-1 | POST /api/tickets/:id/checklist | 항목 추가 | `{ text: "단위 테스트" }` | 201, 항목 생성 |
| 007-2 | POST | 텍스트 누락 | `{}` | 400, VALIDATION_ERROR |
| 007-3 | POST | 20개 초과 시도 | 21번째 항목 추가 | 400, VALIDATION_ERROR |
| 007-4 | POST | 없는 티켓 | 존재하지 않는 ticketId | 404, TICKET_NOT_FOUND |
| 007-5 | PATCH /:id/checklist/:itemId | 완료 토글 | `{ isCompleted: true }` | 200, isCompleted=true |
| 007-6 | PATCH | 텍스트 수정 | `{ text: "수정된 텍스트" }` | 200, text 변경 |
| 007-7 | PATCH | 없는 항목 | 존재하지 않는 itemId | 404, CHECKLIST_ITEM_NOT_FOUND |
| 007-8 | DELETE /:id/checklist/:itemId | 항목 삭제 | 유효한 itemId | 204 |
| 007-9 | DELETE | 없는 항목 | 존재하지 않는 itemId | 404, CHECKLIST_ITEM_NOT_FOUND |
| 007-10 | POST | position 자동 계산 | 3번째 항목 추가 | position = 기존 max + 1 |

---

### TC-API-008: 라벨 API

| ID | 엔드포인트 | 시나리오 | 입력 | 기대 결과 |
|----|-----------|----------|------|-----------|
| 008-1 | GET /api/labels | 전체 목록 조회 | — | 200, labels 배열 |
| 008-2 | POST /api/labels | 라벨 생성 | `{ name: "Testing", color: "#71e4bf" }` | 201, 생성된 라벨 |
| 008-3 | POST | 이름 중복 | 기존 라벨명과 동일 | 400, VALIDATION_ERROR |
| 008-4 | POST | 이름 누락 | `{ color: "#fff" }` | 400, VALIDATION_ERROR |
| 008-5 | POST | 20자 초과 이름 | name 21자 | 400, VALIDATION_ERROR |
| 008-6 | POST | 잘못된 HEX 색상 | `{ name: "x", color: "red" }` | 400, VALIDATION_ERROR |
| 008-7 | POST | 20개 초과 시도 | 21번째 라벨 생성 | 400, VALIDATION_ERROR |
| 008-8 | PATCH /api/labels/:id | 이름 수정 | `{ name: "Updated" }` | 200, 수정된 라벨 |
| 008-9 | PATCH | 색상 수정 | `{ color: "#fb2c36" }` | 200, 수정된 라벨 |
| 008-10 | PATCH | 없는 라벨 | 존재하지 않는 id | 404, LABEL_NOT_FOUND |
| 008-11 | DELETE /api/labels/:id | 라벨 삭제 | 유효한 id | 204 |
| 008-12 | DELETE | 티켓 라벨 자동 제거 | 티켓에 부착된 라벨 삭제 | ticket_labels 레코드 제거 확인 |
| 008-13 | DELETE | 없는 라벨 | 존재하지 않는 id | 404, LABEL_NOT_FOUND |

---

### TC-API-009: 이슈 API

| ID | 엔드포인트 | 시나리오 | 입력 | 기대 결과 |
|----|-----------|----------|------|-----------|
| 009-1 | GET /api/issues | 전체 계층 조회 | — | 200, 트리 구조 반환 |
| 009-2 | POST /api/issues | GOAL 생성 | `{ name: "MVP 출시", type: "GOAL" }` | 201, parentId=null |
| 009-3 | POST | STORY 생성 | `{ name: "인증", type: "STORY", parentId: 1 }` | 201, Goal 하위 |
| 009-4 | POST | FEATURE 생성 | `{ name: "인증 API", type: "FEATURE", parentId: 2 }` | 201, Story 하위 |
| 009-5 | POST | TASK 생성 | `{ name: "JWT 구현", type: "TASK", parentId: 3 }` | 201, Feature 하위 |
| 009-6 | POST | 이름 누락 | `{ type: "GOAL" }` | 400, VALIDATION_ERROR |
| 009-7 | POST | 잘못된 타입 | `{ name: "x", type: "EPIC" }` | 400, VALIDATION_ERROR |
| 009-8 | PATCH /api/issues/:id | 이름 수정 | `{ name: "수정된 이름" }` | 200, 수정된 이슈 |
| 009-9 | PATCH | 없는 이슈 | 존재하지 않는 id | 404, ISSUE_NOT_FOUND |
| 009-10 | DELETE /api/issues/:id | 이슈 삭제 | 유효한 id | 204 |
| 009-11 | DELETE | 하위 이슈 parentId=null 처리 | 부모 이슈 삭제 | 자식의 parentId = null |
| 009-12 | DELETE | 티켓 issueId=null 처리 | 티켓에 연결된 이슈 삭제 | 티켓의 issueId = null |
| 009-13 | DELETE | 없는 이슈 | 존재하지 않는 id | 404, ISSUE_NOT_FOUND |

---

### TC-API-010: 멤버 API

**Phase 1**: GET만 허용 (자동 생성된 본인만 조회). POST/PATCH/DELETE → 405 (Phase 4에서 활성화)

| ID | 엔드포인트 | 시나리오 | 입력 | 기대 결과 |
|----|-----------|----------|------|-----------|
| 010-1 | GET /api/members | 본인 멤버 조회 | — | 200, 세션 사용자의 워크스페이스 멤버 배열 (Phase 1: 본인만) |
| 010-2 | POST /api/members | Phase 1 차단 | `{ displayName: "홍길동" }` | 405, METHOD_NOT_ALLOWED |
| 010-3 | PATCH /api/members/:id | Phase 1 차단 | `{ displayName: "홍길순" }` | 405, METHOD_NOT_ALLOWED |
| 010-4 | DELETE /api/members/:id | Phase 1 차단 | 유효한 id | 405, METHOD_NOT_ALLOWED |
| 010-5 | GET /api/members | 미인증 | 세션 없음 | 401, UNAUTHORIZED |

---

## 4. 컴포넌트 테스트 (프론트엔드)

### TC-COMP-001: TicketCard

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C001-1 | 기본 렌더링 | 제목, 우선순위 뱃지, 마감일 표시 |
| C001-2 | 오버듀 티켓 | 빨간 테두리 + ⚠ 아이콘 표시 |
| C001-3 | 마감일 없는 티켓 | 마감일 영역 미표시 |
| C001-4 | 클릭 이벤트 | onClick 호출 확인 |
| C001-5 | 긴 제목 | 1줄 말줄임(...) 처리 |
| C001-6 | 라벨 뱃지 렌더링 | labels 배열 기반 색상 뱃지 표시 |
| C001-7 | 체크리스트 진행률 | "2/4" 형식으로 진행률 표시 |
| C001-8 | 담당자 아바타 | assignee 이니셜 + 배경색 표시 |
| C001-9 | 이슈 태그 | 연결된 이슈의 최하위 이름 표시 |
| C001-10 | Done 카드 | opacity 0.7 적용 확인 |
| C001-11 | CRITICAL 뱃지 | 빨간 배경 뱃지 표시 |
| C001-12 | 마감 임박 뱃지 | 3일 이내 마감 시 노란 배경 |

---

### TC-COMP-002: Column

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C002-1 | 티켓 있는 칼럼 | 카드 목록 표시 + 개수 뱃지 |
| C002-2 | 빈 칼럼 | 빈 상태 안내 표시 |
| C002-3 | 칼럼 헤더 | 칼럼명 + 티켓 수 표시 |
| C002-4 | TODO 헤더 색상 | #DBEAFE 배경 적용 확인 |
| C002-5 | IN_PROGRESS 헤더 색상 | #FEF3C7 배경 적용 확인 |
| C002-6 | DONE 헤더 색상 | #D1FAE5 배경 적용 확인 |

---

### TC-COMP-003: Board

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C003-1 | 4칼럼 렌더링 | BACKLOG, TODO, IN_PROGRESS, DONE 순서 |
| C003-2 | 반응형 레이아웃 | 뷰포트에 따라 칼럼 수 변경 |
| C003-3 | 칼럼 순서 고정 | BACKLOG → TODO → IN_PROGRESS → DONE |

---

### TC-COMP-004: TicketForm (생성 모달)

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C004-1 | 빈 폼 렌더링 | 타입 미선택, 우선순위 MEDIUM 기본, 상태 TODO 기본 |
| C004-2 | 타입 선택 | 4개 버튼 (GOAL/STORY/FEATURE/TASK), 선택 시 색상 변경 |
| C004-3 | 타입 미선택 제출 | 빨간 테두리 + "타입을 선택해주세요" 에러 |
| C004-4 | 빈 제목 제출 | "제목을 입력해주세요" 에러 메시지 |
| C004-5 | 정상 제출 | onSubmit 호출 + 데이터 확인 |
| C004-6 | 로딩 상태 | 버튼 비활성화 |
| C004-7 | 체크리스트 추가 | 항목 추가 후 목록에 표시 |
| C004-8 | 체크리스트 삭제 | ✕ 클릭 시 항목 제거 |
| C004-9 | 라벨 토글 선택 | 클릭 시 선택/해제, 선택 시 강조 |
| C004-10 | 라벨 5개 초과 방지 | 5개 선택 후 추가 시도 시 차단 |
| C004-11 | TASK 타입 시 캐스케이딩 | Goal→Story→Feature 3단계 셀렉트 표시 |
| C004-12 | GOAL 타입 시 상위 이슈 없음 | 상위 카테고리 섹션 비표시 |
| C004-13 | 담당자 (Phase 1) | 읽기 전용 (세션 사용자 자동 입력), 미배정 버튼만 표시 |
| C004-14 | 취소 | 폼 초기화 + onCancel 호출 |

---

### TC-COMP-005: TicketModal (상세 모달)

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C005-1 | 열기/닫기 | isOpen에 따라 표시/숨김 |
| C005-2 | ESC 닫기 | ESC 키 → onClose 호출 |
| C005-3 | 오버레이 클릭 닫기 | 오버레이 클릭 → onClose |
| C005-4 | 삭제 확인 | 삭제 → ConfirmDialog → 확인 → onDelete |
| C005-5 | 라벨 편집 표시 | 부착된 라벨 + ✕ + + 버튼 표시 |
| C005-6 | 브레드크럼 표시 | 이슈 계층 [G] › [S] › [F] › [T] 형식 |
| C005-7 | 메타 정보 표시 | 상태, 우선순위, 마감일, 담당자 표시 |
| C005-8 | 편집 버튼 | 편집 모드 전환 시 필드 수정 가능 |
| C005-9 | 스크롤 잠금 | 모달 열림 시 body overflow: hidden |

---

### TC-COMP-006: ChecklistSection

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C006-1 | 항목 렌더링 | 체크박스 + 텍스트 + ✕ 버튼 |
| C006-2 | 체크 토글 | 체크 시 취소선 + muted 색상 |
| C006-3 | 항목 추가 | 입력 후 엔터 → 항목 추가 |
| C006-4 | 항목 삭제 | ✕ 클릭 → 항목 제거 + API 호출 |
| C006-5 | 진행률 표시 | "2/4" 형식 |
| C006-6 | 최대 20개 제한 | 20개 도달 시 입력 비활성화 |
| C006-7 | API 오류 처리 | 체크 실패 시 원상 복구 |

---

### TC-COMP-007: LabelSelector

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C007-1 | 프리셋 라벨 표시 | 6개 기본 라벨 칩 표시 |
| C007-2 | 라벨 선택 토글 | 클릭 시 선택/해제 |
| C007-3 | 커스텀 라벨 생성 | 이름 + 색상 선택 후 추가 |
| C007-4 | 색상 스와치 | 17개 색상 옵션 표시 |
| C007-5 | 선택 수 제한 | 5개 초과 시 추가 불가 |

---

### TC-COMP-008: IssueBreadcrumb

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C008-1 | 전체 계층 표시 | [G] → [S] → [F] → [T] 형식 |
| C008-2 | 부분 계층 표시 | Goal만 연결 시 [G] 만 표시 |
| C008-3 | 연결 없음 | "상위 카테고리 없음" 표시 |
| C008-4 | 타입 색상 | Goal=#8B5CF6, Story=#3B82F6, Feature=#10B981, Task=#F59E0B |
| C008-5 | 편집 버튼 | ✏ 클릭 시 카테고리 에디터 토글 |

---

### TC-COMP-009: FilterBar

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C009-1 | 칩 목록 렌더링 | 전체, 이번 주 업무, 일정 초과, 높은 우선순위, 내게 할당됨, 라벨 |
| C009-2 | 칩 클릭 토글 | ON/OFF 전환 (accent 배경) |
| C009-3 | 전체 칩 활성 | 모든 필터 해제 |
| C009-4 | 카운트 표시 | 칩 내 해당 항목 수 표시 |
| C009-5 | 일정 초과 칩 | isOverdue=true 티켓 필터링 |

---

## 5. 통합 테스트

### TC-INT-001: 드래그앤드롭 + API 연동

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| I001-1 | BACKLOG → TODO 드래그 | UI 즉시 반영 + API 호출 + status 변경 확인 |
| I001-2 | API 실패 시 롤백 | 드래그 후 API 에러 → 원래 칼럼으로 복원 + 에러 토스트 |
| I001-3 | → DONE 드래그 시 완료 처리 | completedAt 설정 확인 |
| I001-4 | DONE → TODO 이동 | completedAt = null 확인 |
| I001-5 | 같은 칼럼 내 리오더 | position 재계산, status 유지 |
| I001-6 | 낙관적 업데이트 순서 | UI 먼저 반영 후 API 호출 순서 확인 |

---

### TC-INT-002: 티켓 CRUD 전체 흐름

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| I002-1 | 생성 → 보드 반영 | BACKLOG 칼럼 맨 위에 새 카드 추가 |
| I002-2 | 수정 → 보드 반영 | 카드 내용 즉시 업데이트 |
| I002-3 | 삭제 → 보드 반영 | 카드 제거, 칼럼 카운트 감소 |
| I002-4 | 생성 + 체크리스트 | 생성 시 체크리스트 포함, 카드에 진행률 표시 |
| I002-5 | 생성 + 라벨 | 생성 시 라벨 포함, 카드에 라벨 뱃지 표시 |
| I002-6 | 생성 + 담당자 | 생성 시 담당자 포함, 카드에 아바타 표시 |

---

### TC-INT-003: 필터링 흐름

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| I003-1 | 높은 우선순위 필터 | HIGH, CRITICAL 티켓만 보드에 표시 |
| I003-2 | 일정 초과 필터 | isOverdue=true 티켓만 표시 |
| I003-3 | 라벨 필터 | 선택한 라벨이 부착된 티켓만 표시 |
| I003-4 | 전체 칩 | 모든 필터 해제, 전체 티켓 표시 |
| I003-5 | 필터 중 드래그 | 필터 상태 유지 후 드래그앤드롭 동작 확인 |

---

## 6. 테스트 우선순위

### Phase 1 (핵심 — 즉시 구현)
- TC-AUTH-001~003 (인증, 미인증 차단, 데이터 격리)
- TC-WS-001~003 (워크스페이스 자동 생성, 멤버 자동 등록, Phase 1 제한)
- TC-API-001~006 (티켓 기본 CRUD + 리오더)
- TC-COMP-001, TC-COMP-002, TC-COMP-003 (카드, 칼럼, 보드 렌더링)

### Phase 2 (기능 — 확장 기능)
- TC-API-007~010 (체크리스트, 라벨, 이슈, 멤버 API)
- TC-COMP-004, TC-COMP-005 (폼, 모달)
- TC-COMP-006, TC-COMP-007, TC-COMP-008 (체크리스트, 라벨, 이슈 컴포넌트)

### Phase 3 (통합 — E2E 흐름)
- TC-INT-001 (드래그앤드롭 + API)
- TC-INT-002 (CRUD 전체 흐름)
- TC-INT-003 (필터링 흐름)
- TC-COMP-009 (FilterBar)

---

## 7. Phase 2 (SaaS) 추가 예정 테스트

> TC-AUTH 인증 테스트는 Phase 1으로 이동 완료 (§1 참조)

| 케이스 | 설명 |
|--------|------|
| TC-NOTIF-001 | Slack Webhook 연동 테스트 메시지 발송 |
| TC-NOTIF-002 | Telegram Bot 연동 테스트 |
| TC-NOTIF-003 | D-1 알림 스케줄러 트리거 |
| TC-SEARCH-001 | 키워드 검색 (ILIKE) |
| TC-SEARCH-002 | 다중 조건 AND 필터링 |
| TC-COMMENT-001 | 댓글 CRUD |
| TC-MEMBER-CRUD | 멤버 POST/PATCH/DELETE 활성화 (Phase 4) |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 0.3.0 | 2026-02-22 | 인증+워크스페이스 반영: TC-AUTH(§1), TC-WS(§2) 추가, TC-API-010 Phase 1 제한 반영, Phase 2 TC-AUTH 제거, 테스트 우선순위에 인증/워크스페이스 추가 |
| 0.2.0 | 2026-02-21 | 초기 작성 — API(10), 컴포넌트(9), 통합(3) 테스트 |
