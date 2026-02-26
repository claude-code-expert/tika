# Quickstart: 워크스페이스 설정 페이지

**Feature**: 002-workspace-settings | **Date**: 2026-02-25

## 통합 시나리오

### 시나리오 1: 라벨 관리 전체 흐름

```
1. 사용자가 헤더 설정 아이콘 클릭 → /settings 이동
2. 좌측 Nav에서 "라벨 관리" 클릭
3. GET /api/labels → LabelWithCount 목록 표시 (이름, 색상, 티켓 수)
4. "새 라벨 추가" 클릭 → 인라인 Creator 표시
5. 이름 입력 + 색상 선택 + "추가" 클릭
   → POST /api/labels { name, color }
   → 성공: 목록에 즉시 추가, Toast "라벨이 생성되었습니다"
   → 실패(중복): Toast "이미 존재하는 라벨명입니다"
   → 실패(한도): Toast "라벨은 최대 20개까지 생성할 수 있습니다"
6. 편집 버튼 클릭 → 인라인 편집 모드
   → PATCH /api/labels/{id} { name?, color? }
   → 성공: 목록 즉시 업데이트, Toast "라벨이 수정되었습니다"
7. 삭제 버튼 클릭 → 확인 다이얼로그 (티켓 수 표시)
   → DELETE /api/labels/{id}
   → 성공: 목록에서 제거, Toast "라벨이 삭제되었습니다"
```

### 시나리오 2: Slack 알림 채널 설정

```
1. 설정 페이지 → "알림 채널" 섹션
2. GET /api/notifications → 현재 설정 로드 (없으면 기본값: enabled=false, config=empty)
3. Webhook URL 입력 → 토글 ON → "저장" 클릭
   → PUT /api/notifications/slack { type: "slack", config: { webhookUrl }, enabled: true }
   → 성공: Toast "Slack 설정이 저장되었습니다"
4. "테스트 발송" 클릭
   → POST /api/notifications/slack/test
   → 버튼 로딩 상태 → 결과에 따라 성공(초록)/실패(빨강) 피드백
   → 5초 후 버튼 원복
```

### 시나리오 3: 멤버 관리

```
1. 설정 페이지 → "멤버 관리" 섹션
2. GET /api/members → 멤버 목록 (아바타, 이름, 이메일, 역할, 가입일)
3. 역할 변경 버튼 클릭 → 확인 다이얼로그
   → PATCH /api/members/{id} { role: "admin" | "member" }
   → 성공: 목록 즉시 업데이트, Toast "역할이 변경되었습니다"
   → 실패(마지막 admin): Toast "워크스페이스에 관리자가 최소 1명이어야 합니다"
4. 멤버 초대 버튼 → 이메일 입력 폼 (UI만, 실제 발송 없음)
   → "초대" 클릭 → Toast "초대 기능은 준비 중입니다" (Phase 1 제한)
```

### 시나리오 4: 일반 설정

```
1. 설정 페이지 → "일반 설정" 섹션 (기본값으로 열림)
2. GET /api/workspaces → 현재 워크스페이스 이름, description 표시
3. 이름/설명 수정 → "저장" 클릭
   → PATCH /api/workspaces/{id} { name?, description? }
   → 성공: Toast "설정이 저장되었습니다"
   → 빈 이름 저장: Toast "이름은 1자 이상 입력해야 합니다"
4. 환경 설정 섹션: 드롭다운 UI 표시 (Phase 1: 저장 비활성화)
5. 위험 영역: 버튼 표시, 클릭 시 준비 중 안내 (Phase 1)
```

---

## 컴포넌트 트리

```
app/settings/page.tsx (Server Component)
└── SettingsShell (Client Component)
    ├── SettingsHeader (헤더: 로고 링크 + "설정" 타이틀 + 아바타)
    ├── SettingsSideNav (좌측 Nav: 4개 항목)
    ├── GeneralSection (일반 설정)
    │   ├── WorkspaceInfoCard (이름, 설명, 저장)
    │   ├── EnvSettingsCard (시간대 등 UI, Phase 1: 저장 비활성)
    │   └── DangerZoneCard (초기화/삭제 버튼, Phase 1: 비활성)
    ├── NotificationSection (알림 채널)
    │   ├── SlackChannelCard (Toggle + URL + 테스트 발송 + 저장)
    │   └── TelegramChannelCard (Toggle + Token + ChatID + 테스트 발송 + 저장)
    ├── LabelSection (라벨 관리)
    │   ├── LabelCreatorBox (인라인 생성 폼)
    │   └── LabelList → LabelRow (인라인 편집, 삭제 확인)
    └── MemberSection (멤버 관리)
        ├── InviteBox (이메일 입력, Phase 1: Toast 안내)
        └── MemberList → MemberRow (역할 뱃지, 역할 변경, 제거)
```

---

## 헤더 연결

```typescript
// src/components/layout/Header.tsx
// 설정 버튼: button → Link

import Link from 'next/link';

// 기존 button → Link로 교체
<Link href="/settings" title="설정" style={{ ... }}>
  <svg> ... </svg>
</Link>
```

---

## Toast 구현 패턴

```typescript
// SettingsShell.tsx 내부 상태
const [toast, setToast] = useState<{ message: string; type: 'success' | 'fail' | 'info' } | null>(null);

function showToast(message: string, type: 'success' | 'fail' | 'info' = 'success') {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
}

// JSX
{toast && (
  <div className={`toast show ${toast.type}`}>
    {toast.message}
  </div>
)}
```

---

## 마이그레이션 실행 순서

```bash
# 1. schema.ts 수정 후 (사용자 확인 필요)
npm run db:generate   # 마이그레이션 파일 자동 생성

# 2. 마이그레이션 확인 후
npm run db:migrate    # DB 적용

# 3. (선택) 기존 소유자 role 업데이트
# → 마이그레이션 SQL에 UPDATE 구문 포함되어 자동 처리됨
```

---

## 새 파일 목록

| 파일 | 유형 |
|------|------|
| `app/settings/page.tsx` | 신규 |
| `app/api/workspaces/[id]/route.ts` | 신규 |
| `app/api/notifications/route.ts` | 신규 |
| `app/api/notifications/[type]/test/route.ts` | 신규 |
| `app/api/members/[id]/route.ts` | 신규 |
| `src/components/settings/SettingsShell.tsx` | 신규 |
| `src/components/settings/GeneralSection.tsx` | 신규 |
| `src/components/settings/NotificationSection.tsx` | 신규 |
| `src/components/settings/LabelSection.tsx` | 신규 |
| `src/components/settings/MemberSection.tsx` | 신규 |
| `src/db/queries/workspaces.ts` | 신규 |
| `src/db/queries/notificationChannels.ts` | 신규 |

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/db/schema.ts` | workspaces.description, members.role, notificationChannels 테이블 추가 |
| `src/types/index.ts` | Member.role, Workspace.description, LabelWithCount, MemberWithEmail, NotificationChannel 추가 |
| `src/lib/validations.ts` | updateWorkspaceSchema, upsertNotificationChannelSchema, updateMemberRoleSchema 추가 |
| `src/db/queries/labels.ts` | getLabelsByWorkspaceWithCount 추가 |
| `src/db/queries/members.ts` | getMembersByWorkspace 확장 (email JOIN), updateMemberRole, removeMember, getAdminCount 추가 |
| `src/components/layout/Header.tsx` | 설정 버튼을 Link로 변경 |
