# Tika - 컴포넌트 명세 (COMPONENT_SPEC.md)

> React 컴포넌트 계층, Props, 동작, 이벤트 흐름 정의

---

## 1. 컴포넌트 계층 구조

```
App (page.tsx - 서버 컴포넌트)
│
└── BoardContainer (클라이언트 컴포넌트, 상태 관리 + DnD 컨텍스트)
    │
    ├── [헤더 영역] ─── TicketForm (생성 모달)
    │
    ├── Board (DndContext)
    │   ├── Column (BACKLOG)
    │   │   ├── [칼럼 헤더] (칼럼명 + 카드 수)
    │   │   └── SortableContext
    │   │       ├── TicketCard
    │   │       ├── TicketCard
    │   │       └── ...
    │   ├── Column (TODO)
    │   │   └── ...
    │   ├── Column (IN_PROGRESS)
    │   │   └── ...
    │   └── Column (DONE)
    │       └── ...
    │
    └── TicketModal (상세/수정 모달)
        ├── TicketForm (수정 폼)
        └── ConfirmDialog (삭제 확인)
```

> **참고**: `[헤더 영역]`, `[칼럼 헤더]`는 논리적 영역을 나타낸다. 독립 컴포넌트 파일이 아니라 각각 `BoardContainer`, `Column` 내부에 인라인으로 구현된다. 물리적 파일 구조는 TRD.md §3 참조.

---

## 2. 핵심 컴포넌트 상세

### 2.1 BoardContainer

**역할**: 보드 전체의 상태 관리, DnD 컨텍스트 제공, API 통신

**Props**: 
| Prop | 타입 | 설명 |
|------|------|------|
| initialData | BoardData | 서버에서 초기 로드한 보드 데이터 |

**내부 상태**:
| 상태 | 타입 | 설명 |
|------|------|------|
| board | BoardData | 현재 보드 상태 (4개 칼럼의 티켓 배열) |
| activeTicket | TicketWithMeta \| null | 드래그 중인 티켓 |
| selectedTicket | TicketWithMeta \| null | 모달에 표시할 선택된 티켓 |
| isCreating | boolean | 생성 모달 열림 여부 |

**핵심 동작**:
1. DndContext의 onDragStart, onDragOver, onDragEnd 핸들링
2. 드래그 완료 시 낙관적 업데이트 → API 호출 → 실패 시 롤백
3. 티켓 CRUD 시 board 상태 즉시 반영 + API 동기화

---

### 2.2 Board

**역할**: DnD 영역을 정의하고 4개 Column을 가로 배치

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| board | BoardData | 칼럼별 티켓 데이터 |
| onTicketClick | (ticket: TicketWithMeta) => void | 카드 클릭 핸들러 |

**레이아웃**:
- 데스크톱: 4칼럼 가로 배치 (`grid-cols-4`)
- 태블릿: 2칼럼 그리드 (`grid-cols-2`)
- 모바일: 단일 칼럼 세로 스크롤 (`grid-cols-1`)

---

### 2.3 Column

**역할**: 단일 칼럼(상태)에 속하는 카드 목록 표시, 드롭 영역

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| status | TicketStatus | 칼럼 상태 값 |
| tickets | TicketWithMeta[] | 이 칼럼의 티켓 목록 |
| onTicketClick | (ticket: TicketWithMeta) => void | 카드 클릭 핸들러 |

**동작**:
1. SortableContext로 칼럼 내 정렬 지원
2. useDroppable로 드롭 대상 영역 설정
3. 비어있을 때 "이 칼럼에 티켓이 없습니다" 안내 표시
4. 칼럼 헤더에 티켓 수 뱃지 표시

**스타일**:
- 배경: 연한 회색 (구분감)
- 최소 높이: 화면 높이에 맞춤
- 카드 간격: 8px

---

### 2.4 TicketCard

**역할**: 개별 티켓을 카드 형태로 표시, 드래그 소스

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| ticket | TicketWithMeta | 티켓 데이터 |
| onClick | () => void | 클릭 핸들러 (상세 모달) |

**표시 정보**:
- 제목 (1줄, 넘치면 말줄임)
- 우선순위 뱃지 (색상 구분)
- 마감일 (있을 경우)
- 오버듀 표시 (빨간 테두리 또는 아이콘)

**동작**:
1. useSortable로 드래그 가능하게 설정
2. 클릭 시 onClick 호출 (드래그와 클릭 구분)
3. 드래그 중일 때 반투명 + 그림자 스타일

**접근성**:
- `role="button"`
- `aria-label="티켓: {title}"`
- 키보드 포커스 가능 (Tab), Enter로 상세 열기

---

### 2.5 TicketModal

**역할**: 티켓 상세 정보 표시 및 수정/삭제

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| ticket | TicketWithMeta | 표시할 티켓 |
| isOpen | boolean | 모달 열림 상태 |
| onClose | () => void | 닫기 핸들러 |
| onUpdate | (id: number, data: UpdateTicketInput) => void | 수정 핸들러 |
| onDelete | (id: number) => void | 삭제 핸들러 |

**동작**:
1. 모달 열림 시 바깥 영역 클릭 또는 ESC로 닫기
2. 인라인 편집: 필드 클릭 시 편집 모드 전환
3. 삭제 버튼 클릭 시 ConfirmDialog 표시
4. 수정 완료 시 onUpdate 호출
5. body 스크롤 잠금

---

### 2.6 TicketForm

**역할**: 티켓 생성/수정 폼

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| mode | 'create' \| 'edit' | 폼 모드 |
| initialData | Partial\<Ticket\> | 수정 시 기존 데이터 |
| onSubmit | (data: CreateTicketInput \| UpdateTicketInput) => void | 제출 핸들러 |
| onCancel | () => void | 취소 핸들러 |
| isLoading | boolean | 제출 중 로딩 상태 |

**폼 필드**:
| 필드 | 컴포넌트 | 검증 |
|------|----------|------|
| title | text input | 필수, 1~200자 |
| description | textarea | 선택, 최대 1000자 |
| priority | select (3옵션) | LOW, MEDIUM, HIGH |
| dueDate | date input | 선택, 오늘 이후 |

**동작**:
1. 클라이언트 사이드 검증 → 에러 메시지 표시
2. Enter 키 또는 제출 버튼으로 폼 제출
3. 제출 중 버튼 비활성화 + 로딩 스피너
4. 성공 시 폼 초기화 (생성 모드) 또는 모달 닫기 (수정 모드)

**검증 규칙**:
| 필드 | 규칙 | 에러 메시지 |
|------|------|-------------|
| title | 빈 값 | "제목을 입력해주세요" |
| title | 200자 초과 | "제목은 200자 이내로 입력해주세요" |
| description | 1000자 초과 | "설명은 1000자 이내로 입력해주세요" |
| dueDate | 과거 날짜 | "마감일은 오늘 이후여야 합니다" |

---

## 3. 공통 UI 컴포넌트

### Modal
- 오버레이 + 중앙 정렬 컨테이너
- ESC 키 닫기, 바깥 클릭 닫기
- 열림/닫힘 애니메이션

### Badge
- 우선순위 표시: LOW(회색), MEDIUM(파란색), HIGH(빨간색)
- 크기: 작은 텍스트 + 둥근 패딩

### ConfirmDialog
- "정말 삭제하시겠습니까?" 확인 다이얼로그
- 확인/취소 버튼
- 위험 동작(삭제)은 빨간색 확인 버튼

### Button
- variant: primary, secondary, danger, ghost
- size: sm, md, lg
- 로딩 상태 지원

---

## 4. 이벤트 흐름

### 드래그앤드롭 흐름

```
사용자 드래그 시작
  → onDragStart: activeTicket 설정, 드래그 오버레이 표시
  
사용자 드래그 중 (칼럼 위)
  → onDragOver: 대상 칼럼 하이라이트

사용자 드롭
  → onDragEnd:
    1. 낙관적 업데이트 (board 상태 즉시 반영)
    2. PATCH /api/tickets/reorder 호출
    3. 성공: 확정
    4. 실패: 롤백 (이전 board 상태로 복원) + 에러 토스트
```

### 티켓 CRUD 흐름

```
[생성] CreateTicketButton → TicketForm → onSubmit
  → POST /api/tickets → 성공: board에 카드 추가 → 모달 닫기

[수정] TicketCard 클릭 → TicketModal → 필드 수정 → onUpdate
  → PATCH /api/tickets/:id → 성공: board 카드 업데이트

[삭제] TicketModal → DeleteButton → ConfirmDialog → onDelete
  → DELETE /api/tickets/:id → 성공: board에서 카드 제거 → 모달 닫기
```
