# UI Contracts: Onboarding Wizard & Workspace Flow

**Feature**: 001-onboarding-wizard
**Phase**: 1 — Design
**Date**: 2026-03-05

---

## Design Token Reference

All components use the existing Tika design system:

| Token | Value | Usage |
|-------|-------|-------|
| Accent | `#629584` (var(--color-accent)) | CTA buttons, active states |
| App background | `#F8F9FB` | Page background |
| Border | `var(--color-border)` | Card borders, dividers |
| Text primary | `#2C3E50` | Headings, labels |
| Text muted | `var(--color-text-muted)` | Subtitles, hints |
| Font | Plus Jakarta Sans, Noto Sans KR | All text |
| Icon library | `lucide-react` | All icons |

---

## Screen 1: /onboarding — OnboardingWizard

**Route**: `app/onboarding/page.tsx` (server component, redirects if `userType !== null`)
**Component**: `src/components/onboarding/OnboardingWizard.tsx` (client component)

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [Tika logo + wordmark — top center]                │
│                                                     │
│  ──────────────────────────────────────────────     │
│                                                     │
│  👋 Tika에 오신 것을 환영합니다                     │
│  어떤 방식으로 사용하실 건가요?                     │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────┐    │
│  │  [User icon]     │  │  [Building2 icon]    │    │
│  │  개인용           │  │  워크스페이스         │    │
│  │                  │  │                      │    │
│  │  나 혼자 사용     │  │  팀과 함께 사용       │    │
│  │  칸반 보드        │  │  멤버 초대, 협업      │    │
│  │  무제한 티켓      │  │  통합 대시보드        │    │
│  │                  │  │                      │    │
│  │  [시작하기 →]    │  │  [시작하기 →]        │    │
│  └──────────────────┘  └──────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Specification

- Full viewport height, vertically centered content
- Background: `#F8F9FB`
- Cards: white background, `border: 1px solid var(--color-border)`, `border-radius: 12px`, `padding: 32px`
- Card hover: accent border (`#629584`), slight box-shadow lift
- Card selected: accent border + accent background tint
- "시작하기" button: `variant=primary` (accent color), width 100%, `size=md`
- Clicking "시작하기" calls `PATCH /api/users/type` then redirects
- Loading state: button shows spinner while API is in flight
- Lucide icons: `User` (개인용), `Building2` (워크스페이스), size 32px

---

## Screen 2: /onboarding/workspace — WorkspaceOnboarding

**Route**: `app/onboarding/workspace/page.tsx` (server component, redirects if `userType !== 'WORKSPACE'`)
**Component**: `src/components/onboarding/WorkspaceOnboarding.tsx` (client component, tab controller)
**Sub-components**:
- `src/components/onboarding/WorkspaceCreator.tsx` — "개설" tab
- `src/components/onboarding/WorkspaceFinder.tsx` — "찾기" tab

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [Tika logo — top left]           [← 로그아웃]      │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  워크스페이스 설정                            │   │
│  │                                             │   │
│  │  ┌────────────────┬───────────────────┐     │   │
│  │  │  🆕 개설       │  🔍 찾기          │     │   │
│  │  └────────────────┴───────────────────┘     │   │
│  │                                             │   │
│  │  [Tab content — WorkspaceCreator or         │   │
│  │   WorkspaceFinder renders here]             │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Tab Specification

- Tab bar: `border-bottom: 1px solid var(--color-border)`
- Active tab: accent color text + border-bottom accent underline (2px)
- Inactive tab: muted text, no underline
- Lucide icons: `Plus` (개설), `Search` (찾기)

---

## Component 3: WorkspaceCreator (개설 탭)

```
┌─────────────────────────────────────────────────────┐
│  워크스페이스 이름 *                                 │
│  [__________________________________________]        │
│  (예: Acme Corp, 내 팀)                             │
│                                                     │
│  설명 (선택)                                         │
│  [__________________________________________]        │
│                                                     │
│  [워크스페이스 만들기]                               │
└─────────────────────────────────────────────────────┘
```

**Spec**:
- Name field: required, max 100 chars, placeholder "워크스페이스 이름"
- Description field: optional, max 500 chars, textarea
- Submit button: `variant=primary`, full width, shows spinner during creation
- On success: redirect to `/team/[newWorkspaceId]`
- Validation error inline below the input field
- API: `POST /api/workspaces` with `{ name, description, type: 'TEAM' }`

---

## Component 4: WorkspaceFinder (찾기 탭)

```
┌─────────────────────────────────────────────────────┐
│  워크스페이스 이름 또는 초대 링크                    │
│  [____________________________________] [검색]       │
│                                                     │
│  ─────────────────────────────────────────          │
│                                                     │
│  [검색 결과 상태]                                   │
│                                                     │
│  결과 있을 때:                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ [Building2] Acme Corp  멤버 5명  [가입신청]  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  결과 없을 때:                                       │
│  워크스페이스가 없습니다.                            │
│  초대 링크로 진입하세요.                             │
│                                                     │
│  초대링크 감지 시:                                   │
│  초대 링크를 확인하는 중...  [스피너]                │
│                                                     │
│  초대 수락 후:                                       │
│  ✅ 워크스페이스에 참여했습니다! → 이동 중...        │
│                                                     │
│  초대 만료 에러:                                     │
│  ⚠ 이 초대 링크가 만료되었습니다.                   │
│    워크스페이스 오너에게 새 링크를 요청하세요.       │
└─────────────────────────────────────────────────────┘
```

**Spec**:
- Input detects on submit:
  - Pattern `/invite/[uuid]` in URL → call `POST /api/invites/[token]/accept`
  - Pattern `/team/[id]` in URL → extract workspaceId, show join request modal for that workspace
  - Plain text → call `GET /api/workspaces/search?q=[text]`
- Search results: each card shows workspace name, description snippet, member count, "가입신청" button
- "가입신청" click → call `POST /api/workspaces/[id]/join-requests` → show success state
- Success state for join request: check icon + "신청이 완료되었습니다. 오너 승인 후 참여됩니다." message
- Lucide icons: `Search`, `Building2`, `CheckCircle`, `AlertTriangle`, `Users`

---

## Component 5: JoinRequestList (Members 페이지 섹션)

**File**: `src/components/workspace/JoinRequestList.tsx`
**Location**: Rendered in `app/team/[workspaceId]/members/page.tsx` — only when `session.user.role === 'OWNER'`

```
가입 신청 (2건)
─────────────────────────────────────────────────────
┌──────────────────────────────────────────────────┐
│  [Avatar] 홍길동                                  │
│           hong@example.com                        │
│           신청일: 2026-03-05                       │
│                          [거절]  [승인]           │
├──────────────────────────────────────────────────┤
│  [Avatar] 김철수                                  │
│           kim@example.com                         │
│           신청일: 2026-03-04                       │
│                          [거절]  [승인]           │
└──────────────────────────────────────────────────┘
```

**Spec**:
- Section title: "가입 신청 (N건)" — count badge updates in real time
- If N=0: section is hidden entirely
- Avatar: `<Avatar>` component with fallback initials
- "승인" button: `variant=primary`, accent color
- "거절" button: `variant=ghost`, muted color, hover → red tint
- Both buttons: disabled while API call is in flight (prevent double-submit)
- Optimistic UI: immediately remove the row from the list on action
- Rollback: if API fails, re-insert the row and show error toast
- API calls:
  - Approve: `PATCH /api/workspaces/[id]/join-requests/[reqId]` with `{ action: 'APPROVE' }`
  - Reject: `PATCH /api/workspaces/[id]/join-requests/[reqId]` with `{ action: 'REJECT' }`

---

## Page Routing Changes

### app/page.tsx redirect logic

```
User visits /
  └── auth() → session
        ├── no session → redirect('/login')
        ├── userType === null → redirect('/onboarding')
        ├── userType === 'USER' → render personal board (no redirect)
        └── userType === 'WORKSPACE'
              ├── has workspace membership → redirect('/team/[firstWorkspaceId]')
              └── no workspace → redirect('/onboarding/workspace')
```

### New protected routes

| Route | Guard condition |
|-------|----------------|
| `/onboarding` | Authenticated + `userType === null`. If `userType !== null` → redirect to appropriate board |
| `/onboarding/workspace` | Authenticated + `userType === 'WORKSPACE'`. If personal → redirect to `/`. If has workspace → redirect to `/team/[id]` |
