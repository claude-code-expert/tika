# tika Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-23

## Active Technologies

- TypeScript 5.7 (strict mode) + Next.js 15 (App Router), @dnd-kit 6.x, Drizzle ORM 0.38, Zod 3.24, NextAuth.js v5, Tailwind CSS 4 (001-kanban-board)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.7 (strict mode): Follow standard conventions

## Recent Changes

- 001-kanban-board: Added TypeScript 5.7 (strict mode) + Next.js 15 (App Router), @dnd-kit 6.x, Drizzle ORM 0.38, Zod 3.24, NextAuth.js v5, Tailwind CSS 4

<!-- MANUAL ADDITIONS START -->
## UI 구현 시 필수 참조 (HTML 프로토타입)

UI 컴포넌트를 구현하거나 수정할 때는 반드시 아래 HTML 프로토타입을 최우선 참조해야 한다.

- **http://localhost:3000/demo/index.html** — 컴포넌트 데모 허브 (개별 컴포넌트 확인)
- **http://localhost:3000/demo/tika-main.html** — 전체 화면 프로토타입

소스: `public/demo/*.html` (18개 컴포넌트 데모)

### 핵심 디자인 토큰 (COLOR.json 기준)

| 항목 | 값 |
|------|-----|
| 액센트 색상 | `#629584` (그린톤, 파랑 아님) |
| 앱 배경 | `#F8F9FB` |
| 보드 배경 | `#E8EDF2` |
| 사이드바 배경 | `#F1F3F6` |
| TODO 칼럼 헤더 | `#DBEAFE` (라이트 블루) |
| In Progress 칼럼 헤더 | `#FEF3C7` (라이트 옐로우) |
| Done 칼럼 헤더 | `#D1FAE5` (라이트 그린) |
| 텍스트 Primary | `#2C3E50` |
| 폰트 | Plus Jakarta Sans, Noto Sans KR |

### 레이아웃 구조 (필수 준수)

```
Header (60px) + [Sidebar (260px) + Board 영역] + Footer (55px)
```

자세한 색상/치수: `docs/front/COLOR.json`, `docs/front/DESIGN_SYSTEM.md` 참조
<!-- MANUAL ADDITIONS END -->
