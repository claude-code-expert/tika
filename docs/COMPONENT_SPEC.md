# Tika - 컴포넌트 명세 (COMPONENT_SPEC.md)

> React 컴포넌트 계층, Props, 동작, 이벤트 흐름 정의
> 버전: 0.2.0 (Phase 1 Full)
> 최종 수정일: 2026-02-21

---

## 1. 컴포넌트 계층 구조

```
App (page.tsx - 서버 컴포넌트)
│
└── BoardContainer (클라이언트, 상태관리 + DnD 컨텍스트)
    │
    ├── Header
    │   ├── Logo
    │   ├── SearchInput
    │   ├── [새 업무] CTA Button → TicketForm 모달
    │   ├── NotificationBell
    │   ├── SettingsIcon
    │   └── UserAvatar
    │
    ├── Sidebar
    │   ├── WorkspaceSelector
    │   └── SidebarTaskList
    │       └── SidebarTaskCard[]
    │
    ├── FilterBar
    │   └── FilterChip[]
    │
    ├── Board (DndContext)
    │   ├── Column (BACKLOG)
    │   │   └── SortableContext
    │   │       └── TicketCard[]
    │   ├── Column (TODO)
    │   │   └── SortableContext
    │   │       └── TicketCard[]
    │   ├── Column (IN_PROGRESS)
    │   │   └── SortableContext
    │   │       └── TicketCard[]
    │   └── Column (DONE)
    │       └── SortableContext
    │           └── TicketCard[]
    │
    └── TicketModal (상세/수정 모달)
        ├── IssueBreadcrumb
        ├── LabelEditor
        │   └── LabelSelector
        │       └── LabelBadge[]
        ├── ChecklistSection
        │   └── ChecklistItem[]
        ├── Avatar (담당자)
        └── ConfirmDialog (삭제 확인)
```

> **참고**: `Logo`, `NotificationBell`, `SettingsIcon`, `UserAvatar`, `WorkspaceSelector`, `SidebarTaskList`는 Phase 1에서 UI 표시 전용 정적 컴포넌트이다. 인터랙션은 Phase 2에서 구현한다.

---

## 2. 핵심 컴포넌트 상세

### 2.1 BoardContainer

**파일**: `src/components/board/BoardContainer.tsx`

**역할**: 보드 전체의 상태 관리, DnD 컨텍스트 제공, API 통신 총괄

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| initialData | BoardData | 서버에서 초기 로드한 보드 데이터 |
| initialLabels | Label[] | 서버에서 초기 로드한 라벨 목록 |
| initialMembers | Member[] | 서버에서 초기 로드한 멤버 목록 |
| initialIssues | Issue[] | 서버에서 초기 로드한 이슈 목록 |

**내부 상태**:
| 상태 | 타입 | 설명 |
|------|------|------|
| board | BoardData | 현재 보드 상태 (4개 칼럼의 티켓 배열) |
| activeTicket | TicketWithMeta \| null | 드래그 중인 티켓 |
| selectedTicket | TicketWithMeta \| null | 모달에 표시할 선택된 티켓 |
| isCreating | boolean | 생성 모달 열림 여부 |
| filterType | FilterType | 현재 활성 필터 |
| labels | Label[] | 전체 라벨 목록 |
| members | Member[] | 전체 멤버 목록 |
| issues | Issue[] | 전체 이슈 목록 |

**핵심 동작**:
1. DndContext의 onDragStart, onDragOver, onDragEnd 핸들링
2. 드래그 완료 시 낙관적 업데이트 → API 호출 → 실패 시 롤백
3. 티켓 CRUD 시 board 상태 즉시 반영 + API 동기화
4. FilterBar 필터 변경 시 board 필터링 적용
5. `useTickets` 커스텀 훅을 통해 상태 관리 로직 위임

---

### 2.2 Board

**파일**: `src/components/board/Board.tsx`

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

**파일**: `src/components/board/Column.tsx`

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

**파일**: `src/components/board/TicketCard.tsx`

**역할**: 개별 티켓을 카드 형태로 표시, 드래그 소스

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| ticket | TicketWithMeta | 티켓 데이터 (라벨, 체크리스트, 이슈, 담당자 포함) |
| onClick | () => void | 클릭 핸들러 (상세 모달) |

**표시 정보**:
- 이슈 태그 (issue가 있을 경우 이슈명 + 타입 아이콘)
- 제목 (2줄, 넘치면 말줄임)
- 라벨 뱃지 (최대 5개, LabelBadge 컴포넌트 사용)
- 체크리스트 진행률 (예: "2/4" + 진행 바, checklist가 있을 경우)
- 우선순위 뱃지 (Badge 컴포넌트 사용)
- 마감일 (있을 경우, 오버듀 시 빨간색)
- 담당자 아바타 (assignee가 있을 경우, Avatar 컴포넌트 사용)
- 오버듀 표시 (빨간 테두리 또는 경고 아이콘)

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

**파일**: `src/components/ticket/TicketModal.tsx`

**역할**: 티켓 상세 정보 표시 및 수정/삭제

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| ticket | TicketWithMeta | 표시할 티켓 |
| isOpen | boolean | 모달 열림 상태 |
| onClose | () => void | 닫기 핸들러 |
| onUpdate | (id: number, data: UpdateTicketInput) => void | 수정 핸들러 |
| onDelete | (id: number) => void | 삭제 핸들러 |
| labels | Label[] | 전체 라벨 목록 (라벨 선택용) |
| members | Member[] | 전체 멤버 목록 (담당자 선택용) |
| issues | Issue[] | 전체 이슈 목록 (이슈 연결용) |

**동작**:
1. 모달 열림 시 바깥 영역 클릭 또는 ESC로 닫기
2. 인라인 편집: 필드 클릭 시 편집 모드 전환
3. 삭제 버튼 클릭 시 ConfirmDialog 표시
4. 수정 완료 시 onUpdate 호출
5. body 스크롤 잠금
6. IssueBreadcrumb으로 이슈 계층 표시
7. ChecklistSection으로 체크리스트 관리
8. LabelEditor로 라벨 편집

**접근성**:
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` 제목 연결

---

### 2.6 TicketForm

**파일**: `src/components/ticket/TicketForm.tsx`

**역할**: 티켓 생성/수정 폼

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| mode | 'create' \| 'edit' | 폼 모드 |
| initialData | Partial\<TicketWithMeta\> | 수정 시 기존 데이터 |
| onSubmit | (data: CreateTicketInput \| UpdateTicketInput) => void | 제출 핸들러 |
| onCancel | () => void | 취소 핸들러 |
| isLoading | boolean | 제출 중 로딩 상태 |
| labels | Label[] | 전체 라벨 목록 |
| members | Member[] | 전체 멤버 목록 |
| issues | Issue[] | 전체 이슈 목록 |

**폼 필드**:
| 필드 | 컴포넌트 | 검증 | 관련 FR |
|------|----------|------|---------|
| type | 타입 선택기 (4버튼: GOAL/STORY/FEATURE/TASK) | 필수 | FR-001 |
| title | text input | 필수, 1~200자 | FR-001 |
| description | textarea | 선택, 최대 1,000자 | FR-001 |
| priority | select (4옵션: LOW/MEDIUM/HIGH/CRITICAL) | — | FR-001 |
| dueDate | date input | 선택, 오늘 이후 | FR-001 |
| checklist | 체크리스트 빌더 (항목 추가/삭제) | 최대 20개 | FR-008 |
| labelIds | LabelSelector | 최대 5개 | FR-009 |
| issueId | 캐스케이딩 드롭다운 (GOAL→STORY→FEATURE→TASK) | — | FR-010 |
| assigneeId | 담당자 셀렉트 (멤버 목록) | — | FR-011 |

**타입 선택기 동작**:
- 4개 버튼 형식 (GOAL, STORY, FEATURE, TASK)
- 선택된 타입에 따라 issueId 드롭다운 필터링
- GOAL 선택 시 issueId 선택 불필요 (자동 null)

**캐스케이딩 드롭다운 동작**:
- 티켓 타입에 따라 연결 가능한 이슈 타입 결정:
  - GOAL 티켓 → 이슈 연결 없음
  - STORY 티켓 → GOAL 이슈 선택
  - FEATURE 티켓 → STORY 이슈 선택
  - TASK 티켓 → FEATURE 이슈 선택

**검증 규칙**:
| 필드 | 규칙 | 에러 메시지 |
|------|------|-------------|
| type | 미선택 | "타입을 선택해주세요" |
| title | 빈 값 | "제목을 입력해주세요" |
| title | 200자 초과 | "제목은 200자 이내로 입력해주세요" |
| description | 1,000자 초과 | "설명은 1,000자 이내로 입력해주세요" |
| dueDate | 과거 날짜 | "마감일은 오늘 이후 날짜를 선택해주세요" |
| labelIds | 5개 초과 | "라벨은 최대 5개까지 선택할 수 있습니다" |
| checklist | 20개 초과 | "체크리스트는 최대 20개까지 추가할 수 있습니다" |

**동작**:
1. 클라이언트 사이드 검증 → 에러 메시지 표시
2. Enter 키 또는 제출 버튼으로 폼 제출
3. 제출 중 버튼 비활성화 + 로딩 스피너
4. 성공 시 폼 초기화 (생성 모드) 또는 모달 닫기 (수정 모드)

---

## 3. 신규 컴포넌트 상세

### 3.1 FilterBar

**파일**: `src/components/board/FilterBar.tsx`

**역할**: 보드 상단 필터 칩 목록. 클릭 시 보드 티켓 필터링.

**관련 FR**: FR-007 (오버듀), FR-009 (라벨 필터)

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| activeFilter | FilterType | 현재 활성 필터 |
| onChange | (filter: FilterType) => void | 필터 변경 핸들러 |
| labels | Label[] | 라벨 필터용 전체 라벨 목록 |

**FilterType 정의**:
```typescript
export type FilterType =
  | 'ALL'
  | 'THIS_WEEK'
  | 'OVERDUE'
  | 'HIGH_PRIORITY'
  | 'ASSIGNED_TO_ME'
  | { labelId: number };
```

**FilterChip 목록**:
| 칩 | FilterType | 필터 조건 |
|----|-----------|----------|
| 전체 | ALL | 필터 없음 |
| 이번 주 업무 | THIS_WEEK | dueDate가 이번 주 이내 |
| 일정 초과 | OVERDUE | isOverdue = true |
| 높은 우선순위 | HIGH_PRIORITY | priority = HIGH 또는 CRITICAL |
| 내게 할당됨 | ASSIGNED_TO_ME | assigneeId = 현재 사용자 |
| {라벨명} | { labelId } | 해당 라벨이 부착된 티켓 |

**동작**:
1. 활성 칩은 강조 스타일 (파란색 배경)
2. 라벨 칩은 해당 라벨 color로 dot 표시
3. 필터 선택 시 BoardContainer의 board 표시를 즉시 필터링 (API 호출 없음, 클라이언트 필터링)

---

### 3.2 ChecklistSection

**파일**: `src/components/ticket/ChecklistSection.tsx`

**역할**: 티켓 모달 내 체크리스트 항목 표시, 추가, 토글, 삭제

**관련 FR**: FR-008

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| ticketId | number | 소속 티켓 ID |
| items | ChecklistItem[] | 체크리스트 항목 목록 |
| onAdd | (text: string) => Promise\<void\> | 항목 추가 핸들러 |
| onToggle | (itemId: number, isCompleted: boolean) => Promise\<void\> | 완료 토글 핸들러 |
| onDelete | (itemId: number) => Promise\<void\> | 항목 삭제 핸들러 |

**내부 상태**:
| 상태 | 타입 | 설명 |
|------|------|------|
| newItemText | string | 새 항목 입력 텍스트 |
| isAdding | boolean | 추가 입력 UI 표시 여부 |

**표시 정보**:
- 진행률 표시: "완료 {n}/{total}" + 프로그레스 바
- 각 항목: 체크박스 + 텍스트 + 삭제 버튼
- 완료된 항목: 텍스트에 취소선
- "+ 항목 추가" 버튼 (최대 20개 미만일 때만 표시)

**동작**:
1. 체크박스 클릭 시 즉시 낙관적 업데이트 → PATCH /api/tickets/:id/checklist/:itemId
2. 항목 추가: 텍스트 입력 후 Enter 또는 추가 버튼 → POST /api/tickets/:id/checklist
3. 삭제: 항목 호버 시 삭제 버튼 표시 → DELETE /api/tickets/:id/checklist/:itemId
4. 20개 도달 시 추가 버튼 숨김

---

### 3.3 LabelBadge

**파일**: `src/components/ui/LabelBadge.tsx`

**역할**: 라벨 색상 뱃지 표시 (TicketCard, TicketModal에서 사용)

**관련 FR**: FR-009

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| label | Label | 라벨 데이터 |
| size | 'sm' \| 'md' | 뱃지 크기 (기본: sm) |
| onRemove | () => void | 제거 버튼 핸들러 (선택, 편집 모드에서만) |

**동작**:
- 라벨 color를 배경색으로 사용 (연한 버전) + 텍스트
- onRemove 제공 시 X 버튼 표시

---

### 3.4 LabelSelector

**파일**: `src/components/ticket/LabelSelector.tsx`

**역할**: 라벨 선택 드롭다운. 기존 라벨 선택 및 신규 라벨 생성.

**관련 FR**: FR-009

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| selectedIds | number[] | 선택된 라벨 ID 목록 |
| labels | Label[] | 전체 라벨 목록 |
| onChange | (ids: number[]) => void | 선택 변경 핸들러 |
| onCreateLabel | (name: string, color: string) => Promise\<Label\> | 신규 라벨 생성 핸들러 |
| maxCount | number | 최대 선택 개수 (기본: 5) |

**내부 상태**:
| 상태 | 타입 | 설명 |
|------|------|------|
| isOpen | boolean | 드롭다운 열림 여부 |
| search | string | 라벨 검색어 |
| isCreating | boolean | 신규 라벨 생성 UI 표시 여부 |
| newLabelName | string | 새 라벨 이름 |
| newLabelColor | string | 새 라벨 색상 |

**동작**:
1. 라벨 목록에서 검색 (이름 기준)
2. 라벨 클릭 시 선택/해제 토글
3. 최대 개수 도달 시 미선택 라벨 비활성화
4. "새 라벨 만들기" 버튼으로 생성 폼 전환
5. 생성 폼: 이름 입력 + 색상 선택(사전 정의 팔레트)
6. 바깥 클릭 시 드롭다운 닫기

---

### 3.5 LabelEditor

**파일**: `src/components/ticket/LabelEditor.tsx`

**역할**: TicketModal 내 라벨 편집 영역. 현재 라벨 표시 + LabelSelector 연동.

**관련 FR**: FR-009

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| selectedLabels | Label[] | 현재 선택된 라벨 목록 |
| allLabels | Label[] | 전체 라벨 목록 |
| onChange | (ids: number[]) => void | 변경 핸들러 |
| onCreateLabel | (name: string, color: string) => Promise\<Label\> | 생성 핸들러 |

**동작**:
1. 선택된 라벨들을 LabelBadge로 나열 (X 버튼 포함)
2. "+ 라벨 추가" 버튼 클릭 시 LabelSelector 드롭다운 열기
3. 라벨 제거 시 onRemove → onChange 호출

---

### 3.6 IssueBreadcrumb

**파일**: `src/components/ticket/IssueBreadcrumb.tsx`

**역할**: 티켓에 연결된 이슈의 계층 경로를 브레드크럼으로 표시

**관련 FR**: FR-010

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| issue | IssueWithBreadcrumb \| null | 연결된 이슈 (브레드크럼 포함) |
| onEdit | () => void | 이슈 변경 버튼 핸들러 |

**표시 형식**:
```
MVP 출시 (GOAL) > 사용자 인증 (STORY) > 인증 API (FEATURE)
```

**타입별 아이콘/색상**:
| 타입 | 표시 |
|------|------|
| GOAL | 보라색 목표 아이콘 |
| STORY | 파란색 스토리 아이콘 |
| FEATURE | 초록색 피처 아이콘 |
| TASK | 회색 태스크 아이콘 |

**동작**:
1. issue가 null이면 "상위 이슈 없음" + 연결 버튼 표시
2. issue가 있으면 breadcrumb 배열을 ">" 구분자로 나열
3. 각 브레드크럼 항목에 타입 아이콘 표시
4. onEdit 클릭 시 이슈 선택 드롭다운 열기

---

### 3.7 Avatar

**파일**: `src/components/ui/Avatar.tsx`

**역할**: 멤버 아바타 표시 (이니셜 + 배경색)

**관련 FR**: FR-011

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| member | Member \| null | 멤버 데이터 (null이면 미배정 상태) |
| size | 'xs' \| 'sm' \| 'md' \| 'lg' | 아바타 크기 (기본: sm) |
| tooltip | boolean | 호버 시 이름 툴팁 표시 여부 (기본: true) |

**표시**:
- 배경색: `member.color`
- 텍스트: 이름 첫 글자 (이니셜)
- null이면: 회색 배경 + "?" 또는 빈 원형 표시

**크기 정의**:
| size | 픽셀 |
|------|------|
| xs | 20px |
| sm | 28px |
| md | 36px |
| lg | 48px |

---

## 4. 공통 UI 컴포넌트

### Modal

**파일**: `src/components/ui/Modal.tsx`

- 오버레이 + 중앙 정렬 컨테이너
- ESC 키 닫기, 바깥 클릭 닫기
- 열림/닫힘 애니메이션
- `role="dialog"`, `aria-modal="true"` 적용

### Badge

**파일**: `src/components/ui/Badge.tsx`

- 우선순위 표시: LOW(회색), MEDIUM(파란색), HIGH(주황색), CRITICAL(빨간색)
- 크기: 작은 텍스트 + 둥근 패딩

### ConfirmDialog

**파일**: `src/components/ui/ConfirmDialog.tsx`

- "정말 삭제하시겠습니까?" 확인 다이얼로그
- 확인/취소 버튼
- 위험 동작(삭제)은 빨간색 확인 버튼
- ESC로 취소

### Button

**파일**: `src/components/ui/Button.tsx`

- variant: primary, secondary, danger, ghost
- size: sm, md, lg
- 로딩 상태 지원 (isLoading prop)
- 아이콘 버튼 시 `aria-label` 필수

---

## 5. 이벤트 흐름

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
[생성] Header CTA 버튼 → TicketForm 모달 → onSubmit
  → POST /api/tickets → 성공: board BACKLOG에 카드 추가 → 모달 닫기

[수정] TicketCard 클릭 → TicketModal 열기 → 필드 수정 → onUpdate
  → PATCH /api/tickets/:id → 성공: board 카드 업데이트

[삭제] TicketModal → DeleteButton → ConfirmDialog → onDelete
  → DELETE /api/tickets/:id → 성공: board에서 카드 제거 → 모달 닫기
```

### 체크리스트 흐름

```
[추가] "+ 항목 추가" 클릭 → 입력 UI 표시 → 텍스트 입력 → Enter
  → 낙관적 업데이트 → POST /api/tickets/:id/checklist
  → 성공: 항목 목록에 추가 / 실패: 롤백

[토글] 체크박스 클릭
  → 낙관적 업데이트 (즉시 체크 상태 변경)
  → PATCH /api/tickets/:id/checklist/:itemId { isCompleted }
  → 실패: 롤백

[삭제] 항목 호버 → X 버튼 클릭
  → DELETE /api/tickets/:id/checklist/:itemId
  → 성공: 항목 목록에서 제거
```

### 라벨 흐름

```
[선택] LabelEditor → LabelSelector 열기 → 라벨 클릭 선택/해제
  → onChange 호출 → PATCH /api/tickets/:id { labelIds }
  → 성공: 티켓 라벨 업데이트

[신규 생성] LabelSelector → "새 라벨 만들기" → 이름/색상 입력 → 확인
  → POST /api/labels → 성공: labels 목록에 추가 → 자동 선택
```

### 필터 흐름

```
FilterChip 클릭
  → FilterBar.onChange 호출
  → BoardContainer 상태 업데이트 (filterType)
  → board 표시 데이터 클라이언트 사이드 필터링 (API 호출 없음)
  → 필터 조건에 맞는 티켓만 각 Column에 표시
```

---

## 6. 파일 경로 요약

| 컴포넌트 | 파일 경로 |
|---------|----------|
| BoardContainer | `src/components/board/BoardContainer.tsx` |
| Board | `src/components/board/Board.tsx` |
| Column | `src/components/board/Column.tsx` |
| TicketCard | `src/components/board/TicketCard.tsx` |
| FilterBar | `src/components/board/FilterBar.tsx` |
| TicketModal | `src/components/ticket/TicketModal.tsx` |
| TicketForm | `src/components/ticket/TicketForm.tsx` |
| ChecklistSection | `src/components/ticket/ChecklistSection.tsx` |
| LabelEditor | `src/components/ticket/LabelEditor.tsx` |
| LabelSelector | `src/components/ticket/LabelSelector.tsx` |
| IssueBreadcrumb | `src/components/ticket/IssueBreadcrumb.tsx` |
| Button | `src/components/ui/Button.tsx` |
| Badge | `src/components/ui/Badge.tsx` |
| Modal | `src/components/ui/Modal.tsx` |
| ConfirmDialog | `src/components/ui/ConfirmDialog.tsx` |
| LabelBadge | `src/components/ui/LabelBadge.tsx` |
| Avatar | `src/components/ui/Avatar.tsx` |
