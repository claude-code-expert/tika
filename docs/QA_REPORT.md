# QA 구현 보고서 — VIEWER 제한 & 티켓 경고 배너

> **작성일:** 2026-03-12
> **대상 브랜치:** `develop`
> **기반 체크리스트:** `docs/check_list_workspace.md`

이 문서는 기존 QA 점검에서 미구현/부분 구현으로 분류된 항목 중, 이번 세션에서 새롭게 구현 완료된 내역과 검증 방법을 정리합니다.

---

## 구현 완료 항목 요약

| 항목 | 설명 | 이전 상태 | 현재 상태 |
|------|------|-----------|-----------|
| 4-2 | VIEWER Members 페이지 URL 직접 접근 차단 | ⚠️ 부분 구현 | ✅ 완료 |
| 4-3 | VIEWER 새 티켓 버튼 UI 차단 | ❌ 미구현 | ✅ 완료 |
| 4-4 | VIEWER 티켓 상세 모달 입력 필드 비활성화 | ❌ 미구현 | ✅ 완료 |
| 4-5 | VIEWER 티켓 저장/삭제 버튼 숨김 | ❌ 미구현 | ✅ 완료 |
| 4-6 | VIEWER DnD(드래그 앤 드롭) 차단 | ❌ 미구현 | ✅ 완료 |
| 4-8 | VIEWER 댓글 작성 API 차단 | ❌ 미구현 | ✅ 완료 |
| 1-5 | 개인 WS 티켓 270개 초과 시 소프트 경고 표시 | ❌ 미구현 | ✅ 완료 |
| 2-8 | 팀 WS 티켓 900개 초과 시 소프트 경고 표시 | ❌ 미구현 | ✅ 완료 |

---

## 상세 구현 내역

### 4-2 — VIEWER Members 페이지 URL 직접 접근 차단

**변경 파일:** `app/workspace/[workspaceId]/members/page.tsx`

**구현 내용:**
TeamSidebar에서 VIEWER에게 멤버 메뉴가 숨겨지더라도, URL을 직접 입력하면 서버 레벨에서 접근할 수 있는 문제가 있었습니다. 이제 서버 컴포넌트에서 role을 확인하여 VIEWER면 즉시 보드로 redirect합니다.

```typescript
const role = currentMember.role as TeamRole;
if (role === 'VIEWER') redirect(`/workspace/${workspaceId}`);
```

---

### 4-3 — VIEWER 새 티켓 버튼 UI 차단

**변경 파일:** `src/components/layout/TeamShell.tsx`

**구현 내용:**
헤더의 "새 티켓(+)" 버튼을 클릭해도 VIEWER는 생성 모달이 열리지 않습니다. 클라이언트 사이드에서 role을 확인하여 조기 종료합니다. API(`POST /api/tickets`)에는 이미 `requireRole(MEMBER)` 가드가 있어 직접 API 호출도 차단됩니다.

```typescript
const handleNewTask = useCallback(() => {
  if (role === 'VIEWER') return;
  setIsNewTicketOpen(true);
}, [role]);
```

---

### 4-4 & 4-5 — VIEWER 티켓 상세 모달 읽기 전용

**변경 파일:** `src/components/ticket/TicketModal.tsx`, `src/components/board/BoardContainer.tsx`, `src/components/team/TeamBoardClient.tsx`

**구현 내용:**
`TicketModal`에 `readOnly` prop을 추가하여, VIEWER가 티켓을 클릭하면 모든 편집 요소가 비활성화됩니다.

| 요소 | readOnly 처리 |
|------|--------------|
| 제목 textarea | `readOnly={true}`, 커서 `default` |
| 타입 select | `disabled={true}` |
| 설명 textarea | `readOnly={true}` |
| 상태 select | `disabled={true}` |
| 우선순위 select | `disabled={true}` |
| 시작 예정일 input | `disabled={true}` |
| 종료 예정일 input | `disabled={true}` |
| 라벨 추가 버튼 | `{!readOnly && ...}` (숨김) |
| 라벨 × 제거 버튼 | `{!readOnly && ...}` (숨김) |
| 담당자 추가/제거 버튼 | `{!readOnly && ...}` (숨김) |
| 저장 버튼 | `{!readOnly && ...}` (숨김) |
| 삭제 버튼 | `{!readOnly && ...}` (숨김) |

prop 전달 경로: `TeamBoardClient(role) → BoardContainer(readOnly) → TicketModal(readOnly)`

---

### 4-6 — VIEWER DnD(드래그 앤 드롭) 차단

**변경 파일:** `src/components/team/TeamBoardClient.tsx`

**구현 내용:**
`@dnd-kit` 센서의 `activationConstraint`를 이용하여 VIEWER일 때 드래그 활성화 임계값을 사실상 불가능한 9999px로 설정합니다. 또한 `handleDragEnd` 핸들러에서도 VIEWER이면 즉시 종료합니다.

```typescript
const isViewer = role === 'VIEWER';
const sensors = useSensors(
  useSensor(MouseSensor, { activationConstraint: { distance: isViewer ? 9999 : 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: isViewer ? 9999 : 200, tolerance: isViewer ? 0 : 5 } }),
);
// handleDragEnd 내:
if (isViewer) { setDraggingTicket(null); return; }
```

---

### 4-8 — VIEWER 댓글 작성 API 차단

**변경 파일:** `app/api/tickets/[id]/comments/route.ts`

**구현 내용:**
댓글 작성 API(`POST /api/tickets/[id]/comments`)에 MEMBER 이상 권한 체크를 추가하였습니다. VIEWER가 API를 직접 호출해도 `403 FORBIDDEN`이 반환됩니다.

```typescript
const roleCheck = await requireRole(userId, commentWsId, TEAM_ROLE.MEMBER);
if (isRoleError(roleCheck)) return roleCheck;
```

---

### 1-5 & 2-8 — 티켓 한도 임박 경고 배너

**변경 파일:** `src/hooks/useTickets.ts`, `src/components/team/TeamBoardClient.tsx`, `src/components/layout/TeamShell.tsx`

**구현 내용:**
API는 이미 한도 임박 시 `warning` 필드를 응답에 포함하고 있었으나(개인 270개, 팀 900개 기준), 프론트엔드에서 이를 읽지 않아 표시되지 않았습니다.

**임계값 (기존 상수):**
- 개인 워크스페이스: `TICKET_WARNING_PERSONAL = 270`
- 팀 워크스페이스: `TICKET_WARNING_TEAM = 900`

**변경 사항:**

1. `useTickets.ts`: `createTicket`에서 API 응답의 `warning` 필드를 읽어 `warningMessage` 상태 저장
2. `TeamBoardClient.tsx`: `warningMessage`를 보드 상단에 dismissible 배너로 표시
3. `TeamShell.tsx`: 헤더 "새 티켓" 버튼을 통한 생성 경로에서도 `warning` 배너 표시

배너 표시 예시: `⚠ 티켓 한도에 가까워지고 있습니다. 현재 271개 / 최대 300개`
배너는 × 버튼으로 닫을 수 있습니다.

---

## QA 검증 방법

### 사전 준비

1. 테스트용 팀 워크스페이스 생성 (OWNER 계정)
2. 별도 Google 계정으로 로그인하여 VIEWER 역할로 워크스페이스 참여
   - `members` 페이지 → 참여 신청 승인 후 → 역할을 VIEWER로 변경

---

### 4-2 검증: VIEWER Members 페이지 차단

1. VIEWER 계정으로 로그인
2. 사이드바에서 Members 메뉴가 숨겨져 있는지 확인
3. 브라우저 주소창에 직접 `/workspace/[워크스페이스ID]/members` 입력 후 Enter
4. **기대 결과:** `/workspace/[워크스페이스ID]/board` 또는 대시보드로 즉시 redirect됨

---

### 4-3 검증: VIEWER 새 티켓 버튼 차단

1. VIEWER 계정으로 팀 워크스페이스 보드 접속
2. 헤더 우측의 "새 티켓(+)" 버튼 클릭
3. **기대 결과:** 생성 모달이 열리지 않음 (아무 반응 없음)
4. API 직접 검증: `curl -X POST /api/tickets ...` → `403 FORBIDDEN` 확인

---

### 4-4 & 4-5 검증: VIEWER 티켓 모달 읽기 전용

1. VIEWER 계정으로 팀 워크스페이스 보드 접속
2. 아무 티켓 카드 클릭 → 상세 모달 열기
3. **기대 결과:**
   - 제목 필드 클릭 시 커서가 깜빡이지 않음
   - 타입/상태/우선순위 드롭다운 클릭 시 선택 불가 (disabled 표시)
   - 시작 예정일/종료 예정일 수정 불가
   - "라벨 추가" 버튼이 표시되지 않음
   - 기존 라벨에 × 제거 버튼이 표시되지 않음
   - 담당자 "담당자 추가" 버튼이 표시되지 않음
   - Footer에 "저장" 버튼이 표시되지 않음
   - Footer에 "삭제" 버튼이 표시되지 않음
   - "닫기" 버튼만 표시됨

---

### 4-6 검증: VIEWER DnD 차단

1. VIEWER 계정으로 팀 워크스페이스 보드 접속
2. 티켓 카드를 마우스로 클릭 후 드래그 시도 (다른 칼럼 또는 같은 칼럼 내)
3. **기대 결과:**
   - 드래그가 시작되지 않음 (카드가 움직이지 않음)
   - 다른 칼럼으로 이동되지 않음
   - API 호출 없음 (네트워크 탭 확인)

---

### 4-8 검증: VIEWER 댓글 차단

1. VIEWER 계정으로 티켓 상세 모달 열기
2. 댓글 입력란에 텍스트 입력 후 "댓글 작성" 버튼 클릭
3. **기대 결과:**
   - `403 FORBIDDEN` 에러 응답
   - UI에 에러 메시지 표시 (또는 댓글이 저장되지 않음)
4. 추가 확인: MEMBER 계정으로 댓글 작성 → 정상 저장 확인

---

### 1-5 검증: 개인 WS 270개 소프트 경고

> 직접 270개 이상 티켓을 만들기 어려우므로 DB 또는 API로 개수를 조작하거나, `TICKET_WARNING_PERSONAL` 상수를 임시로 낮춰 테스트합니다.

1. 개인 워크스페이스에서 티켓 수가 270개를 초과하는 상태 조성
2. 새 티켓 생성 시도
3. **기대 결과:**
   - 티켓은 정상 생성됨
   - 보드 상단에 노란색 경고 배너 표시: `⚠ [경고 메시지]`
   - 배너 우측 ✕ 버튼으로 닫기 가능
4. 300개 초과 시: 티켓 생성 실패 + `TICKET_LIMIT_EXCEEDED` 에러 메시지 표시

---

### 2-8 검증: 팀 WS 900개 소프트 경고

> 위와 동일하게 DB 조작 또는 `TICKET_WARNING_TEAM` 상수 임시 변경으로 테스트합니다.

1. 팀 워크스페이스에서 티켓 수가 900개를 초과하는 상태 조성
2. MEMBER 계정으로 새 티켓 생성 시도
3. **기대 결과:**
   - 티켓은 정상 생성됨
   - 보드 상단에 노란색 경고 배너 표시
   - 배너 우측 ✕ 버튼으로 닫기 가능
4. 1000개 초과 시: 티켓 생성 실패 + `TICKET_LIMIT_EXCEEDED` 에러 메시지 표시

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `app/api/tickets/[id]/comments/route.ts` | POST에 `requireRole(TEAM_ROLE.MEMBER)` 가드 추가 |
| `app/workspace/[workspaceId]/members/page.tsx` | VIEWER role 시 보드로 서버 redirect |
| `app/workspace/[workspaceId]/board/page.tsx` | TeamBoardClient에 `role` prop 전달 |
| `src/hooks/useTickets.ts` | `warningMessage` 상태 추가, API 응답 `warning` 필드 처리 |
| `src/components/team/TeamBoardClient.tsx` | `role` prop 수신, isViewer 플래그, DnD 센서 임계값, handleDragEnd 가드, warning 배너, BoardContainer에 `readOnly` 전달 |
| `src/components/board/BoardContainer.tsx` | `readOnly` prop 추가 및 TicketModal에 전달 |
| `src/components/ticket/TicketModal.tsx` | `readOnly` prop 추가, 모든 입력/버튼 조건부 비활성화 |
| `src/components/layout/TeamShell.tsx` | VIEWER 새 티켓 차단, 티켓 생성 warning 배너 표시 |

---

## 잔여 미구현 항목

아래 항목은 이번 세션에서 구현되지 않았으며 별도 작업이 필요합니다.

| 항목 | 설명 | 비고 |
|------|------|------|
| 2-2 | 멤버 초대 링크 수락 시 INVITE_RECEIVED 알림 발송 여부 | 상세 플로우 확인 필요 |
| 5-2 | 온보딩 개인→팀 순차 단계 표시 | 현재 구현 유지 (변경 보류) |
