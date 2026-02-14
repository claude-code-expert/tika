# 프런트엔드 구현 태스크

> 컴포넌트 명세는 [COMPONENT_SPEC.md](./COMPONENT_SPEC.md), 테스트 케이스는 [TEST_CASES.md](./TEST_CASES.md) 참조
> 최종 수정일: 2026-02-14

---

## 구현 원칙

- **Bottom-up**: 말단 컴포넌트(Leaf)부터 구현하여 컨테이너로 조립
- **TDD**: Red(실패 테스트) → Green(최소 구현) → Refactor(개선)
- **의존성 순서**: 각 컴포넌트는 자신의 의존성이 먼저 구현된 상태에서 작업

---

## 의존성 그래프

```
Button ─────────────────────────────────────┐
Badge ✅ ────────────────────────────────────┤
Modal ──────────┬───────────────────────────┤
                ├── ConfirmDialog ──────────┤
                │                           │
TicketCard ✅ ──┤                           │
ColumnHeader ───┼── Column ── Board ────────┤
                │                           │
TicketDetailView┤                           │
TicketForm ─────┼── TicketModal ────────────┤
                │                           │
ticketApi ── useTickets ────────────────────┤
                                            │
BoardHeader ────┤                           │
FilterBar ──────┼── BoardContainer ─────── page.tsx
```

---

## 구현 순서

### Phase 1: UI 컴포넌트 (의존성 없음)

| 순서 | 컴포넌트 | 파일 경로 | 명세 | 테스트 | 상태 |
|------|----------|-----------|------|--------|------|
| 1-1 | Button | `src/client/components/ui/Button.tsx` | COMPONENT_SPEC §3 | — | ⬜ |
| 1-2 | Badge | `src/client/components/ui/Badge.tsx` | COMPONENT_SPEC §3 | TC-COMP-001 C001-7 | ✅ |
| 1-3 | Modal | `src/client/components/ui/Modal.tsx` | COMPONENT_SPEC §3 | — | ⬜ |
| 1-4 | ConfirmDialog | `src/client/components/ui/ConfirmDialog.tsx` | COMPONENT_SPEC §3 | TC-COMP-006 | ⬜ |

**의존성**: 없음 (Badge 구현 완료)
**ConfirmDialog**는 Modal + Button에 의존하므로 1-1, 1-3 이후 구현

---

### Phase 2: Board 컴포넌트 (Phase 1 UI에 의존)

| 순서 | 컴포넌트 | 파일 경로 | 명세 | 테스트 | 상태 |
|------|----------|-----------|------|--------|------|
| 2-1 | TicketCard | `src/client/components/ticket/TicketCard.tsx` | COMPONENT_SPEC §2.6 | TC-COMP-001 | ✅ |
| 2-2 | ColumnHeader | `src/client/components/board/ColumnHeader.tsx` | COMPONENT_SPEC §2.5 | TC-COMP-002 C002-3 | ⬜ |
| 2-3 | Column | `src/client/components/board/Column.tsx` | COMPONENT_SPEC §2.5 | TC-COMP-002 | ⬜ |
| 2-4 | Board | `src/client/components/board/Board.tsx` | COMPONENT_SPEC §2.4 | TC-COMP-003 | ⬜ |

**의존성**: Badge, TicketCard (구현 완료)
**Column** → ColumnHeader + TicketCard + dnd-kit SortableContext
**Board** → Column + DndContext + DragOverlay

---

### Phase 3: Ticket 컴포넌트 (Phase 1 UI + Zod에 의존)

| 순서 | 컴포넌트 | 파일 경로 | 명세 | 테스트 | 상태 |
|------|----------|-----------|------|--------|------|
| 3-1 | TicketDetailView | `src/client/components/ticket/TicketDetailView.tsx` | COMPONENT_SPEC §2.7 | TC-COMP-005 C005-2 | ⬜ |
| 3-2 | TicketForm | `src/client/components/ticket/TicketForm.tsx` | COMPONENT_SPEC §2.8 | TC-COMP-004 | ⬜ |
| 3-3 | TicketModal | `src/client/components/ticket/TicketModal.tsx` | COMPONENT_SPEC §2.7 | TC-COMP-005 | ⬜ |

**의존성**: Modal, Button, ConfirmDialog (Phase 1)
**TicketForm** → Zod 스키마 (`src/shared/validations/ticket.ts`)
**TicketModal** → TicketDetailView + TicketForm + ConfirmDialog + Modal

---

### Phase 4: 데이터 레이어

| 순서 | 모듈 | 파일 경로 | 명세 | 테스트 | 상태 |
|------|------|-----------|------|--------|------|
| 4-1 | ticketApi | `src/client/api/ticketApi.ts` | COMPONENT_SPEC §4 | — | ⬜ |
| 4-2 | useTickets | `src/client/hooks/useTickets.ts` | COMPONENT_SPEC §4 | — | ⬜ |

**의존성**: 없음 (fetch 래퍼 + React Hook)
**useTickets** → ticketApi

---

### Phase 5: 컨테이너 (전체 조립)

| 순서 | 컴포넌트 | 파일 경로 | 명세 | 테스트 | 상태 |
|------|----------|-----------|------|--------|------|
| 5-1 | BoardHeader | `src/client/components/board/BoardHeader.tsx` | COMPONENT_SPEC §2.2 | — | ⬜ |
| 5-2 | FilterBar | `src/client/components/board/FilterBar.tsx` | COMPONENT_SPEC §2.3 | — | ⬜ |
| 5-3 | BoardContainer | `src/client/components/board/BoardContainer.tsx` | COMPONENT_SPEC §2.1 | — | ⬜ |
| 5-4 | page.tsx | `app/page.tsx` | — | — | ⬜ |

**의존성**: 모든 Phase 완료 후
**BoardContainer** → useTickets + Board + BoardHeader + FilterBar + TicketModal
**page.tsx** → 서버 컴포넌트에서 ticketService.getBoard() → BoardContainer

---

## 컴포넌트별 상세

### Button (Phase 1-1)

```
파일: src/client/components/ui/Button.tsx
Props: variant (primary|secondary|danger|ghost), size (sm|md|lg), isLoading, children, onClick
CSS:  globals.css의 .btn, .btn-primary, .btn-secondary, .btn-danger, .btn-ghost
```

TDD 체크리스트:
- [ ] variant별 CSS 클래스 적용
- [ ] size별 CSS 클래스 적용
- [ ] isLoading=true → 버튼 비활성화 + 로딩 표시
- [ ] onClick 핸들러 호출
- [ ] isLoading=true일 때 클릭 무시

---

### Modal (Phase 1-3)

```
파일: src/client/components/ui/Modal.tsx
Props: isOpen, onClose, children
CSS:  globals.css의 .modal-overlay, .modal-content
```

TDD 체크리스트:
- [ ] isOpen=false → 렌더링 안 됨
- [ ] isOpen=true → 오버레이 + 컨텐츠 표시
- [ ] ESC 키 → onClose 호출
- [ ] 오버레이 클릭 → onClose 호출
- [ ] 컨텐츠 영역 클릭 → onClose 호출 안 됨

---

### ConfirmDialog (Phase 1-4)

```
파일: src/client/components/ui/ConfirmDialog.tsx
Props: isOpen, message, onConfirm, onCancel
의존: Modal, Button
테스트: TC-COMP-006 (C006-1, C006-2)
```

TDD 체크리스트:
- [ ] C006-1: 확인 클릭 → onConfirm 호출
- [ ] C006-2: 취소 클릭 → onCancel 호출

---

### ColumnHeader (Phase 2-2)

```
파일: src/client/components/board/ColumnHeader.tsx
Props: title (string), count (number)
테스트: TC-COMP-002 C002-3
```

TDD 체크리스트:
- [ ] C002-3: 칼럼명 + 티켓 수 표시

---

### Column (Phase 2-3)

```
파일: src/client/components/board/Column.tsx
Props: status (TicketStatus), tickets (TicketWithMeta[]), onTicketClick
의존: ColumnHeader, TicketCard, @dnd-kit/sortable
테스트: TC-COMP-002 (C002-1, C002-2, C002-3)
```

TDD 체크리스트:
- [ ] C002-1: 티켓 있는 칼럼 → 카드 목록 + 개수 뱃지
- [ ] C002-2: 빈 칼럼 → "이 칼럼에 티켓이 없습니다" 안내
- [ ] C002-3: 칼럼 헤더에 칼럼명 + 티켓 수

---

### Board (Phase 2-4)

```
파일: src/client/components/board/Board.tsx
Props: board (BoardData), onTicketClick
의존: Column, @dnd-kit/core
테스트: TC-COMP-003 (C003-1, C003-2)
```

TDD 체크리스트:
- [ ] C003-1: 4칼럼 렌더링 (BACKLOG, TODO, IN_PROGRESS, DONE)
- [ ] C003-2: Backlog가 좌측 사이드바로 배치

---

### TicketDetailView (Phase 3-1)

```
파일: src/client/components/ticket/TicketDetailView.tsx
Props: ticket (TicketWithMeta)
테스트: TC-COMP-005 C005-2
```

TDD 체크리스트:
- [ ] C005-2: status, startedAt, completedAt, createdAt 읽기 전용 표시
- [ ] 값 없으면 "-" 표시

---

### TicketForm (Phase 3-2)

```
파일: src/client/components/ticket/TicketForm.tsx
Props: mode (create|edit), initialData, onSubmit, onCancel, isLoading
의존: Button, src/shared/validations/ticket.ts (Zod)
테스트: TC-COMP-004 (C004-1 ~ C004-7)
```

TDD 체크리스트:
- [ ] C004-1: 생성 모드 → 빈 필드, 우선순위 MEDIUM 기본값
- [ ] C004-2: 수정 모드 → initialData 반영
- [ ] C004-3: 빈 제목 → "제목을 입력해주세요"
- [ ] C004-4: 과거 종료예정일 → "종료예정일은 오늘 이후 날짜를 선택해주세요"
- [ ] C004-5: plannedStartDate date input 렌더링
- [ ] C004-6: 정상 제출 → onSubmit 호출 + 데이터 확인
- [ ] C004-7: isLoading=true → 버튼 비활성화 + 스피너

---

### TicketModal (Phase 3-3)

```
파일: src/client/components/ticket/TicketModal.tsx
Props: ticket, isOpen, onClose, onUpdate, onDelete
의존: Modal, TicketDetailView, TicketForm, ConfirmDialog
테스트: TC-COMP-005 (C005-1 ~ C005-6)
```

TDD 체크리스트:
- [ ] C005-1: isOpen에 따라 표시/숨김
- [ ] C005-2: 읽기 전용 필드 표시
- [ ] C005-3: 편집 가능 필드
- [ ] C005-4: ESC → onClose
- [ ] C005-5: 바깥 클릭 → onClose
- [ ] C005-6: 삭제 → ConfirmDialog → 확인 → onDelete

---

### ticketApi (Phase 4-1)

```
파일: src/client/api/ticketApi.ts
함수: getBoard, create, update, remove, reorder, complete
의존: 없음 (fetch 래퍼)
```

---

### useTickets (Phase 4-2)

```
파일: src/client/hooks/useTickets.ts
반환: { board, isLoading, error, create, update, remove, reorder, complete }
의존: ticketApi
패턴: 낙관적 업데이트 (UI 즉시 반영 → API → 실패 시 롤백)
```

---

### BoardHeader (Phase 5-1)

```
파일: src/client/components/board/BoardHeader.tsx
Props: onCreateClick
의존: Button
```

---

### FilterBar (Phase 5-2)

```
파일: src/client/components/board/FilterBar.tsx
Props: activeFilter, onFilterChange, counts
의존: Button
CSS: globals.css의 .filter-btn
```

---

### BoardContainer (Phase 5-3)

```
파일: src/client/components/board/BoardContainer.tsx
Props: initialData (BoardData)
의존: Board, BoardHeader, FilterBar, TicketModal, useTickets
역할: DnD 이벤트 핸들링, 필터 상태, 모달 제어
```

---

### page.tsx (Phase 5-4)

```
파일: app/page.tsx
역할: 서버 컴포넌트에서 ticketService.getBoard() 호출 → BoardContainer에 전달
```
