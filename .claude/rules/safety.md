# Tika — 금지 사항 & 안전 규칙 (SAFETY_RULES)

> 참조 위치: `.claude/CLAUDE.md` → 섹션 7 문서 참조 표
> 최종 수정: 2026-03-28

---

## 🔴 데이터베이스 — 절대 금지 명령어

```sql
DROP TABLE        -- ❌ 절대 금지
DROP DATABASE     -- ❌ 절대 금지
TRUNCATE          -- ❌ 절대 금지
DELETE FROM       -- ⚠️ WHERE 절 없이 사용 금지
ALTER TABLE DROP  -- ⚠️ 사용자 허가 필요
```

## 🔴 데이터베이스 — 필수 작업 규칙

1. 데이터 삭제/리셋 전 반드시 사용자에게 **명시적 허가 요청**
2. 백업 없이 데이터 삭제 절대 금지
3. 테스트 데이터가 있는 상태에서 리셋 금지
4. SQL 수정으로 해결 가능한 문제는 데이터베이스 리셋 금지
5. 프로덕션 데이터베이스 어떤 경우에도 자동 수정 금지
6. `db:generate` / `db:migrate` / `db:push`는 **사용자 명시적 요청 없이 절대 실행 금지**
   → 스키마 변경 내용을 먼저 설명하고, 실행 여부를 반드시 확인받을 것

---

## 🔴 Git — 절대 사용 금지 명령어

```bash
git push --force       # ❌ 절대 금지
git reset --hard       # ❌ 절대 금지
git commit --no-verify # ❌ 절대 금지
```

## 🔴 Git — 커밋/푸시 규칙

- `git commit`은 사용자가 **명시적으로 요청**한 경우에만 실행
- `git push`는 사용자가 **명시적으로 요청**한 경우에만 실행
- 작업 완료 후 커밋이 필요하다고 판단되면, 실행하지 말고 사용자에게 먼저 물어볼 것
- "커밋해줘", "commit해줘" 등 명시적 지시가 없으면 커밋하지 않는다

---

## 🔴 npm — 금지 명령어

```bash
npm audit fix --force  # ❌ 절대 금지
```

---

## ⚠️ 파일 수정/삭제 규칙

| 파일/디렉토리 | 규칙 |
|---|---|
| `src/db/schema.ts` | 수정 전 사용자 확인 필수 (마이그레이션 영향) |
| `drizzle.config.ts`, `next.config.ts` | 수정 전 사용자 확인 필수 |
| `package.json` dependencies | 변경 전 사용자 허가 필요 |
| `.env.local` | 직접 수정/생성 금지 (사용자가 직접 관리) |
| `migrations/` | 수동 편집 금지 (drizzle-kit으로만 생성) |
| `docs/` | 삭제 금지 (수정은 가능, 삭제 시 사용자 확인) |
