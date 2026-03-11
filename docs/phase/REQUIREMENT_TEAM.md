# Tika — Team Pro 티어 요구사항

> **버전**: Team Pro (v0.3.x)
> **레포지토리**: 별도 레포 (현재 tika 레포에서 개발하지 않음)
> **작성일**: 2026-03-11
> **전제**: Workspace 티어의 모든 기능을 포함하며, 아래 기능을 추가로 제공한다.

---

## 1. 티어 개요

| 항목                          | 내용                   |
| ----------------------------- | ---------------------- |
| 대상                          | 중소 규모 팀, 스타트업 |
| 팀 워크스페이스               | 최대 **200개**         |
| 워크스페이스당 티켓           | **무제한**             |
| Workspace 티어 대비 추가 기능 | 아래 섹션 참조         |

---

## 2. 추가 기능 목록

### 2.1 Markdown 에디터

**개요**: 티켓 설명(description) 입력 시 마크다운 기반 리치 텍스트 에디터를 제공한다.

**지원 서식**:

| 서식        | 마크다운        | 툴바 버튼    |
| ----------- | --------------- | ------------ |
| 제목 1~3    | `# / ## / ###`  | H1 / H2 / H3 |
| 굵게        | `**텍스트**`    | B            |
| 기울임      | `*텍스트*`      | I            |
| 밑줄        | 에디터 전용     | U            |
| 취소선      | `~~텍스트~~`    | S            |
| 링크        | `[텍스트](URL)` | Link         |
| 글머리 기호 | `- 항목`        | List         |
| 체크리스트  | `- [ ] 항목`    | Checklist    |
| 코드 블록   | ` ```코드``` `  | Code         |
| 서식 초기화 | —               | Clear        |

**처리 규칙**:

- 마크다운 원본 DB 저장, 렌더링 시 HTML 변환
- description 최대 길이: 5,000자 (Workspace 티어 1,000자 → 확장)
- XSS 방지: 허용 태그 화이트리스트 처리
- 편집 / 미리보기 탭 전환

**구현 참고**: Tiptap 또는 @uiw/react-md-editor 도입

---

### 2.2 이미지 및 파일 첨부

**개요**: 티켓에 파일을 첨부하고 다운로드할 수 있다.

**제약 조건**:

| 항목                | 제한                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------- |
| 파일당 최대 크기    | 10 MB                                                                                 |
| 티켓당 최대 파일 수 | 10개                                                                                  |
| 허용 확장자         | 이미지 (jpg, png, gif, webp), 문서 (pdf, doc, docx, xls, xlsx), 텍스트 (txt, md, csv) |

**처리 규칙**:

- 클라우드 스토리지 업로드 (Vercel Blob 또는 S3)
- 이미지 파일 썸네일 미리보기
- 에디터 내 이미지 인라인 삽입 지원
- 드래그 앤 드롭 업로드
- 티켓 삭제 시 첨부 파일 CASCADE 삭제 (스토리지 정리)

**DB 테이블**: `attachments`

| 컬럼       | 타입                 | 설명         |
| ---------- | -------------------- | ------------ |
| id         | SERIAL PK            |              |
| ticket_id  | INTEGER FK → tickets |              |
| file_name  | VARCHAR              | 원본 파일명  |
| file_url   | TEXT                 | 스토리지 URL |
| file_size  | INTEGER              | 바이트 단위  |
| mime_type  | VARCHAR              | MIME 타입    |
| created_at | TIMESTAMPTZ          |              |

**API**:

- `POST /api/tickets/[id]/attachments` — 파일 업로드
- `GET /api/attachments/[id]` — 파일 다운로드
- `DELETE /api/attachments/[id]` — 파일 삭제

---

### 2.3 Slack · Telegram 실시간 알림

**개요**: 마감일 D-1 알림 및 티켓 이벤트를 Slack/Telegram 채널로 전송한다.

**알림 채널**:

| 채널     | 설정 정보            |
| -------- | -------------------- |
| Slack    | Incoming Webhook URL |
| Telegram | Bot Token + Chat ID  |

**알림 트리거**:

- 마감일 D-1 경고 (Cron, 매일 09:00)
- 티켓 상태 변경
- 댓글 작성
- 담당자 지정/해제
- 멤버 초대 수락

**처리 규칙**:

- 워크스페이스 설정 > 알림 채널 탭에서 설정/테스트/저장
- 채널별 활성화/비활성화 토글
- 테스트 메시지 발송 기능
- 개인별 알림 선호도와 별개 (워크스페이스 레벨 알림)

**DB 테이블**: `notification_channels` (type, config JSON, enabled, workspaceId)

**API**:

- `GET /api/notifications` — 채널 목록 조회
- `PUT /api/notifications/[type]` — 채널 설정 저장 (slack / telegram)
- `POST /api/notifications/[type]/test` — 테스트 메시지 발송
- `GET /api/notifications/logs` — 발송 이력 조회

---

### 2.4 MCP 서버 연동

**개요**: AI 기반 개발 도구(Claude Code, Cursor, Windsurf 등)에서 PAT(Personal Access Token) 인증으로 Tika 티켓을 직접 관리한다.

**인증 방식**:

| 항목      | 내용                                      |
| --------- | ----------------------------------------- |
| 인증 수단 | Personal Access Token (PAT)               |
| 토큰 형식 | `tika_pat_` 접두사 + 랜덤 문자열 (256bit) |
| 만료      | 30일 / 90일 / 1년 / 무기한                |
| 권한 범위 | 본인 계정의 모든 티켓 읽기/쓰기           |

**MCP 도구 목록 (9개)**:

| 도구                    | 설명                         |
| ----------------------- | ---------------------------- |
| `tika_list_tickets`     | 보드 전체 티켓 조회 (칼럼별) |
| `tika_get_ticket`       | 단일 티켓 상세 조회          |
| `tika_create_ticket`    | 티켓 생성                    |
| `tika_update_ticket`    | 티켓 수정                    |
| `tika_move_ticket`      | 티켓 상태 변경 (칼럼 이동)   |
| `tika_delete_ticket`    | 티켓 삭제                    |
| `tika_list_labels`      | 라벨 목록 조회               |
| `tika_list_parents`     | 상위 티켓 계층 조회          |
| `tika_toggle_checklist` | 체크리스트 항목 토글         |

**배포**: npm 패키지 (`@tika/mcp-server`)

**제약**:

- Rate Limit: 분당 60회 (429 Too Many Requests)
- HTTPS 필수
- `last_used_at` 매 요청 시 갱신

**DB 테이블**: `api_tokens` (userId, name, tokenHash, tokenPrefix, expiresAt, lastUsedAt)

**API**:

- `POST /api/settings/tokens` — PAT 발급 (1회 노출)
- `GET /api/settings/tokens` — 목록 조회
- `DELETE /api/settings/tokens/[id]` — 폐기

---

### 2.5 자동화 워크플로우

**개요**: 트리거 → 조건 → 액션 형태의 자동화 규칙을 설정한다.

**구조**:

```
트리거 (When) → 조건 (If) → 액션 (Then)
```

**트리거 예시**:

- 티켓 상태가 변경되면
- 마감일이 X일 이내면
- 담당자가 지정되면

**조건 예시**:

- 우선순위가 CRITICAL이면
- 타입이 TASK이면
- 특정 라벨이 있으면

**액션 예시**:

- 상태를 IN_PROGRESS로 변경
- 특정 멤버에게 담당자 지정
- 알림 발송

**DB 테이블**: `automation_rules` (workspaceId, name, trigger, conditions JSON, actions JSON, enabled)

---

### 2.6 스위밍 레인

**개요**: 칸반 보드에 가로 행(Swimming Lane)을 추가하여 팀/역할/프로젝트 단위로 티켓을 그룹핑한다.

**기능 상세**:

| 항목 | 설명 |
|------|------|
| 레인 CRUD | OWNER만 생성/수정/삭제 가능 |
| 레인 구성 | 이름(1~50자), 배경색(HEX), WIP 제한(null=무제한) |
| 순서 변경 | 드래그앤드롭으로 레인 순서 변경 |
| 독립 칼럼 구조 | 각 레인은 Backlog/TODO/IN_PROGRESS/DONE 4칼럼을 독립적으로 가짐 |
| 기본 레인 | 최소 1개 필수 (삭제 불가) |
| 레인 삭제 | 하위 티켓 다른 레인으로 이동 후 삭제 가능 |
| WIP 제한 연계 | 레인별 IN_PROGRESS 제한 초과 시 경고 표시 (이동 차단하지 않음) |

---

### 2.7 스프린트 관리

**개요**: OWNER가 스프린트를 생성하고 팀의 작업 단위를 관리한다.

**스프린트 상태 전이**:
```
PLANNED → ACTIVE → COMPLETED
```

**생성 제약**:
- 스프린트명 자동 채번: `Sprint-N` (단조 증가, 삭제 후 재사용 없음)
- PLANNED + ACTIVE 합산 최대 10개 제한 (COMPLETED는 미포함)
- 날짜 중복 금지: 기존 스프린트와 하루라도 겹치면 생성 불가
- 주 단위(1W/2W/3W/4W) 또는 커스텀 날짜 입력 방식 지원

**활성화 제약**:
- 동시에 ACTIVE 스프린트는 1개만 허용
- 시작일이 미래여도 수동 활성화 가능

**완료 처리**:
- 미완료 티켓 처리 옵션 선택 필수:
  - `MOVE_TO_BACKLOG`: 연결 해제 + BACKLOG 상태로 변경
  - `MOVE_TO_NEXT_SPRINT`: 다음 PLANNED 스프린트로 이동 (기존 status 유지)
- 미완료 티켓 0개이면 즉시 완료
- 완료 후 재열기 불가, 단일 트랜잭션으로 원자성 보장

**스프린트 보드 뷰**:
- 보드 상단 드롭다운으로 스프린트 필터 전환
- ACTIVE 스프린트 기본 선택, "전체 보드" 옵션 포함
- 배너: 스프린트 이름, 기간, 남은 일수(D-N), 완료율

**DB 테이블**: `sprints` (workspaceId, name, status, startDate, endDate, startedAt, completedAt)

**에러 코드**: `SPRINT_ALREADY_ACTIVE` (409), `SPRINT_DATE_CONFLICT` (409), `SPRINT_LIMIT_EXCEEDED` (422)

**API**:
- `GET/POST /api/workspaces/[id]/sprints` — 목록/생성
- `PATCH/DELETE /api/workspaces/[id]/sprints/[sid]` — 수정/삭제
- `POST /api/workspaces/[id]/sprints/[sid]/activate` — 활성화 (OWNER)
- `POST /api/workspaces/[id]/sprints/[sid]/complete` — 완료 (OWNER)

---

### 2.8 결제 모듈

**개요**: 유료 구독 플랜을 도입하여 Team Pro 기능을 게이팅한다.

**플랜 구조**:

| 플랜 | 가격 | 제한 |
|------|------|------|
| Workspace (무료) | 무료 | 팀 워크스페이스 3개, 티켓 1,000개/워크스페이스 |
| Team Pro | 월 $9.99/사용자 | 팀 워크스페이스 100개, 티켓 무제한, 전체 추가 기능 |

**처리 규칙**:
- 결제 게이트웨이: Stripe 또는 Paddle 연동
- 구독 생성, 변경, 취소 지원
- 결제 성공 시 플랜 즉시 적용 (Webhook 검증 필수)
- 구독 취소 시 현재 기간 종료까지 Team Pro 유지 → 이후 Workspace 플랜으로 전환
- Workspace 플랜 초과 시 업그레이드 안내 모달 표시
- PCI DSS 준수: 결제 정보는 Stripe/Paddle에서만 처리 (서버 미경유)

**DB 테이블**: `subscriptions` (userId, plan, status, currentPeriodStart, currentPeriodEnd), `billing_events`

**API**:
- `POST /api/billing/subscribe` — Checkout 세션 생성
- `POST /api/billing/webhook` — Stripe Webhook 수신
- `GET/PATCH /api/billing/subscription` — 구독 조회/변경
- `POST /api/billing/cancel` — 구독 취소

---

### 2.9 팀 대시보드 강화 (스프린트 연동)

**개요**: Workspace 티어 대시보드에 스프린트 기반 지표를 추가한다.

> Workspace 티어에서 스프린트 기능은 제외되므로, 아래 항목은 Team Pro에서만 제공된다.

**추가 지표**:

| 지표                     | 설명                                           |
| ------------------------ | ---------------------------------------------- |
| 스프린트 번다운 차트     | 스프린트 기간 내 잔여 티켓 수 추이             |
| 스프린트 벨로시티        | 스프린트별 완료 티켓 수/포인트                 |
| 누적 흐름도 (CFD)        | 칼럼별 티켓 누적 흐름                          |
| 스프린트 현황 배너       | 활성 스프린트 진행률 + D-Day                   |
| 스프린트 완료 다이얼로그 | 미완료 티켓 처리 (다음 스프린트 이동 / 백로그) |

**스프린트 DB**: `sprints` (workspaceId, name, startDate, endDate, status, goal)

---

## 3. 워크스페이스 제한 비교

| 항목                | Workspace |   Team Pro   |
| ------------------- | :-------: | :----------: |
| 팀 워크스페이스 수  |    3개    |    100개     |
| 워크스페이스당 티켓 |  1,000개  |    무제한    |
| 파일 첨부           |    ❌     | ✅ (10MB/건) |
| Markdown 에디터     |    ❌     |      ✅      |
| Slack/Telegram 알림 |    ❌     |      ✅      |
| MCP 서버            |    ❌     |      ✅      |
| 자동화 워크플로우   |    ❌     |      ✅      |
| 스위밍 레인         |    ❌     |      ✅      |
| 스프린트 기능       |    ❌     |      ✅      |
| 결제 모듈           |    ❌     |      ✅      |

---

## 4. 참고 문서

- `docs/phase/REQUIREMENT_WORKSPACE.md` — Workspace 티어 전체 요구사항
- `docs/phase/REQUIREMENT_ENTERPRISE.md` — Enterprise 티어 요구사항
