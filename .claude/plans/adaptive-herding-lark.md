# 헤더 아바타 드롭다운 메뉴 + 프로필 설정 + 로그아웃

## Context

현재 헤더의 아바타 버튼은 클릭 시 무조건 `signOut()`을 실행한다. 로그인된 상태에서는 드롭다운 메뉴로 프로필 설정/로그아웃을 선택할 수 있어야 하고, 프로필 설정에서는 `avatar.html` 데모를 참고하여 이니셜(displayName) 입력과 색상 선택을 할 수 있어야 한다.

## 수정 파일 및 내용

### 1. `src/db/queries/members.ts` — updateMember 함수 추가
- `updateMember(id, workspaceId, data: { displayName?, color? })` 쿼리 추가
- 기존 `toMember`, `getMemberByUserId`, `getMembersByWorkspace` 유지

### 2. `app/api/members/[id]/route.ts` — PATCH 엔드포인트 신규 생성
- `PATCH /api/members/:id` — displayName, color 업데이트
- Zod 검증: displayName(1-50자), color(hex 7자리 `#XXXXXX`)
- 세션 검증 + 본인 memberId 일치 확인

### 3. `src/components/layout/Header.tsx` — 아바타 드롭다운 메뉴
- 현재 아바타 버튼의 `onClick={() => signOut()}` → 드롭다운 토글로 변경
- 드롭다운 메뉴 UI:
  - 사용자 이름 + 이메일 표시
  - "프로필 설정" 메뉴 항목 → ProfileModal 열기
  - 구분선
  - "로그아웃" 메뉴 항목 → `signOut({ callbackUrl: '/login' })`
- ESC 키 / 바깥 클릭으로 드롭다운 닫기
- 마운트 시 `/api/members` fetch → 현재 사용자의 displayName, color 취득
- 아바타에 member.color 반영 (현재 하드코딩 accent → member.color)
- 프로필 저장 후 로컬 상태 즉시 반영

### 4. `src/components/layout/ProfileModal.tsx` — 프로필 설정 모달 신규 생성
- `avatar.html` 데모 참조 UI:
  - 이니셜(displayName) 입력 필드 (max 50자)
  - 색상 스와치 6개: `#629584`, `#3B82F6`, `#8B5CF6`, `#F59E0B`, `#EF4444`, `#10B981`
  - 실시간 미리보기 (Avatar XL 사이즈)
  - 저장/취소 버튼
- 저장 → `PATCH /api/members/:id` 호출
- 기존 컴포넌트 재사용: `src/components/ui/Modal.tsx`, `src/components/ui/Avatar.tsx`

### 변경하지 않는 것
- DB 스키마 (members 테이블에 displayName, color 이미 존재)
- NextAuth 설정 (`src/lib/auth.ts`)
- 로그인 페이지 (`app/login/page.tsx`)

## 검증 방법
1. 로그인 후 헤더 아바타 클릭 → 드롭다운 메뉴 표시 확인
2. "프로필 설정" 클릭 → 모달 열림, 현재 이름/색상 표시
3. 이름 변경 + 색상 변경 → 저장 → 아바타 즉시 반영
4. "로그아웃" 클릭 → 로그인 페이지 이동
5. `npm run build` 성공
