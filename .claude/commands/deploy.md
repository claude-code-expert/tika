# Vercel 배포

Vercel로 프로덕션 배포를 수행한다.

## 배포 전 체크리스트

1. 빌드가 성공하는지 확인한다:
   ```bash
   npm run build
   ```

2. 린트 에러가 없는지 확인한다:
   ```bash
   npm run lint
   ```

3. 테스트가 통과하는지 확인한다:
   ```bash
   npm run test
   ```

4. 모든 변경사항이 커밋되어 있는지 확인한다:
   ```bash
   git status
   ```

## 배포 실행

```bash
# Vercel CLI로 배포 (프리뷰)
vercel

# Vercel CLI로 프로덕션 배포
vercel --prod
```

## 배포 후 확인사항

- Vercel 대시보드에서 빌드 로그 확인
- 배포된 URL에서 기능 정상 동작 확인
- 데이터베이스 연결이 정상인지 확인 (티켓 생성/조회 테스트)

## 환경변수 동기화

```bash
# Vercel에서 환경변수 가져오기
vercel env pull .env.local
```

> 주의: `.env.local` 파일은 Git에 커밋하지 않는다.
