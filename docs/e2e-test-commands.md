# E2E 테스트 명령어 (화면 단위)

> Playwright 기반 E2E 테스트
> 테스트 파일 위치: `tests/e2e/pages/`
> 로컬 서버: `http://localhost:3000` (사전 실행 필요)

---

## 공통 실행 옵션

| 옵션 | 설명 |
|------|------|
| _(없음)_ | 헤드리스 모드 (빠름, CI 기본) |
| `--headed` | 브라우저 화면 표시 |
| `--ui` | Playwright UI 모드 (단계별 타임라인) |
| `PWDEBUG=1` | 디버그 모드 (중단점, 단계 실행) |

---

## 전체 테스트 실행

```bash
# 전체 E2E 한 번에 실행
npx playwright test

# 브라우저 보면서 실행
npx playwright test --headed

# UI 모드 (테스트 선택 · 재생 · 타임라인)
npx playwright test --ui

# HTML 리포트 확인
npx playwright show-report
```

---

## 화면별 테스트 명령어

### 1. 칸반 보드 — `/workspace/[id]/board`

```bash
# 기본 보드 구조 테스트 (5개)
# - 4개 칼럼 렌더링
# - "+ 새 업무" 버튼 존재
# - 제목 없이 제출 시 모달 유지
# - 제목 입력 후 티켓 생성
# - 티켓 카드 클릭 → 상세 모달 열림
npx playwright test board.spec.ts

# 브라우저로 보기
npx playwright test board.spec.ts --headed
```

---

### 2. 새 업무 생성 폼 — `/workspace/[id]/board` (모달)

```bash
# 새 업무 생성 전체 폼 플로우 테스트 (9개)
# - 타입 버튼 선택 (Task / Feature / Goal)
# - 제목 필수 검증
# - 전체 폼 입력 → 백로그 생성 확인
#   (타입 · 제목 · 설명 · 우선순위 · 시작일 · 종료일 · 담당자)
# - 종료일 < 시작일 에러 표시
# - 취소 버튼
# - 우선순위 4종 선택 (LOW / MEDIUM / HIGH / CRITICAL)
npx playwright test board-create-ticket.spec.ts

# 브라우저로 보기
npx playwright test board-create-ticket.spec.ts --headed
```

---

### 3. 티켓 상세 조회 & 수정 — `/workspace/[id]/board` (모달)

```bash
# 티켓 수정 전체 플로우 테스트 (5개)
# - 티켓 카드 클릭 → 상세 모달 열림 (제목 · 상태 · 우선순위 필드 확인)
# - 제목 수정 후 저장 → 보드 카드에 반영
# - 전체 필드 수정 (제목 · 설명 · 상태 · 우선순위 · 시작일 · 종료일)
# - 담당자 검색창 열림 확인
# - ESC 키 → 모달 닫힘
npx playwright test ticket-edit.spec.ts

# 브라우저로 보기
npx playwright test ticket-edit.spec.ts --headed
```

---

### 4. 멤버 페이지 — `/workspace/[id]/members`

```bash
# 멤버 페이지 테스트 (5개)
# - 페이지 로드 또는 권한 없으면 리다이렉트
# - "워크스페이스 멤버" 헤딩 표시
# - 멤버 목록 + 역할 배지 표시
# - OWNER 계정: 초대 링크 생성 버튼
# - 요약 통계 카드 (총 할당 티켓 · 완료 티켓)
npx playwright test members.spec.ts

# 브라우저로 보기
npx playwright test members.spec.ts --headed
```

---

### 5. 설정 — `/settings`

```bash
# 설정 페이지 전체 테스트 (11개)
# [일반 설정]
# - 3개 탭 표시 확인
# - 프로젝트 이름 수정 → 저장 → 성공 토스트
# - 프로젝트 설명 수정 → 저장 → 성공 토스트
# - 아이콘 색상 변경 → 저장 → 성공 토스트
# [알림 설정]
# - 카테고리 헤더 (티켓 · 마감일 · 워크스페이스) 표시
# - 알림 토글 클릭 → 켜기/끄기 상태 반전
# [라벨 관리]
# - "+ 새 라벨 추가" → 입력 폼 노출
# - 라벨 이름 입력 → 추가 → 목록 반영
# - 라벨 삭제 → 확인 다이얼로그 → 목록 제거
# - "기본 라벨 자동 생성" → 다이얼로그 열림/닫힘
# - 기본 라벨 자동 생성 확인 → 토스트 표시
npx playwright test settings.spec.ts

# 브라우저로 보기
npx playwright test settings.spec.ts --headed
```

---

### 6. 알림 — `/notifications`

```bash
# 알림 페이지 테스트 (2개)
# - 페이지 로드 확인
# - 알림 목록 또는 빈 상태 메시지 표시
npx playwright test notifications.spec.ts

# 브라우저로 보기
npx playwright test notifications.spec.ts --headed
```

---

### 7. WBS — `/workspace/[id]/wbs`

```bash
# WBS 페이지 테스트 (3개)
# - Goal 통계 카드 표시
# - "작업 항목" 컬럼 헤더 표시
# - 티켓 행 또는 빈 상태 메시지 표시
npx playwright test wbs.spec.ts

# 브라우저로 보기
npx playwright test wbs.spec.ts --headed
```

---

### 8. Analytics — `/workspace/[id]/analytics`

```bash
# 분석 페이지 테스트 (3개)
# - 페이지 로드 확인
# - 주요 통계 요소 표시
# - 차트 영역 렌더링
npx playwright test analytics.spec.ts

# 브라우저로 보기
npx playwright test analytics.spec.ts --headed
```

---

## 그룹별 실행

```bash
# 보드 관련 전체 (board + create + edit)
npx playwright test board

# 보드 관련 브라우저로 보기
npx playwright test board --headed

# 설정 + 멤버 + 알림
npx playwright test settings members notifications

# 설정 + 멤버 + 알림 브라우저로 보기
npx playwright test settings members notifications --headed
```

---

## 디버그 모드

```bash
# 특정 테스트 디버그 (중단점 · 단계 실행)
PWDEBUG=1 npx playwright test settings.spec.ts
PWDEBUG=1 npx playwright test ticket-edit.spec.ts
PWDEBUG=1 npx playwright test board-create-ticket.spec.ts

# 특정 테스트만 실행 (--grep)
npx playwright test --grep "라벨 삭제"
npx playwright test --grep "전체 폼 입력"
npx playwright test --grep "제목 수정 후 저장"
```

---

## 테스트 결과 확인

```bash
# HTML 리포트 열기 (마지막 실행 결과)
npx playwright show-report

# 실패한 테스트만 재실행
npx playwright test --last-failed
```

---

## 파일 구조 요약

```
tests/e2e/
├── fixtures/
│   └── base.ts                    # 인증된 page, workspaceId, memberId 픽스처
├── global.setup.ts                # JWT 쿠키 생성 (Google 로그인 대체)
├── .auth/
│   └── user.json                  # 저장된 인증 상태 (gitignore)
└── pages/
    ├── board.spec.ts              # 칸반 보드 기본 (5개)
    ├── board-create-ticket.spec.ts # 새 업무 생성 폼 (9개)
    ├── ticket-edit.spec.ts        # 티켓 수정 (5개)
    ├── members.spec.ts            # 멤버 페이지 (5개)
    ├── settings.spec.ts           # 설정 페이지 (11개)
    ├── notifications.spec.ts      # 알림 페이지 (2개)
    ├── wbs.spec.ts                # WBS 페이지 (3개)
    └── analytics.spec.ts          # Analytics 페이지 (3개)
```

**총 43개 테스트**
