# Tika Bug Report

---

## BUG-001 · PERSONAL 워크스페이스에서 팀 메뉴(TeamSidebar) 노출

| 항목         | 내용 |
|-------------|------|
| **심각도**   | High — 개인 워크스페이스 사용자에게 팀 전용 UI 노출, RBAC 우회 가능성 |
| **발견일**   | 2026-03-11 |
| **수정일**   | 2026-03-11 |
| **수정 커밋** | develop 브랜치 |
| **관련 파일** | `app/workspace/[workspaceId]/page.tsx` 外 5개 |

---

### 증상

개인 워크스페이스(type = `'PERSONAL'`) 소유자가 `/workspace/[id]` URL로 직접 접근하면
`TeamShell` + `TeamSidebar`가 렌더되어 팀 전용 메뉴(대시보드, 멤버, 분석 등)가 노출된다.

### 재현 방법

1. 개인 워크스페이스 ID를 확인한다 (DB: `workspaces.type = 'PERSONAL'`)
2. `/workspace/[personalId]` URL로 직접 접근한다
3. 팀 전용 사이드바 메뉴(대시보드, 칸반보드, WBS, 분석, 멤버)가 표시된다 ← **버그**

### 근본 원인

`board/page.tsx`와 `[ticketId]/page.tsx`에는 PERSONAL 타입 체크가 있었지만,
나머지 6개 팀 전용 페이지에는 해당 체크가 **누락**되어 있었다.

```typescript
// ✅ board/page.tsx — 기존 올바른 패턴
if (workspace.type === 'PERSONAL') {
  redirect('/');
}

// ❌ page.tsx, analytics, burndown, members, trash, wbs — 체크 없음 (버그)
```

### 영향 범위

| 페이지 | 경로 | 수정 전 | 수정 후 |
|--------|------|---------|---------|
| 팀 대시보드 | `/workspace/[id]`            | ❌ PERSONAL 허용 | ✅ redirect('/') |
| 분석        | `/workspace/[id]/analytics`  | ❌ PERSONAL 허용 | ✅ redirect('/') |
| 번다운      | `/workspace/[id]/burndown`   | ❌ PERSONAL 허용 | ✅ redirect('/') |
| 멤버 관리   | `/workspace/[id]/members`    | ❌ PERSONAL 허용 | ✅ redirect('/') |
| 휴지통      | `/workspace/[id]/trash`      | ❌ PERSONAL 허용 | ✅ redirect('/') |
| WBS         | `/workspace/[id]/wbs`        | ❌ PERSONAL 허용 | ✅ redirect('/') |

### 적용된 수정

각 페이지의 워크스페이스 조회 직후 아래 두 줄을 추가했다:

```typescript
if (!workspace || !member) redirect('/');  // 기존
if (workspace.type === 'PERSONAL') redirect('/');  // 추가
```

### 재발 방지 규칙

> **팀 전용 페이지를 새로 추가할 때 반드시 아래 두 줄을 포함해야 한다.**

```typescript
const [workspace, member] = await Promise.all([
  getWorkspaceById(workspaceId),
  getMemberByUserId(userId, workspaceId),
]);

if (!workspace || !member) redirect('/');
if (workspace.type === 'PERSONAL') redirect('/');   // ← 반드시 필요
```

가드 로직의 단위 테스트:
- **`src/lib/workspaceGuard.ts`** — `checkTeamWorkspaceAccess()` 순수 함수 정의
- **`__tests__/lib/workspaceGuard.test.ts`** — 경계 케이스 포함 전체 시나리오 테스트

---
