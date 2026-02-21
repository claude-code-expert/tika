# 컴포넌트 작업 규칙

`src/components/` 하위 파일 작업 시 자동 적용되는 규칙이다.

## 컴포넌트 작성 규칙

### 파일 구조
```
src/components/
├── board/          # 칸반 보드 도메인 컴포넌트
├── ticket/         # 티켓 도메인 컴포넌트
└── ui/             # 공통 재사용 UI 컴포넌트
```

### 컴포넌트 분류
- **서버 컴포넌트**: 데이터 fetch 담당 (기본값, `app/page.tsx`)
- **클라이언트 컴포넌트**: 상호작용 담당 (`'use client'` 디렉티브 필수)

### 네이밍
- 파일명: PascalCase.tsx (예: `TicketCard.tsx`)
- 컴포넌트 함수: PascalCase (예: `export default function TicketCard()`)
- Props 인터페이스: `{컴포넌트명}Props` (예: `TicketCardProps`)

### 스타일링
- Tailwind CSS 유틸리티 클래스만 사용
- 인라인 style 속성 사용 지양
- 별도 CSS 파일 생성 지양 (globals.css 제외)
- `prettier-plugin-tailwindcss`가 자동으로 클래스 정렬

### 상태 관리
- 전역 상태: `useTickets` 커스텀 훅 사용
- 로컬 UI 상태: `useState` 사용
- Optimistic UI: 즉시 UI 반영 → API 호출 → 실패 시 롤백

### 접근성
- 버튼에 `aria-label` 제공 (아이콘 버튼인 경우 필수)
- 모달에 `role="dialog"`, `aria-modal="true"` 적용
- 폼 입력에 `<label>` 연결
- ESC 키로 모달/다이얼로그 닫기 지원
- 키보드 네비게이션 (Tab, Enter) 지원

### 공통 UI 컴포넌트 사용
새 UI 요소 필요 시 먼저 `src/components/ui/` 에 기존 컴포넌트가 있는지 확인한다:
- **Button**: `variant` (primary, secondary, danger, ghost), `size` (sm, md, lg), `isLoading`
- **Badge**: 우선순위/상태 표시
- **Modal**: 오버레이 + 중앙 정렬 컨테이너
- **ConfirmDialog**: 삭제 확인 등 위험한 작업 전 확인

### 금지 사항
- `src/components/ui/` 의 공통 컴포넌트를 특정 도메인 로직으로 오염시키지 않는다
- CSS-in-JS 라이브러리(styled-components, emotion 등)를 도입하지 않는다
- 전역 CSS 클래스를 `globals.css`에 무분별하게 추가하지 않는다
