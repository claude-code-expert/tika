# Drizzle ORM 마이그레이션

데이터베이스 스키마 변경 시 마이그레이션을 수행한다.

## 마이그레이션 워크플로우

### 1. 스키마 수정
`src/db/schema.ts` 파일에서 테이블 정의를 수정한다.

### 2. 마이그레이션 파일 생성
```bash
npm run db:generate
```
- `migrations/` 디렉토리에 SQL 마이그레이션 파일이 자동 생성된다.
- 생성된 SQL 파일을 반드시 검토한다.

### 3. 마이그레이션 적용
```bash
npm run db:migrate
```

### 4. (개발용) 스키마 직접 Push
```bash
npm run db:push
```
> 마이그레이션 파일 없이 스키마를 DB에 직접 반영한다. 개발 환경에서만 사용한다.

## Drizzle Studio

```bash
npm run db:studio
```
- 브라우저에서 DB 데이터를 시각적으로 확인/편집할 수 있다.

## 주의사항
- `migrations/` 디렉토리 내 파일을 수동으로 편집하지 않는다.
- 프로덕션 DB에 `db:push`를 사용하지 않는다.
- 스키마 변경 전 반드시 사용자에게 확인한다.
- 칼럼 삭제, 테이블 삭제 등 파괴적 변경은 사용자 명시적 허가 후 진행한다.
