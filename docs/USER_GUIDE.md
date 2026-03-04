# Tika 사용자 가이드

> **버전:** Phase 4 (Team Collaboration)
> **대상:** 서비스를 처음 접하는 사용자
> **구성:** 화면 → 버튼 → 호출 API → 결과 → 다음 단계 순으로 기술

---

## 목차

1. [첫 진입 — 로그인](#1-첫-진입--로그인)
2. [메인 보드 — 칸반](#2-메인-보드--칸반)
3. [티켓 생성](#3-티켓-생성)
4. [티켓 상세 & 수정](#4-티켓-상세--수정)
5. [드래그 앤 드롭](#5-드래그-앤-드롭)
6. [헤더 — 검색 & 알림 & 프로필](#6-헤더--검색--알림--프로필)
7. [설정 페이지](#7-설정-페이지)
   - 7-1 일반 설정
   - 7-2 알림 채널
   - 7-3 라벨 관리
   - 7-4 멤버 관리
8. [팀 워크스페이스 진입](#8-팀-워크스페이스-진입)
9. [팀 대시보드](#9-팀-대시보드)
10. [WBS / 간트 차트](#10-wbs--간트-차트)
11. [멤버 페이지 & 초대](#11-멤버-페이지--초대)
12. [분석 페이지](#12-분석-페이지)
13. [번다운 차트 페이지](#13-번다운-차트-페이지)
14. [초대 링크 수락 (초대받은 사람)](#14-초대-링크-수락-초대받은-사람)
15. [알림 내역 페이지](#15-알림-내역-페이지)

---

## 1. 첫 진입 — 로그인

### 화면: `/login`

```
브라우저에서 http://localhost:3000 접속
  └→ 세션 없음 → /login 으로 자동 이동
```

| 화면 요소 | 액션 | 호출 API | 결과 |
|-----------|------|----------|------|
| **Google로 계속하기** 버튼 | 클릭 | `GET /api/auth/signin/google` (NextAuth) | Google OAuth 인증 팝업 |
| Google 계정 선택 | 선택 | `POST /api/auth/callback/google` | 세션 생성 → `/` 리디렉트 |

> **다음 단계:** 로그인 완료 후 메인 칸반 보드(`/`)로 이동합니다.

---

## 2. 메인 보드 — 칸반

### 화면: `/`

로그인하면 바로 보이는 첫 화면입니다.

```
┌─────────────────────────────────────────────────────┐
│  Header (60px): 로고 | 검색창 | 🔔 | 아바타         │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  BACKLOG │ TODO │ IN PROGRESS │ DONE     │
│ (260px)  │  [카드들] │[카드]│  [카드들]   │ [카드들] │
├──────────┴──────────────────────────────────────────┤
│  Footer (55px)                                      │
└─────────────────────────────────────────────────────┘
```

### 보드 초기 로드

| 단계 | 호출 API | 응답 |
|------|----------|------|
| 페이지 열림 | `GET /api/tickets` | 전체 티켓 목록 (상태별 그룹화) |
| 페이지 열림 | `GET /api/members` | 현재 사용자 멤버 정보 |
| 페이지 열림 | `GET /api/issues` | 이슈 계층 목록 (Goal/Story/Feature/Task) |
| 페이지 열림 | `GET /api/labels` | 라벨 목록 |

### 사이드바 필터 탭

| 탭 버튼 | 결과 |
|---------|------|
| **전체** | 모든 티켓 표시 |
| **이번 주** | 이번 주 마감 티켓만 표시 |
| **기한 초과** | 오늘 이후 마감 초과 티켓만 표시 (빨간 테두리) |

> 필터는 클라이언트 측 필터로 추가 API 호출 없음.

---

## 3. 티켓 생성

### 화면: 메인 보드 `/`

| 화면 요소 | 액션 | 결과 |
|-----------|------|------|
| 헤더 우측 **`+ 새 티켓`** 버튼 | 클릭 | 티켓 생성 모달 열림 |

### 모달 내 입력 필드

| 필드 | 설명 | 필수 |
|------|------|------|
| 제목 | 1~200자 | ✅ |
| 타입 | GOAL / STORY / FEATURE / TASK | ✅ |
| 상태 | BACKLOG / TODO / IN_PROGRESS / DONE | ✅ |
| 우선순위 | LOW / MEDIUM / HIGH / CRITICAL | ✅ |
| 마감일 | YYYY-MM-DD | ❌ |
| 담당자 | 멤버 선택 | ❌ |
| 상위 이슈 | 이슈 계층 연결 | ❌ |
| 스토리 포인트 | 숫자 | ❌ |
| 설명 | 최대 1000자 | ❌ |

### 저장 버튼 클릭

```
저장 버튼 클릭
  └→ POST /api/tickets
       Body: { title, type, status, priority, dueDate, assigneeId, issueId, storyPoints, description }
       ↓ 성공 (201)
       보드에 새 카드 즉시 추가 (Optimistic UI)
       모달 닫힘
```

> **다음 단계:** 생성된 카드를 클릭해 상세 보기로 이동하거나, 드래그하여 상태를 변경합니다.

---

## 4. 티켓 상세 & 수정

### 화면: 메인 보드 → 티켓 카드 클릭

```
보드 카드 클릭  또는  사이드바 티켓 클릭
  └→ GET /api/tickets/:id
  └→ 티켓 상세 모달 열림
```

### 상세 모달 내 기능

#### 4-1. 필드 수정

| 필드 | 조작 | 호출 API |
|------|------|----------|
| 제목/설명/우선순위/마감일/스토리포인트 | 수정 후 **저장** | `PATCH /api/tickets/:id` |
| 상태 변경 | 드롭다운 선택 후 저장 | `PATCH /api/tickets/:id` (DONE이면 completedAt 자동 기록) |
| 담당자 | 멤버 선택 | `PATCH /api/tickets/:id` |
| 라벨 | 라벨 선택기에서 추가/제거 | `PATCH /api/tickets/:id` |

#### 4-2. 체크리스트

| 버튼/조작 | 호출 API | 결과 |
|-----------|----------|------|
| **+ 항목 추가** → 내용 입력 → Enter | `POST /api/tickets/:id/checklist` | 체크리스트 항목 추가 |
| 체크박스 클릭 | `PATCH /api/tickets/:id/checklist/:itemId` | 완료/미완료 토글 |
| 항목 텍스트 수정 → Enter | `PATCH /api/tickets/:id/checklist/:itemId` | 텍스트 수정 |
| 🗑️ 삭제 아이콘 | `DELETE /api/tickets/:id/checklist/:itemId` | 항목 제거 |

#### 4-3. 댓글

| 버튼/조작 | 호출 API | 결과 |
|-----------|----------|------|
| 댓글 입력창에 작성 → **등록** | `POST /api/tickets/:id/comments` | 댓글 추가 |
| 내 댓글 **수정** 아이콘 | `PATCH /api/tickets/:id/comments/:commentId` | 댓글 수정 |
| 내 댓글 **삭제** 아이콘 | `DELETE /api/tickets/:id/comments/:commentId` | 댓글 제거 |

#### 4-4. 티켓 삭제

| 버튼 | 결과 |
|------|------|
| 모달 하단 **삭제** 버튼 | 확인 다이얼로그 표시 |
| 확인 다이얼로그 **삭제 확인** | `DELETE /api/tickets/:id` → 204 → 보드에서 카드 제거 |

> **다음 단계:** 모달 X 버튼 또는 배경 클릭으로 닫고 보드로 돌아갑니다.

---

## 5. 드래그 앤 드롭

### 화면: 메인 보드 `/`

#### 칼럼 간 이동

```
카드를 다른 칼럼으로 드래그
  └→ 드롭 시: PATCH /api/tickets/reorder
       Body: { id, status: '새상태', position: 새위치 }
       ↓ 성공
       카드가 해당 칼럼으로 이동
       status=DONE 이동 시 completedAt 자동 기록
```

#### 칼럼 내 순서 변경

```
같은 칼럼 안에서 카드 위/아래로 드래그
  └→ 드롭 시: PATCH /api/tickets/reorder
       Body: { id, status: '현재상태', position: 새위치 }
```

> Optimistic UI 적용 — 드래그 중에는 즉시 반영, 서버 오류 시 원위치로 롤백.

---

## 6. 헤더 — 검색 & 알림 & 프로필

### 화면: 메인 보드 Header (항상 표시)

#### 6-1. 검색창

| 조작 | 결과 |
|------|------|
| 검색어 입력 | 보드 & 사이드바 티켓을 제목으로 즉시 필터 (추가 API 없음) |
| 검색어 지우기 | 전체 티켓 복원 |

#### 6-2. 🔔 알림 벨

| 조작 | 호출 API | 결과 |
|------|----------|------|
| 벨 아이콘 클릭 | `GET /api/notifications/logs` | 드롭다운 알림 목록 표시 |
| 드롭다운 외부 클릭 | `POST /api/notifications/logs` `{ action: 'markAllRead' }` | 전체 읽음 처리, 미읽음 뱃지 제거 |
| **모든 알림 보기** 링크 | — | `/notifications` 페이지로 이동 |

#### 6-3. 프로필 아바타 (우상단)

| 메뉴 항목 | 결과 |
|-----------|------|
| **프로필 수정** | 프로필 모달 열림 (표시 이름, 색상 변경) |
| **설정** | `/settings` 페이지로 이동 |
| **로그아웃** | `POST /api/auth/signout` → `/login` 이동 |

#### 프로필 모달 저장

```
표시 이름 or 색상 변경 → 저장 버튼
  └→ PATCH /api/members/:id
       Body: { displayName } 또는 { color }
       ↓ 성공
       헤더 아바타 즉시 반영
```

---

## 7. 설정 페이지

### 화면: `/settings`

헤더 아바타 클릭 → **설정** 메뉴로 진입합니다.

```
┌────────────────────────────────────────────────────┐
│ Header                                             │
├──────────────┬─────────────────────────────────────┤
│ 사이드 탭    │ 선택한 탭의 콘텐츠                   │
│ ─일반 설정   │                                     │
│ ─알림 채널   │                                     │
│ ─라벨 관리   │                                     │
│ ─멤버 관리   │                                     │
└──────────────┴─────────────────────────────────────┘
```

---

### 7-1. 일반 설정 탭

| 항목 | 조작 | 호출 API | 결과 |
|------|------|----------|------|
| 워크스페이스 이름 | 수정 → **저장** | `PATCH /api/workspaces/:id` `{ name }` | 이름 업데이트 |
| 워크스페이스 설명 | 수정 → **저장** | `PATCH /api/workspaces/:id` `{ description }` | 설명 업데이트 |
| **워크스페이스 삭제** 버튼 | 클릭 | — | 이름 확인 다이얼로그 표시 |
| 이름 입력 → **삭제 확인** | `DELETE /api/workspaces/:id` `{ confirmName }` | 204 → `/login` 이동 |

> ⚠️ 워크스페이스 삭제는 되돌릴 수 없습니다. 이름을 정확히 입력해야 삭제됩니다.

---

### 7-2. 알림 채널 탭

| 조작 | 호출 API | 결과 |
|------|----------|------|
| **이메일 알림** 토글 ON/OFF | `PATCH /api/workspaces/:id/members/me` | 알림 채널 설정 저장 |
| **마감 임박 알림** 토글 | (위 동일) | 마감 3일 전 자동 알림 ON/OFF |
| **테스트 알림 보내기** | `POST /api/notifications/:type/test` | 현재 채널로 테스트 알림 발송 |

---

### 7-3. 라벨 관리 탭

| 조작 | 호출 API | 결과 |
|------|----------|------|
| **+ 새 라벨** 버튼 | — | 이름 입력 + 색상 선택 폼 표시 |
| 이름 & 색상 입력 → **추가** | `POST /api/labels` `{ name, color }` | 라벨 목록에 추가 |
| 라벨 이름 클릭 → 수정 → **저장** | `PATCH /api/labels/:id` | 라벨 업데이트 |
| 라벨 옆 🗑️ 아이콘 | `DELETE /api/labels/:id` | 라벨 삭제 (연결된 티켓에서도 제거) |

---

### 7-4. 멤버 관리 탭

| 조작 | 호출 API | 결과 |
|------|----------|------|
| 탭 진입 | `GET /api/members` | 멤버 목록 로드 |
| 역할 드롭다운 변경 (OWNER → MEMBER 등) | 확인 다이얼로그 → `PATCH /api/members/:id` `{ role }` | 역할 변경 |
| 마지막 OWNER를 MEMBER로 변경 시도 | — | 에러 토스트: "관리자가 최소 1명" (409 차단) |
| 멤버 옆 **탈퇴 처리** 버튼 | 확인 다이얼로그 → `DELETE /api/members/:id` | 멤버 제거 |

> **다음 단계:** 멤버 초대는 팀 워크스페이스의 **멤버 페이지**에서 할 수 있습니다.

---

## 8. 팀 워크스페이스 진입

### 팀 워크스페이스가 있는 경우

팀 워크스페이스(type=`TEAM`)가 DB에 생성되어 있으면 사이드바 상단 **WorkspaceSwitcher**에서 전환할 수 있습니다.

```
팀 사이드바 최상단 워크스페이스 이름 클릭
  └→ GET /api/workspaces
       ↓ 드롭다운에 내가 속한 워크스페이스 목록 표시
          - PERSONAL 타입 → 클릭 시 / 이동
          - TEAM 타입    → 클릭 시 /team/:workspaceId 이동
```

| 드롭다운 항목 | 타입 | 이동 경로 |
|--------------|------|-----------|
| 내 개인 보드 | PERSONAL | `/` |
| 팀 워크스페이스 이름 | TEAM | `/team/:workspaceId` |

---

## 9. 팀 대시보드

### 화면: `/team/:workspaceId`

```
┌────────────────────────────────────────────────────┐
│ Header                                             │
├──────────────┬─────────────────────────────────────┤
│ Team Sidebar │ 8개 대시보드 카드 그리드              │
│ [워크스페이스]│                                     │
│ 📊 대시보드  │  번다운 | 완료 도넛 | 트렌드 | 매트릭스│
│ 📋 WBS/간트  │  마감현황| 워크로드 | 목표진행 | WBS  │
│ 👥 멤버      │                                     │
│ 📈 분석      │                                     │
│ 📉 번다운    │                                     │
└──────────────┴─────────────────────────────────────┘
```

### 페이지 로드 시 API 호출

| 호출 API | 데이터 |
|----------|--------|
| `GET /api/tickets` | 전체 티켓 (상태·우선순위 매트릭스 계산용) |
| `GET /api/workspaces/:id/sprints` | 스프린트 목록 |
| `GET /api/workspaces/:id/members/workload` | 멤버별 담당 티켓 통계 |
| `GET /api/issues` | 이슈 계층 (WBS 미니뷰용) |
| `GET /api/workspaces/:id/analytics/cfd` | CFD 데이터 (트렌드 계산용) |
| `GET /api/workspaces/:id/analytics/burndown` | 현재 활성 스프린트 번다운 |

### 대시보드 카드별 기능

| 카드 | 표시 내용 | 클릭 이동 |
|------|-----------|-----------|
| **번다운 차트** | 현재 스프린트 이상선 vs 실제 소진 | → `/burndown` |
| **완료 도넛** | Done 티켓 수 / 전체 비율 | — |
| **트렌드 차트** | 일별 생성 vs 해결 | → `/analytics` |
| **우선순위×상태 매트릭스** | CRITICAL~LOW × 4상태 히트맵 | — |
| **마감일 현황** | 기한 초과 수, 3일 내 마감, 티켓 목록 | — |
| **워크로드 히트맵** | 멤버별 Todo/InProgress/Done 개수 | → `/members` |
| **목표 진행률** | GOAL 티켓별 하위 완료 비율 바 | — |
| **WBS 미니뷰** | 이슈 트리 구조 | → `/wbs` |

---

## 10. WBS / 간트 차트

### 화면: `/team/:workspaceId/wbs`

좌측 팀 사이드바 **📋 WBS / 간트** 클릭으로 진입합니다.

### 페이지 로드

```
GET /api/issues       → 이슈 계층 (Goal→Story→Feature→Task)
GET /api/tickets      → 각 이슈에 연결된 티켓
  └→ 트리 구조로 GanttChart 컴포넌트에 전달
```

### 간트 차트 레이아웃

```
┌──────────────────────────────────────────────────────────┐
│ 트리 패널 (220px) │ 타임라인 SVG (스크롤) │ 상세 (200px) │
│ Goal            │ ████░░░░░░░░░░░░░   │ 제목         │
│  └ Story        │      ████░░░░░░░░   │ 상태: ACTIVE │
│     └ Feature   │         ████░░░░   │ 기간: 1/1~   │
│        └ Task   │              ██░   │ 담당자: 홍   │
└──────────────────────────────────────────────────────────┘
```

| 조작 | 결과 |
|------|------|
| 트리 항목 클릭 | 우측 상세 패널 업데이트 |
| 타임라인 가로 스크롤 | 트리 패널·상세 패널 동기화 스크롤 |
| 바 색상 | BACKLOG=회색, TODO=파랑, IN_PROGRESS=주황, DONE=초록 |
| 날짜 없는 항목 | 타임라인 중앙에 점(·) 표시 |

---

## 11. 멤버 페이지 & 초대

### 화면: `/team/:workspaceId/members`

좌측 사이드바 **👥 멤버** 클릭으로 진입합니다.

### 페이지 로드

```
GET /api/workspaces/:id/members          → 멤버 목록 (역할 포함)
GET /api/workspaces/:id/members/workload → 멤버별 담당 티켓 통계
GET /api/tickets                         → 전체 티켓 (멤버별 목록 구성용)
```

### 워크로드 히트맵

| 표시 | 내용 |
|------|------|
| 각 행 | 멤버 이름, 역할 뱃지 |
| 칼럼 | Todo 수(파랑), In Progress 수(주황), Done 수(초록) |
| 워크로드 바 | 전체 대비 IN_PROGRESS 비율 — 80% 이상: 빨강, 60% 이상: 주황, 그 외: 초록 |

### 멤버 상세 카드

| 조작 | 결과 |
|------|------|
| 멤버 카드 클릭 | 해당 멤버의 담당 티켓 목록 펼침 |

### 팀원 초대 (OWNER 권한 필요)

| 조작 | 호출 API | 결과 |
|------|----------|------|
| **팀원 초대** 버튼 클릭 | — | InviteModal 열림 |
| 이메일 입력 + 역할 선택(MEMBER/VIEWER) → **초대 링크 생성** | `POST /api/workspaces/:id/invites` `{ email, role }` | 초대 링크 생성됨 |
| **복사** 버튼 | — | 링크 클립보드 복사 |
| 생성된 링크를 초대 대상자에게 전달 | — | 상대방이 `/invite/:token` 접속 |
| 대기 중인 초대 목록의 **취소** 버튼 | `DELETE /api/workspaces/:id/invites/:inviteId` | 초대 취소 |

> 초대 링크는 **7일** 후 만료됩니다.

---

## 12. 분석 페이지

### 화면: `/team/:workspaceId/analytics`

좌측 사이드바 **📈 분석** 클릭으로 진입합니다.

### 페이지 로드

| 호출 API | 데이터 |
|----------|--------|
| `GET /api/workspaces/:id/analytics/burndown` | 번다운 데이터 |
| `GET /api/workspaces/:id/analytics/cfd` | CFD 누적 흐름 |
| `GET /api/workspaces/:id/analytics/velocity` | 스프린트별 벨로시티 |
| `GET /api/workspaces/:id/analytics/cycle-time` | 티켓별 처리 시간 분포 |
| `GET /api/workspaces/:id/analytics/labels` | 라벨 사용 통계 |
| `GET /api/tickets` | 타입 분포 계산용 |

### 차트 목록

| 차트 | 내용 |
|------|------|
| **요약 수치 (4개)** | 완료 티켓 수 / 완료율 / 완료 스프린트 수 / 평균 사이클 타임 |
| **번다운 차트** | 이상선 vs 실제 소진 (미니 버전) |
| **CFD** | 상태별 누적 스택 영역 차트 (BACKLOG→DONE 흐름) |
| **벨로시티** | 스프린트별 계획 수(회색) vs 완료 수(초록) 수평 바 |
| **일일 로그 테이블** | 날짜 / 완료된 수 / 추가된 수 / 잔여 / 흡수율 |
| **사이클 타임 히스토그램** | 처리 일수 분포 + 평균(빨간 점선) + 중앙값 |
| **타입 분포** | GOAL/STORY/FEATURE/TASK 비율 바 |
| **라벨 분석** | 라벨별 색상+이름+사용 수 막대 |

---

## 13. 번다운 차트 페이지

### 화면: `/team/:workspaceId/burndown`

좌측 사이드바 **📉 번다운** 클릭 또는 대시보드 번다운 카드 클릭으로 진입합니다.

### 스프린트 전환

```
상단 SprintSelector 드롭다운에서 스프린트 선택
  └→ URL이 /burndown?sprintId=N 으로 변경
  └→ GET /api/workspaces/:id/analytics/burndown?sprintId=N
  └→ 차트 데이터 갱신
```

| 조작 | 결과 |
|------|------|
| 스프린트 드롭다운 | 스프린트 목록 (`GET /api/workspaces/:id/sprints`) |
| **티켓 수** / **스토리 포인트** 토글 | 차트 Y축 데이터 전환 (API 재호출 없음) |

### 표시 차트

| 차트 | 내용 |
|------|------|
| **전체 번다운** | 영역 채우기 + 이상선(점선) + 실제 소진선 + hover 데이터 포인트 |
| **벨로시티** | 스프린트별 완료 실적 비교 |
| **CFD** | 해당 기간 누적 흐름 |
| **일일 로그** | 날짜별 Delta 테이블 |

---

## 14. 초대 링크 수락 (초대받은 사람)

### 화면: `/invite/:token`

초대 받은 사람이 링크를 클릭하면 진입합니다.

### 흐름

```
초대 링크 클릭 (예: https://tika.app/invite/abc-xyz-123)
  └→ GET /api/invites/:token  (인증 불필요)
       ↓
  [정상 초대] 초대 카드 표시:
     - 워크스페이스 이름
     - 초대자 이름
     - 역할 (멤버 / 뷰어)
     - 초대 이메일 힌트
     - 만료일
  [만료/없음]  에러 메시지 → 홈으로 이동 버튼
```

### 로그인 상태에 따른 분기

| 상태 | 화면 | 조작 |
|------|------|------|
| **비로그인** | **Google로 로그인 후 수락** 버튼 표시 | 클릭 → Google 로그인 → 자동 수락 처리 |
| **로그인됨 (이메일 일치)** | **수락** / **거절** 버튼 표시 | — |
| **로그인됨 (이메일 불일치)** | "초대 이메일과 현재 계정이 다릅니다" 경고 | 다른 계정으로 로그인 안내 |

### 수락 버튼 클릭

```
수락 버튼 클릭
  └→ POST /api/invites/:token/accept
       Body: { displayName }
       ↓ 성공 (200)
       워크스페이스 멤버로 등록
       → /team/:workspaceId 로 리디렉트
```

### 거절 버튼 클릭

```
거절 버튼 클릭
  └→ POST /api/invites/:token/reject
       ↓ 성공 (200)
       초대 상태 REJECTED로 변경
       → / 로 리디렉트
```

---

## 15. 알림 내역 페이지

### 화면: `/notifications`

헤더 🔔 드롭다운 → **모든 알림 보기** 링크로 진입합니다.

### 페이지 로드

```
GET /api/notifications/logs
  └→ 전체 알림 로그 목록 반환
     각 항목: 종류 아이콘 | 내용 | 시간 | 읽음 여부
```

### 알림 종류

| 아이콘 | 종류 | 발생 시점 |
|--------|------|-----------|
| 🕐 | 마감 임박 | Cron: 매일 마감 3일 전 티켓 자동 발송 |
| 💬 | 댓글 | 내 티켓에 댓글 추가 시 |
| @ | 멘션 | 댓글에 @나 포함 시 |
| ✉️ | 초대 | 팀 초대 생성 시 |

---

## 빠른 참조: 화면별 URL 정리

| URL | 화면 이름 | 진입 방법 |
|-----|-----------|-----------|
| `/login` | 로그인 | 미인증 시 자동 이동 |
| `/` | 메인 칸반 보드 | 로그인 후 기본 화면 |
| `/settings` | 설정 | 헤더 아바타 → 설정 |
| `/notifications` | 알림 내역 | 헤더 🔔 → 모든 알림 보기 |
| `/invite/:token` | 초대 수락 | 초대 링크 클릭 |
| `/team/:workspaceId` | 팀 대시보드 | WorkspaceSwitcher → 팀 선택 |
| `/team/:workspaceId/wbs` | WBS / 간트 | 팀 사이드바 WBS/간트 |
| `/team/:workspaceId/members` | 멤버 & 초대 | 팀 사이드바 멤버 |
| `/team/:workspaceId/analytics` | 분석 차트 | 팀 사이드바 분석 |
| `/team/:workspaceId/burndown` | 번다운 차트 | 팀 사이드바 번다운 |

---

## 빠른 참조: 주요 API 목록

| 메서드 | 경로 | 기능 |
|--------|------|------|
| `GET` | `/api/tickets` | 보드 전체 티켓 조회 |
| `POST` | `/api/tickets` | 티켓 생성 |
| `PATCH` | `/api/tickets/:id` | 티켓 수정 |
| `DELETE` | `/api/tickets/:id` | 티켓 삭제 |
| `PATCH` | `/api/tickets/reorder` | 드래그앤드롭 순서 변경 |
| `GET` | `/api/labels` | 라벨 목록 |
| `POST` | `/api/labels` | 라벨 생성 |
| `GET` | `/api/issues` | 이슈 계층 목록 |
| `GET` | `/api/workspaces` | 내 워크스페이스 목록 |
| `PATCH` | `/api/workspaces/:id` | 워크스페이스 수정 |
| `DELETE` | `/api/workspaces/:id` | 워크스페이스 삭제 |
| `GET` | `/api/workspaces/:id/members` | 팀 멤버 목록 |
| `POST` | `/api/workspaces/:id/invites` | 초대 링크 생성 |
| `POST` | `/api/invites/:token/accept` | 초대 수락 |
| `POST` | `/api/invites/:token/reject` | 초대 거절 |
| `GET` | `/api/workspaces/:id/sprints` | 스프린트 목록 |
| `POST` | `/api/workspaces/:id/sprints/:sid/activate` | 스프린트 활성화 |
| `POST` | `/api/workspaces/:id/sprints/:sid/complete` | 스프린트 완료 |
| `GET` | `/api/workspaces/:id/analytics/burndown` | 번다운 데이터 |
| `GET` | `/api/workspaces/:id/analytics/velocity` | 벨로시티 데이터 |
| `GET` | `/api/workspaces/:id/analytics/cfd` | CFD 데이터 |
| `GET` | `/api/workspaces/:id/analytics/cycle-time` | 사이클 타임 |
| `GET` | `/api/workspaces/:id/analytics/labels` | 라벨 분석 |
| `GET` | `/api/workspaces/:id/members/workload` | 멤버 워크로드 |
| `GET` | `/api/notifications/logs` | 알림 로그 |

---

*최종 업데이트: Phase 4 Team Collaboration 구현 완료*
