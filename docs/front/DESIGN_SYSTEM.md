# Tika Design System v3.0

> Last updated: 2026-03-20
> Source of truth: `app/globals.css` `:root` variables

---

## 1. Foundations

### 1.1 Typography

| Token            | Value                                          | Usage                        |
|------------------|------------------------------------------------|------------------------------|
| `--font-display` | 'Plus Jakarta Sans', 'Noto Sans KR', sans-serif | Headings, logo, lane titles  |
| `--font-body`    | 'Noto Sans KR', 'Plus Jakarta Sans', sans-serif | Body text, form inputs, UI   |

| Scale         | Variable         | Size  | Usage                            |
|---------------|------------------|-------|----------------------------------|
| H1            | `--text-h1`      | 20px  | Logo, modal titles               |
| H2            | `--text-h2`      | 16px  | Lane titles, section headers     |
| Body 1        | `--text-body1`   | 14px  | Card titles, descriptions, forms |
| Body 2        | `--text-body2`   | 12px  | Badges, meta info, labels        |
| Small         | `--text-small`   | 11px  | Timestamps, counts, hints        |

| Weight    | Variable          | Value | Usage                          |
|-----------|-------------------|-------|--------------------------------|
| Bold      | `--fw-bold`       | 700   | Headings, logo                 |
| Semibold  | `--fw-semibold`   | 600   | Lane titles, buttons           |
| Medium    | `--fw-medium`     | 500   | Card titles, badges, tags      |
| Regular   | `--fw-regular`    | 400   | Body text, descriptions        |

### 1.2 Spacing

Base unit: **4px**

| Token      | Value | Usage                          |
|------------|-------|--------------------------------|
| `--sp-xs`  | 4px   | Inline gaps, tag gaps          |
| `--sp-sm`  | 8px   | Small paddings, card gaps      |
| `--sp-md`  | 12px  | Card padding, form spacing     |
| `--sp-lg`  | 16px  | Header padding, section gaps   |
| `--sp-xl`  | 24px  | Modal padding, large sections  |

CSS vars (globals.css):

| Variable                | Value | Usage                    |
|-------------------------|-------|--------------------------|
| `--spacing-card-gap`    | 8px   | Gap between ticket cards |
| `--spacing-column-gap`  | 16px  | Gap between columns      |

### 1.3 Border Radius

| Token              | Value | Usage                           |
|--------------------|-------|---------------------------------|
| `--radius-card`    | 8px   | Cards, popovers                 |
| `--radius-modal`   | 12px  | Modals                          |
| `--radius-column`  | 12px  | Lane containers                 |
| `--radius-button`  | 6px   | Buttons                         |
| `--radius-input`   | 6px   | Inputs, dropdowns               |
| `--radius-badge`   | 4px   | Priority/status badges          |
| `--radius-tag`     | 4px   | Tags, category crumbs           |

### 1.4 Shadows

| Token                    | Value                                    | Usage              |
|--------------------------|------------------------------------------|--------------------|
| `--shadow-card`          | `0 1px 2px rgba(9,30,66,0.12)`          | Card resting       |
| `--shadow-card-hover`    | `0 3px 8px rgba(9,30,66,0.18)`          | Card hover         |
| `--shadow-card-dragging` | `0 5px 10px rgba(9,30,66,0.25)`         | Card dragging      |
| `--shadow-modal`         | `0 16px 48px rgba(0,0,0,0.2)`           | Modals             |
| `--shadow-header`        | `0 1px 3px rgba(0,0,0,0.08)`            | Header bar         |
| `--shadow-dropdown`      | `0 8px 24px rgba(0,0,0,0.12)`           | Dropdowns          |

### 1.5 Z-Index Layers

| Token         | Value | Usage                                        |
|---------------|-------|----------------------------------------------|
| `--z-sidebar` | 10    | Sidebar (desktop)                            |
| Sidebar (mobile) | 40 | Fixed sidebar overlay (< 1024px)           |
| `--z-header`  | 50    | Header bar                                   |
| `--z-modal`   | 200   | Modals, modal overlay, dropdown menus        |

### 1.6 Layout Dimensions

| Token                 | Value | Description          |
|-----------------------|-------|----------------------|
| `--header-height`     | 60px  | Fixed top header     |
| `--footer-height`     | 40px  | Fixed bottom footer  |
| `--sidebar-width`     | 260px | Default sidebar      |
| Sidebar min           | 200px | Minimum resize       |
| Sidebar max           | 400px | Maximum resize       |
| `--column-width`      | 280px | Kanban lane width    |
| `--filter-bar-height` | 48px  | Filter chips bar     |

---

## 2. Color System

### 2.1 Brand

| Name             | Hex       | CSS Variable              | Usage                             |
|------------------|-----------|---------------------------|-----------------------------------|
| Accent Primary   | `#629584` | `--color-accent`          | CTA buttons, active states, links |
| Accent Hover     | `#527D6F` | `--color-accent-hover`    | Hover on accent elements          |
| Accent Light     | `#E8F5F0` | `--color-accent-light`    | Focus rings, light backgrounds    |

### 2.2 Backgrounds

| Name            | Hex       | CSS Variable               | Usage                     |
|-----------------|-----------|----------------------------|---------------------------|
| App             | `#F8F9FB` | `--color-app-bg`           | Page background           |
| Header          | `#FFFFFF` | `--color-header-bg`        | Header bar                |
| Sidebar         | `#F1F3F6` | `--color-sidebar-bg`       | Sidebar background        |
| Sidebar Hover   | `#E8EBF0` | `--color-sidebar-hover`    | Sidebar item hover        |
| Board           | `#E8EDF2` | `--color-board-bg`         | Board area                |
| Footer          | `#F4F5F7` | `--color-footer-bg`        | Footer bar                |
| Card (default)  | `#EFF6FF` | `--color-card-bg`          | Cards (fallback)          |
| Column          | `#F4F5F7` | `--color-col-bg`           | Lane containers           |

#### Per-Column Card Backgrounds

Cards take different background tints based on their column:

| Column      | Hex       | CSS Variable                    |
|-------------|-----------|---------------------------------|
| Backlog     | `#EFF6FF` | `--color-card-bg-backlog`       |
| TODO        | `#F4F9FF` | `--color-card-bg-todo`          |
| In Progress | `#FFFDF5` | `--color-card-bg-in-progress`   |
| Done        | `#F5FFF9` | `--color-card-bg-done`          |

### 2.3 Text

| Name      | Hex       | CSS Variable              | Usage                        |
|-----------|-----------|---------------------------|------------------------------|
| Primary   | `#2C3E50` | `--color-text-primary`    | Headings, card titles, body  |
| Secondary | `#5A6B7F` | `--color-text-secondary`  | Descriptions, labels         |
| Muted     | `#8993A4` | `--color-text-muted`      | Timestamps, placeholders     |

### 2.4 Lane Header Colors

All lane header text uses `--color-text-primary` (#2C3E50) for readability.

| Lane        | Background | CSS Variable              |
|-------------|------------|---------------------------|
| Backlog     | `#F4F5F7`  | `--color-col-backlog`     |
| TODO        | `#DBEAFE`  | `--color-col-todo`        |
| In Progress | `#FEF3C7`  | `--color-col-in-progress` |
| Done        | `#D1FAE5`  | `--color-col-done`        |

### 2.5 Tag/Label Colors

17-color palette supporting preset labels and custom user-created labels:

| # | Name     | Background | Text     | CSS Class |
|---|----------|------------|----------|-----------|
| 1 | Frontend | `#2b7fff`  | `#FFFFFF`| `.fe`     |
| 2 | Backend  | `#00c950`  | `#FFFFFF`| `.be`     |
| 3 | Design   | `#ad46ff`  | `#FFFFFF`| `.ui`     |
| 4 | Bug      | `#fb2c36`  | `#FFFFFF`| `.bug`    |
| 5 | Docs     | `#ffac6d`  | `#3D2200`| `.doc`    |
| 6 | Infra    | `#615fff`  | `#FFFFFF`| `.inf`    |
| 7 | —        | `#ff29d3`  | `#FFFFFF`| `.c7`     |
| 8 | —        | `#a0628c`  | `#FFFFFF`| `.c8`     |
| 9 | —        | `#89d0f0`  | `#1A3D4D`| `.c9`     |
| 10| —        | `#71e4bf`  | `#0A3D2A`| `.c10`    |
| 11| —        | `#46e264`  | `#0D3A14`| `.c11`    |
| 12| —        | `#caee68`  | `#3A4200`| `.c12`    |
| 13| —        | `#fffe92`  | `#4A4500`| `.c13`    |
| 14| —        | `#f7d1d1`  | `#5C1A1A`| `.c14`    |
| 15| —        | `#f7a2ff`  | `#4A0050`| `.c15`    |
| 16| —        | `#c1d1ff`  | `#1A2A5C`| `.c16`    |
| 17| —        | `#c5dbdc`  | `#2A3D3E`| `.c17`    |

> Auto contrast: Light backgrounds (luminance > 160) receive dark text; dark backgrounds receive white text. Calculated via `needsDarkText()` function.

### 2.6 Priority Badge Colors

| Priority | Korean | Background | Text      | CSS Variable                              |
|----------|--------|------------|-----------|-------------------------------------------|
| Critical | 긴급   | `#FEE2E2`  | `#DC2626` | `--color-priority-critical-bg` / `--color-priority-critical` |
| High     | 높음   | `#FFEDD5`  | `#C2410C` | `--color-priority-high-bg` / `--color-priority-high`         |
| Medium   | 중간   | `#FEF9C3`  | `#A16207` | `--color-priority-medium-bg` / `--color-priority-medium`     |
| Low      | 낮음   | `#F3F4F6`  | `#6B7280` | `--color-priority-low-bg` / `--color-priority-low`           |

### 2.7 Category Hierarchy Type Colors

| Type    | Color     | Abbreviation |
|---------|-----------|-------------|
| Goal    | `#8B5CF6` | G           |
| Story   | `#3B82F6` | S           |
| Feature | `#10B981` | F           |
| Task    | `#F59E0B` | T           |

---

## 3. Icon System

All icons are **inline SVGs** with the `.ic` utility class:

```css
.ic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  vertical-align: middle;
}
.ic svg {
  width: 100%;
  height: 100%;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}
```

Standard sizes: 12px, 14px, 16px, 18px (set via inline `style="width:Npx;height:Npx"`).

**아이콘 라이브러리:** `lucide-react` 패키지를 공식 아이콘 소스로 사용한다.
React 컴포넌트에서는 `import { IconName } from 'lucide-react'`로 직접 임포트하거나,
인라인 SVG가 필요한 경우 Lucide 아이콘셋의 SVG path를 복사하여 사용한다.

### 공식 아이콘 지정 목록

| 용도 | 아이콘 이름 | lucide-react import |
|------|------------|---------------------|
| 링크 / 초대 링크 | `Link2` | `import { Link2 } from 'lucide-react'` |
| 멤버 / 팀 | `Users` | `import { Users } from 'lucide-react'` |
| 닫기 | `X` | `import { X } from 'lucide-react'` |
| 더 보기 이동 | `ArrowRight` | `import { ArrowRight } from 'lucide-react'` |

> 새로운 아이콘을 도입할 때는 이 목록에 추가한다.

---

## 4. Animation & Transitions

### 4.1 Transition Variables

| Variable              | Value       | Usage                              |
|-----------------------|-------------|------------------------------------|
| `--transition-fast`   | `150ms ease`| Buttons, hover, border color       |
| `--transition-normal` | `200ms ease`| Modals appear, overlay fade        |

### 4.2 Keyframe Animations

```css
/* Modal overlay fade */
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Modal panel slide up */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

| Animation    | Used On              | Duration / Variable    |
|--------------|----------------------|------------------------|
| `fade-in`    | `.modal-overlay`     | `--transition-normal`  |
| `slide-up`   | `.modal-content`     | `--transition-normal`  |

### 4.3 Common Transition Timings

| Property         | Duration | Easing | Usage                          |
|------------------|----------|--------|--------------------------------|
| Background       | 150ms    | ease   | Buttons, nav items hover       |
| Box shadow       | 150ms    | ease   | Card hover/drag                |
| Transform        | 150ms    | ease   | Card lift, dropdown appear     |
| Modal appear     | 200ms    | ease   | `fade-in` / `slide-up`        |
| Sidebar toggle   | 300ms    | ease   | Width transition               |

---

## 5. Responsive Behavior

| Breakpoint | Behavior                                              |
|------------|-------------------------------------------------------|
| ≥ 1024px   | Full layout: sidebar 260px + 3-column board           |
| 768–1023px | Sidebar hidden; toggleable fixed overlay (z:40); 2-column board |
| < 768px    | Single column; sidebar overlay; full-width modals     |

- Sidebar: Resizable 200px–400px via drag handle
- Board: Horizontal scroll for overflow lanes
- Cards: Fixed 280px column width, vertical scroll within lanes
- Modals: `max-width: 560px` (centered flex); `max-width: 100%` on mobile
- Filter bar chips: `height: 36px; min-width: 44px` touch target on mobile
