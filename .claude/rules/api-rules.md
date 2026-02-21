# API 작업 규칙

`app/api/` 하위 파일 작업 시 자동 적용되는 규칙이다.

## API Route Handler 작성 규칙

### 요청 검증
- 모든 API 입력은 Zod 스키마로 검증한다 (`src/lib/validations.ts`)
- 검증 실패 시 400 에러를 반환한다

### 응답 형식
```typescript
// 성공 응답 (데이터 반환)
return NextResponse.json({ ticket }, { status: 200 });

// 성공 응답 (생성)
return NextResponse.json({ ticket }, { status: 201 });

// 성공 응답 (삭제)
return new NextResponse(null, { status: 204 });

// 에러 응답
return NextResponse.json(
  { error: { code: 'ERROR_CODE', message: '설명' } },
  { status: 400 }
);
```

### 에러 코드 체계
| 코드 | HTTP 상태 | 설명 |
|------|-----------|------|
| VALIDATION_ERROR | 400 | 입력 유효성 검증 실패 |
| TICKET_NOT_FOUND | 404 | 티켓을 찾을 수 없음 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

### Route Handler 구조
```typescript
export async function METHOD(request: NextRequest) {
  try {
    // 1. 요청 파싱 & Zod 검증
    // 2. DB 쿼리 실행
    // 3. 성공 응답 반환
  } catch (error) {
    // 4. 에러 로깅 + 에러 응답
    console.error('설명:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '...' } },
      { status: 500 }
    );
  }
}
```

### 금지 사항
- API Route에서 직접 SQL 문자열을 사용하지 않는다 (Drizzle ORM 사용)
- DB 쿼리 로직을 Route Handler에 직접 작성하지 않는다 (`src/db/queries/`에 분리)
- 인증/인가 없이 파괴적 작업(전체 삭제 등)을 구현하지 않는다
