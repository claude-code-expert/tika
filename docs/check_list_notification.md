# Tika — In-App 알림 시스템 구현 체크리스트

> **기준일**: 2026-03-10
> **상태**: Phase 1 구현 완료 (1-5-7 INVITE_RECEIVED 트리거 제외)
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
| 1-1-1 | `in_app_notifications` 테이블 생성 | ✅ | `src/db/schema.ts` | id, userId, workspaceId, type, title, message, link, actorId, refType, refId, isRead, createdAt |
| 1-1-2 | `notification_preferences` 테이블 생성 | ✅ | `src/db/schema.ts` | id, userId, workspaceId, type, inAppEnabled, slackEnabled, telegramEnabled. UNIQUE(userId, workspaceId, type) |
| 1-1-3 | 인덱스 생성 — `in_app_notifications` | ✅ | `migrations/0016_moaning_kingpin.sql` | (userId, isRead), (userId, createdAt DESC), (workspaceId) |
| 1-1-4 | 인덱스 생성 — `notification_preferences` | ✅ | `migrations/0016_moaning_kingpin.sql` | (userId, workspaceId) |
| 1-1-5 | Drizzle 마이그레이션 생성 및 적용 | ✅ | `migrations/0016_moaning_kingpin.sql` | `npm run db:generate` → `npm run db:migrate` 완료 |

### 1-2. 쿼리 레이어

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-2-1 | `bulkCreateInAppNotifications()` — 알림 bulk insert | ✅ | `src/db/queries/inAppNotifications.ts` | 다건 INSERT |
| 1-2-2 | `getInAppNotifications()` — 사용자별 목록 조회 | ✅ | 상동 | 페이지네이션, workspaceId 필터, unreadOnly 옵션, actorName LEFT JOIN |
| 1-2-3 | `getInAppUnreadCount()` — 미읽음 수 | ✅ | 상동 | userId 기반 COUNT |
| 1-2-4 | `markInAppNotificationAsRead()` — 단일 읽음 | ✅ | 상동 | id + userId 조건 |
| 1-2-5 | `markAllInAppNotificationsAsRead()` — 전체 읽음 | ✅ | 상동 | userId 조건 |
| 1-2-6 | `getNotificationPreferences()` — 설정 조회 | ✅ | 상동 | userId + workspaceId → Record<type, boolean> |
| 1-2-7 | `upsertNotificationPreference()` — 설정 변경 | ✅ | 상동 | ON CONFLICT → UPDATE |
| 1-2-8 | `deleteOldInAppNotifications()` — 90일 이전 삭제 | ✅ | 상동 | daysOld 파라미터 (기본 90일) |

### 1-3. 알림 API

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-3-1 | `GET /api/notifications/in-app` — 목록 조회 | ✅ | `app/api/notifications/in-app/route.ts` | ?page, ?limit, ?workspaceId, ?unreadOnly |
| 1-3-2 | `GET /api/notifications/in-app/unread-count` — 미읽음 수 | ✅ | `app/api/notifications/in-app/unread-count/route.ts` | 세션 userId 기반 |
| 1-3-3 | `PATCH /api/notifications/in-app/:id/read` — 단일 읽음 | ✅ | `app/api/notifications/in-app/[id]/read/route.ts` | 본인 알림만 처리 가능 |
| 1-3-4 | `PATCH /api/notifications/in-app/read-all` — 전체 읽음 | ✅ | `app/api/notifications/in-app/read-all/route.ts` | |
| 1-3-5 | `GET /api/notifications/preferences` — 설정 조회 | ✅ | `app/api/notifications/preferences/route.ts` | ?workspaceId |
| 1-3-6 | `PUT /api/notifications/preferences` — 설정 변경 | ✅ | `app/api/notifications/preferences/route.ts` | upsert |
| 1-3-7 | Zod 스키마 추가 | ✅ | `src/lib/validations.ts` | `inAppNotificationQuerySchema`, `updateNotificationPreferenceSchema` |

### 1-4. 알림 생성 헬퍼

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-4-1 | `sendInAppNotification()` 메인 헬퍼 | ✅ | `src/lib/notifications.ts` | actorId 필터(null이면 스킵) → preferences 체크(`getDisabledTypesForUsers`) → bulk insert |
| 1-4-2 | 알림 메시지 템플릿 유틸리티 (14개 빌더) | ✅ | `src/lib/notifications.ts` | `build*Message()` 14종 — 유형별 title/message 생성 함수 (별도 파일 분리 않고 동일 파일 내 구현) |
| 1-4-3 | `NotificationType` 타입 정의 | ✅ | `src/types/index.ts` | `NOTIFICATION_TYPE` 상수 14종 + `NOTIFICATION_REF_TYPE` 상수 |
| 1-4-4 | 수신 대상 결정 로직 — 티켓 기반 | ✅ | 각 API route 내 | `getAssigneeUserIds()` → userIds 배열 → `sendInAppNotification` |
| 1-4-5 | 수신 대상 결정 로직 — 댓글 기반 | ⚠️ | `app/api/tickets/[id]/comments/route.ts` | assignees만 수신 대상 (기존 댓글 작성자는 미포함 — memberId→userId 변환 복잡성으로 보류) |
| 1-4-6 | 수신 대상 결정 로직 — 워크스페이스 기반 | ✅ | 각 API route 내 | `getMembersByWorkspace()` → OWNER 필터 또는 전체 멤버 |

### 1-5. 트리거 연동 (기존 API Route에 후처리 추가)

| # | 트리거 | 알림 유형 | 상태 | 관련 파일 | 상세 내용 |
|---|--------|-----------|------|-----------|-----------|
| 1-5-1 | 티켓 상태 변경 | `TICKET_STATUS_CHANGED` | ✅ | `app/api/tickets/[id]/route.ts` | PATCH 핸들러, status 변경 시 배정자에게 fire-and-forget |
| 1-5-2 | 댓글 생성 | `TICKET_COMMENTED` | ✅ | `app/api/tickets/[id]/comments/route.ts` | POST 핸들러, 배정자에게 알림 |
| 1-5-3 | 담당자 배정 | `TICKET_ASSIGNED` | ✅ | `app/api/tickets/[id]/route.ts` | PATCH 핸들러, prevAssignees vs newAssignees diff → 추가된 사용자에게 |
| 1-5-4 | 담당자 해제 | `TICKET_UNASSIGNED` | ✅ | `app/api/tickets/[id]/route.ts` | PATCH 핸들러, 제거된 사용자에게 |
| 1-5-5 | 티켓 삭제 | `TICKET_DELETED` | ✅ | `app/api/tickets/[id]/route.ts` | DELETE 핸들러, 삭제 전 배정자 조회 후 알림 |
| 1-5-6 | 마감 D-1 경고 | `DEADLINE_WARNING` | ✅ | `app/api/cron/notify-due/route.ts` | 기존 Cron 확장 — actorId: null (시스템 알림) |
| 1-5-7 | 초대 생성 | `INVITE_RECEIVED` | ❌ | `app/api/workspaces/[id]/invites/route.ts` | 메시지 빌더(`buildInviteReceivedMessage`)는 존재하나 invites POST에 트리거 미연결. 초대는 링크 생성만 하고 피초대자에게 in-app 알림 발송 안 함 |
| 1-5-8 | 초대 수락 | `MEMBER_JOINED` | ✅ | `app/api/invites/[token]/accept/route.ts` | POST 핸들러, OWNER들에게 알림 |
| 1-5-9 | 역할 변경 | `ROLE_CHANGED` | ✅ | `app/api/workspaces/[id]/members/[memberId]/route.ts` | PATCH 핸들러, oldRole !== newRole 시 대상 멤버에게 |
| 1-5-10 | 멤버 제거 | `MEMBER_REMOVED` | ✅ | `app/api/workspaces/[id]/members/[memberId]/route.ts` | DELETE 핸들러, 제거된 멤버에게 알림 |
| 1-5-11 | 참여 신청 | `JOIN_REQUEST_RECEIVED` | ✅ | `app/api/workspaces/[id]/join-requests/route.ts` | POST 핸들러, OWNER들에게 알림 |
| 1-5-12 | 참여 신청 승인/거절 | `JOIN_REQUEST_RESOLVED` | ✅ | `app/api/workspaces/[id]/join-requests/[reqId]/route.ts` | PATCH 핸들러, APPROVE/REJECT 각각 신청자에게 알림 |
| 1-5-13 | 스프린트 시작 | `SPRINT_STARTED` | ✅ | `app/api/workspaces/[id]/sprints/[sid]/activate/route.ts` | POST 핸들러, 전체 워크스페이스 멤버에게 |
| 1-5-14 | 스프린트 완료 | `SPRINT_COMPLETED` | ✅ | `app/api/workspaces/[id]/sprints/[sid]/complete/route.ts` | POST 핸들러, 전체 워크스페이스 멤버에게 |

### 1-6. UI — 헤더 알림

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-6-1 | 벨 아이콘 미읽음 뱃지 — `in_app_notifications` 기반으로 전환 | ✅ | `src/components/layout/Header.tsx` | `GET /api/notifications/in-app/unread-count` 호출 |
| 1-6-2 | 알림 드롭다운 — `in_app_notifications` 최근 5건 표시 | ✅ | 상동 | title, message, 상대 시간 표시. 미읽음 배경 #F0FDF4 |
| 1-6-3 | 드롭다운 항목 클릭 → link로 이동 + 읽음 처리 | ✅ | 상동 | `<a href={notif.link}>` + `PATCH /in-app/:id/read` |
| 1-6-4 | "모두 읽음 처리" 버튼 | ✅ | 상동 | `PATCH /in-app/read-all` 호출 + 드롭다운 닫을 때 자동 처리 |
| 1-6-5 | "전체 보기" → /notifications 페이지 이동 | ✅ | 상동 | 드롭다운 하단 Link |

### 1-7. UI — 알림 내역 페이지

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-7-1 | In-App 알림 페이지로 전환 | ✅ | `src/components/notifications/NotificationsPage.tsx` | 외부 채널 이력 → In-App 알림으로 전체 전환 (탭 분리 아닌 교체 방식) |
| 1-7-2 | 워크스페이스 필터 | ❌ | 상동 | 미구현 — 전체 워크스페이스 알림 통합 표시 |
| 1-7-3 | 미읽음 필터 | ✅ | 상동 | 전체 / 미읽음 / 읽음 3단 필터 + 각 건수 표시 |
| 1-7-4 | 알림 목록 (페이지네이션) | ✅ | 상동 | 10건 단위, 알림 유형별 컬러 뱃지(14종), actorName 표시 |
| 1-7-5 | 알림 클릭 → 해당 링크 이동 + 읽음 처리 | ✅ | 상동 | link 필드 기반 `router.push()` + `PATCH /in-app/:id/read` |
| 1-7-6 | 전체 읽음 처리 버튼 | ✅ | 상동 | `PATCH /in-app/read-all` |

### 1-8. UI — 알림 설정

| # | 항목 | 상태 | 관련 파일 | 상세 내용 |
|---|------|------|-----------|-----------|
| 1-8-1 | 설정 페이지에 "알림 설정" 섹션 추가 | ✅ | `src/components/settings/NotificationPreferencesSection.tsx`, `SettingsShell.tsx` | 좌측 내비에 "알림 설정" 항목 추가, 독립 섹션 컴포넌트 |
| 1-8-2 | 카테고리별 on/off 토글 (TICKET / DEADLINE / WORKSPACE / SPRINT) | ✅ | `NotificationPreferencesSection.tsx` | 4개 카테고리 × 14개 알림 유형별 개별 토글 스위치 |
| 1-8-3 | 설정 변경 시 즉시 저장 (PUT /preferences) | ✅ | 상동 | 토글 클릭 즉시 Optimistic UI 업데이트 + `PUT /api/notifications/preferences` 호출 (실패 시 롤백) |
| 1-8-4 | 기본값 표시 (레코드 없으면 활성화 상태로 표시) | ✅ | 상동 | `prefs[type] !== undefined ? prefs[type] : true` — lazy creation 방식 |

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
| 3-6 | notification_logs 기반 이력 조회 | ⚠️ | `GET /api/notifications/logs` | API는 유지. 단, `/notifications` 페이지가 In-App 알림 전용으로 전환되어 외부 채널 이력 UI 경로 없음 |

---

## 4. 구현 우선순위

```
P0 (즉시) — ✅ 완료
 ├─ 1-1: DB 스키마 (in_app_notifications + notification_preferences)
 ├─ 1-2: 쿼리 레이어
 ├─ 1-3: 알림 API
 └─ 1-4: 알림 생성 헬퍼 + 메시지 템플릿

P1 (트리거 연동 — 핵심) — ✅ 완료
 ├─ 1-5-1: 티켓 상태 변경 알림
 ├─ 1-5-2: 댓글 알림
 ├─ 1-5-3/4: 담당자 배정/해제 알림
 └─ 1-5-6: D-1 Cron 확장

P2 (트리거 연동 — 워크스페이스) — ⚠️ 13/14 완료 (INVITE_RECEIVED 미연결)
 ├─ 1-5-7: 초대 알림 ❌
 ├─ 1-5-8: 멤버 참여 알림 ✅
 ├─ 1-5-9: 역할 변경 알림 ✅
 ├─ 1-5-10: 멤버 제거 알림 ✅
 ├─ 1-5-11: 참여 신청 알림 ✅
 └─ 1-5-12: 참여 신청 결과 알림 ✅

P3 (트리거 연동 — 스프린트) — ✅ 완료
 ├─ 1-5-5: 티켓 삭제 알림
 ├─ 1-5-13: 스프린트 시작 알림
 └─ 1-5-14: 스프린트 완료 알림

P4 (UI) — ✅ 완료 (워크스페이스 필터 제외)
 ├─ 1-6: 헤더 알림 벨 전환 ✅
 ├─ 1-7: 알림 내역 페이지 In-App 전환 ✅ (워크스페이스 필터 ❌)
 └─ 1-8: 알림 설정 UI ✅

P5 (Phase 2) — ❌ 미착수
 └─ 2-1~2-11: 개인별 Slack/Telegram
```

---

## 5. 요약

```
Phase 1 완료율: 95% (48/51 항목 완료)

미구현 항목 (3건):
- 1-5-7: INVITE_RECEIVED 트리거 미연결 (빌더 존재, API 연결만 필요)
- 1-7-2: 알림 내역 페이지 워크스페이스 필터 미구현
- 1-4-5: 댓글 알림 수신자에 기존 댓글 작성자 미포함 (assignees만)

Phase 2 완료율: 0% (11건 전체 미착수)
```

---

*이 문서는 소스코드 직접 검증 결과를 기반으로 작성됨. 최종 업데이트: 2026-03-10*
