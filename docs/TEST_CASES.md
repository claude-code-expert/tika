# Tika - 테스트 케이스 정의 (TEST_CASES.md)

> TDD 사이클에 따라 테스트를 먼저 작성하고 구현한다.
> 테스트 프레임워크: Jest + React Testing Library

---

## 1. API 테스트 (백엔드)

### TC-API-001: POST /api/tickets - 티켓 생성

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| 001-1 | 필수 필드만으로 생성 | `{ title: "테스트 할일" }` | 201, status=BACKLOG, priority=MEDIUM |
| 001-2 | 전체 필드로 생성 | `{ title, description, priority: "HIGH", dueDate }` | 201, 모든 필드 반영 |
| 001-3 | 제목 누락 | `{ }` | 400, VALIDATION_ERROR |
| 001-4 | 빈 제목 | `{ title: "" }` | 400, VALIDATION_ERROR |
| 001-5 | 제목 200자 초과 | `{ title: "a".repeat(201) }` | 400, VALIDATION_ERROR |
| 001-6 | 설명 1000자 초과 | `{ title: "ok", description: "a".repeat(1001) }` | 400, VALIDATION_ERROR |
| 001-7 | 잘못된 우선순위 | `{ title: "ok", priority: "URGENT" }` | 400, VALIDATION_ERROR |
| 001-8 | 과거 마감일 | `{ title: "ok", dueDate: "2020-01-01" }` | 400, VALIDATION_ERROR |
| 001-9 | position 자동 할당 | 연속 2개 생성 | 먼저 생성된 것의 position이 더 큼 (나중 것이 위) |

### TC-API-002: GET /api/tickets - 보드 조회

| ID | 시나리오 | 조건 | 기대 결과 |
|----|----------|------|-----------|
| 002-1 | 빈 보드 조회 | 티켓 없음 | 200, 4개 빈 배열 |
| 002-2 | 데이터 있는 보드 | 여러 상태의 티켓 존재 | 200, 상태별 그룹화 |
| 002-3 | 칼럼 내 정렬 | 같은 칼럼에 여러 티켓 | position 오름차순 |
| 002-4 | isOverdue 계산 | 마감일 지난 미완료 티켓 | isOverdue = true |
| 002-5 | DONE은 오버듀 아님 | 마감일 지난 DONE 티켓 | isOverdue = false |

### TC-API-003: GET /api/tickets/:id - 상세 조회

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| 003-1 | 존재하는 티켓 | 유효한 id | 200, 티켓 전체 데이터 |
| 003-2 | 없는 티켓 | 존재하지 않는 id | 404, TICKET_NOT_FOUND |
| 003-3 | 잘못된 id 형식 | `"abc"` | 400, VALIDATION_ERROR |

### TC-API-004: PATCH /api/tickets/:id - 티켓 수정

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| 004-1 | 제목만 수정 | `{ title: "새 제목" }` | 200, 제목 변경, 나머지 유지 |
| 004-2 | 우선순위 변경 | `{ priority: "LOW" }` | 200, priority 변경 |
| 004-3 | 설명 삭제 | `{ description: null }` | 200, description=null |
| 004-4 | 마감일 삭제 | `{ dueDate: null }` | 200, dueDate=null |
| 004-5 | 없는 티켓 수정 | 존재하지 않는 id | 404, TICKET_NOT_FOUND |
| 004-6 | updatedAt 갱신 | 아무 필드 수정 | updatedAt 변경 확인 |

### TC-API-005: DELETE /api/tickets/:id - 티켓 삭제

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| 005-1 | 정상 삭제 | 유효한 id | 204, 재조회 시 404 |
| 005-2 | 없는 티켓 삭제 | 존재하지 않는 id | 404, TICKET_NOT_FOUND |

### TC-API-006: PATCH /api/tickets/reorder - 순서/상태 변경

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| 006-1 | 칼럼 간 이동 | BACKLOG → TODO | status=TODO, position 갱신 |
| 006-2 | 같은 칼럼 내 순서 변경 | position 변경만 | status 유지, position 변경 |
| 006-3 | DONE으로 이동 | → DONE | completedAt 자동 설정 |
| 006-4 | DONE에서 나가기 | DONE → TODO | completedAt = null |
| 006-5 | 다른 티켓 position 영향 | 중간에 삽입 | 영향받는 티켓 position 재정렬 |
| 006-6 | 잘못된 status | `"INVALID"` | 400, VALIDATION_ERROR |
| 006-7 | 없는 티켓 이동 | 존재하지 않는 ticketId | 404, TICKET_NOT_FOUND |

---

## 2. 컴포넌트 테스트 (프론트엔드)

### TC-COMP-001: TicketCard

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C001-1 | 기본 렌더링 | 제목, 우선순위 뱃지, 마감일 표시 |
| C001-2 | 오버듀 티켓 | 빨간 테두리 또는 경고 아이콘 표시 |
| C001-3 | 마감일 없는 티켓 | 마감일 영역 미표시 |
| C001-4 | 클릭 이벤트 | onClick 호출 확인 |
| C001-5 | 긴 제목 | 말줄임(...) 처리 |

### TC-COMP-002: Column

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C002-1 | 티켓 있는 칼럼 | 카드 목록 표시 + 개수 뱃지 |
| C002-2 | 빈 칼럼 | "이 칼럼에 티켓이 없습니다" 안내 |
| C002-3 | 칼럼 헤더 | 칼럼명 + 티켓 수 표시 |

### TC-COMP-003: Board

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C003-1 | 4칼럼 렌더링 | BACKLOG, TODO, IN_PROGRESS, DONE 순서 |
| C003-2 | 반응형 레이아웃 | 뷰포트에 따라 칼럼 수 변경 |

### TC-COMP-004: TicketForm

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C004-1 | 빈 폼 렌더링 (생성) | 빈 필드들, 우선순위 MEDIUM 기본 선택 |
| C004-2 | 기존 데이터 표시 (수정) | initialData 필드에 반영 |
| C004-3 | 빈 제목 제출 | 에러 메시지 "제목을 입력해주세요" |
| C004-4 | 정상 제출 | onSubmit 호출 + 전달된 데이터 확인 |
| C004-5 | 로딩 상태 | 버튼 비활성화 + 스피너 |

### TC-COMP-005: TicketModal

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C005-1 | 열기/닫기 | isOpen에 따라 표시/숨김 |
| C005-2 | ESC 닫기 | ESC 키 누르면 onClose 호출 |
| C005-3 | 바깥 클릭 닫기 | 오버레이 클릭 시 onClose |
| C005-4 | 삭제 확인 | 삭제 → ConfirmDialog → 확인 → onDelete |

### TC-COMP-006: ConfirmDialog

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| C006-1 | 확인 클릭 | onConfirm 호출 |
| C006-2 | 취소 클릭 | onCancel 호출, 다이얼로그 닫힘 |

---

## 3. 통합 테스트

### TC-INT-001: 드래그앤드롭 + API 연동

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| I001-1 | BACKLOG → TODO 드래그 | UI 즉시 반영 + API 호출 + status 변경 확인 |
| I001-2 | API 실패 시 롤백 | 드래그 후 API 에러 → 원래 칼럼으로 복원 |
| I001-3 | → DONE 드래그 시 완료 처리 | completedAt 설정 확인 |

### TC-INT-002: 티켓 CRUD 전체 흐름

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| I002-1 | 생성 → 수정 → 삭제 | 각 단계에서 보드 UI 정상 반영 |
| I002-2 | 생성 후 보드에 표시 | BACKLOG 칼럼에 새 카드 추가 |

---

## 4. 테스트 우선순위

**Phase 1 (핵심)**: API 테스트 전체 + TicketCard/Column 렌더링
**Phase 2 (기능)**: TicketForm 검증 + TicketModal 동작
**Phase 3 (통합)**: 드래그앤드롭 + API 연동, CRUD 전체 흐름
