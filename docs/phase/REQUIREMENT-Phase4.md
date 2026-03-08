# Phase 4 — 알림 채널 (Notification Channels)

> Phase 3에서 UI/API가 구현되었으나, 이번 단계에서는 비활성화 처리함.
> Phase 4에서 복원하여 정식 출시 예정.

## 개요

마감일 D-1 알림을 Slack, Telegram 채널로 전송하는 기능.
워크스페이스 설정 → 알림 채널 탭에서 설정/테스트/저장할 수 있다.

## 주석 처리된 코드 위치

### 1. 설정 메뉴 (SettingsShell)

**파일:** `src/components/settings/SettingsShell.tsx`

- `NAV_ITEMS` 배열에서 `notifications` 항목 주석 처리
- `sectionRenderers`에서 `notifications` 키 주석 처리
- `NotificationSection` import 주석 처리
- 검색 키워드: `Phase 4: 알림 채널`

### 2. SectionKey 타입

**파일:** `src/components/settings/types.ts`

- `SectionKey` 타입에서 `'notifications'` 제거됨
- 복원 시: `'general' | 'notifications' | 'labels' | 'members'`로 변경

### 3. NotificationSection 컴포넌트

**파일:** `src/components/settings/NotificationSection.tsx`

- 파일 자체는 그대로 유지 (삭제하지 않음)
- Slack/Telegram 설정 UI, 토글, 테스트 발송, 저장 기능 포함
- 의존 타입: `NotificationChannel`, `SlackConfig`, `TelegramConfig` (`@/types/index`)

### 4. API 라우트

**파일들:** (삭제하지 않음, 그대로 유지)

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `app/api/notifications/route.ts` | GET | 워크스페이스 알림 채널 목록 조회 |
| `app/api/notifications/[type]/route.ts` | PUT | 채널 설정 저장 (slack/telegram) |
| `app/api/notifications/[type]/test/route.ts` | POST | 테스트 메시지 발송 |
| `app/api/notifications/logs/route.ts` | GET | 알림 로그 조회 |

### 5. DB 스키마

**파일:** `src/db/schema.ts`

- `notification_channels` 테이블: 워크스페이스별 채널 설정 (type, config JSON, enabled)
- `notification_logs` 테이블: 발송 이력 (status, sentAt, errorMessage, isRead)
- 스키마는 그대로 유지 (테이블 삭제하지 않음)

### 6. 관련 타입

**파일:** `src/types/index.ts`

```typescript
interface NotificationChannel {
  id: number;
  workspaceId: number;
  type: 'slack' | 'telegram';
  config: SlackConfig | TelegramConfig;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SlackConfig {
  webhookUrl: string;
}

interface TelegramConfig {
  botToken: string;
  chatId: string;
}
```

## 복원 절차

1. `src/components/settings/types.ts` — `SectionKey`에 `'notifications'` 추가
2. `src/components/settings/SettingsShell.tsx` — 3곳 주석 해제:
   - `NotificationSection` import
   - `NAV_ITEMS`의 notifications 항목
   - `sectionRenderers`의 notifications 렌더러
3. 기능 테스트: 설정 페이지에서 알림 채널 탭 표시 확인
4. Slack/Telegram 테스트 발송 정상 동작 확인
