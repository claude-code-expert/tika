# Tika - 구현 현황 및 남은 업무

> 최종 점검일: 2026-02-25
> 기준: Phase 1 (v0.1.0) 범위

---

## 1. 기능별 구현 현황 요약

| 구분 | 완료 | 미연결 | 미구현 | 비고 |
|------|:----:|:------:|:------:|------|
| 백엔드 (API + DB) | 14/14 | — | — | 전 엔드포인트 구현 완료 |
| 프론트엔드 컴포넌트 | 21/21 | 1 | — | FilterBar 컴포넌트 미사용 |
| 커스텀 훅 | 3/3 | — | — | useTickets/useLabels/useIssues |
| UI 기능 연결 | 7/11 | 4 | — | 필터·검색·알림·설정 미연결 |

---

## 2. 완료된 기능 (Phase 1 Core)

### 2-1. 티켓 CRUD — 완료

| 항목 | 상태 | 파일 |
|------|:----:|------|
| 티켓 생성 폼 (전 필드) | ✅ | `src/components/ticket/TicketForm.tsx` |
| 티켓 상세 모달 (전 필드 편집) | ✅ | `src/components/ticket/TicketModal.tsx` |
| 티켓 삭제 (확인 다이얼로그) | ✅ | `src/components/ui/ConfirmDialog.tsx` |
| 체크리스트 CRUD | ✅ | `src/components/ticket/ChecklistSection.tsx` |
| 라벨 선택/생성 | ✅ | `src/components/label/LabelSelector.tsx` |
| 이슈 계층 연결 (Goal>Story>Feature) | ✅ | `src/components/issue/IssueBreadcrumb.tsx` |
| 담당자 배정 (자기 자신만) | ✅ | TicketForm 내 구현 |

### 2-2. 칸반 보드 — 완료

| 항목 | 상태 | 파일 |
|------|:----:|------|
| 3칼럼 보드 (TODO/In Progress/Done) | ✅ | `src/components/board/Board.tsx` |
| 칼럼 간 드래그앤드롭 | ✅ | `@dnd-kit` + `AppShell.tsx` |
| 칼럼 내 순서 변경 | ✅ | gap-based position |
| 사이드바 Backlog 표시 | ✅ | `src/components/layout/Sidebar.tsx` |
| 사이드바 ↔ 보드 드래그 | ✅ | `SortableContext` + `useDroppable` |
| 사이드바 접기/펼치기 | ✅ | 플로팅 토글 버튼 |
| 사이드바 드래그 리사이즈 (200~400px) | ✅ | Sidebar 내 구현 |

### 2-3. 티켓 카드 표시 — 완료

| 표시 항목 | 상태 | 비고 |
|-----------|:----:|------|
| 타입 뱃지 (G/S/F/T) | ✅ | |
| 제목 (1줄 말줄임) | ✅ | |
| 우선순위 뱃지 | ✅ | |
| 마감일 + 오버듀 경고 | ✅ | |
| 라벨 뱃지 (max 3 + "+N") | ✅ | |
| 체크리스트 진행률 (2/4) | ✅ | |
| 담당자 아바타 | ✅ | |
| 상위 이슈 태그 | ✅ | |

### 2-4. 인증/레이아웃 — 완료

| 항목 | 상태 | 파일 |
|------|:----:|------|
| Google OAuth 로그인 | ✅ | `src/lib/auth.ts` + `/api/auth/[...nextauth]` |
| 로그인 페이지 | ✅ | `app/login/page.tsx` |
| 아바타 드롭다운 (프로필/로그아웃) | ✅ | `src/components/layout/Header.tsx` |
| 프로필 설정 모달 (이니셜+색상) | ✅ | `src/components/layout/ProfileModal.tsx` |
| 워크스페이스 격리 | ✅ | 전 API에 workspaceId 필터 |
| 헤더 (60px) | ✅ | `src/components/layout/Header.tsx` |
| 푸터 (55px) | ✅ | `src/components/layout/Footer.tsx` |

---

## 3. 남은 업무

### 3-1. 높은 우선순위 — UI 기능 연결

#### T-001: 필터 바 기능 연결

**현재 상태**: AppShell에 "전체/이번 주 업무/일정 초과" 칩 3개가 하드코딩되어 있음. 건수 카운트는 동적이나 **클릭 시 필터링 미동작**.

**필요한 작업**:
- [ ] AppShell의 필터 칩에 `onClick` 핸들러 추가
- [ ] "이번 주 업무" 필터: 이번 주 마감 티켓만 보드에 표시
- [ ] "일정 초과" 필터: `isOverdue === true` 티켓만 표시
- [ ] "전체" 클릭 시 필터 초기화
- [ ] 활성 필터 칩 시각 피드백 (`data-active` 토글)
- [ ] `BoardContainer`에 `filteredBoard` 전달 (현재 raw `board` 사용 중)

**관련 파일**: `src/components/layout/AppShell.tsx`, `src/hooks/useTickets.ts`

**난이도**: ★★☆ (로직은 useTickets에 이미 부분 구현)

---

#### T-002: 라벨 필터 연결 (FilterBar 컴포넌트)

**현재 상태**: `src/components/ui/FilterBar.tsx` 컴포넌트가 완성되어 있으나 **아무 곳에서도 사용하지 않음**. `useTickets`에 `toggleLabel`, `clearLabels`, `filteredBoard`가 구현되어 있으나 UI에 미연결.

**필요한 작업**:
- [ ] AppShell 또는 보드 영역에 `FilterBar` 컴포넌트 배치
- [ ] `useLabels()` → 라벨 목록 fetch → FilterBar에 전달
- [ ] `useTickets().toggleLabel` → FilterBar `onLabelToggle` 연결
- [ ] `useTickets().filteredBoard` → BoardContainer에 전달
- [ ] 활성 라벨 필터 시 Sidebar Backlog도 필터 반영 여부 결정

**관련 파일**: `src/components/ui/FilterBar.tsx`, `src/components/layout/AppShell.tsx`, `src/hooks/useTickets.ts`

**난이도**: ★☆☆ (컴포넌트와 훅 모두 완성, 연결만 필요)

---

#### T-003: 티켓 모달 — 이슈/담당자 편집 기능

**현재 상태**: TicketModal에서 이슈(상위 이슈)와 담당자는 **읽기 전용 표시만** 가능. 수정 UI 미구현.

**필요한 작업**:
- [ ] 이슈 연결 변경: 이슈 검색/선택 드롭다운 추가 (TicketForm의 이슈 선택기 재사용)
- [ ] 담당자 변경: 멤버 선택 드롭다운 추가 (Phase 1은 자기 자신만)
- [ ] 이슈/담당자 해제(null) 기능

**관련 파일**: `src/components/ticket/TicketModal.tsx`

**난이도**: ★★☆ (TicketForm에서 UI 패턴 참조 가능)

---

### 3-2. 중간 우선순위 — 기능 보완

#### T-004: 검색 기능

**현재 상태**: 헤더 검색창에 `disabled` 속성 하드코딩. 검색 API 없음.

**필요한 작업**:
- [ ] `disabled` 속성 제거, 검색 입력 활성화
- [ ] 프론트엔드 검색: `board` 데이터에서 title/description 클라이언트 필터링 (Phase 1)
- [ ] 검색 결과 하이라이트 또는 필터된 보드 표시
- [ ] 검색 초기화 (X 버튼 또는 빈 입력)
- [ ] (선택) 디바운스 적용 (300ms)

**관련 파일**: `src/components/layout/Header.tsx`, `src/components/layout/AppShell.tsx`

**난이도**: ★★☆ (클라이언트 필터링으로 Phase 1 구현 시)

---

#### T-005: 시드 데이터 보강

**현재 상태**: `src/db/seed.ts`에 기본 라벨 6개만 시드. 이슈/샘플 티켓 없음.

**필요한 작업**:
- [ ] 기본 이슈 시드: Goal 1개 → Story 2개 → Feature 3개 예시
- [ ] 샘플 티켓 시드: 각 칼럼별 2~3개 (Backlog 3, TODO 2, In Progress 2, Done 1)
- [ ] 시드 티켓에 라벨, 체크리스트, 이슈 연결 포함
- [ ] 멤버는 OAuth 로그인 시 자동 생성되므로 시드 불필요

**관련 파일**: `src/db/seed.ts`

**난이도**: ★☆☆

---

#### T-006: 모바일 반응형 대응

**현재 상태**: 대부분 컴포넌트가 inline style 사용. 데스크톱(1280px+) 기준 레이아웃. 모바일 브레이크포인트 미적용.

**필요한 작업**:
- [ ] 사이드바: 모바일에서 오버레이 모드 또는 자동 숨김
- [ ] 보드: 칼럼 가로 스크롤 (좁은 화면에서)
- [ ] 모달/폼: 모바일 전체 화면 모드
- [ ] 헤더: 검색창 축소, 햄버거 메뉴
- [ ] 터치 영역 최소 44px 확보
- [ ] Tailwind 브레이크포인트 활용 (`sm:`, `md:`, `lg:`)

**관련 파일**: 전체 컴포넌트

**난이도**: ★★★

---

### 3-3. 낮은 우선순위 — Phase 1 선택 사항

#### T-007: 알림 버튼 기능

**현재 상태**: 헤더 알림 벨 아이콘 UI만 존재. Phase 2 기능이나 Phase 1에서 최소한의 안내 가능.

**필요한 작업**:
- [ ] (최소) 클릭 시 "준비 중" 툴팁 표시
- [ ] (또는) 마감 임박 티켓(D-1, D-day) 목록 드롭다운

**난이도**: ★☆☆ (최소 구현 시)

---

#### T-008: 설정 페이지 — ✅ 완료

**구현 내용**: `app/settings/page.tsx` + 4개 설정 섹션 컴포넌트 구현.

| 컴포넌트 | 기능 |
|---------|------|
| `src/components/settings/SettingsShell.tsx` | 탭 레이아웃 + 섹션 렌더링 |
| `src/components/settings/GeneralSection.tsx` | 워크스페이스 이름/설명 편집 (PATCH /api/workspaces/:id) |
| `src/components/settings/NotificationSection.tsx` | Slack/Telegram 채널 설정 (GET/PUT /api/notifications) |
| `src/components/settings/LabelSection.tsx` | 라벨 CRUD 관리 (GET/POST/PATCH/DELETE /api/labels) |
| `src/components/settings/MemberSection.tsx` | 멤버 역할 변경/제거 (PATCH/DELETE /api/members/:id) |

**새로 추가된 API**:
- `PATCH /api/workspaces/[id]` — 워크스페이스 이름/설명 수정
- `GET /api/notifications` — 알림 채널 목록 조회
- `PUT /api/notifications/[type]` — Slack/Telegram 채널 설정 저장
- `PATCH /api/members/[id]` — 역할 변경 또는 프로필 수정
- `DELETE /api/members/[id]` — 멤버 제거

**새로 추가된 테스트**: 40개 (workspaces-settings 9 + notifications 14 + members-settings 17)

---

#### T-009: 티켓 복제 기능

**현재 상태**: TicketModal에 "복제" 버튼이 "준비 중" 상태로 표시됨.

**필요한 작업**:
- [ ] 기존 티켓 데이터로 새 티켓 생성 (title에 "(복사)" 접미사)
- [ ] 체크리스트, 라벨 복제 포함
- [ ] 상태는 BACKLOG으로 초기화

**난이도**: ★★☆

---

## 4. 작업 우선순위 로드맵

```
Phase 1 잔여 작업 권장 순서:

┌─────────────────────────────────────────────┐
│  1단계: 필터 기능 연결 (T-001, T-002)         │  ← 기존 코드 연결만
│  2단계: 모달 편집 보완 (T-003)                │  ← UI 패턴 재사용
│  3단계: 검색 기능 (T-004)                     │  ← 클라이언트 필터링
│  4단계: 시드 데이터 (T-005)                   │  ← 개발/데모 편의
├─────────────────────────────────────────────┤
│  5단계: 모바일 반응형 (T-006)                 │  ← 전체 컴포넌트 수정
│  6단계: 알림/설정/복제 (T-007~009)            │  ← 선택 사항
└─────────────────────────────────────────────┘
```

---

## 5. Phase 2 예정 기능 (참고)

Phase 1 완료 후 진행할 기능. 현재 구현 범위에 포함되지 않음.

| 기능 코드 | 기능명 | 설명 |
|-----------|--------|------|
| FR-102 | 알림 채널 | Slack/Telegram 연동 |
| FR-103 | 마감일 D-1 알림 | 스케줄러 기반 자동 알림 |
| FR-104 | 알림 히스토리 | 알림 목록 조회/읽음 처리 |
| FR-105 | 라벨 확장 | 워크스페이스 단위 라벨 관리 고도화 |
| FR-106 | 댓글 | 티켓 내 스레드 댓글 |
| FR-107 | 고급 검색 | 복합 조건 검색 + 저장된 필터 |

> Phase 3~5: `docs/phase/` 디렉토리 참조
