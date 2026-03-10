# Tika — In-App 알림 시스템 구현 체크리스트

> **기준일**: 2026-03-10
> **상태**: 전체 미구현 (설계 완료)
> **참조**: `docs/notification_system_design.md`

---

## 범례

| 아이콘 | 의미 |
|--------|------|
| ✅ | 완전 구현 (API + UI + 검증 모두 완료) |
| ⚠️ | 부분 구현 (API만, 또는 UI만, 또는 로직 불완전) |
| ❌ | 미구현 (코드 없음) |

---

## 목차

1. [Phase 1 — In-App 알림 기반](#1-phase-1--in-app-알림-기반)
   - 1-1: DB 스키마
   - 1-2: 쿼리 레이어
   - 1-3: 알림 API
   - 1-4: 알림 생성 헬퍼
   - 1-5: 트리거 연동
   - 1-6: UI — 헤더 알림
   - 1-7: UI — 알림 내역 페이지
   - 1-8: UI — 알림 설정
2. [Phase 2 — 개인별 Slack/Telegram](#2-phase-2--개인별-slacktelegram)
3. [기존 알림 시스템 (유지)](#3-기존-알림-시스템-유지)

---

## 1. Phase 1 — In-App 알림 기반

### 1-1. DB 스키마

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-1-1 | `in_app_notifications` 테이블 생성 | ❌ | `src/db/schema.ts` | id, userId, workspaceId, type, title, message, link, actorId, refType, refId, isRead, createdAt |
| 1-1-2 | `notification_preferences` 테이블 생성 | ❌ | `src/db/schema.ts` | id, userId, workspaceId, type, inAppEnabled, slackEnabled, telegramEnabled. UNIQUE(userId, workspaceId, type) |
| 1-1-3 | 인덱스 생성 — `in_app_notifications` | ❌ | — | (userId, isRead), (userId, createdAt DESC), (workspaceId) |
| 1-1-4 | 인덱스 생성 — `notification_preferences` | ❌ | — | (userId, workspaceId) |
| 1-1-5 | Drizzle 마이그레이션 생성 및 적용 | ❌ | `migrations/` | `npm run db:generate` → `npm run db:migrate` |

### 1-2. 쿼리 레이어

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-2-1 | `createInAppNotifications()` — 알림 bulk insert | ❌ | `src/db/queries/in-app-notifications.ts` | actorId 제외, preferences 확인 후 bulk insert |
| 1-2-2 | `getInAppNotifications()` — 사용자별 목록 조회 | ❌ | 상동 | 페이지네이션, workspaceId 필터, unreadOnly 옵션 |
| 1-2-3 | `getUnreadCount()` — 미읽음 수 | ❌ | 상동 | userId 기반 COUNT |
| 1-2-4 | `markAsRead()` — 단일 읽음 | ❌ | 상동 | id + userId 조건 |
| 1-2-5 | `markAllAsRead()` — 전체 읽음 | ❌ | 상동 | userId 조건 |
| 1-2-6 | `getNotificationPreferences()` — 설정 조회 | ❌ | `src/db/queries/notification-preferences.ts` | userId + workspaceId |
| 1-2-7 | `upsertNotificationPreference()` — 설정 변경 | ❌ | 상동 | ON CONFLICT → UPDATE |
| 1-2-8 | `deleteOldNotifications()` — 90일 이전 삭제 | ❌ | `src/db/queries/in-app-notifications.ts` | Cron 또는 수동 배치용 |

### 1-3. 알림 API

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-3-1 | `GET /api/notifications/in-app` — 목록 조회 | ❌ | `app/api/notifications/in-app/route.ts` | ?page, ?limit, ?workspaceId, ?unreadOnly |
| 1-3-2 | `GET /api/notifications/in-app/unread-count` — 미읽음 수 | ❌ | `app/api/notifications/in-app/unread-count/route.ts` | 세션 userId 기반 |
| 1-3-3 | `PATCH /api/notifications/in-app/:id/read` — 단일 읽음 | ❌ | `app/api/notifications/in-app/[id]/read/route.ts` | 본인 알림만 처리 가능 |
| 1-3-4 | `PATCH /api/notifications/in-app/read-all` — 전체 읽음 | ❌ | `app/api/notifications/in-app/read-all/route.ts` | |
| 1-3-5 | `GET /api/notifications/preferences` — 설정 조회 | ❌ | `app/api/notifications/preferences/route.ts` | ?workspaceId |
| 1-3-6 | `PUT /api/notifications/preferences` — 설정 변경 | ❌ | `app/api/notifications/preferences/route.ts` | upsert |
| 1-3-7 | Zod 스키마 추가 | ❌ | `src/lib/validations.ts` | in-app 알림 쿼리, 설정 변경 검증 |

### 1-4. 알림 생성 헬퍼

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-4-1 | `createNotification()` 메인 헬퍼 | ❌ | `src/lib/notifications.ts` | 수신 대상 결정 → actorId 필터 → preferences 체크 → bulk insert |
| 1-4-2 | 알림 메시지 템플릿 유틸리티 | ❌ | `src/lib/notification-templates.ts` | 유형별 title/message 생성 함수 |
| 1-4-3 | `NotificationType` 타입 정의 | ❌ | `src/types/index.ts` | 14종 알림 유형 코드 상수 |
| 1-4-4 | 수신 대상 결정 로직 — 티켓 기반 | ❌ | `src/lib/notifications.ts` | ticket_assignees → members → users.id |
| 1-4-5 | 수신 대상 결정 로직 — 댓글 기반 | ❌ | 상동 | assignees + 기존 댓글 작성자 (중복 제거) |
| 1-4-6 | 수신 대상 결정 로직 — 워크스페이스 기반 | ❌ | 상동 | OWNER 멤버 전원 |

### 1-5. 트리거 연동 (기존 API Route에 후처리 추가)

| # | 트리거 | 알림 유형 | 상태 | 관련 파일 | 상세 내용 |
|---|--------|-----------|------|-----------|-----------|
| 1-5-1 | 티켓 상태 변경 | `TICKET_STATUS_CHANGED` | ❌ | `app/api/tickets/[id]/route.ts` | PATCH 핸들러, status 변경 시 |
| 1-5-2 | 댓글 생성 | `TICKET_COMMENTED` | ❌ | `app/api/tickets/[id]/comments/route.ts` | POST 핸들러 |
| 1-5-3 | 담당자 배정 | `TICKET_ASSIGNED` | ❌ | `app/api/tickets/[id]/route.ts` 또는 `app/api/tickets/[id]/assignees/route.ts` | 새로 추가된 담당자에게 |
| 1-5-4 | 담당자 해제 | `TICKET_UNASSIGNED` | ❌ | 상동 | 제거된 담당자에게 |
| 1-5-5 | 티켓 삭제 | `TICKET_DELETED` | ❌ | `app/api/tickets/[id]/route.ts` | DELETE 핸들러 (논리 삭제) |
| 1-5-6 | 마감 D-1 경고 | `DEADLINE_WARNING` | ❌ | `app/api/cron/notify-due/route.ts` | 기존 Cron 확장 — in_app_notifications 추가 생성 |
| 1-5-7 | 초대 생성 | `INVITE_RECEIVED` | ❌ | `app/api/workspaces/[id]/invites/route.ts` | POST 핸들러 |
| 1-5-8 | 초대 수락 | `MEMBER_JOINED` | ❌ | `app/api/invite/[token]/route.ts` | POST/PATCH 핸들러 |
| 1-5-9 | 역할 변경 | `ROLE_CHANGED` | ❌ | `app/api/members/[id]/route.ts` | PATCH 핸들러, role 변경 시 |
| 1-5-10 | 멤버 제거 | `MEMBER_REMOVED` | ❌ | `app/api/members/[id]/route.ts` | DELETE 핸들러 |
| 1-5-11 | 참여 신청 | `JOIN_REQUEST_RECEIVED` | ❌ | `app/api/workspaces/[id]/join-requests/route.ts` | POST 핸들러 |
| 1-5-12 | 참여 신청 승인/거절 | `JOIN_REQUEST_RESOLVED` | ❌ | `app/api/join-requests/[id]/route.ts` | PATCH 핸들러 |
| 1-5-13 | 스프린트 시작 | `SPRINT_STARTED` | ❌ | `app/api/workspaces/[id]/sprints/[sid]/activate/route.ts` | POST 핸들러 |
| 1-5-14 | 스프린트 완료 | `SPRINT_COMPLETED` | ❌ | `app/api/workspaces/[id]/sprints/[sid]/complete/route.ts` | POST 핸들러 |

### 1-6. UI — 헤더 알림

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-6-1 | 벨 아이콘 미읽음 뱃지 — `in_app_notifications` 기반으로 전환 | ❌ | `src/components/layout/Header.tsx` | `getUnreadNotificationCount()` → in-app 기반 |
| 1-6-2 | 알림 드롭다운 — `in_app_notifications` 최근 10건 표시 | ❌ | 상동 | 유형별 아이콘, 메시지, 상대 시간 |
| 1-6-3 | 드롭다운 항목 클릭 → link로 이동 + 읽음 처리 | ❌ | 상동 | |
| 1-6-4 | "모두 읽음 처리" 버튼 | ❌ | 상동 | PATCH /in-app/read-all 호출 |
| 1-6-5 | "전체 보기" → /notifications 페이지 이동 | ❌ | 상동 | |

### 1-7. UI — 알림 내역 페이지

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-7-1 | In-App 알림 탭 추가 | ❌ | `src/components/notifications/NotificationsPage.tsx` | 기존 외부 채널 이력과 탭 분리 |
| 1-7-2 | 워크스페이스 필터 | ❌ | 상동 | 드롭다운으로 워크스페이스 선택 |
| 1-7-3 | 미읽음 필터 | ❌ | 상동 | 전체/미읽음 토글 |
| 1-7-4 | 알림 목록 (페이지네이션) | ❌ | 상동 | 20건 단위, 유형별 아이콘 표시 |
| 1-7-5 | 알림 클릭 → 해당 링크 이동 + 읽음 처리 | ❌ | 상동 | link 필드 기반 |
| 1-7-6 | 전체 읽음 처리 버튼 | ❌ | 상동 | |

### 1-8. UI — 알림 설정

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-8-1 | 설정 페이지 알림 탭에 In-App 설정 섹션 추가 | ❌ | `src/components/settings/NotificationSection.tsx` | 기존 워크스페이스 채널 설정 하단에 추가 |
| 1-8-2 | 카테고리별 on/off 토글 (TICKET / DEADLINE / WORKSPACE / SPRINT) | ❌ | 상동 | 각 알림 유형별 체크박스 또는 토글 |
| 1-8-3 | 설정 변경 시 즉시 저장 (PUT /preferences) | ❌ | 상동 | 토글 변경 시 디바운스 후 API 호출 |
| 1-8-4 | 기본값 표시 (레코드 없으면 활성화 상태로 표시) | ❌ | 상동 | lazy creation 방식 |

---

## 2. Phase 2 — 개인별 Slack/Telegram

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 2-1 | `user_notification_channels` 테이블 생성 | ❌ | `src/db/schema.ts` | userId, type('slack'\|'telegram'), config(JSON), enabled. UNIQUE(userId, type) |
| 2-2 | 쿼리: `getUserNotificationChannel()` | ❌ | `src/db/queries/user-notification-channels.ts` | userId + type |
| 2-3 | 쿼리: `upsertUserNotificationChannel()` | ❌ | 상동 | 설정 저장 |
| 2-4 | `GET /api/notifications/channels/me` — 내 채널 조회 | ❌ | `app/api/notifications/channels/me/route.ts` | |
| 2-5 | `PUT /api/notifications/channels/me/slack` — Slack 설정 | ❌ | `app/api/notifications/channels/me/slack/route.ts` | |
| 2-6 | `PUT /api/notifications/channels/me/telegram` — Telegram 설정 | ❌ | `app/api/notifications/channels/me/telegram/route.ts` | |
| 2-7 | `POST /api/notifications/channels/me/slack/test` — 테스트 발송 | ❌ | `app/api/notifications/channels/me/slack/test/route.ts` | |
| 2-8 | `POST /api/notifications/channels/me/telegram/test` — 테스트 발송 | ❌ | `app/api/notifications/channels/me/telegram/test/route.ts` | |
| 2-9 | 알림 생성 헬퍼 확장 — 개인 채널 발송 | ❌ | `src/lib/notifications.ts` | preferences에서 slackEnabled/telegramEnabled 확인 후 발송 |
| 2-10 | UI — 개인 채널 설정 (프로필 또는 설정 페이지) | ❌ | 미정 | Slack Webhook URL, Telegram Bot Token + Chat ID, 활성화 토글, 테스트 버튼 |
| 2-11 | `notification_preferences` 테이블의 slackEnabled/telegramEnabled 활용 | ❌ | — | 유형별 개인 채널 on/off 제어 |

---

## 3. 기존 알림 시스템 (유지)

> 기존 워크스페이스 레벨 알림은 **변경 없이 유지**한다. In-App 알림과 병행 운영한다.

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 3-1 | 워크스페이스 Slack 채널 설정 | ✅ | `NotificationSection.tsx`, `PUT /api/notifications/slack` | 유지 |
| 3-2 | 워크스페이스 Telegram 채널 설정 | ✅ | `NotificationSection.tsx`, `PUT /api/notifications/telegram` | 유지 |
| 3-3 | 채널 활성화/비활성화 토글 | ✅ | `NotificationSection.tsx` | 유지 |
| 3-4 | Slack/Telegram 테스트 발송 | ✅ | `POST /api/notifications/slack/test`, `/telegram/test` | 유지 |
| 3-5 | D-1 Cron — 외부 채널 발송 | ✅ | `app/api/cron/notify-due/route.ts` | 유지 + in_app_notifications 추가 생성 |
| 3-6 | notification_logs 기반 이력 조회 | ✅ | `NotificationsPage.tsx` | "외부 채널 이력" 탭으로 유지 |

---

## 4. 구현 우선순위

```
P0 (즉시)
 ├─ 1-1: DB 스키마 (in_app_notifications + notification_preferences)
 ├─ 1-2: 쿼리 레이어
 ├─ 1-3: 알림 API
 └─ 1-4: 알림 생성 헬퍼 + 메시지 템플릿

P1 (트리거 연동 — 핵심)
 ├─ 1-5-1: 티켓 상태 변경 알림
 ├─ 1-5-2: 댓글 알림
 ├─ 1-5-3/4: 담당자 배정/해제 알림
 └─ 1-5-6: D-1 Cron 확장

P2 (트리거 연동 — 워크스페이스)
 ├─ 1-5-7: 초대 알림
 ├─ 1-5-8: 멤버 참여 알림
 ├─ 1-5-9: 역할 변경 알림
 ├─ 1-5-10: 멤버 제거 알림
 ├─ 1-5-11: 참여 신청 알림
 └─ 1-5-12: 참여 신청 결과 알림

P3 (트리거 연동 — 스프린트)
 ├─ 1-5-5: 티켓 삭제 알림
 ├─ 1-5-13: 스프린트 시작 알림
 └─ 1-5-14: 스프린트 완료 알림

P4 (UI)
 ├─ 1-6: 헤더 알림 벨 전환
 ├─ 1-7: 알림 내역 페이지 In-App 탭
 └─ 1-8: 알림 설정 UI

P5 (Phase 2)
 └─ 2-1~2-11: 개인별 Slack/Telegram
```
