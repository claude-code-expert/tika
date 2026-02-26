# Implementation Plan: 워크스페이스 설정 페이지

**Branch**: `002-workspace-settings` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-workspace-settings/spec.md`

## Summary

설정 페이지(`/settings`)를 구현한다. 라벨 관리(기존 API 재사용), 알림 채널(신규 테이블/API), 멤버 관리(role 컬럼 추가), 일반 설정(workspace description 추가)의 4개 섹션으로 구성되며, `public/demo/settings.html`을 UI 기준으로 삼는다.

DB 스키마 변경은 Drizzle Kit 마이그레이션으로 적용하며 사용자 확인 후 진행한다.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), Drizzle ORM 0.38, Zod 3.24, NextAuth.js v5
**Storage**: Vercel Postgres (Neon) — PostgreSQL
**Testing**: Jest 29.7 + @testing-library/react 16
**Target Platform**: Vercel (서버리스, Node.js runtime)
**Project Type**: web-service (풀스택 Next.js 앱)
**Performance Goals**: 섹션 전환 즉각, API 응답 < 500ms
**Constraints**: 기존 CLAUDE.md 기술 스택 고정, 신규 라이브러리 도입 금지
**Scale/Scope**: Phase 1 단일 사용자 MVP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Status | Notes |
|---|------|--------|-------|
| I | Spec-Driven: spec.md 및 plan.md 존재 | ✅ PASS | |
| II | TypeScript strict, Zod 입력 검증, `src/types/index.ts` 타입 중앙화 | ✅ PASS | 계획에 명시 |
| III | 모든 API 라우트 세션 검증, 401 즉시 반환 | ✅ PASS | 기존 패턴 준수 |
| IV | 스키마 변경은 Drizzle Kit 마이그레이션 전용, 수동 편집 금지 | ✅ PASS | 마이그레이션 태스크에 명시 |
| V | 신규 라이브러리 없음, 추상화 최소화 | ✅ PASS | 기존 스택만 사용 |
| VI | Optimistic UI + 실패 시 롤백 | ✅ PASS | 설정 저장에 적용 |

**Complexity Tracking**: 위반 없음 — 복잡성 추가 없음.

## Project Structure

### Documentation (this feature)

```text
specs/002-workspace-settings/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── workspaces.md    # PATCH /api/workspaces/[id]
│   ├── notifications.md # /api/notifications/*
│   └── members.md       # PATCH/DELETE /api/members/[id]
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# 기존 파일 수정
src/
├── types/index.ts           ← Member(role 추가), Workspace(description 추가),
│                               NotificationChannel(신규), LabelWithCount(신규)
├── db/
│   ├── schema.ts            ← workspaces(description), members(role), notification_channels(신규)
│   └── queries/
│       ├── labels.ts        ← getLabelsByWorkspaceWithCount 추가
│       ├── members.ts       ← updateMemberRole, removeMember 추가, getMembersByWorkspace join users
│       ├── workspaces.ts    ← 신규: getWorkspaceById, updateWorkspace
│       └── notificationChannels.ts ← 신규: CRUD + test send
├── lib/
│   └── validations.ts       ← updateWorkspaceSchema, upsertNotificationChannelSchema 추가
└── components/
    └── settings/            ← 신규 디렉토리
        ├── SettingsShell.tsx  # 좌측 nav + 섹션 전환
        ├── GeneralSection.tsx
        ├── NotificationSection.tsx
        ├── LabelSection.tsx
        └── MemberSection.tsx

# 기존 파일 수정
src/components/layout/Header.tsx  ← 설정 버튼: button → Link href="/settings"
app/
├── settings/
│   └── page.tsx             ← 신규: 설정 페이지 라우트
└── api/
    ├── workspaces/[id]/route.ts  ← 신규: PATCH
    ├── notifications/
    │   ├── route.ts              ← 신규: GET, PUT
    │   └── [type]/test/route.ts  ← 신규: POST (test send)
    └── members/[id]/route.ts     ← 신규: PATCH (role), DELETE (remove)

migrations/
└── 0001_workspace_settings.sql   ← Drizzle Kit 자동 생성
```

**Structure Decision**: 기존 Next.js App Router 구조 준수. 설정 컴포넌트는 `src/components/settings/`에 도메인별로 분리. 모든 API는 `app/api/` 하위에 신규 라우트로 추가.
