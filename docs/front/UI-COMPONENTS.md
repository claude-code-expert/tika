# UI 컴포넌트 & 화면 명세 — HTML 프로토타입

> **최종 업데이트:** 2026-02-25
> **소스 경로:** `public/demo/*.html`, `public/demo/team-common.css`
> **데모 허브:** `http://localhost:3000/demo/index.html`

---

## 목차

1. [파일 인벤토리](#1-파일-인벤토리)
2. [공통 디자인 토큰](#2-공통-디자인-토큰)
3. [공통 레이아웃 구조](#3-공통-레이아웃-구조)
4. [개별 UI 컴포넌트 (9개)](#4-개별-ui-컴포넌트)
5. [풀스크린 페이지 (11개)](#5-풀스크린-페이지)
6. [팀 페이지 (5개)](#6-팀-페이지)
7. [인터랙션 & 애니메이션 규격](#7-인터랙션--애니메이션-규격)
8. [컬러 시스템 참조표](#8-컬러-시스템-참조표)

---

## 1. 파일 인벤토리

### 개별 UI 컴포넌트 (9개)

| 파일 | 라인수 | 역할 |
|------|--------|------|
| `button.html` | 397 | 버튼 4 variant × 3 size × 상태 |
| `badge.html` | 320 | 뱃지 (우선순위, 상태, 라벨, 이슈타입, 마감일, 체크리스트) |
| `avatar.html` | 444 | 아바타 5 size + 그룹 스택 |
| `ticket-card.html` | 683 | 티켓 카드 해부도 (정상/지연/완료) |
| `confirm-dialog.html` | 568 | 확인 다이얼로그 3종 (Danger/Warning/Info) |
| `filter-bar.html` | 779 | 칩 기반 필터 바 + 라벨 드롭다운 |
| `label-selector.html` | 629 | 라벨 선택기 + 커스텀 생성 (최대 5개) |
| `checklist.html` | 475 | 체크리스트 CRUD + 진행률 바 |
| `breadcrumb.html` | 926 | 이슈 계층 브레드크럼 (Goal→Story→Feature→Task) |

### 풀스크린 페이지 (11개)

| 파일 | 라인수 | 역할 |
|------|--------|------|
| `index.html` | 495 | 데모 허브 (iframe 로더, 전체 네비게이션) |
| `board.html` | 1697 | 칸반 보드 (4칼럼: Backlog/TODO/In Progress/Done) |
| `tika-main.html` | 1728 | 메인 보드 v2 (대안 레이아웃) |
| `modal-new.html` | 1006 | 새 티켓 생성 모달 |
| `modal-detail.html` | 1124 | 티켓 상세 보기 모달 |
| `new-task-modal.html` | 500 | 생성 모달 (대안) |
| `detail-modal.html` | 308 | 상세 모달 (대안) |
| `landing.html` | 381 | 랜딩 페이지 (비인증) |
| `login.html` | 215 | 로그인 페이지 (Google OAuth) |
| `settings.html` | 794 | 설정 (일반/알림/라벨/멤버 4탭) |
| `notifications.html` | 273 | 알림 내역 리스트 |

### 팀 페이지 (5개 + 공통 CSS 1개)

| 파일 | 라인수 | 역할 |
|------|--------|------|
| `team-common.css` | 98 | 팀 페이지 공유 CSS 변수 & 레이아웃 |
| `team.html` | 1227 | 팀 대시보드 (스프린트, 차트, Goal, WBS, 멤버, MCP) |
| `team-analytics.html` | 699 | 분석 차트 (번다운+CFD 좌우배치, 벨로시티, Cycle Time, 타입분포, 라벨분석) |
| `team-wbs.html` | 791 | WBS 간트 차트 (3패널: 항목/일정/메타) |
| `team-members.html` | 339 | 멤버 일감 (카드, 작업목록, 히트맵) |
| `team-burndown.html` | 371 | 번다운 차트 (레거시, team-analytics에 통합됨) |

---

## 2. 공통 디자인 토큰

### 타이포그래피

| 용도 | 폰트 | 크기 | 굵기 |
|------|------|------|------|
| Display (제목) | Plus Jakarta Sans | H1: 20px, H2: 16px | 700 (Bold) |
| Body (본문) | Noto Sans KR | Body1: 14px, Body2: 12px | 400~600 |
| Small (캡션) | Noto Sans KR | 11px | 400~500 |

### 색상 팔레트

| 항목 | 값 | 용도 |
|------|-----|------|
| 액센트 Primary | `#629584` | 주요 액션, 활성 상태 |
| 액센트 Hover | `#527D6F` | 호버 상태 |
| 액센트 Light | `#E8F5F0` | 선택 배경 |
| 앱 배경 | `#F8F9FB` | 전체 배경 |
| 카드 배경 | `#FFFFFF` | 카드, 헤더 |
| 보드 배경 | `#E8EDF2` | 보드 영역 |
| 사이드바 배경 | `#F1F3F6` | 사이드바, 칼럼 |
| 텍스트 Primary | `#2C3E50` | 주요 텍스트 |
| 텍스트 Secondary | `#5A6B7F` | 보조 텍스트 |
| 텍스트 Muted | `#8993A4` | 비활성 텍스트 |
| Border Light | `#DFE1E6` | 카드/섹션 테두리 |
| Border Medium | `#C4C9D1` | 강조 테두리 |

### 간격 체계

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--sp-xs` | 4px | 아이콘 간격 |
| `--sp-sm` | 8px | 뱃지 내부 패딩 |
| `--sp-md` | 12px | 카드 내부 간격 |
| `--sp-lg` | 16px | 섹션 간격 |
| `--sp-xl` | 24px | 대블록 간격 |

### 둥근 모서리

| 토큰 | 값 | 대상 |
|------|-----|------|
| `--radius-tag` | 4px | 태그, 뱃지 |
| `--radius-button` | 6px | 버튼, 아이콘 |
| `--radius-card` | 8px | 카드 |
| `--radius-column` | 12px | 칼럼, 큰 컨테이너 |
| (pill) | 20px | 칩, 필터, 아바타 |

### 그림자

| 토큰 | 값 | 대상 |
|------|-----|------|
| `--shadow-card` | `0 1px 2px rgba(9,30,66,0.12)` | 기본 카드 |
| `--shadow-card-hover` | `0 3px 8px rgba(9,30,66,0.18)` | 호버 카드 |
| `--shadow-header` | `0 1px 3px rgba(0,0,0,0.08)` | 헤더 |
| `--shadow-dropdown` | `0 8px 24px rgba(0,0,0,0.12)` | 드롭다운 |

---

## 3. 공통 레이아웃 구조

```
┌─────────────────── Header (60px) ───────────────────┐
│ [Logo]  [Search 300px]  [+새 티켓] [알림] [설정] [아바타] │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │ Tab Bar                                   │
│ (240px)  ├──────────────────────────────────────────┤
│          │                                           │
│ 메뉴     │  Content Area (스크롤)                    │
│ ────     │                                           │
│ 대시보드 │  페이지별 콘텐츠                          │
│ 칸반보드 │                                           │
│ 멤버관리 │                                           │
│ 스프린트 │                                           │
│ WBS      │                                           │
│ 분석차트 │                                           │
│ ────     │                                           │
│ 연동     │                                           │
│ MCP 설정 │                                           │
│ 알림내역 │                                           │
├──────────┴──────────────────────────────────────────┤
│ Footer (55px) — MCP 연결 상태, 버전                  │
└─────────────────────────────────────────────────────┘
```

### 공통 CSS 클래스 (team-common.css)

| 클래스 | 역할 |
|--------|------|
| `.app` | 루트 flex 컨테이너 (100vh) |
| `.header` | 상단 고정 바 (z-index: 50) |
| `.sidebar` | 좌측 네비게이션 (overflow-y: auto) |
| `.nav-item` / `.nav-item.active` | 사이드바 메뉴 항목 |
| `.tab-bar` / `.tab.active` | 콘텐츠 영역 탭 바 |
| `.content` | 메인 콘텐츠 영역 (flex:1) |
| `.page-content` | 스크롤 가능 콘텐츠 |
| `.footer` | 하단 상태 바 |
| `.btn-new` | 녹색 주요 액션 버튼 |
| `.icon-btn` | 아이콘 전용 버튼 (36×36) |
| `.chip` / `.chip.on` | 필터 칩 (pill 형태) |
| `.demo-info` | 하단 고정 데모 라벨 |

---

## 4. 개별 UI 컴포넌트

### 4.1 Button (`button.html`)

4가지 variant, 3가지 size, 다중 상태를 지원하는 범용 버튼.

**Variant:**

| variant | 배경 | 텍스트 | 용도 |
|---------|------|--------|------|
| `primary` | `#629584` | white | 주요 액션 (저장, 생성) |
| `secondary` | transparent + border | `#5A6B7F` | 보조 액션 (취소) |
| `danger` | `#DC2626` | white | 위험 액션 (삭제) |
| `ghost` | transparent | `#5A6B7F` | 최소 강조 |

**Size:**

| size | 높이 | 폰트 | 패딩 |
|------|------|------|------|
| `sm` | 28px | 11px | 0 8px |
| `md` | 34px | 13px | 0 14px |
| `lg` | 40px | 14px | 0 20px |

**상태:** default, hover, active, loading (스피너 `@keyframes spin 0.6s`), disabled (opacity 0.45)

**CSS 클래스:** `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.btn-sm`, `.btn-md`, `.btn-lg`, `.btn-loading`, `.btn-disabled`

---

### 4.2 Badge (`badge.html`)

다양한 컨텍스트의 상태 표시 뱃지.

**우선순위 뱃지 (`.badge-priority`, 22px):**

| 클래스 | 배경 | 텍스트색 | 라벨 |
|--------|------|----------|------|
| `.priority-critical` | `#FEE2E2` | `#991B1B` | CRITICAL |
| `.priority-high` | `#FFEDD5` | `#9A3412` | HIGH |
| `.priority-medium` | `#FEF9C3` | `#854D0E` | MEDIUM |
| `.priority-low` | `#F3F4F6` | `#6B7280` | LOW |

**상태 뱃지 (`.badge-status`):**

| 클래스 | 배경 | 텍스트색 |
|--------|------|----------|
| `.status-backlog` | `#F1F3F6` | `#6B7280` |
| `.status-todo` | `#DBEAFE` | `#1E40AF` |
| `.status-in-progress` | `#FEF3C7` | `#92400E` |
| `.status-done` | `#D1FAE5` | `#065F46` |

**이슈 타입 뱃지 (`.badge-issue`):**

| 클래스 | 배경 | 텍스트색 | 약자 |
|--------|------|----------|------|
| `.issue-goal` | `#E0E7FF` | `#4338CA` | G / Goal |
| `.issue-story` | `#DBEAFE` | `#1D4ED8` | S / Story |
| `.issue-feature` | `#D1FAE5` | `#065F46` | F / Feature |
| `.issue-task` | `#F3F4F6` | `#6B7280` | T / Task |

**마감일 뱃지 (`.badge-due`):** `.due-normal`, `.due-soon` (노란), `.due-overdue` (빨간), `.due-done` (취소선)

**체크리스트 뱃지 (`.badge-checklist`):** 체크 개수 표시, `.done` 시 녹색

---

### 4.3 Avatar (`avatar.html`)

이니셜 기반 원형 아바타 + 그룹 스태킹.

**Size:**

| 클래스 | 크기 | 용도 |
|--------|------|------|
| `.avatar-xs` | 20px | 인라인 텍스트 옆 |
| `.avatar-sm` | 24px | 카드 내 담당자 |
| `.avatar-md` | 32px | 헤더, 목록 |
| `.avatar-lg` | 40px | 멤버 카드 |
| `.avatar-xl` | 56px | 프로필 |

**그룹 (`.avatar-group`):** `margin-left: -8px`로 겹침 표현, `.avatar-overflow` (+N 표시)

**인터랙티브:** 이니셜 입력 (2자 제한), 12색 팔레트 선택, 실시간 프리뷰

---

### 4.4 TicketCard (`ticket-card.html`)

칸반 보드에서 사용하는 드래그 가능한 티켓 카드.

```
┌─ .ticket-card (280px) ─────────────────────┐
│ [이슈타입 태그]  [라벨 뱃지 ×N]            │
│                                             │
│ 카드 제목 (13px, bold, 2줄 clamp)          │
│ 설명 미리보기 (11px, 2줄 clamp)            │
│                                             │
│ [우선순위] [마감일] [체크리스트] · [아바타] │
└─────────────────────────────────────────────┘
```

**특수 상태:**
- `.ticket-card.overdue` — 2px solid `#DC2626` 테두리
- `.ticket-card.done` — opacity 0.75, 제목 취소선

**CSS 클래스:** `.ticket-card`, `.issue-tag`, `.label-row`, `.card-title`, `.card-desc`, `.card-footer`, `.priority-badge`, `.due-badge`, `.checklist-badge`

---

### 4.5 ConfirmDialog (`confirm-dialog.html`)

파괴적 작업 전 확인용 모달 다이얼로그 3종.

| 타입 | 아이콘 색상 | 용도 | 확인 버튼 |
|------|------------|------|-----------|
| Danger (`.icon-danger`) | 빨강 | 삭제 확인 | `.btn-danger` |
| Warning (`.icon-warning`) | 노랑 | 상태 변경 확인 | `.btn-primary` |
| Info (`.icon-info`) | 파랑 | 저장 확인 | `.btn-primary` |

**구조:** `.modal-overlay` (fixed, z-1000) → `.dialog-panel` (max-width 400px) → 아이콘 + 제목 + 본문 + 버튼

**인터랙션:** ESC 키 닫기, 오버레이 클릭 닫기, 확인 시 토스트 알림

---

### 4.6 FilterBar (`filter-bar.html`)

칸반 보드 상단의 칩 기반 필터 시스템.

```
┌─ .filter-bar (48px, 가로 스크롤) ─────────────────────────────┐
│ [전체][CRITICAL][HIGH] | [TODO][In Progress] | [라벨▼] [초기화]│
└───────────────────────────────────────────────────────────────┘
```

**구성요소:**
- **Quick 필터** (우선순위): 라디오 방식 (하나만 선택)
- **Toggle 필터** (상태): 독립 토글 (다중 선택)
- **라벨 드롭다운**: `.label-dropdown` (position absolute, z-200)
- **Active 필터 칩**: 선택된 라벨 표시 + × 제거 버튼

**CSS 클래스:** `.filter-bar`, `.chip`, `.chip.active`, `.chip-count`, `.chip-divider`, `.label-dropdown`, `.label-chip`, `.active-label-chip`

---

### 4.7 LabelSelector (`label-selector.html`)

티켓에 라벨을 추가/제거하는 인라인 선택기.

**기능:**
- 기존 라벨 목록에서 선택 (드롭다운)
- 커스텀 라벨 생성 (이름 + 17색 팔레트)
- **최대 5개** 제한 (초과 시 툴팁)
- 중복 이름 검증 (최대 20자)

**구조:** `.label-area` (flex wrap) → `.label-badge` (색상 pill + × 제거) + `.add-label-btn` (점선 테두리)

**CSS 클래스:** `.label-badge`, `.remove-btn`, `.label-area`, `.add-label-btn`, `.label-dropdown`, `.dropdown-chip`, `.color-swatch`, `.creator-input`, `.preview-badge`

---

### 4.8 ChecklistSection (`checklist.html`)

티켓 내 체크리스트 항목 CRUD.

```
┌─ 체크리스트 (3/5) ──────────── [+] ──┐
│ ■■■■■■■■■░░░░░ 60%                   │
│ ☑ 항목 1 (취소선)               [×]   │
│ ☑ 항목 2 (취소선)               [×]   │
│ ☐ 항목 3                        [×]   │
│ ☐ 항목 4                        [×]   │
│ ☐ 항목 5                        [×]   │
│ [+ 새 항목 입력...]            [추가]  │
└───────────────────────────────────────┘
```

**인터랙션:** 체크 토글, Enter 키 추가, × 삭제 (확인 없음), 진행률 자동 계산

**CSS 클래스:** `.checklist-header`, `.checklist-count`, `.progress-track`, `.progress-fill`, `.checklist-item`, `.item-text.done`, `.delete-item-btn`, `.add-item-input`, `.empty-state`

---

### 4.9 IssueBreadcrumb (`breadcrumb.html`)

이슈 계층 구조를 보여주는 브레드크럼.

```
[G] MVP 출시 › [S] 칸반 보드 구축 › [F] 드래그 앤 드롭 › [T] @dnd-kit 셋업
```

**타입 뱃지 색상:**
- Goal: 보라 (`#E0E7FF` / `#4338CA`)
- Story: 파랑 (`#DBEAFE` / `#1D4ED8`)
- Feature: 초록 (`#D1FAE5` / `#065F46`)
- Task: 회색 (`#F3F4F6` / `#6B7280`)

**CSS 클래스:** `.breadcrumb`, `.bc-item`, `.bc-sep`, `.type-badge.goal/story/feature/task`

---

## 5. 풀스크린 페이지

### 5.1 데모 허브 (`index.html`)

모든 데모를 iframe으로 로드하는 네비게이션 허브.

**구조:** 좌측 사이드바 (220px) + 우측 프리뷰 영역 (iframe)

**모드:**
- `mode-screen` — 전체 너비, 페이지 프리뷰
- `mode-doc` — 패딩 배경, 그림자 카드

**JS 함수:** `loadPage(file, element, label, type)` — iframe src 변경 + 활성 메뉴 전환

---

### 5.2 칸반 보드 (`board.html`)

4칼럼 칸반 보드 — Backlog / TODO / In Progress / Done.

```
┌─ Backlog (2) ─┐┌─ TODO (3) ────┐┌─ In Progress (4)─┐┌─ Done (15) ──┐
│ [TicketCard]   ││ [TicketCard]  ││ [TicketCard]      ││ [TicketCard] │
│ [TicketCard]   ││ [TicketCard]  ││ [TicketCard]      ││ [TicketCard] │
│                ││ [TicketCard]  ││ [TicketCard]      ││ ...          │
│                ││               ││ [TicketCard]      ││              │
└────────────────┘└───────────────┘└───────────────────┘└──────────────┘
```

**핵심 CSS:**
- `.board-area` — flex-grow, overflow-auto
- `.columns-container` — flex, gap 16px
- `.column` — 280px 고정 너비, flex-shrink: 0
- `.column-header` — sticky, 칼럼 색상 배경 (TODO=파랑, InProgress=노랑, Done=초록)
- `.ticket-card` — 드래그 가능 카드

**인터랙션:** 드래그 앤 드롭 (프로덕션에서 @dnd-kit 사용), 칼럼 간 이동, 순서 변경, 카드 클릭 → 상세 모달

---

### 5.3 메인 보드 v2 (`tika-main.html`)

`board.html`의 대안 레이아웃. 동일한 4칼럼 칸반 구조에 전체 프로토타입 레이아웃 적용.

---

### 5.4 새 티켓 모달 (`modal-new.html`)

티켓 생성 폼 모달.

**폼 필드:**
- 제목 (필수, 1~200자)
- 설명 (선택, 최대 1000자)
- 이슈 타입 (Goal/Story/Feature/Task)
- 우선순위 (LOW/MEDIUM/HIGH/CRITICAL)
- 상태 (BACKLOG/TODO/IN_PROGRESS/DONE)
- 담당자 선택
- 마감일 (datepicker)
- 라벨 선택 (LabelSelector)
- 체크리스트 (ChecklistSection)
- 상위 이슈 연결

**인터랙션:** Zod 유효성 검증, ESC 닫기, 생성 후 보드 갱신

---

### 5.5 티켓 상세 모달 (`modal-detail.html`)

기존 티켓 조회/수정 모달.

**구성:** 좌측 (제목, 설명, 체크리스트, 라벨) + 우측 사이드바 (상태, 우선순위, 담당자, 마감일, 이슈타입)

---

### 5.6 로그인 (`login.html`)

인증 페이지. Google OAuth 버튼 + 이메일/비밀번호 폼 (비활성 상태).

---

### 5.7 랜딩 (`landing.html`)

비인증 사용자용 마케팅 페이지. Hero 섹션, 기능 소개, CTA 버튼.

---

### 5.8 설정 (`settings.html`)

4개 탭 구성 설정 페이지.

| 탭 | 내용 |
|----|------|
| 일반 | 워크스페이스 이름, 언어, 테마 |
| 알림 | 이메일/Slack/웹훅 채널 설정 |
| 라벨 | 라벨 CRUD (색상, 이름) |
| 멤버 | 초대, 역할 관리 (Owner/Member/Viewer) |

**JS 함수:** `switchSection(sectionId, navEl)` — 탭 전환

---

### 5.9 알림 (`notifications.html`)

시간순 활동 로그 리스트. 아이콘 타입별 색상 분류 (Slack=보라, MCP=파랑, System=노랑, Push=초록).

---

## 6. 팀 페이지

### 6.0 공통 네비게이션 (전 팀 페이지 동일)

**사이드바 메뉴:**

| 메뉴 | 링크 | 아이콘 |
|------|------|--------|
| 대시보드 | `team.html` | 활동 그래프 |
| 칸반 보드 | `team.html` | 4칸 그리드 |
| 멤버 관리 | `team-members.html` | 사람 + 그룹 |
| 스프린트 | `team.html` | 시계 |
| WBS | `team-wbs.html` | 리스트 |
| 분석 차트 | `team-analytics.html` | 꺾은선 그래프 |
| MCP 설정 | `team.html` | 서버 |
| 알림 내역 | `team.html` | 종 |

**탭 바:**

| 탭 | 링크 |
|----|------|
| 대시보드 | `team.html` |
| WBS | `team-wbs.html` |
| 멤버 일감 | `team-members.html` |
| 분석 차트 | `team-analytics.html` |

---

### 6.1 팀 대시보드 (`team.html`)

팀 전체 상황을 한눈에 보여주는 메인 대시보드.

#### 섹션 구성 (상→하 순서)

**1) 스프린트 배너**
- CSS: `.sprint-banner`, `.sprint-info`, `.sprint-name`, `.sprint-meta`, `.sprint-progress`
- 내용: 스프린트 이름, 기간, 티켓수, 멤버수, D-day, 진행률 바

**2) 차트 Row 1 — 번다운 + 도넛 (기존)**
- CSS: `.chart-row` (2칼럼 그리드), `.chart-card`, `.chart-card-header`, `.chart-card-body`
- 좌: 번다운 차트 (SVG — 이상선 점선 + 실제선 실선)
- 우: 진척률 도넛 (SVG 원형 — Done/InProgress/TODO/Backlog)
- `.donut-wrap`, `.donut`, `.donut-label`, `.donut-pct`, `.donut-legend`, `.legend-item`

**3) 차트 Row 2 — 생성vs완료 + 우선순위 매트릭스 (격리 CSS)**
- CSS: `.dash-extra-row` (2칼럼 그리드), `.dash-card`, `.dash-card-hd`, `.dash-card-bd`
- 좌: 생성 vs 완료 추이 (SVG 듀얼 라인 차트 — 파랑=생성, 초록=완료)
  - `.trend-chart-wrap` (width:100%, flex:1)
- 우: 우선순위 × 상태 분포 (HTML 테이블 + 스택 바)
  - `.matrix-table`, `.matrix-cell`, `.priority-label`, `.priority-dot`, `.matrix-bar`

> **CSS 격리:** Row 2의 카드는 `.chart-card`가 아닌 `.dash-card` 계열 사용. 기존 `.chart-card-body`의 `min-height:180px`, `align-items:flex-end`와 충돌 방지.

**4) 마감일 오버뷰**
- CSS: `.deadline-card` (독립 카드 — 자체 격리)
- `.deadline-header`, `.deadline-stats`, `.deadline-body`
- 타임라인: `.dl-track`, `.dl-dot` (overdue=빨강, today=초록, upcoming=파랑), `.dl-today-mark`
- 지연 목록: `.overdue-list`, `.overdue-item` (빨간 테두리 배경)
- 예정 목록: `.upcoming-list`, `.upcoming-item`

**5) Goal 진행률 (클릭 → 하위 티켓 펼침)**
- CSS: `.goal-row` (3칼럼 그리드), `.goal-card` (cursor:pointer)
- `.goal-card.selected` — 액센트 테두리
- `.goal-detail` — `display:none`, `.goal-detail.open` → `display:block` + slideDown 애니메이션
- 하위 항목: `.gd-item` (flex row), `.gd-type` (Story/Feature/Task 뱃지), `.gd-status`

**인터랙션 (JS, DOMContentLoaded):**
```
Goal 카드 클릭 → data-goal 속성으로 패널 ID 매칭
→ 모든 패널 닫기 → 해당 패널 .open 추가
→ scrollIntoView 스크롤
닫기 버튼 → data-close 속성으로 패널 닫기
```

**6) WBS 트리**
- CSS: `.wbs-card`, `.wbs-tree`, `.wbs-node`, `.wbs-indent`, `.wbs-pipe`
- 계층 구조: `├─` / `└─` 파이프 문자로 트리 표현
- `.wbs-type` (goal/story/feature/task 색상), `.wbs-status`, `.wbs-pct`

**7) 하단 Row — 구성원 + MCP**
- CSS: `.bottom-row` (2칼럼), `.member-row` (4칼럼 그리드)
- 멤버 카드: `.member-card`, `.member-avatar`, `.member-stats` (할당/완료/Workday)
- MCP: `.mcp-card`, `.mcp-server` (아이콘 + 이름 + 상태 + 토글 스위치)

**8) 하단 Row 2 — 알림**
- CSS: `.notif-card`, `.notif-item` (타입별 아이콘: Slack/MCP/System/Push)

---

### 6.2 분석 차트 (`team-analytics.html`)

번다운 차트와 분석 지표를 통합한 차트 전용 페이지.

> **`team-burndown.html` + 구 `team-analytics.html`을 통합한 결과물.**

#### 섹션 구성

**1) 스프린트 요약 (4칼럼 그리드)**
- CSS: `.sprint-row`, `.stat-card`, `.stat-value` (+`.accent`/`.warn`/`.danger`)
- 카드: 총 SP (48) / 완료 SP (30, 녹색) / 잔여 SP (18, 노란) / D-3 (빨강)

**2) 번다운 + CFD 좌우 배치 ★**
- CSS: `.two-col` (2칼럼 그리드), `.bc-card`, `.bc-card-hd`, `.bc-card-title`, `.bc-card-body`
- **좌: 번다운 차트** — SVG 700×260, 이상선(점선) + 실제선(실선) + 완료 누적(반투명 영역) + Today 마커
- **우: 누적 흐름도 (CFD)** — SVG 700×260, 4 stacked areas (Done 초록, InProgress 노랑, TODO 파랑, Backlog 회색) + WIP 어노테이션

**3) 벨로시티 + 일별 소화량 (2칼럼)**
- 좌: 스프린트 속도 비교 — `.vel-bar-group`, `.vel-bar-item` (Sprint 1~3 가로 바)
- 우: 일별 소화량 — `.daily-table` (날짜/완료/추가/잔여/소화율)

**4) 구분선** — `<hr class="section-divider">`

**5) 분석 요약 (4칼럼 그리드)**
- CSS: `.analytics-stats`, `.a-stat`, `.a-stat-val`
- 카드: 평균 Cycle Time (3.8d) / 전체 티켓 (24) / 완료율 (62%) / 지연 (2)

**6) Cycle Time + 타입 분포 (2칼럼)**
- 좌: Cycle Time 분석
  - CSS: `.a-card`, `.a-card-header`, `.a-card-body`
  - 타입별 가로 바: `.ct-row`, `.ct-track`, `.ct-fill` (Story 8.2d / Feature 4.8d / Task 2.3d)
  - 히스토그램: `.hist-row`, `.hist-bar` (1d~10d+ 분포, hover 시 값 표시)
- 우: 타입별 분포
  - `.type-row`, `.type-badge-lg` (Goal/Story/Feature/Task)
  - `.type-track`, `.type-fill`, `.type-fill-inner` (완료율 이중 바)
  - `.type-stacked` (전체 구성 비율 스택 바)

**7) 라벨 분석 (전체 너비)**
- CSS: `.a-card` (전체 너비), 내부 2칼럼 grid
- 좌: `.label-grid` → `.label-bubble` (pill 태그, 색상 dot + 이름 + 개수 + 비율)
- 우: `.lb-row` → `.lb-track` + `.lb-fill` (가로 바 차트)

---

### 6.3 WBS 간트 차트 (`team-wbs.html`)

3패널 동기화 스크롤 구조의 간트 차트.

```
┌── Left (220px) ──┬── Center (flex:1, 스크롤) ──┬── Right (260px) ──┐
│ [G] MVP 출시     │ ■■■■■□□□□□□□□□□□□□□□        │ 김지현 HIGH Done  │
│   [S] 칸반 보드  │   ████████□□□□□□□□□□□        │ 김지현 MED  Done  │
│     [F] DnD      │     ██████□□□□□□□□□□□        │ 김지현 HIGH Done  │
│       [T] 셋업   │       ████□□□□□□□□□□□        │ 이수호 MED  Done  │
│   [S] 인증       │         ████████□□□□□        │ 박하은 CRIT InP   │
│     [F] OAuth    │           ████□□□□□□□        │ 박하은 HIGH Done  │
│     [F] 세션     │               ████████       │ 박하은 HIGH TODO  │
└──────────────────┴──────────────────────────────┴───────────────────┘
```

**3패널 CSS:**
- `.gantt-wrapper` (flex, flex:1, overflow:hidden)
- `.gantt-left` (220px, flex-shrink:0, overflow-y:auto)
- `.gantt-center` (flex:1, overflow:auto, cursor:grab → grabbing)
- `.gantt-right-panel` (260px, flex-shrink:0, overflow-y:auto)

**좌측 패널 (작업 항목):**
- `.gantt-row-label` (36px 높이, 들여쓰기로 계층 표현)
- `.type-badge` (Goal/Story/Feature/Task 색상 뱃지)

**가운데 패널 (일정 그리드):**
- `.gantt-date-header` (2행: 월 + 일)
- `.gantt-day-cell` (28px 너비), `.gantt-day-cell.today` (액센트 배경)
- `.gantt-bar` (22px, 색상별 상태): `.done` 초록, `.inp` 노랑, `.todo` 파랑, `.backlog` 회색, `.overdue` 빨강
- `.bar-start`, `.bar-end`, `.bar-single` (모서리 둥글기)
- **드래그 스크롤:** mousedown/mousemove/mouseup 핸들러

**우측 패널 (메타 정보):**
- `.gantt-meta-row` (36px, 각 작업 항목에 대응)
- `.meta-assignee` (아바타 + 이름), `.priority-chip`, `.status-chip`

**동기화:** 3패널 수직 스크롤 + 행 hover 동기화 (JS)

**요약 통계:** `.gantt-summary` (5칼럼: Goal/Story/Feature/Task 수 + 전체 진행률)

---

### 6.4 멤버 일감 (`team-members.html`)

팀 멤버별 작업 할당 현황.

#### 섹션 구성

**1) 요약 통계 (5칼럼)**
- CSS: `.summary-row`, `.sum-card`, `.sum-val`
- 카드: 전체 멤버 / 평균 부하 / 최대 부하 / 완료율 / 지연 건수

**2) 멤버 카드 (2칼럼 그리드)**
- CSS: `.member-grid`, `.m-card`
- 카드 구조:
  - `.m-card-header` — 아바타(48px) + 이름 + 이메일 + 역할 뱃지 (Owner/Member/Viewer)
  - `.m-stats` (4칼럼) — 할당 / 완료 / 진행 / 지연
  - `.m-tasks` (max-height:200px 스크롤) — 작업 목록 (타입 + 제목 + 상태 + 마감일)
  - `.m-task-due.overdue` — 지연 마감일 빨간색 강조

**3) 워크로드 히트맵**
- CSS: `.heat-card`, `.heat-table`
- 멤버별 부하 바: `.heat-bar`, `.heat-bar-fill` (용량별 색상)
- `.capacity-label` (over=빨강, ok=초록, light=회색)

---

## 7. 인터랙션 & 애니메이션 규격

### 트랜지션

| 대상 | 지속시간 | 이징 |
|------|----------|------|
| 호버 (배경, 색상, 테두리) | 0.1s ~ 0.15s | ease |
| 진행률 바 | 0.3s | ease |
| 가로 바 차트 | 0.4s | ease |
| 모달/다이얼로그 등장 | 0.2s | ease |
| 카드 리프트 | 0.15s ~ 0.2s | ease |

### 키프레임 애니메이션

| 이름 | 대상 | 설명 |
|------|------|------|
| `spin` | 버튼 로딩 스피너 | 0.6s linear infinite, 360° 회전 |
| `slideDown` | Goal 디테일 패널 | 0.2s ease, opacity 0→1 + translateY -8px→0 |

### 키보드 지원

| 키 | 동작 |
|----|------|
| ESC | 모달/다이얼로그 닫기 |
| Enter | 체크리스트 항목 추가, 폼 제출 |
| Tab | 폼 필드 이동 |

### 접근성 패턴

- 아이콘 버튼: `aria-label` 필수
- 모달: `role="dialog"`, `aria-modal="true"`
- 폼 입력: `<label>` 연결
- 색상 전용 표시 + 텍스트/아이콘 병행

---

## 8. 컬러 시스템 참조표

### 우선순위

| 레벨 | 배경 | 텍스트 | dot |
|------|------|--------|-----|
| CRITICAL | `#FEE2E2` | `#991B1B` | `#DC2626` |
| HIGH | `#FFEDD5` | `#9A3412` | `#D97706` |
| MEDIUM | `#FEF9C3` | `#854D0E` | `#2563EB` |
| LOW | `#F3F4F6` | `#6B7280` | `#9CA3AF` |

### 상태

| 상태 | 배경 | 텍스트 | 간트 바 |
|------|------|--------|---------|
| BACKLOG | `#F1F3F6` | `#6B7280` | `#E5E7EB` |
| TODO | `#DBEAFE` | `#1E40AF` | `#93C5FD` |
| IN_PROGRESS | `#FEF3C7` | `#92400E` | `#FCD34D` |
| DONE | `#D1FAE5` | `#065F46` | `#86EFAC` |

### 이슈 타입

| 타입 | 배경 | 텍스트 |
|------|------|--------|
| Goal | `#E0E7FF` | `#4338CA` |
| Story | `#DBEAFE` | `#1D4ED8` |
| Feature | `#D1FAE5` | `#065F46` |
| Task | `#F3F4F6` | `#6B7280` |

### 알림 아이콘 타입

| 타입 | 배경 | 텍스트 |
|------|------|--------|
| Slack | `#E8DEF8` | `#7C3AED` |
| MCP | `#DBEAFE` | `#2563EB` |
| System | `#FEF3C7` | `#D97706` |
| Push | `#D1FAE5` | `#059669` |

### 차트 색상

| 시리즈 | 색상 | 용도 |
|--------|------|------|
| 생성 라인 | `#3B82F6` | Created vs Resolved 차트 |
| 완료 라인 | `#629584` | Created vs Resolved 차트 |
| 이상선 | `#C4C9D1` (점선) | 번다운 차트 |
| CFD Done | `#86EFAC` | 누적 흐름도 |
| CFD InProgress | `#FCD34D` | 누적 흐름도 |
| CFD TODO | `#93C5FD` | 누적 흐름도 |
| CFD Backlog | `#E5E7EB` | 누적 흐름도 |
