# Research: 워크스페이스 설정 페이지

**Feature**: 002-workspace-settings | **Date**: 2026-02-25

## 기존 구현 현황 분석

### 라벨 API (이미 완전 구현)

| 엔드포인트 | 상태 |
|-----------|------|
| GET /api/labels | ✅ 구현됨 |
| POST /api/labels | ✅ 구현됨 (20개 제한, 중복명 검증 포함) |
| PATCH /api/labels/[id] | ✅ 구현됨 |
| DELETE /api/labels/[id] | ✅ 구현됨 |

**차이점**: `getLabelsByWorkspace`가 ticket_count를 반환하지 않음. `ticketLabels` JOIN이 필요.

### 멤버 API (부분 구현)

| 엔드포인트 | 상태 |
|-----------|------|
| GET /api/members | ✅ 구현됨 |
| PATCH /api/members/[id] | ❌ 미구현 (displayName/color만 있음, role 변경 없음) |
| DELETE /api/members/[id] | ❌ 미구현 |

**차이점**: `members` 테이블에 `role` 컬럼 없음. `getMembersByWorkspace`가 `users.email`을 JOIN하지 않음.

### 워크스페이스 API (부분 구현)

| 엔드포인트 | 상태 |
|-----------|------|
| GET /api/workspaces | ✅ 구현됨 |
| PATCH /api/workspaces/[id] | ❌ 미구현 |

**차이점**: `workspaces` 테이블에 `description` 컬럼 없음.

### 알림 채널 (미구현)

- `notification_channels` 테이블 없음
- 관련 API 없음

---

## 기술 결정

### Decision 1: 알림 채널 config 저장 방식

- **Decision**: `TEXT` 컬럼에 JSON 문자열로 저장 (`jsonb` 아님)
- **Rationale**: Vercel Postgres (Neon)는 jsonb 지원하지만 Drizzle ORM 0.38에서 jsonb 타입 사용 시 복잡성 증가. Phase 1에서는 config 필드에 직접 쿼리가 없으므로 TEXT + JSON.parse/stringify가 충분.
- **Alternatives considered**: `jsonb` — 쿼리 편의성 높지만 현재 요구사항에서 불필요.

### Decision 2: 알림 채널 upsert vs insert/update 분리

- **Decision**: `PUT /api/notifications/[type]` 단일 엔드포인트로 upsert (INSERT ON CONFLICT DO UPDATE)
- **Rationale**: 채널은 workspace당 type별로 최대 1개로 고정(slack 1개, telegram 1개). 생성/수정 구분이 무의미.
- **Alternatives considered**: POST/PATCH 분리 — 불필요한 복잡성.

### Decision 3: 멤버 role 컬럼 추가 위치

- **Decision**: `members` 테이블에 `role VARCHAR(10) NOT NULL DEFAULT 'member'` 추가
- **Rationale**: 역할은 워크스페이스 멤버십에 종속된 속성. 별도 테이블 불필요.
- **Alternatives considered**: 별도 `member_roles` 테이블 — YAGNI 위반.

### Decision 4: 설정 페이지 라우팅 방식

- **Decision**: `/settings` 신규 라우트 (`app/settings/page.tsx`). 내부 섹션은 URL 변경 없는 탭 방식 (`useState`).
- **Rationale**: spec FR-S02 명시. 단순성 유지.
- **Alternatives considered**: `/settings/general`, `/settings/labels` 등 URL 기반 라우팅 — 과도한 복잡성.

### Decision 5: Toast 알림 구현 방식

- **Decision**: `SettingsShell.tsx` 내 로컬 `useState`로 Toast 상태 관리. 기존 Tailwind CSS 클래스 기반.
- **Rationale**: 설정 페이지 전용. 전역 Toast 시스템 불필요 (다른 페이지에서 미사용). 신규 라이브러리 없음.
- **Alternatives considered**: 전역 Context — YAGNI.

### Decision 6: Slack/Telegram 테스트 발송 구현

- **Decision**: 서버사이드에서 직접 HTTP fetch로 Slack webhook / Telegram API 호출. 외부 라이브러리 없음.
- **Rationale**: `npm install --no-approval` 금지. fetch API는 Node.js 18+ 내장.
- **Alternatives considered**: axios, node-fetch — 신규 의존성.

### Decision 7: 라벨 삭제 시 ticket count 표시

- **Decision**: `getLabelsByWorkspaceWithCount` 쿼리 추가. `ticketLabels`를 LEFT JOIN하여 count 반환.
- **Rationale**: spec FR-L01, FR-L04 요구사항. 별도 API 호출 없이 목록 조회 시 포함.
- **Alternatives considered**: 삭제 직전 별도 count API 호출 — 불필요한 왕복.

---

## 스키마 변경 요약

| 테이블 | 변경 | 영향 |
|--------|------|------|
| `workspaces` | `description TEXT` 추가 | 기존 데이터: NULL로 채워짐 |
| `members` | `role VARCHAR(10) DEFAULT 'member'` 추가 | 기존 데이터: 'member'로 채워짐 (최초 사용자 → 'admin'으로 수동 업데이트 또는 seed) |
| `notification_channels` | 신규 테이블 | — |

**주의**: 기존 워크스페이스 소유자(ownerId 기준)를 'admin'으로 설정하는 로직이 필요. 마이그레이션 후 `members.role`을 조건부로 업데이트하는 seed/migration script 필요.

---

## 외부 API 참조

### Slack Incoming Webhook
```
POST https://hooks.slack.com/services/{token}
Content-Type: application/json
Body: { "text": "메시지 내용" }
```
- 성공: HTTP 200, body `"ok"`
- 실패: HTTP 4xx/5xx 또는 `"no_text"`

### Telegram Bot API
```
POST https://api.telegram.org/bot{token}/sendMessage
Content-Type: application/json
Body: { "chat_id": "...", "text": "메시지 내용" }
```
- 성공: `{ "ok": true }`
- 실패: `{ "ok": false, "description": "..." }`

---

## 위험 요소

| 위험 | 완화 방법 |
|------|---------|
| `members.role` 컬럼 추가 후 기존 소유자 role 설정 | 마이그레이션에 UPDATE 쿼리 포함 (`workspaces.owner_id` 기준) |
| Slack/Telegram webhook URL 유출 | DB에만 저장, 클라이언트에 평문 반환 (현재 단일 사용자 MVP) |
| 외부 API 호출 타임아웃 | 테스트 발송 API에 5초 타임아웃 적용 |
