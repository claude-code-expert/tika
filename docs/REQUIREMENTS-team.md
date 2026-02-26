# REQUIREMENTS-team.md

> Tika Team 기능 요구사항 명세서
> 작성 기준: `public/demo/team*.html` 프로토타입 분석
> 작성일: 2026-02-26
> 버전: v0.1 (draft)

---

## 목차

1. [개요](#1-개요)
2. [첫 진입 흐름 (온보딩)](#2-첫-진입-흐름-온보딩)
3. [팀 워크스페이스 개설](#3-팀-워크스페이스-개설)
4. [멤버 초대 & 조인](#4-멤버-초대--조인)
5. [권한 체계 (RBAC)](#5-권한-체계-rbac)
6. [스프린트 관리](#6-스프린트-관리)
7. [화면 명세](#7-화면-명세)
   - 7.1 팀 대시보드 (team.html)
   - 7.2 WBS / 간트 차트 (team-wbs.html)
   - 7.3 멤버 일감 (team-members.html)
   - 7.4 분석 차트 (team-analytics.html)
   - 7.5 번다운 차트 (team-burndown.html)
8. [컴포넌트 명세](#8-컴포넌트-명세)
9. [API 엔드포인트 요약](#9-api-엔드포인트-요약)
10. [DB 모델링 힌트](#10-db-모델링-힌트)
11. [구현 방안 & 아키텍처 노트](#11-구현-방안--아키텍처-노트)
12. [미구현 / 차후 검토 항목](#12-미구현--차후-검토-항목)

---

## 1. 개요

### 1.1 목적

Tika의 **Team 모드**는 개인 워크스페이스(Phase 1)에서 발전하여 여러 멤버가 동일한 워크스페이스에서 협업할 수 있는 기능을 제공한다.
팀 단위로 Goal > Story > Feature > Task 계층을 공유하고, 스프린트를 운영하며, WBS 간트 차트 / 번다운 차트 / 분석 차트를 통해 팀 진척을 가시화한다.

### 1.2 범위

| 기능 영역 | 상태 |
|-----------|------|
| 팀 워크스페이스 CRUD | ✅ 프로토타입 완성 |
| 멤버 초대 / 조인 플로우 | 🔶 일부 (초대 링크 생성 + 수락/거절 플로우) |
| RBAC 권한 (Owner / Member / Viewer) | 🔶 일부 (역할 정의 완료, 미들웨어 미완) |
| 스프린트 생성 / 관리 | 🔶 UI 표시만 존재 |
| 팀 대시보드 | ✅ 프로토타입 완성 |
| WBS 간트 차트 | ✅ 프로토타입 완성 (JavaScript 렌더링) |
| 멤버 일감 / Workday | ✅ 프로토타입 완성 |
| 분석 차트 (번다운, CFD, 속도, Cycle Time) | ✅ 프로토타입 완성 |
| 댓글 시스템 | ❌ Backlog |
| 알림 시스템 | ❌ Backlog |
| MCP 서버 연동 설정 | ❌ Backlog |

### 1.3 화면 목록 (HTML 프로토타입 기준)

| HTML 파일 | 화면명 | URL 경로 (예상) |
|-----------|--------|-----------------|
| `team.html` | 팀 대시보드 | `/team/:workspaceId` |
| `team-wbs.html` | WBS 간트 차트 | `/team/:workspaceId/wbs` |
| `team-members.html` | 멤버 일감 & Workday | `/team/:workspaceId/members` |
| `team-analytics.html` | 분석 차트 | `/team/:workspaceId/analytics` |
| `team-burndown.html` | 번다운 차트 | `/team/:workspaceId/burndown` |

---

## 2. 첫 진입 흐름 (온보딩)

### 2.1 개인 → 팀 전환 플로우

```
로그인 (Google OAuth)
  └─ 기존 워크스페이스 있음? ─── YES → 기존 개인 워크스페이스 대시보드
                               └─ NO → 온보딩 모달
                                          ├─ "개인 워크스페이스 만들기"
                                          └─ "팀 워크스페이스 만들기" → [3. 팀 워크스페이스 개설]
```

### 2.2 팀 워크스페이스 첫 진입 플로우

```
팀 워크스페이스 개설 완료
  └─ 첫 스프린트 생성 안내 (스킵 가능)
       └─ 멤버 초대 안내 (스킵 가능)
            └─ 팀 대시보드 (/team/:workspaceId)
```

### 2.3 초대받은 멤버의 조인 플로우

```
초대 링크 수신 (이메일 또는 링크 공유)
  └─ 로그인 (미로그인 시 Google OAuth)
       └─ 초대 확인 페이지
              ├─ 수락 → 워크스페이스 조인 → 팀 대시보드
              └─ 거절 → 홈
```

### 2.4 워크스페이스 전환

- 사이드바 상단 **워크스페이스 셀렉터** (ws-sel)를 클릭하면 소속된 워크스페이스 목록 드롭다운 표시
- "새 워크스페이스" 버튼으로 추가 개설 가능
- 개인 워크스페이스 ↔ 팀 워크스페이스 자유 전환

---

## 3. 팀 워크스페이스 개설

### 3.1 기능 요구사항

| ID | 요구사항 |
|----|---------|
| TW-001 | 로그인된 사용자는 팀 워크스페이스를 생성할 수 있다 |
| TW-002 | 워크스페이스 이름 (최대 50자), 아이콘 이니셜, 설명 (최대 200자, 선택)을 입력한다 |
| TW-003 | 생성자는 자동으로 **Owner** 역할이 부여된다 |
| TW-004 | 하나의 사용자는 복수의 워크스페이스에 소속될 수 있다 |
| TW-005 | 워크스페이스 이름은 중복 허용 (ID로 구분) |
| TW-006 | 워크스페이스 삭제는 Owner만 가능하며, 삭제 시 소속된 모든 데이터 CASCADE 삭제 |
| TW-007 | 워크스페이스 설정 수정 (이름, 설명, 아이콘)은 Owner만 가능 |

### 3.2 워크스페이스 타입 구분

| 타입 | 표시 라벨 | 설명 |
|------|-----------|------|
| `PERSONAL` | 개인 워크스페이스 | Phase 1 기존 기능. 1인 전용 |
| `TEAM` | 팀 워크스페이스 | 다수 멤버 협업 가능 |

### 3.3 사이드바 워크스페이스 셀렉터 UI

```
[아이콘(2자)] 프로젝트 Alpha
               팀 워크스페이스        ▼
```

- 아이콘: 워크스페이스 이름 첫 글자 (배경색: accent-primary #629584)
- 클릭 시: 드롭다운 목록 표시 (소속 워크스페이스 전체 + "새 워크스페이스" 버튼)

---

## 4. 멤버 초대 & 조인

### 4.1 초대 플로우

| ID | 요구사항 |
|----|---------|
| MI-001 | Owner / Member는 이메일 또는 초대 링크로 멤버를 초대할 수 있다 |
| MI-002 | 초대 링크는 토큰 기반 (UUID), 만료 기간 7일 |
| MI-003 | 초대 시 역할(Member / Viewer) 선택 가능 |
| MI-004 | 초대받은 사용자는 링크 클릭 → 로그인 → 수락/거절 선택 |
| MI-005 | 수락 시 members 테이블에 레코드 생성, 해당 워크스페이스 접근 활성화 |
| MI-006 | 거절 시 초대 링크 무효화 (status: REJECTED) |
| MI-007 | 이미 소속된 멤버에게 초대 불가 (중복 방지) |
| MI-008 | Owner는 멤버를 강제 제거(Kick)할 수 있다 |
| MI-009 | Owner는 멤버 역할을 변경(Member ↔ Viewer)할 수 있다 |
| MI-010 | 본인은 워크스페이스에서 탈퇴(Leave)할 수 있다. 단, 유일한 Owner는 탈퇴 불가 |

### 4.2 초대 링크 형식

```
https://tika.app/invite/:inviteToken
```

### 4.3 초대 상태 전이

```
PENDING → ACCEPTED → (활성 멤버)
         → REJECTED → (무효)
         → EXPIRED  → (7일 초과)
```

---

## 5. 권한 체계 (RBAC)

### 5.1 역할 정의

| 역할 | 표시 | 배지 색상 | 설명 |
|------|------|-----------|------|
| `OWNER` | Owner | green (#E8F5F0 / #629584) | 워크스페이스 전체 관리 권한. 멤버 초대/제거/역할변경, 워크스페이스 삭제 |
| `MEMBER` | Member | purple (#EDE9FE / #7C3AED) | 티켓 CRUD, 멤버 초대(Viewer로만), 스프린트 조회 |
| `VIEWER` | Viewer | gray (#F3F4F6 / #6B7280) | 읽기 전용. 티켓 조회, 대시보드 조회만 가능 |

### 5.2 권한 매트릭스

| 기능 | Owner | Member | Viewer |
|------|-------|--------|--------|
| 워크스페이스 설정 수정 | ✅ | ❌ | ❌ |
| 워크스페이스 삭제 | ✅ | ❌ | ❌ |
| 멤버 초대 (Member 이하) | ✅ | ✅ | ❌ |
| 멤버 제거 | ✅ | ❌ | ❌ |
| 멤버 역할 변경 | ✅ | ❌ | ❌ |
| 스프린트 생성/수정/삭제 | ✅ | ❌ | ❌ |
| 티켓 생성 | ✅ | ✅ | ❌ |
| 티켓 수정 | ✅ | ✅ (본인 할당 우선) | ❌ |
| 티켓 삭제 | ✅ | ✅ (본인 생성) | ❌ |
| 티켓 읽기 | ✅ | ✅ | ✅ |
| 드래그앤드롭 (상태 변경) | ✅ | ✅ | ❌ |
| 라벨 생성/수정 | ✅ | ✅ | ❌ |
| 댓글 작성 | ✅ | ✅ | ❌ |
| 분석/WBS 조회 | ✅ | ✅ | ✅ |

### 5.3 구현 전략

- **미들웨어 방식**: `checkPermission(userId, workspaceId, requiredRole)` 헬퍼 함수
- API Route Handler 진입 전 권한 검사
- Viewer는 모든 쓰기 API에서 403 FORBIDDEN 반환
- 프론트엔드: 역할에 따라 버튼/폼 비활성화 또는 숨김 처리

---

## 6. 스프린트 관리

### 6.1 기능 요구사항

| ID | 요구사항 |
|----|---------|
| SP-001 | Owner는 스프린트를 생성할 수 있다 (이름, 시작일, 종료일, 목표 스토리 포인트) |
| SP-002 | 스프린트는 워크스페이스에 종속된다 |
| SP-003 | 한 번에 하나의 Active 스프린트만 존재한다 |
| SP-004 | 스프린트에 티켓을 추가/제거할 수 있다 |
| SP-005 | 스프린트 진행률은 (완료 티켓 / 전체 스프린트 티켓 × 100)으로 계산 |
| SP-006 | 스프린트 D-day를 헤더/배너에 표시 (예: D-3) |
| SP-007 | 스프린트 필터 칩으로 과거 스프린트 데이터도 조회 가능 |
| SP-008 | 스토리 포인트 필드: 티켓에 `story_points` (INT, nullable) 칼럼 추가 |

### 6.2 스프린트 상태 전이

```
PLANNED → ACTIVE → COMPLETED
                  → CANCELLED
```

### 6.3 Sprint 배너 UI (팀 대시보드 상단)

```
[ Sprint 3 — 인증 및 보드 고도화 ]
  📅 2026.02.17 — 02.28    📄 24 티켓    👤 4명    D-3
                                              ████████░░  15 / 24 완료 (62%)
```

---

## 7. 화면 명세

### 7.1 팀 대시보드 (`team.html`)

**레이아웃**: Header(60px) + [Sidebar(240px) + Content] + Footer(55px)

#### 헤더

| 요소 | 설명 |
|------|------|
| 로고 (Tika) | 홈 링크 |
| Team 뱃지 | `#EDE9FE` bg / `#7C3AED` text — 팀 모드 식별 |
| 검색창 | 300px 너비, placeholder: "티켓, 멤버, 이슈 검색…" |
| 새 티켓 버튼 | accent-primary (#629584), 새 티켓 생성 모달 트리거 |
| 알림 벨 | 빨간 dot badge (미읽은 알림 존재 시) |
| 설정 아이콘 | 설정 페이지 링크 |
| 사용자 아바타 | 이니셜 + 고유 배경색, hover 시 border-color: accent |

#### 사이드바

| 섹션 | 항목 | 비고 |
|------|------|------|
| 워크스페이스 셀렉터 | 아이콘, 이름, 타입, chevron | 클릭 → 워크스페이스 전환 드롭다운 |
| 메뉴 | 대시보드 (cnt: 알림 수) | active 시 accent-light bg |
| 메뉴 | 칸반 보드 (cnt: 티켓 수) | |
| 메뉴 | 멤버 관리 (cnt: 멤버 수) | |
| 메뉴 | 스프린트 | |
| 메뉴 | WBS | |
| 메뉴 | 분석 차트 | |
| 연동 | MCP 설정 | |
| 연동 | 알림 내역 (cnt: 미읽은 수) | |
| 워크스페이스 | 새 워크스페이스 (accent color) | |

#### 탭 바

```
[대시보드*] [WBS] [멤버 일감] [분석 차트]      [Sprint 3 ●] [Sprint 2]
```

#### 대시보드 콘텐츠 영역 (스크롤 가능)

| 섹션 | 컴포넌트 | 설명 |
|------|---------|------|
| ① Sprint 배너 | `SprintBanner` | 스프린트 이름, 날짜, 티켓 수, 멤버 수, D-day, 진척 바 |
| ② 차트 2열 | `BurndownChart` | SVG 번다운 차트 (이상선 dashed, 실제선 solid, today 마커) |
| ② 차트 2열 | `ProgressDonut` | SVG 도넛 차트 (Done/InProgress/TODO/Backlog 분포) |
| ③ 추가 차트 2열 | `TrendChart` | 생성 vs 완료 추이 (일별 꺾은선, 이중축) |
| ③ 추가 차트 2열 | `PriorityStatusMatrix` | 우선순위 × 상태 분포 테이블 + 누적 바 |
| ④ 마감일 오버뷰 | `DeadlineOverview` | 타임라인 바, 지연/오늘/다음주 카운터, 지연 티켓 리스트, 다가오는 마감 리스트 |
| ⑤ Goal 진척 | `GoalProgressRow` | Goal 카드 3개 (클릭 시 하위 항목 expandable) |
| ⑥ WBS 미니 | `WbsMiniCard` | WBS 트리 미리보기 (접기/펼치기) |
| ⑦ 구성원 | `MemberWorkloadRow` | 멤버 4명 카드 (아바타, 이름, 역할, 할당/완료/Workday, 진척 바) |
| ⑧ MCP 설정 | `McpPanel` | MCP 서버 목록 (이름, 설명, on/off 토글, 상태 dot) |
| ⑨ 알림 패널 | `NotificationPanel` | 최근 팀 알림 목록 (Slack/MCP/system/push 타입, 미읽 표시) |

---

### 7.2 WBS / 간트 차트 (`team-wbs.html`)

#### Summary Stats Row (5 cards)

| 카드 | 색상 |
|------|------|
| Goal 수 | 인디고 (#4338CA) |
| Story 수 | 블루 (#1D4ED8) |
| Feature 수 | 에메랄드 (#065F46) |
| Task 수 | 회색 (#6B7280) |
| 전체 완료율 | accent-primary |

#### 간트 차트 (`GanttChart` 컴포넌트)

**3-패널 레이아웃:**

| 패널 | 너비 | 내용 |
|------|------|------|
| Left | 220px (고정) | 작업 항목 계층 (S/F/T 타입 뱃지 + 이름, depth별 들여쓰기) |
| Center | 1fr (스크롤) | 날짜 그리드 (월/일 이중 헤더, 28px/일, 드래그 스크롤) |
| Right | 260px (고정) | 담당자(아바타+이름), 우선순위 칩, 상태 칩 |

**툴바:**
- Goal 선택 드롭다운 (워크스페이스 내 Goal 목록)
- 범례: 완료/진행중/예정/미시작/지연

**Goal info 배너:**
- Goal 이름, 기간, 전체 항목 수, 완료 항목 수, 진척률 바

**간트 바 색상:**

| 상태 | 배경 | 테두리 |
|------|------|--------|
| done | `#86EFAC` | `#22C55E` |
| inp | `#FCD34D` | `#F59E0B` |
| todo | `#93C5FD` | `#3B82F6` |
| backlog | `#E5E7EB` | `#D1D5DB` |
| overdue | `#FCA5A5` | `#EF4444` |

**인터랙션:**
- Goal 드롭다운 변경 → 간트 데이터 재렌더링
- 드래그 스크롤 (`.gantt-center`)
- 행 hover 시 3패널 동기 하이라이트

---

### 7.3 멤버 일감 (`team-members.html`)

#### Summary Row (5 KPI 카드)

| 지표 | 설명 |
|------|------|
| 팀 멤버 | 전체 멤버 수 |
| 총 할당 티켓 | 스프린트 내 할당된 티켓 합산 |
| 완료 티켓 | 완료 상태 티켓 합산 |
| 총 Workday | 모든 멤버 Workday 합산 |
| 팀 완료율 | 완료 / 전체 × 100% |

#### 워크로드 테이블 (`WorkloadHeatmap`)

| 열 | 설명 |
|----|------|
| 멤버 | 아바타 + 이름 |
| 역할 | 역할 뱃지 (Owner/Member/Viewer) |
| 할당 | 스프린트 내 할당 티켓 수 |
| 진행중 | IN_PROGRESS 티켓 수 |
| 완료 | DONE 티켓 수 |
| Workday | 완료 티켓 × 평균 처리일 환산 |
| 소화율 | 진척 바 + % 텍스트 |
| 부하 | 과부하/적정/여유 텍스트 (색상 분기) |

**부하 판정:**
- 소화율 80% 이상 → 과부하 (빨강)
- 50~79% → 적정 (accent)
- 50% 미만 → 여유 (회색)

#### 멤버 상세 카드 (2열 그리드, `MemberDetailCard`)

각 카드 구성:
1. 헤더: 아바타(48px), 이름, 이메일, 역할 뱃지
2. 스탯 4열: 할당 / 완료 / 진행중 / Workday
3. 티켓 목록 (max-height 200px, 스크롤): 타입 뱃지 + 제목 + 상태 칩 + 마감일

---

### 7.4 분석 차트 (`team-analytics.html`)

#### Sprint Summary (4 stat 카드)

| 지표 | 색상 |
|------|------|
| 총 스토리 포인트 | primary |
| 완료 포인트 | accent |
| 잔여 포인트 | warn (#F59E0B) |
| D-day | danger (#DC2626) |

#### 번다운 차트 (`BurndownChartFull`)
- 이상선 (회색 dashed), 실제선 (accent solid), 완료 누적 영역 (파랑 fill)
- Today 마커 (수직선 + 녹색 배지)
- 현재 잔여 포인트 레이블

#### 누적 흐름도 — CFD (`CumulativeFlowDiagram`)
- 4개 상태 누적 영역 (Done/InProgress/TODO/Backlog)
- 각 상태 경계선 + fill opacity
- Today 수직 마커
- 주석 (WIP 건수, Done 건수)

#### 스프린트 속도 비교 (`VelocityChart`)
- Sprint 1/2/3 가로 바 차트 (완료 스토리 포인트)
- 하단: 평균 속도 표시

#### 일별 소화량 테이블 (`DailyLogTable`)
- 날짜 / 완료(-n) / 추가(+n) / 잔여 / 소화율 바

#### Analytics Summary (4 stat 카드)
- 평균 Cycle Time, 전체 티켓 수, 전체 완료율, 지연 티켓 수

#### Cycle Time 분석 (`CycleTimeAnalysis`)
- 타입별(Story/Feature/Task) 평균 처리일 가로 바
- 완료 티켓 처리시간 히스토그램 (1d ~ 10d+)
- 최소/중앙값/최대 표시

#### 타입별 분포 (`TypeDistributionChart`)
- Goal/Story/Feature/Task 비율 및 완료율 막대
- 누적 스택 바 (전체 항목 구성 비율)

#### 라벨 분석 (`LabelAnalyticsCard`)
- 라벨 버블 (이름 + 건수 + %)
- 라벨별 가로 바 차트

---

### 7.5 번다운 차트 (`team-burndown.html`)

분석 차트(7.4)의 번다운 관련 섹션을 단독 페이지로 분리한 뷰.
탭 바: `[대시보드] [번다운 차트*] [WBS] [멤버 일감] [분석]`

포함 섹션:
- Sprint Summary (4 stat 카드)
- 메인 번다운 차트 (전체 너비)
- 스프린트 속도 비교 + 일별 소화량 테이블 (2열)
- CFD (누적 흐름도)

---

## 8. 컴포넌트 명세

### 8.1 신규 컴포넌트 목록

| 컴포넌트 | 위치 | 타입 | 설명 |
|---------|------|------|------|
| `TeamHeader` | `src/components/team/` | Client | Team 뱃지 포함 헤더 |
| `TeamSidebar` | `src/components/team/` | Client | 팀 전용 사이드바 (워크스페이스 셀렉터 포함) |
| `WorkspaceSwitcher` | `src/components/team/` | Client | 워크스페이스 전환 드롭다운 |
| `SprintBanner` | `src/components/team/` | Client | 스프린트 배너 (이름, 날짜, 진척 바) |
| `BurndownChart` | `src/components/team/charts/` | Client | SVG 번다운 차트 |
| `BurndownChartFull` | `src/components/team/charts/` | Client | 대형 번다운 차트 (분석 페이지용) |
| `ProgressDonut` | `src/components/team/charts/` | Client | SVG 도넛 차트 (상태별 분포) |
| `TrendChart` | `src/components/team/charts/` | Client | 생성 vs 완료 추이 꺾은선 차트 |
| `PriorityStatusMatrix` | `src/components/team/charts/` | Client | 우선순위 × 상태 분포 테이블 |
| `CumulativeFlowDiagram` | `src/components/team/charts/` | Client | CFD 누적 영역 차트 |
| `VelocityChart` | `src/components/team/charts/` | Client | 스프린트 속도 비교 바 차트 |
| `CycleTimeAnalysis` | `src/components/team/charts/` | Client | Cycle Time 분석 + 히스토그램 |
| `LabelAnalyticsCard` | `src/components/team/charts/` | Client | 라벨 버블 + 바 차트 |
| `TypeDistributionChart` | `src/components/team/charts/` | Client | 타입별 분포 차트 |
| `DeadlineOverview` | `src/components/team/` | Client | 마감일 타임라인 + 지연/예정 목록 |
| `GoalProgressRow` | `src/components/team/` | Client | Goal 진척 카드 3열 + expandable |
| `WbsMiniCard` | `src/components/team/` | Client | 간략 WBS 트리 |
| `GanttChart` | `src/components/team/` | Client | 3패널 간트 차트 (scroll 가능) |
| `WorkloadHeatmap` | `src/components/team/` | Client | 멤버 워크로드 테이블 |
| `MemberDetailCard` | `src/components/team/` | Client | 개별 멤버 상세 카드 |
| `McpPanel` | `src/components/team/` | Client | MCP 서버 목록 + 토글 |
| `NotificationPanel` | `src/components/team/` | Client | 팀 알림 패널 |
| `DailyLogTable` | `src/components/team/charts/` | Client | 일별 소화량 테이블 |
| `InviteModal` | `src/components/team/` | Client | 멤버 초대 모달 |
| `WorkspaceSwitchModal` | `src/components/team/` | Client | 워크스페이스 생성/전환 |
| `RoleBadge` | `src/components/ui/` | Server | Owner/Member/Viewer 역할 뱃지 |
| `TeamBadge` | `src/components/ui/` | Server | "Team" 보라 뱃지 |

### 8.2 기존 컴포넌트 확장

| 컴포넌트 | 변경 내용 |
|---------|---------|
| `Avatar` | `teamColor` prop 추가 (멤버별 고유 배경색 지원) |
| `Badge` | `role` variant 추가 (owner/member/viewer) |
| `FilterBar` | 스프린트 필터 칩 지원 추가 |

---

## 9. API 엔드포인트 요약

### 9.1 워크스페이스 API

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/workspaces` | 워크스페이스 생성 | 로그인 |
| GET | `/api/workspaces` | 내 워크스페이스 목록 | 로그인 |
| GET | `/api/workspaces/:id` | 워크스페이스 상세 | Member+ |
| PATCH | `/api/workspaces/:id` | 워크스페이스 설정 수정 | Owner |
| DELETE | `/api/workspaces/:id` | 워크스페이스 삭제 | Owner |

### 9.2 멤버 API

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/workspaces/:id/members` | 멤버 목록 조회 | Member+ |
| POST | `/api/workspaces/:id/invites` | 초대 링크 생성 | Member+ |
| GET | `/api/invites/:token` | 초대 정보 조회 (수락 전) | 비로그인 허용 |
| POST | `/api/invites/:token/accept` | 초대 수락 | 로그인 |
| POST | `/api/invites/:token/reject` | 초대 거절 | 로그인 |
| PATCH | `/api/workspaces/:id/members/:memberId` | 역할 변경 | Owner |
| DELETE | `/api/workspaces/:id/members/:memberId` | 멤버 제거 | Owner |
| DELETE | `/api/workspaces/:id/members/me` | 워크스페이스 탈퇴 | 본인 |

### 9.3 스프린트 API

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/workspaces/:id/sprints` | 스프린트 목록 | Member+ |
| POST | `/api/workspaces/:id/sprints` | 스프린트 생성 | Owner |
| PATCH | `/api/workspaces/:id/sprints/:sid` | 스프린트 수정 | Owner |
| DELETE | `/api/workspaces/:id/sprints/:sid` | 스프린트 삭제 | Owner |
| GET | `/api/workspaces/:id/sprints/:sid/stats` | 스프린트 통계 (번다운용) | Member+ |

### 9.4 팀 분석 API

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/workspaces/:id/analytics/burndown` | 번다운 데이터 | Member+ |
| GET | `/api/workspaces/:id/analytics/cfd` | CFD 데이터 | Member+ |
| GET | `/api/workspaces/:id/analytics/velocity` | 스프린트 속도 | Member+ |
| GET | `/api/workspaces/:id/analytics/cycle-time` | Cycle Time 분석 | Member+ |
| GET | `/api/workspaces/:id/analytics/labels` | 라벨 분포 | Member+ |
| GET | `/api/workspaces/:id/members/workload` | 멤버 워크로드 | Member+ |

---

## 10. DB 모델링 힌트

### 10.1 신규/수정 테이블

#### `workspaces` 테이블 확장

| 칼럼 | 타입 | 설명 |
|------|------|------|
| `type` | `VARCHAR(10)` NOT NULL DEFAULT `'PERSONAL'` | PERSONAL / TEAM |

#### `members` 테이블 확장

| 칼럼 | 타입 | 설명 |
|------|------|------|
| `role` | `VARCHAR(10)` NOT NULL DEFAULT `'MEMBER'` | OWNER / MEMBER / VIEWER |
| `invited_by` | INT FK members(id) nullable | 초대한 멤버 ID |
| `joined_at` | TIMESTAMPTZ | 조인 확정 시각 |

#### `workspace_invites` (신규)

| 칼럼 | 타입 | 제약 |
|------|------|------|
| `id` | SERIAL | PK |
| `workspace_id` | INT | FK → workspaces(id) ON DELETE CASCADE |
| `invited_by` | INT | FK → members(id) ON DELETE SET NULL |
| `token` | UUID | UNIQUE NOT NULL |
| `email` | VARCHAR(255) | nullable (이메일 초대 시) |
| `role` | VARCHAR(10) | NOT NULL DEFAULT 'MEMBER' |
| `status` | VARCHAR(10) | NOT NULL DEFAULT 'PENDING' (PENDING/ACCEPTED/REJECTED/EXPIRED) |
| `expires_at` | TIMESTAMPTZ | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() |

#### `sprints` (신규)

| 칼럼 | 타입 | 제약 |
|------|------|------|
| `id` | SERIAL | PK |
| `workspace_id` | INT | FK → workspaces(id) ON DELETE CASCADE |
| `name` | VARCHAR(100) | NOT NULL |
| `goal` | TEXT | nullable |
| `status` | VARCHAR(10) | NOT NULL DEFAULT 'PLANNED' |
| `start_date` | DATE | NOT NULL |
| `end_date` | DATE | NOT NULL |
| `story_points_total` | INT | NOT NULL DEFAULT 0 |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() |

#### `tickets` 테이블 확장

| 칼럼 | 타입 | 설명 |
|------|------|------|
| `sprint_id` | INT | nullable FK → sprints(id) ON DELETE SET NULL |
| `story_points` | INT | nullable, 스토리 포인트 |

### 10.2 인덱스 추가

```sql
idx_workspace_invites_token      → (token)         -- 초대 링크 조회
idx_workspace_invites_status     → (workspace_id, status)
idx_sprints_workspace_status     → (workspace_id, status)
idx_tickets_sprint               → (sprint_id, status, position)
idx_members_role                 → (workspace_id, role)
```

---

## 11. 구현 방안 & 아키텍처 노트

### 11.1 라우팅 구조

```
app/
├── team/
│   └── [workspaceId]/
│       ├── page.tsx              ← 팀 대시보드 (서버 컴포넌트)
│       ├── wbs/page.tsx          ← WBS 간트 차트
│       ├── members/page.tsx      ← 멤버 일감
│       ├── analytics/page.tsx    ← 분석 차트
│       └── burndown/page.tsx     ← 번다운 차트
├── invite/
│   └── [token]/page.tsx          ← 초대 수락 페이지
```

### 11.2 권한 미들웨어 패턴

```typescript
// src/lib/permissions.ts
type TeamRole = 'OWNER' | 'MEMBER' | 'VIEWER';

async function checkPermission(
  userId: string,
  workspaceId: number,
  requiredRole: TeamRole
): Promise<boolean>

// API Route 사용 예시
export async function PATCH(req, { params }) {
  const session = await auth();
  const allowed = await checkPermission(session.user.id, params.id, 'OWNER');
  if (!allowed) return NextResponse.json({ error: { code: 'FORBIDDEN' }}, { status: 403 });
  // ...
}
```

### 11.3 간트 차트 렌더링 전략

- **프로토타입**: 순수 JavaScript DOM 조작 (team-wbs.html)
- **구현 방안**: React 서버 컴포넌트에서 데이터 fetch → Client 컴포넌트(`GanttChart`)에서 날짜 계산 및 렌더링
- 날짜 그리드: `28px / day` 고정, 드래그 스크롤은 `useRef` + `onMouseDown`
- 3패널 동기 스크롤: Left/Right 고정(`position: sticky`), Center만 수평 스크롤
- 차트 라이브러리 도입 없이 직접 SVG/DOM 방식 유지 (기술 스택 규칙 준수)

### 11.4 분석 차트 데이터 설계

- 번다운 데이터: `GET /api/workspaces/:id/analytics/burndown?sprintId=:sid` → `{ dates: string[], ideal: number[], actual: number[], completed: number[] }`
- CFD 데이터: 일별 상태별 누적 티켓 수 집계
- Cycle Time: `completed_at - created_at` (영업일 기준 계산)
- Velocity: 완료된 스프린트별 총 `story_points` 합산

### 11.5 MCP 연동 (Backlog)

- `mcp_servers` 테이블 (id, workspace_id, name, url, enabled, created_at)
- 사이드바 / 푸터에 MCP 연결 상태 dot 표시
- Team v0.2.0 표기 (기존 개인 v0.1.0과 구분)

---

## 12. 미구현 / 차후 검토 항목

| 항목 | 현황 | 비고 |
|------|------|------|
| 댓글 시스템 | Backlog | `ticket_comments` 테이블 신규 |
| 알림 시스템 (알림 벨) | Backlog | `notifications` 테이블 신규 |
| MCP 서버 연동 설정 UI | Backlog | `mcp_servers` 테이블 신규 |
| 워크스페이스 전환 드롭다운 UI | Backlog | 프로토타입에 chevron만 있음 |
| 스프린트 생성/편집 모달 | Backlog | Owner 전용 |
| 반응형 / 모바일 | Backlog | WBS/Gantt는 데스크탑 전용 검토 필요 |
| 실시간 협업 (WebSocket) | 미검토 | Phase 4+ 대상 |
| GitHub / Jira 연동 | 미검토 | MCP 확장 검토 |
