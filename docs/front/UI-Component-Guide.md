# Tika UI Component Guide v2.0

> Last updated: 2026-02-21
> Complete component inventory for the Tika kanban board single-page application

---

## 1. Layout Shell

### 1.1 App Container (`.app`)
- Flex column, 100vh, overflow hidden
- Children: Header → Main Area → Footer

### 1.2 Header (`.header`)
- Height: 60px, white background, bottom border + shadow
- **Left:** Logo (32px icon + "Tika" text)
- **Center:** Search box (300px, bg-sidebar, accent focus ring)
- **Right:** "새 업무" CTA button → Divider → Notification bell (with red dot) → Settings gear → Divider → User avatar ("홍")
- Each right-side icon has a dropdown menu

### 1.3 Sidebar (`.sidebar`)
- Default width: 260px, resizable 200–400px
- Background: `--bg-sidebar`
- **Header section:**
  - Workspace dropdown selector (Project Alpha) with chevron
  - Collapse toggle button (panel icon)
- **Workspace Dropdown (`.ws-dd`):**
  - 메뉴 section: 칸반 보드, Inbox, 내 업무, 일정 보기, 아카이브
  - 워크스페이스 section: Project Alpha, Design Team, Backend Squad
  - 워크스페이스 추가 (accent color link)
- **Task Backlog List (`.sb-list`):**
  - Header: "내 업무" title + count badge ("9건")
  - Cards styled identically to kanban cards (white bg, card shadow, 8px radius)
  - Each card: title + meta row (priority badge, due date badge, relative time)
  - Completed tasks: opacity 0.6, title strikethrough, "완료" badge
  - Click opens matching card's detail modal
  - New tasks auto-prepend with "방금" timestamp

### 1.4 Sidebar Collapse/Expand
- Collapse: sidebar width → 0 with 0.3s transition
- Expand button (`.expand-btn`): absolute, left: 0, top: 12px
  - 28×28px, sidebar-bg, right-rounded, box-shadow
  - Shows after 300ms delay on collapse
  - Same vertical position as sidebar header toggle

### 1.5 Footer (`.footer`)
- Height: 55px, centered text
- "© 2026 Tika. All rights reserved. | Built with ♥ by CodeVillain"

---

## 2. Board Components

### 2.1 Filter Bar (`.filters`)
- Height: 48px, flex row, horizontal scroll
- **Active chip:** `.chip.on` — accent background, white text
- **Chips:** 전체 (24), 이번 주 업무 (6), 일정 초과 (2), 높은 우선순위, 내게 할당됨, 라벨
- Divider (`.f-div`) between count chips and filter chips

### 2.2 Lane (`.lane`)
- Width: 280px, flex column, bg-column, radius-column
- **Variants:** `.todo`, `.inp`, `.done` — each sets lane-head background color
- **Lane Head (`.lane-head`):**
  - Title + count badge (`.lane-cnt` — rgba bg, rounded pill)
  - Text color: `--text-primary` (black) for all lanes
  - Context menu button (three dots)
- **Lane Context Menu (`.lctx-menu`):**
  - WIP 제한 설정, 이름 변경, 색상 변경
  - Separator
  - 오른쪽에 레인 추가, 레인 분할
  - Separator
  - 레인 삭제 (danger red)
- **Lane Body (`.lane-body`):**
  - Vertical scroll, 8px gap between cards
  - Custom thin scrollbar (4px, border-medium)

### 2.3 Card (`.card`)
- White background, 12px padding, 8px radius, card shadow
- Hover: shadow-card-hover + translateY(-1px)
- Active: cursor grabbing + shadow-card-drag
- **Structure:**
  1. Tags row (`.tags`) — flex wrap, 4px gap
  2. Title (`.card-title`) — 14px medium weight
  3. Description (`.card-desc`) — 12px muted, 2-line clamp
  4. Footer (`.card-foot`) — badges left, avatars right
- **Data Attributes:** `data-id`, `data-title`, `data-desc`, `data-tags`, `data-priority`, `data-priority-class`, `data-due`, `data-due-label`, `data-status`, `data-assignee`, `data-assignee-color`, `data-goal`, `data-story`, `data-feature`
- `.card.fin` class: opacity 0.7 for completed cards
- Click → opens detail modal (skips if clicking context menu)

---

## 3. Badge System (`.b`)

Unified badge component: inline-flex, 22px height, 7px horizontal padding, 4px radius, 11px font.

| Class      | Purpose       | Korean  | Style                    |
|------------|---------------|---------|--------------------------|
| `.b-crit`  | Critical      | 긴급    | Red bg #FEE2E2           |
| `.b-high`  | High          | 높음    | Orange bg #FFEDD5        |
| `.b-med`   | Medium        | 중간    | Yellow bg #FEF9C3        |
| `.b-low`   | Low           | 낮음    | Gray bg #F3F4F6          |
| `.b-done`  | Done          | 완료    | Green bg #D1FAE5         |
| `.b-due`   | Due date      | —       | Gray bg #F3F4F6          |
| `.b-over`  | Overdue       | —       | Red bg #FEE2E2           |
| `.b-soon`  | Due soon      | —       | Yellow bg #FEF3C7        |

Each may contain an inline SVG icon (10px) + text label.

---

## 4. Tag/Label System (`.tag`)

- Height: 20px, padding: 0 8px, 4px radius, 10px font, medium weight
- 6 preset CSS classes: `.fe`, `.be`, `.ui`, `.bug`, `.doc`, `.inf`
- 11 extended classes: `.c7` through `.c17`
- Custom tags: inline `style="background:...;color:..."` with auto-contrast

### Custom Label Creator
Available in both new task form and detail modal tag picker.

**Structure:**
- Text input (`.tag-creator-input`) — 28px height, 140px max
- Color swatches (`.tag-color-swatches`) — 17 circular swatches (18px), selected = dark border
- Add button (`.tag-creator-btn`) — accent bg, white text

**Behavior:**
- Enter key submits
- Auto-contrast text color via luminance calculation
- In new task form: creates selected chip
- In detail modal: adds tag directly to card + syncs visual

---

## 5. Avatar System (`.av`)

- Size: 24px (card), 28px (activity, detail), 32px (user header)
- Circle, white border (2px), colored background
- Shows first character of name
- `.avs` container: flex row, negative margin overlap

---

## 6. Modal System

### 6.1 Overlay (`.modal-overlay`)
- Fixed full-screen, rgba(9,30,66,0.54)
- z-index: 300, flex center
- Click overlay → close modal
- `.open` class: opacity 1, visibility visible
- Body scroll locked when open

### 6.2 New Task Modal (`.modal-new`)
- Max-width: 560px
- **Header:** "새 업무 만들기" + close button
- **Form fields (top to bottom):**
  1. **제목** — text input, required (red border validation)
  2. **설명** — textarea, 4 rows
  3. **체크리스트** — checklist builder
  4. **라벨** — preset chip toggles + custom label creator
  5. **상위 카테고리** — 3-column cascading dropdowns (Goal → Story → Feature)
  6. **상태 / 우선순위** — side-by-side selects
  7. **마감일 / 담당자** — side-by-side date input + select
- **Footer:** 취소 (cancel) + 업무 생성 (submit)
- **Submit behavior:** validates title, creates card in target lane, adds to sidebar list, stores checklist in cardExtras

### 6.3 Detail Modal (`.modal-detail`)
- Max-width: 720px
- **Top Section (`.detail-top`):**
  - Editable tags with × remove buttons + add picker
  - Tag picker includes preset options + custom label creator
  - Title (20px bold)
  - Category breadcrumb (`.cat-breadcrumb`) with edit button
  - Category editor (collapsible, 3 cascading dropdowns + save/cancel)
  - Meta row: status badge, priority badge, due date, assignees with avatars
- **Body (`.detail-body`):**
  - 설명 section — gray background box
  - 체크리스트 section — interactive checkboxes, × remove buttons, add input
  - 활동 내역 section — avatar + name + action + timestamp timeline
  - 댓글 입력 — avatar + textarea + submit button
- **Footer (`.detail-footer`):**
  - Left: 편집, 복제, 이동 buttons (`.btn-icon-text`)
  - Right: 삭제 button (danger style)

---

## 7. Checklist Builder (`.cl-builder`)

Used in both new task form and detail modal.

### New Task Form
- **Items container** (`.cl-builder-items`): vertical list
- **Each item** (`.cl-builder-item`): checkbox + text + × remove button
  - White bg, border, 6px radius
- **Add row** (`.cl-builder-add`): dashed-border input + "추가" button
- Enter key adds item, focus returns to input

### Detail Modal
- Existing items rendered from `cardExtras` data
- Checkboxes toggle `.done-item` class (strikethrough + muted)
- × remove button on each item
- Add input below list
- Items persist for session (stored in `cardExtras` object)

---

## 8. Category Hierarchy System

### 8.1 Data Model
```
Goal → Story → Feature → Task
```
- Tasks belong to Features (optional)
- Features belong to Stories
- Stories belong to Goals
- Each ticket links to at most one parent at each level

### 8.2 Cascading Dropdown
- 3-column row: Goal → Story → Feature
- Upper level enables lower level
- Changing parent resets children
- `populateGoals()`, `onGoalChange()`, `onStoryChange()` functions
- Prefix-based (`new` / `dt`) for form reuse

### 8.3 Breadcrumb Display (`.cat-breadcrumb`)
- Format: `[G] Goal Name › [S] Story Name › [F] Feature Name`
- Each crumb: gray pill with colored type badge (9px uppercase)
- Type colors: Goal=#8B5CF6, Story=#3B82F6, Feature=#10B981
- Edit button (pencil icon) opens inline editor
- "상위 카테고리 없음" shown when no parent assigned

### 8.4 Sample Hierarchy Data
| ID | Type    | Name               | Parent |
|----|---------|--------------------|--------|
| G1 | Goal    | MVP 출시            | —      |
| G2 | Goal    | 팀 협업 확장         | —      |
| S1 | Story   | 사용자 인증 시스템    | G1     |
| S2 | Story   | 칸반 보드 핵심 기능   | G1     |
| S3 | Story   | 프로젝트 관리 기반    | G2     |
| F1 | Feature | 인증 API            | S1     |
| F2 | Feature | 데이터베이스 설계     | S1     |
| F3 | Feature | 보드 UI             | S2     |
| F4 | Feature | 드래그앤드롭         | S2     |
| F5 | Feature | 문서화              | S3     |

---

## 9. Comment System

### 9.1 Comment Input (`.comment-box`)
- Located below activity timeline in detail modal
- User avatar (28px) + textarea + submit button row
- Textarea: auto-growing (min 40px, max 120px), accent focus ring
- Submit button: disabled when empty, accent bg when active
- Enter = submit, Shift+Enter = newline

### 9.2 Comment Display
- Appended to activity timeline as `.activity-item`
- Format: `[Avatar] 홍길동 "comment text"` + timestamp
- Auto-scrolls to new comment

---

## 10. Dropdown System (`.dd`)

### 10.1 Standard Dropdown
- Trigger: `onclick="td('dd-id')"`
- Menu: absolute positioned, white bg, border, shadow-dropdown
- Transition: opacity + translateY, 0.15s ease
- `.open` class toggles visibility
- Click outside closes all dropdowns

### 10.2 Dropdown Items
- `.dd-item`: flex row, 8px/12px padding, hover bg-sidebar
- `.dd-label`: section header, 11px semibold, muted color
- `.dd-sep`: 1px border divider
- `.dd-item.danger`: red text + icon

### 10.3 Workspace Dropdown (`.ws-dd`)
- Integrated into sidebar header
- Contains both navigation menu and workspace list
- Same open/close mechanics as standard dropdown

---

## 11. Button Components

| Component        | Class           | Height | Style                              |
|------------------|-----------------|--------|------------------------------------|
| CTA Button       | `.btn-new`      | 34px   | Accent bg, white text, icon + text |
| Icon Button      | `.icon-btn`     | 36px   | Transparent, hover bg-sidebar      |
| Submit           | `.btn-submit`   | 36px   | Accent bg, white text, semibold    |
| Cancel           | `.btn-cancel`   | 36px   | White bg, border, secondary text   |
| Icon + Text      | `.btn-icon-text`| 32px   | White bg, border, 14px icon + text |
| Danger           | `.btn-icon-text.danger` | 32px | Red text, red-tint border    |
| Tag Creator      | `.tag-creator-btn` | 28px | Accent bg, white, 11px text     |
| Comment Submit   | `.comment-submit`| 30px  | Accent bg, disabled opacity 0.4   |
| Filter Chip      | `.chip`         | 30px   | White bg, border, toggleable       |
| Filter Chip Active | `.chip.on`   | 30px   | Accent bg, white text              |

---

## 12. Form Components

| Component   | Class            | Height | Notes                         |
|-------------|------------------|--------|-------------------------------|
| Text Input  | `.form-input`    | 36px   | Border-light, accent focus    |
| Textarea    | `.form-textarea` | auto   | Min 4 rows, same focus style  |
| Select      | `.form-select`   | 36px   | Native select, same styling   |
| Label       | `.form-label`    | —      | 12px semibold, secondary      |
| Required    | `.req`           | —      | Red asterisk (inside label)   |

**Focus state:** border-color: accent-primary + box-shadow: 0 0 0 3px accent-light

### Form Tag Chips (`.form-tag-chip`)
- 26px height, 13px pill radius
- Default: opacity 0.45, colored background
- Hover: opacity 0.75
- Selected: opacity 1, 2px dark border

---

## 13. Interaction Patterns

### Keyboard Shortcuts
| Key           | Action                              |
|---------------|-------------------------------------|
| Escape        | Close all open modals               |
| Enter         | Submit comment / Add checklist item / Add custom tag |
| Shift + Enter | Newline in comment textarea         |

### Click Behaviors
| Target                  | Action                              |
|-------------------------|-------------------------------------|
| Card                    | Open detail modal                   |
| Sidebar task            | Open matching card's detail modal   |
| "새 업무" button         | Open new task modal (reset form)    |
| Modal overlay           | Close modal                         |
| Tag chip (new form)     | Toggle selected state               |
| Tag × button (detail)   | Remove tag from card                |
| Tag + button (detail)   | Open/close tag picker               |
| Checklist checkbox       | Toggle done state (strikethrough)  |
| Checklist × button       | Remove item                        |
| Category edit button     | Toggle category editor             |
| Sidebar resize handle    | Drag to resize (200–400px)         |
| Sidebar toggle button    | Collapse/expand sidebar            |

---

## 14. Data Architecture

### 14.1 Card Data Attributes
```html
<div class="card"
  data-id="1"
  data-title="사용자 인증 API 설계"
  data-desc="JWT 기반 인증 시스템..."
  data-tags="Backend,Infra"
  data-priority="높음"
  data-priority-class="b-high"
  data-due="2025-02-22"
  data-due-label="2월 22일"
  data-status="TODO"
  data-assignee="홍길동"
  data-assignee-color="#7EB4A2"
  data-goal="G1"
  data-story="S1"
  data-feature="F1"
>
```

### 14.2 Card Extras (JS Object)
```javascript
cardExtras = {
  '1': {
    checklist: [
      { text: 'JWT 토큰 생성/검증 로직 구현', done: true },
      ...
    ],
    activity: [
      { name: '홍길동', color: '#7EB4A2', text: '카드를 생성했습니다.', time: '2월 19일 09:30' },
      ...
    ]
  }
};
```

### 14.3 Hierarchy (JS Object)
```javascript
hierarchy = {
  goals: [{ id: 'G1', name: 'MVP 출시' }, ...],
  stories: [{ id: 'S1', goalId: 'G1', name: '사용자 인증 시스템' }, ...],
  features: [{ id: 'F1', storyId: 'S1', name: '인증 API' }, ...]
};
```

### 14.4 Dynamic Registries
- `tagColorMap`: maps tag name → background hex
- `tagTextColorMap`: maps tag name → text hex (for light backgrounds)
- `tagClassMap`: maps preset tag name → CSS class
- `tagPalette`: 17-color array for swatch picker

---

## 15. File Structure

Single file: `tika-main.html` (~1730 lines)

| Section   | Content                                      |
|-----------|----------------------------------------------|
| `<style>` | All CSS (~480 lines)                         |
| HTML      | Header, Sidebar, Board, 9 Cards, Modals       |
| `<script>`| Dropdowns, Sidebar, Modal system, Task CRUD, Hierarchy, Tags, Checklist, Comments |

**Zero external dependencies** (except Google Fonts CDN).
