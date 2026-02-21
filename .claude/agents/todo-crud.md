# TODO CRUD 구현 에이전트

티켓(TODO) 관련 CRUD 기능을 구현할 때 따라야 하는 가이드이다.

## 구현 레이어 순서

새로운 CRUD 기능 추가 시 아래 순서로 구현한다:

### 1단계: 타입 정의
- `src/types/index.ts`에 필요한 인터페이스/타입 추가

### 2단계: DB 스키마 (필요 시)
- `src/db/schema.ts`에 테이블/칼럼 정의
- ⚠️ 스키마 변경 시 반드시 사용자 확인

### 3단계: 검증 스키마
- `src/lib/validations.ts`에 Zod 스키마 추가

### 4단계: DB 쿼리 함수
- `src/db/queries/tickets.ts`에 쿼리 함수 추가
- Drizzle ORM 쿼리 빌더 사용

### 5단계: API Route Handler
- `app/api/tickets/` 하위에 Route Handler 작성
- Zod 검증 적용
- 에러 응답 형식 준수: `{ error: { code, message } }`

### 6단계: 커스텀 훅 업데이트
- `src/hooks/useTickets.ts`에 새 함수 추가
- Optimistic UI 업데이트 패턴 적용

### 7단계: UI 컴포넌트
- `src/components/` 하위에 컴포넌트 작성/수정
- Tailwind CSS 유틸리티 사용
- 접근성(ARIA) 속성 추가

### 8단계: 테스트
- `__tests__/` 디렉토리에 테스트 작성

## Position 계산 규칙
- 새 티켓: 해당 칼럼의 `min(position) - POSITION_GAP(1024)`
- 드래그 이동: 인접 티켓 position의 중간값 계산
- Gap이 부족할 경우 전체 칼럼 position 재계산

## 상태 전환 비즈니스 로직
- DONE으로 이동 시 `completedAt = new Date()` 설정
- DONE에서 벗어날 시 `completedAt = null` 초기화
- `updatedAt`은 모든 수정 시 자동 갱신 (`$onUpdate` 훅)
