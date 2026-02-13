# Tika Development Changelog

> 이 문서는 Tika 프로젝트의 개발 히스토리를 기록합니다.
> 각 엔트리는 프롬프트, 변경사항, 영향받은 파일을 포함합니다.

**변경 기록 형식:**
- 🎯 Prompt: 사용자 요청 또는 작업 설명
- ✅ Changes: 추가/수정/삭제된 내용
- 📊 Test Results: 테스트 실행 결과 (선택)
- 📁 Files Modified: 변경된 파일 목록 및 라인 수
- 🌿 Branches: 여러 브랜치에 적용된 경우 (선택)

---

## [chapter5.1-init] - 2026-02-13 17:00

### 🎯 Prompt
> "Changelog 시스템 구현 - 변경사항 추적 자동화"

### ✅ Changes
- **Added**: Changelog skill definition (`.claude/commands/changelog.md`)
- **Added**: Helper script for changelog generation (`.specify/scripts/bash/generate-changelog.sh`)
- **Added**: CHANGELOG.md template at project root
- **Modified**: CLAUDE.md - Added "Recent Changes" section

### 📁 Files Modified
- `.claude/commands/changelog.md` (+450, -0 lines)
- `.specify/scripts/bash/generate-changelog.sh` (+250, -0 lines)
- `CHANGELOG.md` (+30, -0 lines)
- `CLAUDE.md` (+20, -0 lines)

---

## [chapter5.1-init] - 2026-02-13 16:45

### 🎯 Prompt
> "TC-API-001의 누락된 5개 테스트를 추가해줘"

### ✅ Changes
- **Added**: 빈 제목 검증 테스트 (`__tests__/api/tickets.test.ts:95`)
- **Added**: 공백만 제목 검증 테스트 (`__tests__/api/tickets.test.ts:113`)
- **Added**: 설명 1000자 초과 검증 테스트 (`__tests__/api/tickets.test.ts:149`)
- **Added**: position 자동 할당 검증 테스트 (`__tests__/api/tickets.test.ts:208`)
- **Added**: startedAt/completedAt 초기값 검증 테스트 (`__tests__/api/tickets.test.ts:224`)

### 📊 Test Results
- Total: 11/11 passed (100%)
- Coverage: TC-API-001 완료

### 📁 Files Modified
- `__tests__/api/tickets.test.ts` (+85, -0 lines)

---

## [chapter5.1-init] - 2026-02-13 10:15

### 🎯 Prompt
> ".env 파일들을 3개 브랜치(chapter4.4.5, chapter5.1-SDD, chapter5.1-init)에 푸시"

### ✅ Changes
- **Modified**: `.env.local` - DB 인증 정보 추가
- **Modified**: `.env.test` - DB 인증 정보 추가
- **Added**: `.env.example` - 템플릿 생성
- **Modified**: `jest.setup.ts` - ticketService mock 제거 (chapter5.1-init만)

### 🌿 Branches Updated
- `chapter4.4.5` (commit: a825f9c)
- `chapter5.1-SDD` (commit: 2988021)
- `chapter5.1-init` (commit: f6e7609, c512b3c)

### 📁 Files Modified
- `.env.local` (+1, -1 lines)
- `.env.test` (+1, -1 lines)
- `.env.example` (+4, -0 lines)
- `jest.setup.ts` (+3, -1 lines)

---

<!-- 이전 엔트리들은 여기에 계속 추가됩니다 -->
