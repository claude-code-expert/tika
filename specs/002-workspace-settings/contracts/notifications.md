# API Contract: Notification Channels

## GET /api/notifications

현재 워크스페이스의 알림 채널 목록(최대 2개: slack, telegram)을 반환한다.

### Authentication
세션 필수. 미인증 시 401 반환.

### Response

**200 OK**
```json
{
  "channels": [
    {
      "id": 1,
      "workspaceId": 1,
      "type": "slack",
      "config": { "webhookUrl": "https://hooks.slack.com/services/..." },
      "enabled": true,
      "createdAt": "2026-02-25T00:00:00.000Z",
      "updatedAt": "2026-02-25T00:00:00.000Z"
    },
    {
      "id": 2,
      "workspaceId": 1,
      "type": "telegram",
      "config": { "botToken": "...", "chatId": "@channel" },
      "enabled": false,
      "createdAt": "2026-02-25T00:00:00.000Z",
      "updatedAt": "2026-02-25T00:00:00.000Z"
    }
  ]
}
```

설정이 없는 채널 타입은 결과에 포함되지 않는다 (빈 배열 가능).

---

## PUT /api/notifications/[type]

알림 채널을 생성하거나 업데이트한다 (upsert).

**Path params**: `type` — `slack` | `telegram`

### Request

**Slack:**
```json
{
  "type": "slack",
  "config": { "webhookUrl": "https://hooks.slack.com/services/T.../B.../..." },
  "enabled": true
}
```

**Telegram:**
```json
{
  "type": "telegram",
  "config": { "botToken": "123456:ABC...", "chatId": "@mychannel" },
  "enabled": false
}
```

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| type | "slack" \| "telegram" | ✓ | URL path와 일치해야 함 |
| config | object | ✓ | type별 형식 (아래 참조) |
| enabled | boolean | ✓ | |

**Slack config 제약**: `webhookUrl`은 `https://hooks.slack.com/`으로 시작하는 유효한 URL

**Telegram config 제약**: `botToken`, `chatId` 모두 비어있지 않아야 함

**활성화 시 config 필수**: `enabled: true`인데 config가 비어있으면 400 반환

### Response

**200 OK** — 업데이트 성공
```json
{
  "channel": {
    "id": 1,
    "workspaceId": 1,
    "type": "slack",
    "config": { "webhookUrl": "https://hooks.slack.com/services/..." },
    "enabled": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**400 VALIDATION_ERROR**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "유효한 Slack Webhook URL을 입력하세요" } }
```

**400 CONFIG_REQUIRED** — enabled: true인데 config 미입력
```json
{ "error": { "code": "CONFIG_REQUIRED", "message": "활성화하려면 설정값을 입력해야 합니다" } }
```

---

## POST /api/notifications/[type]/test

지정된 채널 타입으로 테스트 메시지를 발송한다.

**Path params**: `type` — `slack` | `telegram`

### Request

요청 body 없음. 서버에서 DB에 저장된 현재 설정으로 발송.

### Response

**200 OK** — 발송 성공
```json
{ "success": true, "message": "테스트 메시지가 발송되었습니다" }
```

**400 NOT_CONFIGURED** — 해당 채널 설정이 없음
```json
{ "error": { "code": "NOT_CONFIGURED", "message": "알림 채널 설정이 없습니다" } }
```

**502 EXTERNAL_ERROR** — 외부 API 호출 실패
```json
{ "error": { "code": "EXTERNAL_ERROR", "message": "Slack 발송에 실패했습니다. Webhook URL을 확인하세요" } }
```
