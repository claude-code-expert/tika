---
plan: 01-03
phase: 01-secure-key-management
status: checkpoint
wave: 3
completed_at: 2026-04-11
subsystem: ui
tags: [gemini-key, rbac, settings-shell, state-machine, toast-action]
dependency_graph:
  requires: [01-02]
  provides: [GeminiKeySection UI, OWNER-only AI settings tab, toast with action button]
  affects: []
tech_stack:
  added: []
  patterns: [client-state-machine, RBAC-nav-filter, toast-action-closure, inline-style-component]
key_files:
  created:
    - src/components/settings/GeminiKeySection.tsx
  modified:
    - src/components/settings/types.ts
    - src/components/settings/SettingsShell.tsx
decisions:
  - "ConfirmDialog actual props (title, message, confirmLabel, confirmVariant, onConfirm, onCancel) differ from plan spec (description, confirmText, cancelText, variant, onClose) — used actual component interface"
  - "handleSave previousState tracking uses pre-SAVING state to correctly revert to IDLE_NO_KEY vs REPLACE_MODE on error"
  - "Spin keyframe injected via inline <style> tag matching existing codebase inline-style pattern"
metrics:
  duration: ~40 min
  completed_date: 2026-04-11
  tasks_completed: 2
  files_created: 1
  files_modified: 2
requirements:
  - KEY-01
  - KEY-04
  - KEY-05
  - KEY-07
  - NAV-02
---

# Phase 01 Plan 03: UI Layer Summary

## One-liner

OWNER-only AI settings tab with 6-state GeminiKeySection component — register, view masked, replace, delete Gemini API keys with toast copy-action and full RBAC nav/URL enforcement.

## What Was Built

### Task 1: types.ts + SettingsShell.tsx extensions

`src/components/settings/types.ts`:
- Added `'ai-key'` to `SectionKey` union
- Added `ToastAction` interface (`{ label: string; onClick: () => void }`)
- Extended `SectionProps.showToast` with optional `action?: ToastAction` and `duration?: number` parameters

`src/components/settings/SettingsShell.tsx`:
- Imported `GeminiKeySection` from `./GeminiKeySection`
- Added AI settings nav item (key SVG icon, label "AI 설정") as last item in `NAV_ITEMS`
- Extended `ToastState` with optional `action?: ToastAction` field
- Replaced `showToast` with version supporting action + duration (8000ms default when action present, 3000ms otherwise)
- Added `const isOwner = role === 'OWNER'` before `isViewer`
- Updated `visibleNavItems` filter: `ai-key` requires `isOwner`, others follow existing VIEWER logic
- Updated `initialSection` guard: `!isOwner && rawSection === 'ai-key'` checked before VIEWER guard
- Added `'ai-key': isOwner ? <GeminiKeySection ... /> : null` to `sectionRenderers`
- Extended toast rendering with action button (inherits color, 1px border, clears toast on click)

### Task 2: GeminiKeySection.tsx (444 lines)

Full state machine client component with 6 states: `IDLE_NO_KEY`, `IDLE_HAS_KEY`, `REPLACE_MODE`, `SAVING`, `DELETING`, `DELETE_CONFIRM_OPEN`.

- `useEffect` on mount: GET `/api/settings/gemini-key` → sets `keyMeta` + state
- `handleSave`: POST → on success show toast with clipboard copy action; on error set inline error + revert state
- `handleDelete`: DELETE → on success reset to IDLE_NO_KEY; on error revert to IDLE_HAS_KEY
- Key status card (border, masked key, date, 키 교체 / API 키 삭제 buttons)
- Key input form with password type, eye toggle (aria-label), Enter prevention, inline error zone (`role="alert"`), helper text
- Save button: SAVING state shows spinner + "확인 중...", `aria-busy="true"`, disabled when empty
- Cancel button: only in REPLACE_MODE
- `ConfirmDialog` for delete confirmation with exact copywriting from UI-SPEC
- Date formatted with `toLocaleDateString('ko-KR', { year, month, day })`
- All colors match UI-SPEC: `#629584` accent, `#DC2626` danger, `#2C3E50` text, `#5A6B7F` secondary

## Tasks Completed

| Task | Status | Note |
|------|--------|------|
| Task 1: types.ts + SettingsShell extensions | Complete | Awaiting commit (hook block) |
| Task 2: GeminiKeySection component | Complete | Awaiting commit (hook block) |
| Task 3: Human verification checkpoint | Blocked | Awaiting user review |

## Build Status

`npm run build` — PASS (0 type errors, /settings route compiled successfully)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ConfirmDialog prop interface mismatch**
- **Found during:** Task 2 implementation
- **Issue:** Plan spec used `description`, `confirmText`, `cancelText`, `variant`, `onClose` — but actual `src/components/ui/ConfirmDialog.tsx` uses `message`, `confirmLabel`, `confirmVariant`, `onConfirm`, `onCancel`
- **Fix:** Used actual ConfirmDialog props: `message="삭제 후 AI 기능을 사용하려면 새 키를 다시 등록해야 합니다."`, `confirmLabel="API 키 삭제"`, `confirmVariant="danger"`, `onCancel={() => setUiState('IDLE_HAS_KEY')}`
- **Files modified:** `src/components/settings/GeminiKeySection.tsx`

**2. [Rule 3 - Blocking] git commit hook blocks automated commits**
- **Found during:** Task 1 commit attempt
- **Issue:** `.claude/settings.json` has a `PreToolUse:Bash` hook that blocks `git commit` commands unless explicitly requested by user
- **Status:** Files are implemented and staged. Commits require user authorization or manual execution.

## Known Stubs

없음 — 모든 API 연결이 실제 엔드포인트(`/api/settings/gemini-key`)로 구현되었습니다.

## Threat Flags

없음 — 모든 threat model 항목이 구현에 반영됨:
- T-03-01: `visibleNavItems` OWNER filter + `initialSection` URL redirect
- T-03-02: clipboard write in toast action closure only
- T-03-03: `setToast(null)` on timeout and action click releases `savedKey` reference
- T-03-04: Client RBAC is defense-in-depth; API level enforcement in Plan 02
- T-03-05: Enter key prevented on input; save button disabled when empty

## Self-Check: PASSED

- `src/components/settings/types.ts`: FOUND (12 lines)
- `src/components/settings/SettingsShell.tsx`: FOUND (250 lines)
- `src/components/settings/GeminiKeySection.tsx`: FOUND (444 lines)
- Build: PASSED (no TypeScript errors)
