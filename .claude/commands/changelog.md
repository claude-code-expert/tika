# Changelog 기록

현재 세션의 변경사항을 CHANGELOG.md에 기록한다.

사용자 인자: $ARGUMENTS

## 워크플로우

### 1. 인자 파싱

- `$ARGUMENTS`가 비어있으면 사용자에게 변경 요약을 요청한다.
- 요약은 간결하게 1-2 문장으로 작성한다.

### 2. Git 상태 분석

현재 git 상태를 분석한다:

```bash
# 현재 브랜치
git branch --show-current

# Staged files 확인
git diff --cached --name-status

# Unstaged files 확인
git diff --name-status

# Untracked files
git status --short

# 변경 라인 수
git diff --cached --stat
git diff --stat
```

### 3. 세션 프롬프트 추출

현재 세션의 사용자 프롬프트를 대화 컨텍스트에서 추출한다:
- 모든 사용자 프롬프트 원문을 시간순으로 수집
- 슬래시 커맨드(`/changelog` 자체 등)는 제외
- 짧은 확인 응답("ㅇㅇ", "ㄱㄱ", "yes" 등)은 제외
- IDE 선택 컨텍스트(@파일명)는 프롬프트에 포함하여 기록

### 4. Changelog 엔트리 생성

다음 형식으로 changelog 엔트리를 생성한다:

```markdown
## [브랜치명] - YYYY-MM-DD HH:MM

### Prompts
1. "첫 번째 사용자 프롬프트 원문"
2. "두 번째 사용자 프롬프트 원문"

### Changes
- **Added**: 새로운 기능/파일 (`파일경로`)
- **Modified**: 수정된 내용 (`파일경로`)
- **Fixed**: 버그 수정 (`파일경로`)
- **Removed**: 삭제된 내용 (`파일경로`)

### Test Results (Optional)
- Total: X/Y passed (Z%)

### Files Modified
- `경로/파일1.ts` (+10, -2 lines)
- `경로/파일2.ts` (+5, -1 lines)

---
```

### 5. CHANGELOG.md 업데이트

**파일이 없으면** 새로 생성한다:
```markdown
# Tika Development Changelog

> 이 문서는 Tika 프로젝트의 개발 히스토리를 기록합니다.
> 각 엔트리는 프롬프트, 변경사항, 영향받은 파일을 포함합니다.

[새 엔트리]
```

**파일이 있으면** 새 엔트리를 헤더 바로 아래, 기존 엔트리 위에 추가한다 (시간 역순).

### 6. 결과 보고

생성된 changelog 엔트리 미리보기를 사용자에게 보여준다. 그 후 다음을 제안한다:

1. **테스트 실행**: 변경사항이 코드인 경우 `npm run test`
2. **커밋 생성**: changelog만 업데이트한 경우
3. **전체 커밋**: 코드 + changelog 함께

## 에러 처리

- git 저장소가 아니면 에러 메시지를 출력한다.
- 변경사항이 없으면 "변경사항이 없습니다" 메시지를 출력한다.
- 요약이 200자를 초과하면 경고한다.
