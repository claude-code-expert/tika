# Tika — 코딩 규칙 (CODING_CONVENTIONS)

> 참조 위치: `.claude/CLAUDE.md` → 섹션 7 문서 참조 표
> 최종 수정: 2026-03-28

---

## 1. 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `BoardContainer`, `TicketCard` |
| 컴포넌트 파일 | PascalCase.tsx | `BoardContainer.tsx` |
| 훅 | camelCase + `use` 접두사 | `useTickets` |
| 훅 파일 | camelCase.ts | `useTickets.ts` |
| 함수/변수 | camelCase | `groupTicketsByStatus`, `isOverdue` |
| 상수 | UPPER_SNAKE_CASE | `POSITION_GAP`, `TITLE_MAX_LENGTH` |
| 타입/인터페이스 | PascalCase | `TicketStatus`, `BoardData` |
| DB 칼럼 | snake_case | `due_date`, `created_at` |
| API 응답 필드 | camelCase | `dueDate`, `createdAt` |

---

## 2. Prettier 설정

`.prettierrc` 기준값 — 임의 변경 금지.

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## 3. TypeScript 규칙

- **Strict 모드** 활성화 (`"strict": true`) — 비활성화 금지
- 공유 타입은 `src/types/index.ts`에 중앙 관리, 파일별 로컬 타입 선언 지양
- `enum` 대신 `as const` 단언 사용 (예: `TICKET_STATUS`)
- Zod로 런타임 유효성 검증 (API 입력 필수)
- 타입 추론 가능한 곳은 명시적 타입 생략, API 계약부에는 명시적 타입 사용

---

## 4. React 패턴

- 클라이언트 컴포넌트에 `'use client'` 디렉티브 명시
- 서버 컴포넌트에서 초기 데이터 fetch → 클라이언트 컴포넌트로 전달
- 상태 관리는 커스텀 훅(`useTickets`)으로 중앙화
- **Optimistic UI 업데이트 + 실패 시 롤백** 패턴 적용

---

## 5. Tailwind CSS 규칙

- 유틸리티 퍼스트 방식, 별도 CSS 파일 작성 지양
- `prettier-plugin-tailwindcss`로 클래스 자동 정렬 — 수동 정렬 금지
- 반응형: 모바일 퍼스트 (`sm`, `lg` 브레이크포인트)

---

## 6. 라이브러리 추가 규칙

- 기본 기술 스택 이외의 라이브러리/프레임워크 도입 지양
- 불가피한 경우: 도입 이유 + 검토 의견 제시 후 **명시적 허가 요청**
- 합당한 이유 없이 기존 라이브러리 버전 변경 금지 (문제 발생 시 허가 요청 후 변경)
