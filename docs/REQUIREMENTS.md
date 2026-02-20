# Tika - 요구사항 명세 (REQUIREMENTS.md)

> Claude Code 참조용 상세 요구사항.
> PRD, TRD와 함께 CLAUDE.md에서 참조한다.

---

## 기능 요구사항

### FR-001: 티켓 생성

**설명**: 사용자가 새로운 티켓을 생성하여 Backlog에 추가한다.

**입력 필드**:
| 필드 | 타입 | 필수 | 제약조건 | 기본값 |
|------|------|------|----------|--------|
| title | string | O | 1~200자, 공백만 불가 | - |
| description | string | X | 최대 1000자 | null |
| priority | enum | X | LOW, MEDIUM, HIGH | MEDIUM |
| dueDate | date | X | 오늘 이후 날짜 | null |

**처리 규칙**:
- 생성 시 status는 항상 BACKLOG
- 생성 시 position은 해당 칼럼의 최솟값 - 1 (맨 위 배치)
- createdAt, updatedAt 자동 설정

**성공 응답**: 201 Created + 생성된 티켓 전체 데이터
**실패 응답**: 400 Bad Request + 검증 에러 상세

---

### FR-002: 티켓 목록 조회 (보드)

**설명**: 칸반 보드에 표시할 전체 티켓을 칼럼별로 그룹화하여 조회한다.

**응답 데이터**: 4개 칼럼별로 그룹화된 티켓 배열
- 각 칼럼 내 정렬: position 오름차순
- 각 티켓에 isOverdue 파생 필드 포함

**성공 응답**: 200 OK

---

### FR-003: 티켓 상세 조회

**설명**: 특정 티켓의 전체 정보를 조회한다.

**입력**: 티켓 ID (path parameter)
**성공 응답**: 200 OK + 티켓 전체 데이터
**실패 응답**: 404 Not Found (존재하지 않는 ID)

---

### FR-004: 티켓 수정

**설명**: 티켓의 제목, 설명, 우선순위, 마감일을 수정한다.

**수정 가능 필드**:
| 필드 | 타입 | 제약조건 |
|------|------|----------|
| title | string | 1~200자 |
| description | string \| null | 최대 1000자. null 전송 시 삭제 |
| priority | enum | LOW, MEDIUM, HIGH |
| dueDate | date \| null | 오늘 이후. null 전송 시 삭제 |

**처리 규칙**:
- 부분 수정(PATCH) 지원: 전송된 필드만 업데이트
- updatedAt 자동 갱신

**성공 응답**: 200 OK + 수정된 티켓 전체 데이터
**실패 응답**: 400 (검증 실패), 404 (미존재)

---

### FR-005: 티켓 삭제

**설명**: 티켓을 영구 삭제한다.

**입력**: 티켓 ID (path parameter)
**처리 규칙**: 하드 삭제 (soft delete 아님, MVP 기준)
**성공 응답**: 204 No Content
**실패 응답**: 404 Not Found

---

### FR-006: 티켓 상태 이동 (드래그앤드롭)

**설명**: 티켓을 다른 칼럼으로 이동하거나 같은 칼럼 내에서 순서를 변경한다.

**입력**:
| 필드 | 타입 | 설명 |
|------|------|------|
| ticketId | number | 이동할 티켓 ID |
| status | enum | 이동 대상 칼럼 (BACKLOG, TODO, IN_PROGRESS, DONE) |
| position | number | 칼럼 내 새 위치 (0부터 시작) |

**처리 규칙**:
- 상태(status)와 순서(position) 동시 업데이트
- 영향받는 다른 티켓들의 position도 재정렬
- 트랜잭션으로 원자성 보장

**비즈니스 로직**:
- DONE으로 이동 시: completedAt = 현재 시각
- DONE에서 나올 때: completedAt = null

**성공 응답**: 200 OK + 업데이트된 티켓 목록
**실패 응답**: 400 (잘못된 status), 404 (미존재 ticketId)

---

### FR-007: 오버듀 판정

**설명**: 마감일이 지난 미완료 티켓에 오버듀 표시.

**판정 규칙**: `dueDate < 오늘 AND status ≠ DONE`
- 이 값은 DB에 저장하지 않고 조회 시 계산 (파생 필드)
- 프론트엔드에서도 클라이언트 사이드로 계산 가능

---

## 비기능 요구사항

### NFR-001: 성능
- API 응답: 200ms 이내 (p95)
- 보드 초기 로드: 2초 이내

### NFR-002: 반응형
- 모바일 (360px~): 단일 칼럼 스크롤 뷰, 터치 드래그 지원
- 태블릿 (768px~): 2칼럼 그리드
- 데스크톱 (1024px~): 4칼럼 가로 배치

### NFR-003: 접근성
- 키보드로 카드 선택 및 이동 가능
- 스크린 리더 지원 (aria-label, role 속성)
- 충분한 색상 대비

### NFR-004: 데이터 무결성
- 드래그앤드롭 낙관적 업데이트: UI 즉시 반영 → API 성공 시 확정, 실패 시 롤백
- position 값은 정수로 관리, 충돌 시 재정렬

---

## 칼럼(상태) 정의

```typescript
enum TicketStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}
```

**칼럼 순서**: BACKLOG → TODO → IN_PROGRESS → DONE (고정)
**이동 제약**: 없음 (어떤 칼럼에서든 어떤 칼럼으로든 이동 가능)

---

## 우선순위 정의

```typescript
enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}
```

**시각적 표현**:
- LOW: 회색 뱃지
- MEDIUM: 파란색 뱃지
- HIGH: 빨간색 뱃지
