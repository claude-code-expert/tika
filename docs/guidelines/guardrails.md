# Guardrails - 자동 실수 방지 시스템

> **목적**: Claude Code 기능 구현 시 자동으로 실수를 방지하고, 올바른 방향으로 유도하는 시스템

---

## 🎯 Guardrails 개념

**Guardrail**은 도로의 가드레일처럼, 잘못된 방향으로 가지 않도록 **자동으로 막아주는 시스템**입니다.

```
올바른 경로 ━━━━━━━━━━━━━━━━━━━━ 목표
              🚧 Guardrail
잘못된 경로 ╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳
```

---

## 🚧 Level 1: Constitution (Hard Guardrails)

### constitution.md에 명시된 절대 원칙

**Core Principle VII: Documentation First (NON-NEGOTIABLE)**

```yaml
Rule:
  name: "Documentation First"
  priority: "NON-NEGOTIABLE"
  enforcement: "MUST"

When:
  - Claude Code 기능 구현 시
  - 프레임워크/라이브러리 사용 시
  - 불확실한 구현 방법

Action:
  1. 공식 문서 확인 (REQUIRED)
  2. 예제 코드 확인 (REQUIRED)
  3. 구조 검증 (REQUIRED)
  4. 구현

Blocked:
  - 추측으로 구현
  - "아마도", "~일 것이다" 사고
  - 검증 없는 문서화
```

### 위반 시 조치

```python
if implementation_without_docs:
    raise BlockedError("Documentation First 원칙 위반")
    stop_immediately()
    redirect_to_docs()
```

---

## 🚨 Level 2: Pre-Implementation Gates

### Gate 1: Documentation Check

**구현 시작 전 필수 확인**:

```yaml
Gate: "Documentation Verified"
Status: CLOSED (기본값)

Conditions to OPEN:
  - [ ] 공식 문서 URL 확인
  - [ ] 관련 섹션 읽음
  - [ ] 예제 코드 확인
  - [ ] 파일 구조 이해

If CLOSED:
  Action: "구현 차단, 문서로 이동"

If OPEN:
  Action: "구현 진행 허용"
```

**자가 질문 (Self-Check)**:
```bash
# Phase 1: 문서 확인
Q1: "공식 문서를 읽었습니까?"
    → No: STOP, 문서로 이동
    → Yes: Q2로 진행

Q2: "올바른 파일 구조를 확인했습니까?"
    → No: STOP, 문서 재확인
    → Yes: Q3로 진행

Q3: "예제 코드를 확인했습니까?"
    → No: STOP, 예제 확인
    → Yes: 구현 진행 허용
```

### Gate 2: Structure Validation

**파일 생성 전 구조 검증**:

```yaml
For Skills:
  Required Structure:
    - Directory: .claude/skills/<skill-name>/
    - File: SKILL.md (대문자!)
    - YAML frontmatter:
        - name: <string>
        - description: <string>
        - user-invocable: <boolean>

  Blocked Patterns:
    ❌ .claude/skills/<name>.md          # 단일 파일
    ❌ .claude/skills/<name>/skill.md    # 소문자
    ❌ .claude/skills/<name>/README.md   # 잘못된 이름

  Validation:
    if file_matches_blocked_pattern():
        raise StructureError("잘못된 파일 구조")
        show_correct_structure()
        block_creation()
```

### Gate 3: Test Required

**구현 후 테스트 필수**:

```yaml
After Implementation:
  Required Actions:
    1. File structure check
    2. YAML frontmatter validation
    3. Claude Code restart (if needed)
    4. Actual execution test

  Commit Blocked Until:
    - All tests pass
    - Skill appears in list
    - Execution works correctly
```

---

## 🔒 Level 3: Automated Checks

### Check 1: File Structure Validator

**스크립트**: `.specify/scripts/bash/validate-structure.sh`

```bash
#!/bin/bash
# Claude Code 파일 구조 검증 스크립트

validate_skills() {
    local skills_dir=".claude/skills"

    # Skills 디렉토리가 있는지 확인
    if [ ! -d "$skills_dir" ]; then
        echo "✅ No skills directory (OK)"
        return 0
    fi

    local errors=0

    # 각 스킬 검증
    for skill_dir in "$skills_dir"/*; do
        if [ ! -d "$skill_dir" ]; then
            echo "❌ ERROR: $skill_dir는 디렉토리여야 합니다"
            errors=$((errors + 1))
            continue
        fi

        local skill_name=$(basename "$skill_dir")
        local skill_file="$skill_dir/SKILL.md"

        # SKILL.md 파일 확인
        if [ ! -f "$skill_file" ]; then
            echo "❌ ERROR: $skill_file이 없습니다"
            echo "   올바른 구조: .claude/skills/$skill_name/SKILL.md"
            errors=$((errors + 1))
            continue
        fi

        # YAML frontmatter 확인
        if ! head -n 1 "$skill_file" | grep -q "^---$"; then
            echo "❌ ERROR: $skill_file에 YAML frontmatter가 없습니다"
            errors=$((errors + 1))
            continue
        fi

        echo "✅ $skill_name: 구조 정상"
    done

    if [ $errors -gt 0 ]; then
        echo ""
        echo "❌ $errors개의 오류 발견"
        echo ""
        echo "📚 올바른 구조:"
        echo "   .claude/skills/<skill-name>/"
        echo "   └── SKILL.md"
        echo ""
        echo "📖 공식 문서: https://code.claude.com/docs/skills.md"
        return 1
    fi

    echo ""
    echo "✅ 모든 스킬 구조 정상"
    return 0
}

validate_skills
```

### Check 2: YAML Frontmatter Validator

**스크립트**: `.specify/scripts/bash/validate-frontmatter.sh`

```bash
#!/bin/bash
# YAML frontmatter 검증 스크립트

validate_frontmatter() {
    local skill_file="$1"
    local skill_name=$(basename $(dirname "$skill_file"))

    # frontmatter 추출
    local frontmatter=$(awk '/^---$/{p++; if(p==2){exit}} p' "$skill_file")

    # 필수 필드 확인
    local required_fields=("name" "description" "user-invocable")
    local errors=0

    for field in "${required_fields[@]}"; do
        if ! echo "$frontmatter" | grep -q "^$field:"; then
            echo "❌ ERROR: $skill_name - '$field' 필드 누락"
            errors=$((errors + 1))
        fi
    done

    if [ $errors -gt 0 ]; then
        echo ""
        echo "📚 필수 필드:"
        echo "---"
        echo "name: skill-name"
        echo "description: \"스킬 설명\""
        echo "user-invocable: true"
        echo "---"
        return 1
    fi

    echo "✅ $skill_name: frontmatter 정상"
    return 0
}

# 모든 SKILL.md 파일 검증
for skill_file in .claude/skills/*/SKILL.md; do
    if [ -f "$skill_file" ]; then
        validate_frontmatter "$skill_file"
    fi
done
```

### Check 3: Pre-Commit Hook

**Hook**: `.specify/hooks/pre-commit`

```bash
#!/bin/bash
# Pre-commit hook: Claude Code 구조 검증

echo "🔍 Claude Code 구조 검증 중..."

# Skills 구조 검증
if ! .specify/scripts/bash/validate-structure.sh; then
    echo ""
    echo "❌ 커밋 차단: Skills 구조 오류"
    echo "   수정 후 다시 시도하세요"
    exit 1
fi

# YAML frontmatter 검증
if ! .specify/scripts/bash/validate-frontmatter.sh; then
    echo ""
    echo "❌ 커밋 차단: YAML frontmatter 오류"
    echo "   수정 후 다시 시도하세요"
    exit 1
fi

echo "✅ 검증 완료"
exit 0
```

---

## 📊 Level 4: Documentation Guardrails

### Rule 1: Source Citation Required

**CHANGELOG.md 작성 시**:

```yaml
When: Writing Key Learnings or Technical Info
Then: MUST include source

Format:
  ✅ "공식 문서에 따르면... (출처: https://...)"
  ✅ "테스트 결과 확인됨: ..."
  ❌ "아마도 ~일 것이다"
  ❌ "~인 것 같다"

Blocked Phrases:
  - "아마도"
  - "~일 것이다"
  - "~인 것 같다"
  - "추측하건대"
  - "probably"
  - "maybe"
```

### Rule 2: Correction Over Deletion

**잘못된 정보 발견 시**:

```yaml
Wrong Approach:
  ❌ 잘못된 엔트리 삭제
  ❌ 히스토리 숨기기

Correct Approach:
  ✅ 새 엔트리 추가 (올바른 정보)
  ✅ 이전 엔트리에 ⚠️ CORRECTION 표시
  ✅ Incident Report 작성
  ✅ 투명한 기록 유지

Example:
  ## [Branch] - 2026-02-14 01:18
  ### ✅ Changes (CORRECTED)
  - 올바른 정보...

  ## [Branch] - 2026-02-13 23:44
  ### ⚠️ CORRECTION
  > 이 엔트리는 잘못된 정보입니다.
  > 올바른 정보는 2026-02-14 01:18 참조.
```

---

## 🎮 Level 5: Interactive Guardrails

### Checkpoint 1: Before Implementation

**프롬프트 자동 질문**:

```
🤖 Claude: "구현하기 전에 확인하겠습니다."

Q1: Claude Code 기능을 구현하시나요? (Yes/No)
    → Yes: Q2로 진행
    → No: 일반 구현 진행

Q2: 공식 문서를 확인하셨습니까?
    → Yes: Q3로 진행
    → No: "먼저 공식 문서를 확인하겠습니다."
          [Task: claude-code-guide agent 실행]

Q3: 파일 구조를 확인하셨습니까?
    → Yes: 구현 진행
    → No: "공식 문서에서 확인한 구조를 보여드리겠습니다."
```

### Checkpoint 2: After First Failure

**실패 시 자동 개입**:

```
🤖 Detection: Skill이 인식되지 않음

Claude: "스킬이 인식되지 않는 것 같습니다.
        공식 문서를 확인하여 올바른 구조를 찾아보겠습니다."

[Automatic Action]
1. Task: claude-code-guide agent 실행
2. 올바른 구조 확인
3. 현재 구조와 비교
4. 수정 제안

❌ Blocked: 추측으로 재시도
✅ Allowed: 문서 기반 수정
```

---

## 🔔 Alert System

### Alert Level 1: Warning (Yellow)

**Trigger**:
- "아마도", "~일 것이다" 단어 사용
- 공식 문서 URL 없이 기술 정보 작성
- 테스트 없이 구현 완료 선언

**Action**:
```
⚠️ Warning: 추측 표현 감지
"공식 문서를 확인하셨습니까?"
```

### Alert Level 2: Error (Red)

**Trigger**:
- 잘못된 파일 구조 생성 시도
- 필수 필드 누락
- 검증 실패 후 커밋 시도

**Action**:
```
❌ Error: 작업 차단
"올바른 구조: .claude/skills/<name>/SKILL.md"
"공식 문서: https://..."
```

### Alert Level 3: Block (Black)

**Trigger**:
- Constitution 위반
- Documentation First 원칙 무시
- 반복적인 추측 구현

**Action**:
```
🚨 BLOCKED: Constitution 위반
"Documentation First (NON-NEGOTIABLE) 원칙을 위반했습니다."
"공식 문서를 먼저 확인해야 합니다."
[Implementation Blocked]
```

---

## 📈 Self-Monitoring

### Metrics to Track

```yaml
Success Indicators:
  - 문서 확인 후 첫 시도 성공률
  - 평균 구현 시간
  - 커밋 재작업 비율

Failure Indicators:
  - 추측으로 인한 실패 횟수
  - 문서 미확인 비율
  - 잘못된 정보 문서화 횟수
```

### Weekly Review Questions

```
1. 이번 주 Claude Code 기능 구현이 있었나?
2. 공식 문서를 먼저 확인했나?
3. 첫 시도에 성공했나?
4. 추측으로 구현한 적이 있나?
5. 잘못된 정보를 문서화한 적이 있나?
```

---

## 🔄 Continuous Improvement

### Feedback Loop

```
구현 → 검증 → 문서화 → 리뷰 → 개선
  ↑                                  ↓
  ←←←←←←←←←← 학습 ←←←←←←←←←←←←←←←←
```

### Update Triggers

**Guardrails 업데이트 필요 시**:
- 새로운 실수 패턴 발견
- Claude Code 문서 업데이트
- Constitution 수정
- 프로젝트 구조 변경

---

## 📚 Quick Reference

### When to Check Documentation

```
✅ ALWAYS:
  - Claude Code 기능 구현 전
  - 새로운 프레임워크 사용 전
  - 불확실한 구조/문법
  - 첫 시도 실패 후

❌ NEVER:
  - "빨리 해야 하니까 나중에"
  - "이번만 추측으로"
  - "간단한 거니까 안 봐도 돼"
```

### Emergency Protocol

```
IF (잘못된 구현 발견):
    1. 즉시 중단
    2. 공식 문서 확인
    3. 올바른 방법 찾기
    4. 처음부터 재구현
    5. Incident Report 작성 (필요시)

DO NOT:
    - 추측으로 수정
    - 임시 방편 사용
    - 문제 숨기기
```

---

## 🎯 Success Criteria

**이 Guardrails가 성공적으로 작동한다면**:

1. ✅ 첫 시도 성공률 90% 이상
2. ✅ 추측 구현 0건
3. ✅ 잘못된 문서화 0건
4. ✅ 평균 구현 시간 감소
5. ✅ 사용자 신뢰 향상

---

**Version**: 1.0
**Created**: 2026-02-14
**Enforcement**: Active
**Review**: Monthly
