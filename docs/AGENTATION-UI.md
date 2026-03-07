# Agentation UI 연동 가이드

> Claude Code가 tika UI 작업 중 agentation MCP 도구를 활용하는 방법을 정의한다.

---

## 1. 개요

agentation은 브라우저에서 UI 요소에 직접 어노테이션(코멘트)을 남기면, Claude Code가 MCP를 통해 실시간으로 수신해 코드를 수정하는 협업 도구다.

- **브라우저 측:** `<Agentation />` React 컴포넌트 → `localhost:4747` HTTP REST + SSE
- **Claude Code 측:** `agentation-mcp server` (MCP) → 9개 도구로 어노테이션 수신/처리

tika에는 이미 통합이 완료되어 있다. 개발 서버(`npm run dev`) 실행 시 브라우저 우하단에 agentation 툴바가 자동으로 표시된다.

---

## 2. 아키텍처

```
브라우저 (http://localhost:3000/dev)
  └─ <Agentation endpoint="http://localhost:4747" />
       ├─ 어노테이션 저장 → POST localhost:4747/sessions/:id
       └─ SSE 스트림     → GET  localhost:4747/sessions/:id/events

Claude Code (MCP 클라이언트)
  └─ agentation-mcp server  (.mcp.json: "npx agentation-mcp server")
       ├─ agentation_watch_annotations  → SSE로 새 어노테이션 감지 (blocking)
       ├─ agentation_get_all_pending    → 미처리 어노테이션 전체 조회
       ├─ agentation_resolve            → 처리 완료 표시
       └─ 기타 6개 도구
```

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/ui/AgentationWrapper.tsx` | React 래퍼 컴포넌트 |
| `app/layout.tsx` | dev 환경에서 조건부 렌더링 |
| `.mcp.json` | MCP 서버 설정 (`agentation-mcp server`) |
| `package.json` | `devDependencies.agentation: "^2.2.1"` |

---

## 3. UI 작업 워크플로우

### 기본 루프

```
1. npm run dev 실행
2. 브라우저 http://localhost:3000/dev 열기
3. 우하단 agentation 툴바 활성화 확인
4. UI 요소 클릭 → 코멘트 입력 → Send Annotations
5. Claude Code: agentation_watch_annotations 로 수신 대기
6. 어노테이션 수신 → 코드 수정
7. agentation_resolve(annotationId, "수정 내용 요약") 호출
```

### Claude Code 처리 패턴

```typescript
// 1. 새 어노테이션 대기 (blocking, 최대 120초)
const annotations = await agentation_watch_annotations({ timeoutSeconds: 120 });

// 2. 각 어노테이션 확인 후 즉시 acknowledge
for (const annotation of annotations) {
  await agentation_acknowledge(annotation.id);

  // 3. 코드 수정 작업...

  // 4. 완료 후 resolve (사용자가 수락한 경우만)
  await agentation_resolve(annotation.id, "TicketCard 우선순위 뱃지 색상 수정");
}
```

### 어노테이션 거부 / 미처리 시

```typescript
// 요청을 처리하지 않을 경우 dismiss (이유 필수)
await agentation_dismiss(annotation.id, "디자인 시스템 표준과 충돌하는 요청");

// 추가 정보가 필요한 경우 thread로 질문
await agentation_reply(annotation.id, "어느 칼럼에서 발생하는 문제인가요?");
```

---

## 4. MCP 도구 레퍼런스

### `agentation_watch_annotations`

새 어노테이션이 생길 때까지 블로킹 대기. 첫 어노테이션 감지 후 `batchWindowSeconds` 동안 추가 수집.

```typescript
agentation_watch_annotations({
  sessionId?: string,         // 특정 세션만 감시 (생략 시 전체)
  timeoutSeconds?: number,    // 최대 대기 (기본 120, 최대 300)
  batchWindowSeconds?: number // 배치 수집 창 (기본 10, 최대 60)
})
```

### `agentation_get_all_pending`

전체 세션의 미처리(pending) 어노테이션 반환. 대화 시작 시 밀린 피드백 확인에 사용.

```typescript
agentation_get_all_pending()
// → Annotation[]
```

### `agentation_get_pending`

특정 세션의 미처리 어노테이션만 반환.

```typescript
agentation_get_pending({ sessionId: string })
```

### `agentation_acknowledge`

어노테이션 수신 확인. 사용자에게 "확인했음"을 알린다.

```typescript
agentation_acknowledge({ annotationId: string })
```

### `agentation_resolve`

피드백 처리 완료. `summary`에 변경 내용을 간략히 기술한다.

```typescript
agentation_resolve({
  annotationId: string,
  summary?: string  // "TicketCard 배경색을 #629584로 수정"
})
```

### `agentation_dismiss`

처리하지 않기로 결정. `reason` 필수.

```typescript
agentation_dismiss({
  annotationId: string,
  reason: string  // "현재 스프린트 범위 외"
})
```

### `agentation_reply`

어노테이션 스레드에 답글 추가. 명확화 질문이나 중간 상태 보고에 사용.

```typescript
agentation_reply({
  annotationId: string,
  message: string
})
```

### `agentation_list_sessions`

활성 세션 목록 반환.

```typescript
agentation_list_sessions()
// → Session[]
```

### `agentation_get_session`

세션 상세 + 전체 어노테이션 반환.

```typescript
agentation_get_session({ sessionId: string })
// → Session & { annotations: Annotation[] }
```

---

## 5. Annotation 타입 정의

```typescript
type Annotation = {
  id: string;
  comment: string;           // 사용자가 입력한 피드백 텍스트
  element: string;           // 클릭된 HTML 요소 태그명
  elementPath: string;       // DOM 경로 (CSS selector 형식)
  x: number;                 // 클릭 좌표 X
  y: number;                 // 클릭 좌표 Y
  boundingBox?: {
    x: number; y: number;
    width: number; height: number;
  };
  url?: string;              // 어노테이션이 생성된 페이지 URL
  reactComponents?: string;  // React 컴포넌트 트리 (문자열)
  nearbyText?: string;       // 클릭 위치 주변 텍스트
  selectedText?: string;     // 드래그로 선택된 텍스트
  timestamp: number;         // Unix timestamp (ms)
  status?: 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
  thread?: ThreadMessage[];  // 스레드 대화
};

type ThreadMessage = {
  role: 'user' | 'assistant';
  message: string;
  timestamp: number;
};
```

---

## 6. HTTP REST API (localhost:4747)

MCP 도구 내부적으로 사용하는 API. 직접 호출은 디버깅 목적으로만 사용.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/sessions` | 세션 목록 |
| `POST` | `/sessions` | 세션 생성 |
| `GET` | `/sessions/:id` | 세션 + 어노테이션 상세 |
| `GET` | `/sessions/:id/pending` | 미처리 어노테이션 |
| `GET` | `/pending` | 전체 미처리 어노테이션 |
| `SSE` | `/sessions/:id/events` | 특정 세션 실시간 스트림 |
| `SSE` | `/events` | 전체 실시간 스트림 |

---

## 7. Webhook 이벤트

agentation이 발생시키는 이벤트 5종. (SSE 스트림 또는 webhook URL 설정으로 수신)

| 이벤트 | 트리거 |
|--------|--------|
| `annotation.add` | 어노테이션 생성 시 |
| `annotation.delete` | 어노테이션 삭제 시 |
| `annotation.update` | 코멘트 수정 시 |
| `annotations.clear` | 전체 초기화 시 |
| `submit` | Send Annotations 버튼 클릭 시 |

---

## 8. 외부 참조

- **공식 사이트:** https://agentation.dev
- **Webhooks:** https://agentation.dev/webhooks
- **API 명세:** https://agentation.dev/api
- **Basic Usage:** https://agentation.dev/api#basic-usage
- **Programmatic Usage:** https://agentation.dev/api#programmatic-usage
- **GitHub:** https://github.com/benjitaylor/agentation
