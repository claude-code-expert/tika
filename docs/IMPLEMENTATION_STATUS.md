# Tika - 구현 현황 및 남은 업무

> 최종 점검일: 2026-02-27 (SCR-006 완료)
> 기준: Phase 1 (v0.1.0) + Phase 2 (v0.2.0) 범위

---

## 1. 기능별 구현 현황 요약

| 구분 | 완료 | 미연결 | 미구현 | 비고 |
|------|:----:|:------:|:------:|------|
| 백엔드 (API + DB) | 16/16 | — | — | 전 엔드포인트 구현 완료 |
| 프론트엔드 컴포넌트 | 24/24 | 1 | — | FilterBar 컴포넌트 미사용 |
| 커스텀 훅 | 3/3 | — | — | useTickets/useLabels/useIssues |
| UI 기능 연결 | 12/12 | 0 | — | Phase 1+2 + SCR-006 전 기능 연결 완료 |

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

### 3-1. Phase 2 완료 항목

#### T-006: 모바일 반응형 대응 — ✅ 완료 (2026-02-27)

| 항목 | 구현 내용 |
|------|-----------|
| 사이드바 모바일 드로어 | `position: fixed` + `translateX` 슬라이드인, 백드롭 오버레이 |
| 헤더 햄버거 메뉴 | 768px 미만에서 태그라인 숨김 + 햄버거 버튼 |
| 새 업무 버튼 | 모바일에서 원형 `+` 아이콘으로 축소 |
| 모달 Bottom Sheet | 모바일에서 화면 하단 슬라이드업 (둥근 상단 모서리) |
| 보드 가로 스크롤 | Board.tsx의 `overflowX: auto` (기존 구현 활용) |
| 터치 타겟 | 햄버거 버튼 44px, 사이드바 닫기 버튼 44px |
| 필터 바 | 모바일 chip 높이 36px, overflow-x: auto |

**수정된 파일**: `Header.tsx`, `Sidebar.tsx`, `AppShell.tsx`, `Modal.tsx`, `globals.css`, `jest.setup.ts`

---

### 3-2. 완료된 항목 (Phase 1 + Phase 2)

| 항목 | 상태 | 완료일 |
|------|:----:|--------|
| T-001: 필터 칩 기능 연결 | ✅ | 2026-02-25 |
| T-002: 라벨 필터 연결 | ✅ | 2026-02-25 |
| T-003: 티켓 모달 이슈/담당자 편집 | ✅ | 2026-02-25 |
| T-004: 검색 기능 | ✅ | 2026-02-25 |
| T-005: 시드 데이터 보강 | ✅ | 2026-02-25 |
| T-007: 알림 벨 드롭다운 (FR-104) | ✅ | 2026-02-26 |
| T-008: 설정 페이지 | ✅ | 2026-02-25 |
| T-009: 티켓 복제 | ✅ | 2026-02-25 |
| FR-102: 알림 채널 설정 | ✅ | 2026-02-25 |
| FR-103: 마감일 D-1 알림 | ✅ | 2026-02-26 |
| FR-104: 알림 내역 | ✅ | 2026-02-26 |
| FR-105: 라벨 확장 (20개 제한) | ✅ | 2026-02-25 |
| FR-106: 댓글 | ✅ | 2026-02-26 |
| FR-107: 고급 필터 (우선순위+날짜범위) | ✅ | 2026-02-26 |
| T-006: 모바일 반응형 | ✅ | 2026-02-27 |

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
│  5단계: 모바일 반응형 (T-006)                 │  ✅ 완료
│  6단계: 알림/설정/복제 (T-007~009)            │  ✅ 완료
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
