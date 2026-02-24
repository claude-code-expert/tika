# Tika - 컴포넌트 명세 (COMPONENT_SPEC.md)

> React 컴포넌트 계층, Props, 동작, 이벤트 흐름, 디자인 토큰 정의
> 버전: 2.0 (Phase 1 Full + 디자인 상세)
> 최종 수정일: 2026-02-22

---

## 1. 디자인 토큰

### 1.1 타이포그래피

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--font-display` | 'Plus Jakarta Sans', 'Noto Sans KR', sans-serif | 제목, 로고, 뱃지 |
| `--font-body` | 'Noto Sans KR', 'Plus Jakarta Sans', sans-serif | 본문, 폼, 버튼 |
| `--text-h1` | 20px | 페이지 타이틀, 로고 텍스트 |
| `--text-h2` | 16px | 섹션 헤더, 칼럼 타이틀 |
| `--text-body1` | 14px | 기본 본문, 폼 입력 |
| `--text-body2` | 12px | 보조 텍스트, 뱃지, 라벨 |
| `--text-small` | 11px | 메타 정보, 타임스탬프 |
| `--fw-bold` | 700 | 로고, 페이지 타이틀 |
| `--fw-semibold` | 600 | 칼럼 헤더, 버튼, 뱃지 |
| `--fw-medium` | 500 | 카드 타이틀, 네비게이션 |
| `--fw-regular` | 400 | 본문, 설명 |

### 1.2 색상

**배경**:

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--bg-app` | #F8F9FB | 전체 앱 배경 |
| `--bg-header` | #FFFFFF | 헤더 배경 |
| `--bg-sidebar` | #F1F3F6 | 사이드바 배경 |
| `--bg-board` | #E8EDF2 | 보드 영역 배경 |
| `--bg-footer` | #F4F5F7 | 푸터 배경 |
| `--bg-card` | #FFFFFF | 카드 배경 |
| `--bg-column` | #F4F5F7 | 칼럼 배경 |

**텍스트**:

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--text-primary` | #2C3E50 | 주요 텍스트 |
| `--text-secondary` | #5A6B7F | 보조 텍스트 |
| `--text-muted` | #8993A4 | 비활성 텍스트 |

**액센트**:

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--accent-primary` | #629584 | 메인 액센트 (버튼, 토글, 링크) |
| `--accent-primary-hover` | #527D6F | 호버 상태 |
| `--accent-light` | #E8F5F0 | 연한 액센트 (포커스 링, 활성 배경) |

**칼럼 상태 색상**:

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--col-todo` | #DBEAFE | TODO 칼럼 헤더 배경 |
| `--col-todo-text` | #1E40AF | TODO 칼럼 텍스트 |
| `--col-inprogress` | #FEF3C7 | In Progress 칼럼 헤더 배경 |
| `--col-inprogress-text` | #92400E | In Progress 칼럼 텍스트 |
| `--col-done` | #D1FAE5 | Done 칼럼 헤더 배경 |
| `--col-done-text` | #065F46 | Done 칼럼 텍스트 |

**보더**:

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--border-light` | #DFE1E6 | 기본 보더 |
| `--border-medium` | #C4C9D1 | 강조 보더, 호버 보더 |

### 1.3 간격

| 토큰 | 값 |
|------|-----|
| `--sp-xs` | 4px |
| `--sp-sm` | 8px |
| `--sp-md` | 12px |
| `--sp-lg` | 16px |
| `--sp-xl` | 24px |

### 1.4 레이아웃

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--header-height` | 60px | 헤더 높이 |
| `--footer-height` | 55px | 푸터 높이 |
| `--sidebar-width` | 260px | 사이드바 너비 |
| `--column-width` | 280px | 칼럼 최소 너비 |
| `--filter-bar-height` | 48px | 필터바 높이 |

### 1.5 그림자

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--shadow-card` | 0 1px 2px rgba(9,30,66,0.12) | 카드 기본 |
| `--shadow-card-hover` | 0 3px 8px rgba(9,30,66,0.18) | 카드 호버 |
| `--shadow-card-drag` | 0 5px 10px rgba(9,30,66,0.25) | 카드 드래그 중 |
| `--shadow-header` | 0 1px 3px rgba(0,0,0,0.08) | 헤더 |
| `--shadow-dropdown` | 0 8px 24px rgba(0,0,0,0.12) | 드롭다운, 모달 |

### 1.6 라운드

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--radius-card` | 8px | 카드, 드롭다운, 입력 필드 |
| `--radius-column` | 12px | 칼럼, 모달, 로그인 카드 |
| `--radius-button` | 6px | 버튼, 로고 아이콘, 아이콘 버튼 |
| `--radius-tag` | 4px | 태그, 라벨 뱃지, 이슈 타입 |

### 1.7 Z-Index

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--z-sidebar` | 10 | 사이드바 |
| `--z-header` | 50 | 헤더 |
| `--z-modal` | 200 | 모달, 드롭다운 |

### 1.8 라벨 색상 팔레트 (17색)

| 인덱스 | 배경 | 텍스트 | 기본 라벨 |
|--------|------|--------|----------|
| 1 | #2b7fff | #fff | Frontend |
| 2 | #00c950 | #fff | Backend |
| 3 | #ad46ff | #fff | Design |
| 4 | #fb2c36 | #fff | Bug |
| 5 | #ffac6d | #3D2200 | Docs |
| 6 | #615fff | #fff | Infra |
| 7 | #ff29d3 | #fff | — |
| 8 | #a0628c | #fff | — |
| 9 | #89d0f0 | #1A3D4D | — |
| 10 | #71e4bf | #0A3D2A | — |
| 11 | #46e264 | #0D3A14 | — |
| 12 | #caee68 | #3A4200 | — |
| 13 | #fffe92 | #4A4500 | — |
| 14 | #f7d1d1 | #5C1A1A | — |
| 15 | #f7a2ff | #4A0050 | — |
| 16 | #c1d1ff | #1A2A5C | — |
| 17 | #c5dbdc | #2A3D3E | — |

### 1.9 이슈 타입 색상

| 타입 | 배경 | 텍스트 | 약자 |
|------|------|--------|------|
| GOAL | #F3E8FF / #8B5CF6 | #7C3AED | G |
| STORY | #DBEAFE / #3B82F6 | #2563EB | S |
| FEATURE | #D1FAE5 / #10B981 | #059669 | F |
| TASK | #FEF3C7 / #F59E0B | #D97706 | T |

### 1.10 우선순위 색상

| 우선순위 | 배경 | 텍스트 |
|---------|------|--------|
| CRITICAL | #FEE2E2 | #DC2626 |
| HIGH | #FFEDD5 | #C2410C |
| MEDIUM | #FEF9C3 | #A16207 |
| LOW | #F3F4F6 | #6B7280 |

### 1.11 마감일 상태 색상

| 상태 | 배경 | 텍스트 | 설명 |
|------|------|--------|------|
| normal | #F0FDF4 | #16A34A | 여유 있음 (D-2 이상) |
| soon | #FEF3C7 | #92400E | 임박 (D-1) |
| overdue | #FEE2E2 | #DC2626 | 초과 |
| done | #D1FAE5 | #065F46 | 완료됨 |

---

## 2. 컴포넌트 계층 구조

```
App (layout.tsx - 서버 컴포넌트)
│
├── LoginPage (미인증 시 표시) — FR-013
│   └── GoogleLoginButton
│
└── BoardContainer (인증 후 표시, 상태관리 + DnD 컨텍스트)
    │
    ├── Header — 60px 고정 상단
    │   ├── HeaderLeft
    │   │   └── Logo (아이콘 + 텍스트)
    │   ├── HeaderCenter
    │   │   └── SearchInput (Phase 1: UI 전용, Phase 2: 검색 기능)
    │   └── HeaderRight
    │       ├── NewTaskButton (CTA) → TicketForm 모달
    │       ├── NotificationBell (Phase 1: UI 전용)
    │       ├── SettingsIcon → /settings 이동
    │       ├── VerticalDivider
    │       └── UserAvatar → UserDropdown
    │           └── Dropdown
    │
    ├── MainArea (flex row)
    │   │
    │   ├── Sidebar — 260px 좌측
    │   │   ├── SidebarHeader
    │   │   │   ├── WorkspaceSelector → WorkspaceDropdown
    │   │   │   └── SidebarToggle (접기 버튼)
    │   │   ├── SidebarNav
    │   │   │   └── NavItem[] (보드, 설정 등)
    │   │   └── SidebarTaskList (백로그 미리보기)
    │   │       └── SidebarTaskCard[]
    │   │
    │   └── BoardWrap (flex column)
    │       ├── FilterBar — 48px
    │       │   ├── FilterChip[]
    │       │   ├── ChipDivider
    │       │   └── LabelFilterDropdown
    │       │
    │       └── Board (DndContext) — flex-1
    │           ├── Column (BACKLOG)
    │           │   └── SortableContext
    │           │       └── TicketCard[]
    │           ├── Column (TODO)
    │           │   └── SortableContext
    │           │       └── TicketCard[]
    │           ├── Column (IN_PROGRESS)
    │           │   └── SortableContext
    │           │       └── TicketCard[]
    │           └── Column (DONE)
    │               └── SortableContext
    │                   └── TicketCard[]
    │
    ├── Footer — 55px 고정 하단
    │
    ├── TicketForm (새 업무 생성 모달, SCR-002)
    │   ├── TypeSelector (GOAL/STORY/FEATURE/TASK 4버튼)
    │   ├── FormField[] (제목, 설명, 상태, 우선순위, 마감일, 담당자)
    │   ├── ChecklistBuilder (체크리스트 빌더)
    │   ├── LabelChipSelector (라벨 선택 칩)
    │   │   └── TagCreator (커스텀 라벨 생성기)
    │   └── CascadingCategorySelector (상위 카테고리 캐스케이딩)
    │
    └── TicketModal (티켓 상세 모달, SCR-003)
        ├── DetailTop
        │   ├── LabelEditor
        │   │   └── LabelSelector
        │   │       └── LabelBadge[]
        │   ├── IssueBreadcrumb
        │   │   └── IssueBreadcrumbEditor (캐스케이딩 선택)
        │   └── MetaRow (상태, 우선순위, 마감일, 담당자)
        ├── DetailBody
        │   ├── DescriptionSection
        │   ├── ChecklistSection
        │   │   └── ChecklistItem[]
        │   └── ActivitySection (Phase 2)
        │       └── CommentBox (Phase 2)
        ├── DetailFooter
        │   ├── ActionButtons (편집, 복제, 이동)
        │   └── DeleteButton → ConfirmDialog
        └── Avatar (담당자)
```

> **Phase 1 정적 컴포넌트**: `SearchInput`, `NotificationBell`은 UI만 표시하며 인터랙션은 Phase 2에서 구현한다.
> **Phase 1 제한 컴포넌트**: `WorkspaceSelector`는 현재 워크스페이스 이름만 표시 (전환 셀렉터 Phase 4).
> `UserAvatar`는 세션 사용자의 Google 프로필 이니셜을 표시한다.

---

## 3. 레이아웃 컴포넌트

### 3.1 Header

**파일**: `src/components/layout/Header.tsx`

**역할**: 앱 상단 고정 네비게이션 바. 로고, 검색, CTA, 알림, 설정, 사용자 아바타 표시.

**관련 화면**: SCR-001 (메인 보드 뷰 - 헤더 영역)

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| currentUser | User | 현재 로그인 사용자 |
| onNewTask | () => void | "새 업무" 버튼 클릭 핸들러 |

**레이아웃 구조**:
```
┌──────────────────────────────────────────────────────┐
│ [Logo] T Tika  │  [🔍 업무 검색...]  │ [+새 업무] 🔔 ⚙ | 👤 │  60px
└──────────────────────────────────────────────────────┘
  header-left       header-center         header-right
```

**스타일**:
- 높이: 60px (`--header-height`)
- 배경: `--bg-header` (#FFFFFF)
- 하단 보더: 1px solid `--border-light`
- 그림자: `--shadow-header`
- z-index: `--z-header` (50)
- padding: 0 16px
- `position: fixed; top: 0; left: 0; right: 0`

**하위 컴포넌트**:

#### Logo

| 요소 | 스타일 |
|------|--------|
| 아이콘 | 32×32px, background: `--accent-primary`, border-radius: 6px, 텍스트 "T" (16px bold, 흰색) |
| 텍스트 | font-family: `--font-display`, font-size: 20px, font-weight: 700, letter-spacing: -0.5px |

**동작**: 클릭 시 메인 보드(/)로 이동

#### SearchInput

| 스타일 | 값 |
|--------|-----|
| 너비 | 300px |
| 높이 | 36px |
| 배경 | `--bg-sidebar` (#F1F3F6) |
| 보더 | 1px solid transparent |
| border-radius | `--radius-button` (6px) |
| 아이콘 | 🔍 16×16px, left: 10px, color: `--text-muted` |
| placeholder | "업무 검색..." |
| 포커스 | background: #fff, border-color: `--accent-primary`, box-shadow: 0 0 0 3px `--accent-light` |

**Phase 1 동작**: UI만 표시 (입력은 가능하나 검색 기능 미구현)

#### NewTaskButton

| 스타일 | 값 |
|--------|-----|
| 높이 | 34px |
| padding | 0 12px |
| 배경 | `--accent-primary` |
| color | #fff |
| font-size | 12px (body2) |
| font-weight | 600 (semibold) |
| border-radius | `--radius-button` (6px) |
| hover | background: `--accent-primary-hover` |

**동작**: 클릭 시 TicketForm 모달 열기

#### NotificationBell

| 스타일 | 값 |
|--------|-----|
| 크기 | 36×36px |
| 배경 | transparent |
| 아이콘 | 벨 아이콘 18×18px, color: `--text-secondary` |
| 뱃지 dot | 8×8px, #EF4444, top:6px right:6px, border: 2px solid `--bg-header` |
| hover | background: `--bg-sidebar`, color: `--text-primary` |

**Phase 1 동작**: 미읽은 알림이 있으면 빨간 점 표시. 클릭 시 /notifications 이동 (Phase 2)

#### SettingsIcon

| 스타일 | 값 |
|--------|-----|
| 크기 | 36×36px |
| 배경 | transparent |
| 아이콘 | 톱니바퀴 아이콘 18×18px, color: `--text-secondary` |
| hover | background: `--bg-sidebar`, color: `--text-primary` |

**동작**: 클릭 시 /settings 페이지 이동

#### UserAvatar (Header)

| 스타일 | 값 |
|--------|-----|
| 크기 | 32×32px |
| 배경 | member.color (예: #7EB4A2) |
| 텍스트 | 이름 첫 글자, 12px semibold, 흰색 |
| 보더 | 2px solid transparent |
| hover | border-color: `--accent-primary` |

**동작**: 클릭 시 Dropdown 메뉴 토글

#### Dropdown (사용자 메뉴)

| 스타일 | 값 |
|--------|-----|
| min-width | 200px |
| 배경 | #fff |
| 보더 | 1px solid `--border-light` |
| border-radius | `--radius-card` (8px) |
| 그림자 | `--shadow-dropdown` |
| 애니메이션 | opacity 0→1, translateY(-4px)→0, 0.15s ease |

**메뉴 항목**:
| 항목 | 동작 |
|------|------|
| 내 프로필 | (Phase 2) |
| 설정 | /settings 이동 |
| ─── (구분선) | — |
| 로그아웃 | signOut() 호출 |

---

### 3.2 Sidebar

**파일**: `src/components/layout/Sidebar.tsx`

**역할**: 좌측 사이드바. 워크스페이스 선택, 네비게이션, 백로그 리스트 표시.

**관련 화면**: SCR-001 (메인 보드 뷰 - 사이드바 영역)

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| workspace | Workspace | 현재 워크스페이스 |
| backlogTickets | TicketWithMeta[] | 백로그 티켓 목록 |
| isCollapsed | boolean | 접힌 상태 |
| onToggle | () => void | 접기/펼치기 토글 |
| onTicketClick | (ticket: TicketWithMeta) => void | 백로그 카드 클릭 핸들러 |

**레이아웃 구조**:
```
┌─────────────────┐
│ [📁P] Project Alpha ▼│  sb-header (52px)
│  ☰ 접기               │
├─────────────────┤
│  ▸ 보드          3    │  sb-nav
│    설정               │
├─────────────────┤
│  BACKLOG         12   │  sb-list-header
│ ┌─────────────┐      │
│ │ API 설계 리뷰  │      │  sb-task
│ │ 🟡중간 · 2시간전│      │
│ └─────────────┘      │
│ ┌─────────────┐      │  sb-task
│ │ DB 스키마 수정  │      │
│ └─────────────┘      │
│         ...           │
└─────────────────┘
  260px (--sidebar-width)
```

**스타일**:
- 너비: 260px (`--sidebar-width`), 접힘 시 0px (`width: 0; border-right: none`)
- 배경: `--bg-sidebar` (#F1F3F6)
- 우측 보더: 1px solid `--border-light`
- transition: width 0.3s ease
- z-index: `--z-sidebar` (10)
- 리사이저: 우측 6px 영역, cursor: col-resize, 호버 시 2px accent-primary 라인 표시

**접기 동작**:
1. 토글 버튼(☰) 클릭 시 `isCollapsed` 토글
2. 접힌 상태에서 보드 좌측에 펼치기 버튼(expand-btn) 표시
3. expand-btn: 28×28px, `--bg-sidebar`, 우측 라운드, 화살표 아이콘

#### WorkspaceSelector

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| workspace | Workspace | 현재 워크스페이스 |

**스타일**:
| 요소 | 값 |
|------|-----|
| 아이콘 | 28×28px, `--accent-primary` 배경, 흰색 텍스트, border-radius: 6px |
| 이름 | 12px medium, `--text-primary` |
| 부제 | 11px, `--text-muted` ("개인 워크스페이스") |
| chevron | ▼ 아이콘, `--text-muted`, margin-left: auto |
| hover | background: `--border-light` |

**Phase 1 동작**: 이름만 표시, 워크스페이스 전환 UI 없음 (Phase 4)

#### SidebarNav

**NavItem 스타일**:
| 상태 | 배경 | 텍스트 | 기타 |
|------|------|--------|------|
| 기본 | transparent | `--text-secondary` | — |
| hover | #E2E5EA | `--text-primary` | — |
| active | `--accent-light` | `--accent-primary` | font-weight: 500 |

**카운트 뱃지**:
- 기본: 11px, `--bg-header` 배경, `--text-muted` 텍스트, pill 형태
- active: `--accent-primary` 배경, 흰색 텍스트

#### SidebarTaskCard

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| ticket | TicketWithMeta | 백로그 티켓 데이터 |
| onClick | () => void | 클릭 핸들러 |

**스타일**:
| 요소 | 값 |
|------|-----|
| 배경 | `--bg-card` (#FFFFFF) |
| padding | 12px |
| border-radius | `--radius-card` (8px) |
| 그림자 | `--shadow-card` |
| hover | `--shadow-card-hover`, translateY(-1px) |
| 제목 | 14px medium, 1줄 ellipsis |
| 메타 | 우선순위 뱃지 + 시간 (11px muted, margin-left: auto) |

---

### 3.3 Footer

**파일**: `src/components/layout/Footer.tsx`

**역할**: 앱 하단 고정 푸터. 저작권 표시.

**관련 화면**: SCR-001 (메인 보드 뷰 - 푸터 영역)

**스타일**:
- 높이: 55px (`--footer-height`)
- 배경: `--bg-footer` (#F4F5F7)
- 상단 보더: 1px solid `--border-light`
- 텍스트: `--text-small` (11px), `--text-muted`
- 정렬: flex center

**표시**: `© 2026 Tika · All rights reserved`

---

## 4. 보드 컴포넌트

### 4.1 BoardContainer

**파일**: `src/components/board/BoardContainer.tsx`

**역할**: 보드 전체의 상태 관리, DnD 컨텍스트 제공, API 통신 총괄

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| initialData | BoardData | 서버에서 초기 로드한 보드 데이터 |
| initialLabels | Label[] | 서버에서 초기 로드한 라벨 목록 |
| initialMembers | Member[] | 서버에서 초기 로드한 멤버 목록 |
| initialIssues | Issue[] | 서버에서 초기 로드한 이슈 목록 |
| currentUser | User | 현재 로그인 사용자 정보 |
| currentWorkspace | Workspace | 현재 워크스페이스 정보 |

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
| sidebarCollapsed | boolean | 사이드바 접힘 상태 |

**핵심 동작**:
1. DndContext의 onDragStart, onDragOver, onDragEnd 핸들링
2. 드래그 완료 시 낙관적 업데이트 → API 호출 → 실패 시 롤백
3. 티켓 CRUD 시 board 상태 즉시 반영 + API 동기화
4. FilterBar 필터 변경 시 board 필터링 적용
5. `useTickets` 커스텀 훅을 통해 상태 관리 로직 위임
6. Header, Sidebar, FilterBar, Board, Footer 조립

---

### 4.2 Board

**파일**: `src/components/board/Board.tsx`

**역할**: DnD 영역을 정의하고 4개 Column을 가로 배치

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| board | BoardData | 칼럼별 티켓 데이터 |
| onTicketClick | (ticket: TicketWithMeta) => void | 카드 클릭 핸들러 |

**레이아웃**:
- 가로 스크롤, `gap: 16px`, `padding: 16px`
- 배경: `--bg-board` (#E8EDF2)
- 데스크톱: 4칼럼 가로 배치
- 태블릿: 2칼럼 그리드
- 모바일: 단일 칼럼 세로 스크롤

---

### 4.3 Column

**파일**: `src/components/board/Column.tsx`

**역할**: 단일 칼럼(상태)에 속하는 카드 목록 표시, 드롭 영역

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| status | TicketStatus | 칼럼 상태 값 |
| tickets | TicketWithMeta[] | 이 칼럼의 티켓 목록 |
| onTicketClick | (ticket: TicketWithMeta) => void | 카드 클릭 핸들러 |

**스타일**:
| 요소 | 값 |
|------|-----|
| 너비 | 280px (`--column-width`) min-width |
| 배경 | `--bg-column` (#F4F5F7) |
| border-radius | `--radius-column` (12px) |
| 헤더 높이 | 44px min |
| 헤더 배경 | 상태별 색상 (Backlog: `--bg-column`, TODO: `--col-todo`, In Progress: `--col-inprogress`, Done: `--col-done`) |
| 카드 간격 | 8px |
| 스크롤바 | 4px thin, `--border-medium` thumb |

**칼럼 헤더**:
- 타이틀: `--font-display`, 16px semibold
- 카운트 뱃지: 11px medium, rgba(0,0,0,0.08) 배경, pill 형태
- 컨텍스트 메뉴 버튼: 28×28px, opacity 0.5, hover 시 1.0

**동작**:
1. SortableContext로 칼럼 내 정렬 지원
2. useDroppable로 드롭 대상 영역 설정
3. 비어있을 때 "이 칼럼에 티켓이 없습니다" 안내 표시
4. 칼럼 헤더에 티켓 수 뱃지 표시

---

### 4.4 TicketCard

**파일**: `src/components/board/TicketCard.tsx`

**역할**: 개별 티켓을 카드 형태로 표시, 드래그 소스

**관련 화면**: SCR-001 (메인 보드 뷰 - 카드)

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| ticket | TicketWithMeta | 티켓 데이터 (라벨, 체크리스트, 이슈, 담당자 포함) |
| onClick | () => void | 클릭 핸들러 (상세 모달) |

**카드 구조 (Anatomy)**:
```
┌────────────────────────────────┐
│ [F]인증 API                     │  ← 이슈 태그 (18px, 타입 색상)
│ Frontend  Backend               │  ← 라벨 뱃지 (20px, 라벨 색상)
│                                 │
│ 사용자 인증 API 설계             │  ← 제목 (14px/500, 1줄 ellipsis)
│ JWT 기반 인증 시스템의...        │  ← 설명 (12px, 2줄 clamp)
│                                 │
│ 🟠높음  📅2/22  ☑2/4      [홍]│  ← 푸터 (뱃지 + 아바타)
└────────────────────────────────┘
```

**스타일**:
| 요소 | 값 |
|------|-----|
| 배경 | `--bg-card` (#FFFFFF) |
| padding | 12px |
| border-radius | `--radius-card` (8px) |
| 그림자 | `--shadow-card` |
| hover | `--shadow-card-hover`, translateY(-1px) |
| 드래그 중 | cursor: grabbing, `--shadow-card-drag` |
| 완료 상태 | opacity: 0.7, 제목 line-through + `--text-muted` |
| 오버듀 | border: 2px solid #DC2626 |

**이슈 태그**:
| 스타일 | 값 |
|--------|-----|
| 높이 | 18px |
| font-size | 10px |
| 타입 라벨 | 9px uppercase, 타입별 배경색, 흰색 텍스트, 3px radius |
| 이슈명 | 11px medium, `--text-secondary` |

**라벨 뱃지 (카드 내)**:
- 높이: 20px, padding: 0 8px, font-size: 10px
- 라벨 color를 배경으로, 자동 텍스트 색상
- flex-wrap, gap: 4px, 최대 5개

**카드 푸터**:
- flex, space-between
- 좌측: 우선순위 뱃지 + 마감일 뱃지 + 체크리스트 뱃지
- 우측: 담당자 아바타 (24×24px)
- 뱃지: 22px 높이, 4px radius, 11px medium

**동작**:
1. useSortable로 드래그 가능하게 설정
2. 클릭 시 onClick 호출 (드래그와 클릭 구분)
3. 드래그 중일 때 반투명 + 그림자 스타일

**접근성**:
- `role="button"`
- `aria-label="티켓: {title}"`
- 키보드 포커스 가능 (Tab), Enter로 상세 열기

---

## 5. 티켓 모달 컴포넌트

### 5.1 TicketModal

**파일**: `src/components/ticket/TicketModal.tsx`

**역할**: 티켓 상세 정보 표시 및 수정/삭제 (SCR-003)

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

**레이아웃**:
```
┌───────────────────────────────────── max-width: 720px ──┐
│                                                    [✕]  │
│  ── DetailTop ──────────────────────────────────────────│
│  [Backend] [Infra] [+]              ← LabelEditor       │
│  사용자 인증 API 설계                ← 제목 (20px bold)   │
│  [G]MVP 출시 › [S]사용자 인증 › [F]인증 API [✎]         │
│  상태: TODO  우선순위: 높음  마감일: 2/22  담당자: [홍]홍길동│
│  ─────────────────────────────────────────────────────── │
│  ── DetailBody ─────────────────────────────────────────│
│  📄 설명                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ JWT 기반 인증 시스템의 엔드포인트 설계 및...        │   │
│  └─────────────────────────────────────────────────┘   │
│  ☑ 체크리스트                                          │
│  ☑ JWT 토큰 생성/검증 로직 구현                          │
│  ☐ API 엔드포인트 명세 작성                              │
│  ☑ 미들웨어 체인 설계                                    │
│  [항목 추가...]                                         │
│  💬 활동 내역 (Phase 2)                                 │
│  ─────────────────────────────────────────────────────── │
│  ── DetailFooter ───────────────────────────────────────│
│  [✎ 편집] [📋 복제] [↔ 이동]                    [🗑 삭제]│
└──────────────────────────────────────────────────────────┘
```

**스타일**:
- 모달: max-width 720px, background #fff, border-radius: 12px
- 오버레이: rgba(9,30,66,0.54)
- 애니메이션: opacity 0→1, translateY(-12px)→0, 0.2s ease
- 닫기 버튼: 32×32px, top:16px right:16px, hover: `--bg-sidebar` 배경

**DetailTop**:
- padding: 24px 24px 16px
- border-bottom: 1px solid `--border-light`
- 제목: 20px bold, font-display
- 메타 행: flex-wrap, gap: 12px

**DetailBody**:
- padding: 20px 24px
- 설명: `--bg-sidebar` 배경, 12px 16px padding, 14px 텍스트, line-height: 1.7
- 섹션 간격: margin-bottom: 20px

**DetailFooter**:
- padding: 16px 24px
- border-top: 1px solid `--border-light`
- 좌측: 편집/복제/이동 버튼 (32px 높이, secondary 스타일)
- 우측: 삭제 버튼 (danger 스타일, #DC2626 텍스트, #FECACA 보더)

**동작**:
1. 모달 열림 시 바깥 영역 클릭 또는 ESC로 닫기
2. 인라인 편집: 필드 클릭 시 편집 모드 전환
3. 삭제 버튼 클릭 시 ConfirmDialog 표시
4. 수정 완료 시 onUpdate 호출
5. body 스크롤 잠금

**접근성**:
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 제목 연결

---

### 5.2 TicketForm

**파일**: `src/components/ticket/TicketForm.tsx`

**역할**: 티켓 생성/수정 폼 (SCR-002)

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

**모달 레이아웃**:
- max-width: 560px
- 헤더: 20px 24px 16px padding, "새 업무 만들기", 18px semibold
- 바디: 20px 24px padding, max-height: 70vh, overflow-y: auto
- 푸터: 16px 24px padding, 취소(secondary 36px) + 생성(primary 36px) 버튼

**폼 필드**:
| 필드 | 컴포넌트 | 검증 | 관련 FR |
|------|----------|------|---------|
| type | TypeSelector (4버튼: GOAL/STORY/FEATURE/TASK) | 필수 | FR-001 |
| title | text input | 필수, 1~200자 | FR-001 |
| description | textarea | 선택, 최대 1,000자 | FR-001 |
| checklist | ChecklistBuilder (항목 추가/삭제) | 최대 20개 | FR-008 |
| labelIds | LabelChipSelector | 최대 5개 | FR-009 |
| issueId | CascadingCategorySelector | — | FR-010 |
| status | select (BACKLOG/TODO/IN_PROGRESS/DONE) | 기본: TODO | FR-001 |
| priority | select (LOW/MEDIUM/HIGH/CRITICAL) | 기본: MEDIUM | FR-001 |
| dueDate | date input | 선택, 오늘 이후 | FR-001 |
| assigneeId | select (멤버 목록) | Phase 1: 본인 자동 | FR-011 |

#### TypeSelector

| 타입 | 기본 스타일 | 선택 시 스타일 |
|------|------------|--------------|
| GOAL | 2px solid `--border-light`, dot: #8B5CF6 | border: #8B5CF6, bg: #F5F3FF, color: #7C3AED |
| STORY | 2px solid `--border-light`, dot: #3B82F6 | border: #3B82F6, bg: #EFF6FF, color: #2563EB |
| FEATURE | 2px solid `--border-light`, dot: #10B981 | border: #10B981, bg: #ECFDF5, color: #059669 |
| TASK | 2px solid `--border-light`, dot: #F59E0B | border: #F59E0B, bg: #FFFBEB, color: #D97706 |

- 각 버튼: flex-1, min-width: 100px, height: 42px
- border-radius: `--radius-card` (8px)
- dot: 10×10px 원형
- 에러 상태: 모든 버튼 border-color: #FCA5A5

#### LabelChipSelector

- 칩: 26px 높이, 13px radius, 11px medium, 기본 opacity: 0.45
- hover: opacity 0.75
- 선택됨: opacity 1, border: 2px solid `--text-primary`
- 최대 3개 선택 (TicketForm 내에서. LabelSelector는 최대 5개)

#### TagCreator (커스텀 라벨 인라인 생성)

| 요소 | 스타일 |
|------|--------|
| 입력 | 120px 너비, 28px 높이, 12px font |
| 색상 스워치 | 18×18px 원형, gap: 3px, 선택 시 border: 2px solid `--text-primary` |
| 추가 버튼 | 28px 높이, accent-primary bg, 11px 흰색 텍스트 |

#### CascadingCategorySelector

| 선택한 타입 | 표시되는 상위 드롭다운 | 설명 |
|------------|----------------------|------|
| GOAL | (없음) | 최상위 — "Goal은 최상위 타입이므로 상위 카테고리가 없습니다" |
| STORY | [Goal 선택 ▼] | Goal 하위에 배치 |
| FEATURE | [Goal 선택 ▼] → [Story 선택 ▼] | Goal 선택 → Story 활성화 |
| TASK | [Goal 선택 ▼] → [Story 선택 ▼] → [Feature 선택 ▼] | 순차 캐스케이딩 |

- 각 select: flex-1, min-width: 120px, 12px font, 6px 8px padding
- disabled: opacity 0.5, `--bg-sidebar` 배경, cursor: not-allowed
- 상위 변경 시 하위 초기화
- 타입 미선택 시 "타입을 먼저 선택하세요" 안내 (italic, 11px muted)

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

**에러 스타일**:
- 입력 필드: border-color: #EF4444
- 에러 메시지: 11px, #EF4444, margin-top: 4px

**폼 동작**:
1. 클라이언트 사이드 검증 → 에러 메시지 표시
2. Enter 키 또는 제출 버튼으로 폼 제출
3. 제출 중 버튼 비활성화 + 로딩 스피너
4. 성공 시 폼 초기화 (생성 모드) 또는 모달 닫기 (수정 모드)

---

### 5.3 ChecklistSection

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

**스타일**:
| 요소 | 값 |
|------|-----|
| 진행률 바 | 4px 높이, `--border-light` 트랙, `--accent-primary` 필, 0.3s transition |
| 항목 행 | padding: 8px 0, border-bottom: 1px solid `--border-light` |
| 체크박스 | 16×16px (모달) / 15×15px (빌더), accent-color: `--accent-primary` |
| 텍스트 | 12px (모달), 13px (빌더), `--text-primary` |
| 완료 텍스트 | line-through, `--text-muted` |
| 삭제 버튼 | 20×20px 원형, transparent, hover: #FEE2E2 bg + #DC2626 |
| 추가 입력 | 32px 높이, dashed border `--border-medium`, focus 시 solid + accent |

**동작**:
1. 체크박스 클릭 시 즉시 낙관적 업데이트 → PATCH API
2. 항목 추가: 텍스트 입력 후 Enter 또는 추가 버튼 → POST API
3. 삭제: 항목 호버 시 삭제 버튼 표시 → DELETE API
4. 20개 도달 시 추가 버튼 숨김

---

## 6. 라벨 컴포넌트

### 6.1 LabelBadge

**파일**: `src/components/label/LabelBadge.tsx`

**역할**: 라벨 색상 뱃지 표시

**관련 FR**: FR-009

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| label | Label | 라벨 데이터 |
| size | 'sm' \| 'md' | 뱃지 크기 (기본: sm) |
| onRemove | () => void | 제거 버튼 핸들러 (선택, 편집 모드에서만) |

**크기**:
| size | 높이 | font-size | padding |
|------|------|-----------|---------|
| sm | 20px | 10px | 0 8px |
| md | 24px | 11px | 0 8px |

**스타일**:
- 배경: label.color (풀 컬러)
- 텍스트: 자동 계산 (밝기 기준, luminance > 160이면 #333, 아니면 #fff)
- border-radius: `--radius-tag` (4px)
- font-weight: 600, font-family: `--font-display`
- 제거 버튼(onRemove 시): 12×12px 원형, rgba(0,0,0,0.15) bg, hover: rgba(0,0,0,0.3)

---

### 6.2 LabelSelector

**파일**: `src/components/label/LabelSelector.tsx`

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

**드롭다운 스타일**:
| 요소 | 값 |
|------|-----|
| min-width | 180px |
| 배경 | #fff |
| 보더 | 1px solid `--border-light` |
| border-radius | 8px |
| 그림자 | `--shadow-dropdown` |
| padding | 8px |

**라벨 칩 (드롭다운 내)**:
- 20px 높이, 4px radius, 10px bold
- 사용 중: opacity 0.4, cursor: not-allowed
- 미사용: opacity 0.7, hover: opacity 1, filter brightness(0.9)

**추가 버튼 (트리거)**:
- 20px 높이, 20px radius, dashed border `--border-medium`
- hover: border-color + color → `--accent-primary`
- disabled (최대 도달 시): opacity 0.5, 툴팁 "최대 5개까지 추가 가능합니다"

**생성 폼**:
- 입력: 200px 너비, 32px 높이, 13px font
- 색상 스워치: 18×18px 원형, 선택 시 border + scale(1.2)
- 미리보기: LabelBadge 실시간 미리보기
- 생성 버튼: 32px 높이, accent-primary

**동작**:
1. 라벨 목록에서 검색 (이름 기준)
2. 라벨 클릭 시 선택/해제 토글
3. 최대 개수 도달 시 미선택 라벨 비활성화
4. "새 라벨 만들기" 버튼으로 생성 폼 전환
5. 생성 폼: 이름 입력 + 색상 선택(17색 팔레트)
6. 바깥 클릭 시 드롭다운 닫기

---

### 6.3 LabelEditor

**파일**: `src/components/label/LabelEditor.tsx`

**역할**: TicketModal 내 라벨 편집 영역. 현재 라벨 표시 + LabelSelector 연동.

**관련 FR**: FR-009

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| selectedLabels | Label[] | 현재 선택된 라벨 목록 |
| allLabels | Label[] | 전체 라벨 목록 |
| onChange | (ids: number[]) => void | 변경 핸들러 |
| onCreateLabel | (name: string, color: string) => Promise\<Label\> | 생성 핸들러 |

**스타일**:
- 라벨 뱃지: 24px 높이 (md), X 버튼 포함
- X 버튼: 14×14px 원형, rgba(0,0,0,0.2) bg, hover: rgba(0,0,0,0.4)
- 추가 버튼: 24×24px, dashed border, "+" 텍스트 14px
- 추가 버튼 hover: border-color + color → accent, bg → accent-light

**동작**:
1. 선택된 라벨들을 LabelBadge(md)로 나열 (X 버튼 포함)
2. "+" 버튼 클릭 시 LabelSelector 드롭다운 열기
3. 라벨 제거 시 onRemove → onChange 호출

---

## 7. 이슈 계층 컴포넌트

### 7.1 IssueBreadcrumb

**파일**: `src/components/issue/IssueBreadcrumb.tsx`

**역할**: 티켓에 연결된 이슈의 계층 경로를 브레드크럼으로 표시

**관련 FR**: FR-010

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| issue | IssueWithBreadcrumb \| null | 연결된 이슈 (브레드크럼 포함) |
| issues | Issue[] | 전체 이슈 목록 (에디터용) |
| onChangeIssue | (issueId: number \| null) => void | 이슈 변경 핸들러 |

**내부 상태**:
| 상태 | 타입 | 설명 |
|------|------|------|
| isEditing | boolean | 에디터 열림 여부 |

**브레드크럼 표시**:
```
[G]MVP 출시 › [S]사용자 인증 › [F]인증 API [✎]
```

**타입 뱃지 스타일**:

| 크기 | 높이 | font-size | 용도 |
|------|------|-----------|------|
| large | 24px | 12px | 브레드크럼 항목 |
| small | 18px | 10px | 카드 내 이슈 태그 |

**크럼 스타일**:
- padding: 2px 8px
- border-radius: `--radius-tag` (4px)
- 배경: `--bg-sidebar`
- 텍스트: 11px medium, `--text-secondary`
- 타입 뱃지: 9px semibold uppercase, 3px radius, 흰색 텍스트

**구분자**: › 문자, 10px, `--text-muted`

**편집 버튼**: 22×22px, dashed border `--border-medium`, hover: accent 스타일

**에디터 패널**:
- 배경: `--bg-sidebar`, 12px padding, 8px radius
- 캐스케이딩 select (CascadingCategorySelector와 동일)
- 저장/취소 버튼

**동작**:
1. issue가 null이면 "상위 이슈 없음" + 연결 버튼 표시
2. issue가 있으면 breadcrumb 배열을 "›" 구분자로 나열
3. 편집 버튼 클릭 시 캐스케이딩 에디터 토글
4. 저장 시 onChangeIssue 호출

---

## 8. 공통 UI 컴포넌트

### 8.1 Button

**파일**: `src/components/ui/Button.tsx`

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| variant | 'primary' \| 'secondary' \| 'danger' \| 'ghost' | 버튼 스타일 (기본: primary) |
| size | 'sm' \| 'md' \| 'lg' | 버튼 크기 (기본: md) |
| isLoading | boolean | 로딩 스피너 표시 |
| disabled | boolean | 비활성화 상태 |
| children | ReactNode | 버튼 내용 |
| onClick | () => void | 클릭 핸들러 |

**크기**:
| size | 높이 | font-size | padding |
|------|------|-----------|---------|
| sm | 28px | 11px | 0 8px |
| md | 34px | 12px | 0 12px |
| lg | 40px | 14px | 0 16px |

**변형 스타일**:
| variant | 배경 | 텍스트 | 보더 | hover |
|---------|------|--------|------|-------|
| primary | `--accent-primary` (#629584) | #fff | none | bg: `--accent-primary-hover` (#527D6F) |
| secondary | #fff | `--text-secondary` | 1px solid `--border-light` | bg: `--bg-sidebar` |
| danger | #fff | #DC2626 | 1px solid #FECACA | bg: #FEF2F2 |
| ghost | transparent | `--text-muted` | none | bg: `--bg-sidebar`, color: `--text-primary` |

**상태**:
| 상태 | 스타일 |
|------|--------|
| loading | opacity: 0.8, 12px 스피너 (border-top: accent), pointer-events: none |
| disabled | opacity: 0.45, cursor: not-allowed |
| active (primary) | background: #527D6F |

**스피너**: 12×12px, border: 2px solid `--border-light`, border-top-color: accent, spin 0.6s linear infinite

**접근성**: 아이콘 버튼 시 `aria-label` 필수

---

### 8.2 Badge

**파일**: `src/components/ui/Badge.tsx`

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| type | 'priority' \| 'status' \| 'due' \| 'checklist' \| 'issueType' | 뱃지 유형 |
| value | string | 뱃지 값 (예: 'HIGH', 'TODO', 'GOAL') |
| dueStatus | 'normal' \| 'soon' \| 'overdue' \| 'done' | 마감일 상태 (type='due' 시) |
| count | { done: number; total: number } | 체크리스트 카운트 (type='checklist' 시) |

**공통 스타일**:
- 높이: 22px (priority/status/due), 20px (checklist/issueType)
- padding: 0 7px
- border-radius: `--radius-tag` (4px)
- font-size: 11px
- font-weight: 500

**우선순위 뱃지 색상**:
| 값 | 배경 | 텍스트 | 아이콘 |
|-----|------|--------|--------|
| CRITICAL | #FEE2E2 | #DC2626 | ⚠ |
| HIGH | #FFEDD5 | #C2410C | ↑ |
| MEDIUM | #FEF9C3 | #A16207 | ─ |
| LOW | #F3F4F6 | #6B7280 | ↓ |

**상태 뱃지 색상**:
| 값 | 배경 | 텍스트 |
|-----|------|--------|
| BACKLOG | #F1F3F6 | #5A6B7F |
| TODO | #DBEAFE | #1D4ED8 |
| IN_PROGRESS | #FEF3C7 | #92400E |
| DONE | #D1FAE5 | #065F46 |

**마감일 뱃지 색상**: 섹션 1.11 참조

**체크리스트 뱃지**:
- 기본: 1px solid `--border-light`, `--text-muted` 텍스트
- 완료: `--col-done` 배경, `--col-done-text` 텍스트
- 표시: "✓ {done}/{total}"

**이슈 타입 뱃지**: 섹션 1.9 참조

---

### 8.3 Modal

**파일**: `src/components/ui/Modal.tsx`

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| isOpen | boolean | 열림 상태 |
| onClose | () => void | 닫기 핸들러 |
| maxWidth | string | 최대 너비 (기본: '560px') |
| children | ReactNode | 모달 콘텐츠 |

**스타일**:
- 오버레이: fixed inset:0, rgba(9,30,66,0.54), z-index: 300
- 모달: #fff, border-radius: 12px, shadow: 0 16px 48px rgba(0,0,0,0.2)
- 닫기 버튼: 32×32px, absolute top:16px right:16px
- 애니메이션: opacity 0→1, translateY(-12px)→0, 0.2s ease

**동작**:
- ESC 키 닫기
- 오버레이 클릭 닫기
- body 스크롤 잠금
- `role="dialog"`, `aria-modal="true"`

---

### 8.4 ConfirmDialog

**파일**: `src/components/ui/ConfirmDialog.tsx`

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| isOpen | boolean | 열림 상태 |
| variant | 'danger' \| 'warning' \| 'info' | 다이얼로그 유형 (기본: danger) |
| title | string | 제목 |
| message | string | 설명 메시지 |
| confirmLabel | string | 확인 버튼 텍스트 (기본: "삭제") |
| onConfirm | () => void | 확인 핸들러 |
| onCancel | () => void | 취소 핸들러 |

**스타일**:
- max-width: 400px (380px 설정 페이지)
- border-radius: 12px
- padding: 24px
- 애니메이션: scale(0.96)→1 + opacity, 0.2s

**변형별 스타일**:
| variant | 아이콘 배경 | 아이콘 텍스트 | 확인 버튼 |
|---------|------------|-------------|----------|
| danger | #FEF2F2 | ⚠ #DC2626 | Button variant="danger" |
| warning | #FEF9C3 | ↔ #B45309 | bg: #F59E0B, color: #fff |
| info | #DBEAFE | ℹ #2563EB | Button variant="primary" |

**아이콘**: 40×40px 원형

**동작**:
- ESC로 취소
- 오버레이 클릭으로 취소
- 포커스 트랩 (확인/취소 버튼 내에서만)

---

### 8.5 Avatar

**파일**: `src/components/ui/Avatar.tsx`

**관련 FR**: FR-011

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| member | Member \| null | 멤버 데이터 (null이면 미배정 상태) |
| size | 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' | 아바타 크기 (기본: sm) |
| tooltip | boolean | 호버 시 이름 툴팁 표시 여부 (기본: true) |
| showBorder | boolean | 흰색 보더 표시 여부 (기본: true) |

**크기**:
| size | 픽셀 | font-size | 용도 |
|------|------|-----------|------|
| xs | 20px | 8px | 카드 내 아바타 그룹 |
| sm | 24px | 10px | 카드 단일 아바타 |
| md | 32px | 12px | 헤더, 모달 메타 |
| lg | 40px | 14px | 설정 멤버 목록 |
| xl | 56px | 18px | 프로필 페이지 (Phase 2) |

**스타일**:
- 배경: `member.color` (없으면 #DFE1E6)
- 텍스트: 이름 첫 글자 이니셜, 흰색, semibold
- border: 2px solid `--bg-card` (showBorder 시)
- null/미배정: #DFE1E6 배경, "?" 또는 빈 아이콘

**아바타 그룹** (`AvatarGroup`):
- 여러 아바타 겹침: margin-left: -8px (첫 번째 제외)
- 오버플로우: #DFE1E6 배경, "+N" 텍스트

**담당자 행**:
- 아바타 + 이름 텍스트 (12px)
- 미배정 시: italic 스타일 "미배정"

---

### 8.6 FilterBar

**파일**: `src/components/ui/FilterBar.tsx`

**역할**: 보드 상단 필터 칩 목록. 클릭 시 보드 티켓 필터링.

**관련 FR**: FR-007 (오버듀), FR-009 (라벨 필터)

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| activeFilter | FilterType | 현재 활성 필터 |
| onChange | (filter: FilterType) => void | 필터 변경 핸들러 |
| labels | Label[] | 라벨 필터용 전체 라벨 목록 |
| ticketCounts | Record\<string, number\> | 각 필터별 티켓 수 |

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

**레이아웃**:
- 높이: 48px (`--filter-bar-height`)
- 배경: `--bg-app`
- border-bottom: 1px solid `--border-light`
- 가로 스크롤, gap: 8px, padding: 0 16px

**FilterChip 스타일**:
| 상태 | 배경 | 보더 | 텍스트 |
|------|------|------|--------|
| 기본 | `--bg-header` (#fff) | 1px solid `--border-light` | `--text-secondary` |
| hover | `--accent-light` | accent 보더 | `--accent-primary` |
| active | `--accent-primary` | accent 보더 | #fff |

- 높이: 30px, padding: 0 12px, border-radius: 20px
- font-size: 12px, font-weight: 500

**카운트 뱃지**:
- 기본: 10px, `--bg-sidebar` 배경, `--text-muted` 텍스트
- active: rgba(255,255,255,0.25) 배경, 흰색 텍스트
- padding: 1px 6px, border-radius: 10px

**ChipDivider**: 1px × 20px, `--border-light`

**LabelFilterDropdown**:
- 라벨 칩 그리드 표시 (min-width: 220px)
- 활성 라벨: 라벨 색상 칩 + × 제거 버튼

**FilterChip 목록**:
| 칩 | FilterType | 필터 조건 |
|----|-----------|----------|
| 전체 | ALL | 필터 없음 |
| 이번 주 업무 | THIS_WEEK | dueDate가 이번 주 이내 |
| 일정 초과 | OVERDUE | isOverdue = true |
| 높은 우선순위 | HIGH_PRIORITY | priority = HIGH 또는 CRITICAL |
| 내게 할당됨 | ASSIGNED_TO_ME | assigneeId = 세션 사용자 member ID |
| {라벨명} | { labelId } | 해당 라벨이 부착된 티켓 |

**동작**:
1. 활성 칩은 강조 스타일 (accent 배경)
2. 라벨 칩은 해당 라벨 color로 dot 표시
3. 필터 선택 시 클라이언트 사이드 필터링 (API 호출 없음)

---

## 9. 인증 컴포넌트

### 9.1 LoginPage

**파일**: `src/components/auth/LoginPage.tsx`

**역할**: 미인증 사용자에게 Google 로그인 화면 표시 (SCR-004)

**관련 FR**: FR-013

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| callbackUrl | string | 로그인 성공 후 리다이렉트 URL (기본: '/') |

**레이아웃**:
```
┌─────────────────────────────────────┐
│                                     │
│         ┌─────────────────┐         │
│         │   [T] Tika       │         │
│         │                  │         │
│         │  칸반 보드로 할 일을│         │
│         │  관리하세요.       │         │
│         │                  │         │
│         │ [G Google로 로그인]│         │  max-width: 400px
│         │                  │         │  padding: 48px 40px
│         │  ⚠ 인증 실패 에러  │         │
│         │                  │         │
│         │ • 칸반 보드       │         │
│         │ • 이슈 계층       │         │
│         │ • 마감일 알림     │         │
│         └─────────────────┘         │
│                                     │
│      © 2026 Tika · All rights       │
└─────────────────────────────────────┘
```

**로그인 카드 스타일**:
| 요소 | 값 |
|------|-----|
| max-width | 400px |
| padding | 48px 40px |
| 배경 | `--bg-card` (#FFFFFF) |
| border-radius | `--radius-column` (12px) |
| 그림자 | `--shadow-dropdown` |
| 애니메이션 | cardIn: opacity 0→1, translateY(16px)→0, 0.4s ease |

**로고**:
| 요소 | 값 |
|------|-----|
| 아이콘 | 48×48px, 12px radius, `--accent-primary`, shadow: 0 4px 12px rgba(98,149,132,0.35) |
| 텍스트 | 28px bold, `--font-display`, letter-spacing: -0.5px |

**설명**: 14px, `--text-secondary`, line-height: 1.7, strong 텍스트 → `--accent-primary`

**Google 버튼**:
| 요소 | 값 |
|------|-----|
| 높이 | 48px |
| 보더 | 1px solid `--border-light` |
| border-radius | 8px |
| font-size | 14px medium |
| hover | bg: #F8F9FB, border: `--border-medium`, shadow: 0 2px 8px rgba(0,0,0,0.06) |
| active | transform: scale(0.98) |
| loading | pointer-events: none, opacity: 0.7, 스피너 표시 |

**에러 상태**:
- 배경: #FEF2F2, 보더: 1px solid #FECACA
- 텍스트: #DC2626, 12px
- 아이콘: ⚠ 16×16px
- `role="alert"`

**Feature Hints**: dot(6px, accent) + 텍스트(12px, muted), 가로 나열

**동작**:
1. GoogleLoginButton 클릭 시 `signIn('google', { callbackUrl })` 호출
2. 첫 로그인 시 서버에서 자동: user 생성 → 기본 워크스페이스 생성 → member 등록
3. 로그인 성공 시 callbackUrl로 리다이렉트
4. 실패 시 에러 메시지 표시 (3종 랜덤: 인증 실패 / 네트워크 오류 / 접근 거부)

**접근성**:
- 로그인 버튼: `aria-label="Google 계정으로 로그인"`
- 에러 메시지: `role="alert"`

---

## 10. Phase 2 컴포넌트 (스텁)

> Phase 2에서 구현 예정. 현재는 명세만 정의.

### 10.1 SettingsPage

**파일**: `app/settings/page.tsx`

**관련 화면**: SCR-005

**레이아웃**: 좌측 220px 사이드 네비게이션 + 우측 콘텐츠 영역 (max-width: 800px)

**섹션**:
| 섹션 | NavItem | 설명 |
|------|---------|------|
| 일반 | ⚙ 일반 | 프로젝트 이름/설명/키, 환경 설정 (시간대, 언어, 날짜 형식), 위험 영역 |
| 알림 채널 | 🔔 알림 채널 | Slack/Telegram Webhook 설정, 토글, 테스트 발송 |
| 라벨 관리 | 🏷 라벨 관리 | 라벨 CRUD, 17색 팔레트, 인라인 편집, 최대 20개 |
| 멤버 관리 | 👥 멤버 관리 | 멤버 목록, 역할 변경 (관리자/멤버), 초대, 제거 |

**공통 UI 요소**:
- Toast 알림: 고정 top:80px right:20px, 3초 자동 닫힘, success/fail/info 변형
- 사이드 네비: active 시 좌측 3px accent 보더 + accent-light 배경

### 10.2 NotificationHistoryPage

**파일**: `app/notifications/page.tsx`

**관련 화면**: SCR-006

**레이아웃**: 헤더 + 메인 콘텐츠 (max-width: 860px) + 푸터

**기능**:
- 필터: 채널별 (전체/Slack/Telegram) + 상태별 (전체/성공/실패) 칩 필터
- 알림 카드: 채널 뱃지 + 제목 + 시간 + 성공/실패 상태 + 읽음/안읽음
- 에러 메시지: 실패 시 #FEF2F2 배경 에러 상세
- 페이지네이션: 32×32px 페이지 버튼, active: accent 배경

### 10.3 CommentSection

**파일**: `src/components/ticket/CommentSection.tsx`

**역할**: 티켓 상세 모달 내 댓글 영역 (활동 내역 하위)

**스타일**:
- 구분선: border-top 1px solid `--border-light`, padding-top: 16px
- 입력: min-height: 40px, max-height: 120px, resize: vertical
- 포커스: border accent, box-shadow: 0 0 0 3px accent-light
- 전송 버튼: 30px 높이, accent-primary, disabled 시 opacity: 0.4
- Enter로 전송 (Shift+Enter로 줄바꿈)

---

## 11. 이벤트 흐름

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
  → POST /api/tickets → 성공: board 해당 칼럼에 카드 추가 → 모달 닫기

[조회] TicketCard 클릭 → TicketModal 열기 → 상세 정보 표시

[수정] TicketModal → 필드 수정 → onUpdate
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

### 인증 흐름

```
[로그인] LoginPage → GoogleLoginButton 클릭
  → signIn('google', { callbackUrl }) (NextAuth)
  → Google OAuth 인증
  → 콜백: user 조회/생성 → workspace 생성 → member 등록
  → callbackUrl로 리다이렉트 (기본: /)

[로그아웃] UserAvatar → Dropdown → "로그아웃" 클릭
  → signOut() (NextAuth)
  → /login으로 리다이렉트
```

---

## 12. 파일 경로 요약

### 레이아웃 컴포넌트

| 컴포넌트 | 파일 경로 |
|---------|----------|
| Header | `src/components/layout/Header.tsx` |
| Sidebar | `src/components/layout/Sidebar.tsx` |
| Footer | `src/components/layout/Footer.tsx` |

### 보드 컴포넌트

| 컴포넌트 | 파일 경로 |
|---------|----------|
| BoardContainer | `src/components/board/BoardContainer.tsx` |
| Board | `src/components/board/Board.tsx` |
| Column | `src/components/board/Column.tsx` |
| TicketCard | `src/components/board/TicketCard.tsx` |

### 티켓 컴포넌트

| 컴포넌트 | 파일 경로 |
|---------|----------|
| TicketModal | `src/components/ticket/TicketModal.tsx` |
| TicketForm | `src/components/ticket/TicketForm.tsx` |
| ChecklistSection | `src/components/ticket/ChecklistSection.tsx` |

### 라벨 컴포넌트

| 컴포넌트 | 파일 경로 |
|---------|----------|
| LabelBadge | `src/components/label/LabelBadge.tsx` |
| LabelSelector | `src/components/label/LabelSelector.tsx` |
| LabelEditor | `src/components/label/LabelEditor.tsx` |

### 이슈 컴포넌트

| 컴포넌트 | 파일 경로 |
|---------|----------|
| IssueBreadcrumb | `src/components/issue/IssueBreadcrumb.tsx` |

### 공통 UI 컴포넌트

| 컴포넌트 | 파일 경로 |
|---------|----------|
| Button | `src/components/ui/Button.tsx` |
| Badge | `src/components/ui/Badge.tsx` |
| Modal | `src/components/ui/Modal.tsx` |
| ConfirmDialog | `src/components/ui/ConfirmDialog.tsx` |
| Avatar | `src/components/ui/Avatar.tsx` |
| FilterBar | `src/components/ui/FilterBar.tsx` |

### 인증 컴포넌트

| 컴포넌트 | 파일 경로 |
|---------|----------|
| LoginPage | `src/components/auth/LoginPage.tsx` |
| GoogleLoginButton | `src/components/auth/LoginPage.tsx` (내부) |

### Phase 2 컴포넌트 (예정)

| 컴포넌트 | 파일 경로 |
|---------|----------|
| SettingsPage | `app/settings/page.tsx` |
| NotificationHistoryPage | `app/notifications/page.tsx` |
| CommentSection | `src/components/ticket/CommentSection.tsx` |
