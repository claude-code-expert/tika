# Tika Design System v2.0

> Last updated: 2026-02-21
> Single-file HTML implementation — zero external dependencies (except Google Fonts)

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

### 1.3 Border Radius

| Token              | Value | Usage                           |
|--------------------|-------|---------------------------------|
| `--radius-card`    | 8px   | Cards, modals, popovers        |
| `--radius-column`  | 12px  | Lane containers                 |
| `--radius-button`  | 6px   | Buttons, inputs, dropdowns      |
| `--radius-tag`     | 4px   | Tags, badges, category crumbs   |

### 1.4 Shadows

| Token                  | Value                              | Usage             |
|------------------------|------------------------------------|-------------------|
| `--shadow-card`        | 0 1px 2px rgba(9,30,66,0.12)      | Card resting      |
| `--shadow-card-hover`  | 0 3px 8px rgba(9,30,66,0.18)      | Card hover        |
| `--shadow-card-drag`   | 0 5px 10px rgba(9,30,66,0.25)     | Card dragging     |
| `--shadow-header`      | 0 1px 3px rgba(0,0,0,0.08)        | Header            |
| `--shadow-dropdown`    | 0 8px 24px rgba(0,0,0,0.12)       | Dropdowns, modals |

### 1.5 Z-Index Layers

| Token         | Value | Usage                                |
|---------------|-------|--------------------------------------|
| `--z-sidebar` | 10    | Sidebar, expand button               |
| `--z-header`  | 50    | Header bar                           |
| `--z-modal`   | 200   | Modals, dropdown menus               |
| Modal overlay | 300   | `.modal-overlay` (blocks all below)  |

### 1.6 Layout Dimensions

| Token                 | Value | Description          |
|-----------------------|-------|----------------------|
| `--header-height`     | 60px  | Fixed top header     |
| `--footer-height`     | 55px  | Fixed bottom footer  |
| `--sidebar-width`     | 260px | Default sidebar      |
| Sidebar min           | 200px | Minimum resize       |
| Sidebar max           | 400px | Maximum resize       |
| `--column-width`      | 280px | Kanban lane width    |
| `--filter-bar-height` | 48px  | Filter chips bar     |

---

## 2. Color System

### 2.1 Brand

| Name             | Hex       | Usage                             |
|------------------|-----------|-----------------------------------|
| Accent Primary   | `#629584` | CTA buttons, active states, links |
| Accent Hover     | `#527D6F` | Hover on accent elements          |
| Accent Light     | `#E8F5F0` | Focus rings, light backgrounds    |

### 2.2 Backgrounds

| Name       | Hex       | Usage                 |
|------------|-----------|----------------------|
| App        | `#F8F9FB` | Page background       |
| Header     | `#FFFFFF` | Header bar            |
| Sidebar    | `#F1F3F6` | Sidebar, hover states |
| Board      | `#E8EDF2` | Board area            |
| Footer     | `#F4F5F7` | Footer bar            |
| Card       | `#FFFFFF` | Cards, modals         |
| Column     | `#F4F5F7` | Lane containers       |

### 2.3 Text

| Name      | Hex       | Usage                        |
|-----------|-----------|------------------------------|
| Primary   | `#2C3E50` | Headings, card titles, body  |
| Secondary | `#5A6B7F` | Descriptions, labels         |
| Muted     | `#8993A4` | Timestamps, placeholders     |

### 2.4 Lane Header Colors

All lane header text uses `--text-primary` (#2C3E50) for readability.

| Lane        | Background | CSS Class  |
|-------------|------------|------------|
| TODO        | `#DBEAFE`  | `.todo`    |
| In Progress | `#FEF3C7`  | `.inp`     |
| Done        | `#D1FAE5`  | `.done`    |

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

| Priority | Korean | Background | Text      | CSS Class |
|----------|--------|------------|-----------|-----------|
| Critical | 긴급   | `#FEE2E2`  | `#DC2626` | `.b-crit` |
| High     | 높음   | `#FFEDD5`  | `#C2410C` | `.b-high` |
| Medium   | 중간   | `#FEF9C3`  | `#A16207` | `.b-med`  |
| Low      | 낮음   | `#F3F4F6`  | `#6B7280` | `.b-low`  |
| Done     | 완료   | `#D1FAE5`  | `#065F46` | `.b-done` |

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

Zero external icon libraries — all icons from Lucide icon set reproduced as inline SVG paths.

---

## 4. Animation & Transitions

| Property         | Duration | Easing     | Usage                          |
|------------------|----------|------------|--------------------------------|
| Background       | 0.15s    | ease       | Buttons, nav items hover       |
| Box shadow       | 0.2s     | ease       | Card hover/drag                |
| Transform        | 0.15s    | ease       | Card lift, dropdown appear     |
| Modal appear     | 0.2s     | ease-out   | `modalIn` keyframe animation   |
| Sidebar toggle   | 0.3s    | ease       | Width transition               |
| Expand button    | 0.3s    | —          | Delayed show after collapse    |

```css
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
```

---

## 5. Responsive Behavior

- Sidebar: Resizable 200px–400px via drag handle
- Sidebar collapse: Width → 0, expand button appears at top-left (top: 12px)
- Board: Horizontal scroll for overflow lanes
- Cards: Fixed 280px column width, vertical scroll within lanes
- Modals: max-width 560px (new task) / 720px (detail), centered flex
