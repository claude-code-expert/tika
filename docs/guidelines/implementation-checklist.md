# Implementation Checklist - 재발 방지 가이드라인

> **목적**: Claude Code 기능 구현 시 기본적인 실수를 방지하기 위한 체크리스트

---

## 🚨 가장 중요한 규칙

### Rule #0: 추측 금지, 문서 필수

```
❌ "아마도 이렇게 하면 될 것 같다"
✅ "공식 문서에서 확인했다"
```

**모든 구현 전에**:
```bash
1. 공식 문서 검색
2. 올바른 방법 확인
3. 예제 코드 확인
4. 구현
5. 검증
```

---

## 📝 Claude Code 기능 구현 체크리스트

### Phase 1: 요구사항 분석 (5분)

- [ ] 사용자 요청이 Claude Code 기능과 관련 있는가?
  - Skills, Commands, Hooks, MCP, Rules 등
- [ ] 어떤 카테고리에 속하는가?
  - [ ] Skills (custom slash commands)
  - [ ] Hooks (event-driven automation)
  - [ ] MCP Servers (external tool integration)
  - [ ] Rules (project instructions)
  - [ ] Settings (configuration)

### Phase 2: 문서 확인 (10-15분) ⚠️ 가장 중요!

- [ ] **공식 문서 URL 확인**:
  ```
  https://code.claude.com/docs/
  ```

- [ ] 관련 문서 읽기:
  - [ ] Skills: https://code.claude.com/docs/skills.md
  - [ ] Hooks: https://code.claude.com/docs/hooks.md
  - [ ] MCP: https://code.claude.com/docs/mcp.md
  - [ ] Rules: https://code.claude.com/docs/rules.md
  - [ ] Settings: https://code.claude.com/docs/settings.md

- [ ] 예제 코드 확인:
  - [ ] 파일 구조
  - [ ] YAML frontmatter
  - [ ] 필수 필드
  - [ ] 선택 필드

### Phase 3: 구조 확인 (5분)

**Skills 구현 시**:
- [ ] 디렉토리 생성: `.claude/skills/<skill-name>/`
- [ ] `SKILL.md` 파일 생성 (대문자 확인!)
- [ ] YAML frontmatter 필수 필드:
  - [ ] `name`: slash command 이름
  - [ ] `description`: 스킬 설명
  - [ ] `user-invocable`: true/false
- [ ] 지원 파일 (선택):
  - [ ] README.md
  - [ ] templates/
  - [ ] examples/
  - [ ] scripts/

**Commands 구현 시** (레거시):
- [ ] `.claude/commands/<name>.md` 파일 생성
- [ ] 단순 markdown 파일
- [ ] Skills로 마이그레이션 고려

### Phase 4: 구현 (15-30분)

- [ ] 문서에서 확인한 구조대로 구현
- [ ] 예제 코드 참고
- [ ] 추측하지 않기

### Phase 5: 검증 (5-10분)

- [ ] 파일 구조 확인:
  ```bash
  tree .claude/skills/
  ```

- [ ] YAML frontmatter 검증:
  ```bash
  # SKILL.md 첫 부분 확인
  head -n 10 .claude/skills/<name>/SKILL.md
  ```

- [ ] Claude Code 재시작 (필요시)
- [ ] 스킬 목록 확인:
  ```bash
  # VSCode에서 스킬 목록 확인
  /context
  ```

- [ ] 실제 실행 테스트:
  ```bash
  /<skill-name>
  ```

### Phase 6: 문서화 (5-10분)

- [ ] CHANGELOG.md 업데이트
- [ ] CLAUDE.md Recent Changes 업데이트
- [ ] 검증된 정보만 기록
- [ ] 출처 명시 (공식 문서 URL)

---

## 🔴 Red Flags (경고 신호)

다음 생각이 들면 **즉시 멈추고** 문서 확인:

1. ❌ "아마도 이렇게 하면 될 것 같다"
2. ❌ "다른 파일도 이렇게 되어 있으니 이것도 같을 것이다"
3. ❌ "이전에 이렇게 했으니 지금도 같을 것이다"
4. ❌ "빠르게 시도해보고 안 되면 고치자"
5. ❌ "문서 읽는 건 나중에 하고 일단 구현부터"

### 올바른 사고방식

1. ✅ "공식 문서에서 확인한 방법은..."
2. ✅ "예제 코드를 보니..."
3. ✅ "문서에 명시된 구조는..."
4. ✅ "이 부분이 불확실하니 문서를 다시 확인하자"
5. ✅ "구현하기 전에 문서부터 읽자"

---

## 🚧 가드레일 (자동 방지 장치)

### 1. Constitution.md에 명시

```yaml
Core Principle VII: Documentation First (NON-NEGOTIABLE)
- 공식 문서 우선 확인
- 추측 금지
- 검증되지 않은 정보 문서화 금지
```

### 2. Pre-Implementation Checklist

새로운 Claude Code 기능 구현 시:
```bash
# 자가 질문
1. "공식 문서를 읽었는가?" (Yes/No)
2. "예제 코드를 확인했는가?" (Yes/No)
3. "올바른 파일 구조를 확인했는가?" (Yes/No)

모두 Yes → 구현 진행
하나라도 No → 문서로 돌아가기
```

### 3. 실패 시 프로토콜

```
구현 실패 (인식 안 됨, 작동 안 함)
    ↓
즉시 중단
    ↓
공식 문서 재확인
    ↓
올바른 방법 찾기
    ↓
처음부터 다시 구현
    ↓
❌ 추측으로 재시도 금지!
```

### 4. 문서화 규칙

```yaml
CHANGELOG.md 작성 시:
  - 출처 명시 필수: "공식 문서: <URL>"
  - 추측 금지: "아마도", "~일 것이다" 사용 금지
  - 검증된 정보만: 실제 테스트 완료한 내용만
```

---

## 📚 Quick Reference: Claude Code 구조

### Skills (Modern, Recommended)

```
.claude/skills/<skill-name>/
└── SKILL.md                    # 필수

YAML Frontmatter (최소):
---
name: skill-name
description: "스킬 설명"
user-invocable: true
---
```

**공식 문서**: https://code.claude.com/docs/skills.md

### Commands (Legacy, Still Works)

```
.claude/commands/<name>.md
```

**특징**:
- 단순 markdown 파일
- 레거시 방식
- Skills로 마이그레이션 권장

### Hooks

```
.claude/hooks/hooks.json

또는

.claude/settings.json (hooks 섹션)
```

**공식 문서**: https://code.claude.com/docs/hooks.md

### Rules

```
.claude/rules/<topic>.md
.claude/rules/<subdirectory>/<topic>.md
```

**공식 문서**: https://code.claude.com/docs/rules.md

### Settings

```
.claude/settings.json          # Global
.claude/settings.local.json    # Local (gitignore)
```

**공식 문서**: https://code.claude.com/docs/settings.md

---

## 🎯 핵심 원칙 요약

1. **Documentation First**: 추측 금지, 문서 필수
2. **Verify Before Implement**: 구현 전 구조 확인
3. **Test After Implement**: 구현 후 반드시 테스트
4. **Document With Source**: 출처와 함께 문서화
5. **Stop On Uncertainty**: 불확실하면 즉시 중단 → 문서 확인

---

## ✅ 성공 사례 vs ❌ 실패 사례

### ❌ 실패 사례 (2026-02-13)

**Timeline**:
1. 요구사항: changelog skill 구현
2. 추측: `.claude/skills/changelog.md` 생성
3. 실패: 인식 안 됨
4. 추측: `.claude/commands/`로 이동
5. 작동하지만 레거시
6. [사용자 지적] → 문서 확인
7. 올바른 구조: `.claude/skills/changelog/SKILL.md`

**총 시간**: 1시간 30분
**커밋 수**: 3개
**Impact**: 잘못된 문서화, 신뢰 저하

### ✅ 성공 사례 (이상적)

**Timeline**:
1. 요구사항: changelog skill 구현
2. 공식 문서 확인: https://code.claude.com/docs/skills.md
3. 구조 확인: `.claude/skills/<name>/SKILL.md`
4. 예제 확인: YAML frontmatter 필수 필드
5. 구현: `.claude/skills/changelog/SKILL.md`
6. 테스트: `/changelog` 실행 확인
7. 문서화: 출처와 함께 기록

**총 시간**: 30분
**커밋 수**: 1개
**Impact**: 올바른 구현, 정확한 문서화

---

## 📖 필수 북마크

```yaml
Claude Code 공식 문서:
  - Main: https://code.claude.com/docs/
  - Skills: https://code.claude.com/docs/skills.md
  - Hooks: https://code.claude.com/docs/hooks.md
  - MCP: https://code.claude.com/docs/mcp.md
  - Rules: https://code.claude.com/docs/rules.md
  - Settings: https://code.claude.com/docs/settings.md
  - Plugins: https://code.claude.com/docs/plugins-reference.md

프로젝트 내부:
  - Constitution: .specify/memory/constitution.md
  - CLAUDE.md: ./CLAUDE.md
  - Incident Reports: docs/incidents/
```

---

## 🔄 주기적 리뷰

**매 구현 후**:
- [ ] 이 체크리스트를 따랐는가?
- [ ] 공식 문서를 확인했는가?
- [ ] 올바른 구조를 사용했는가?
- [ ] 테스트를 완료했는가?
- [ ] 출처와 함께 문서화했는가?

**매월**:
- [ ] Claude Code 공식 문서 업데이트 확인
- [ ] 새로운 기능 확인
- [ ] Deprecated 기능 확인
- [ ] 체크리스트 업데이트

---

**Version**: 1.0
**Created**: 2026-02-14
**Last Updated**: 2026-02-14
**Reference**: [Incident Report 2026-02-13](../incidents/2026-02-13-changelog-skill-structure.md)
