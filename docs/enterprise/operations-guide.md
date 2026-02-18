# Tika 엔터프라이즈 운영 가이드

> MVP에서 엔터프라이즈까지 — 단계별 운영 성숙도 로드맵

Tika는 현재 Vercel + Neon Postgres 위에서 동작하는 MVP 단계의 칸반 보드 애플리케이션이다. 이 문서는 Tika가 팀 도구 → SaaS 제품 → 온프레미스 엔터프라이즈 솔루션으로 성장할 때 각 단계에서 도입해야 하는 운영 전략을 다룬다.

모든 내용을 한 번에 적용할 필요는 없다. **현재 단계에서 필요한 것만 도입하고, 다음 단계의 요구사항이 나타날 때 확장하는 것이 핵심 원칙이다.**

---

## 1. 성장 단계별 운영 전략 개요

### 1.1 네 단계 정의

| 단계 | 사용자 | 팀 규모 | 특징 |
|------|--------|---------|------|
| **MVP** | 개인/소수 | 1~2명 | 빠른 검증, 단일 환경 |
| **팀** | 수십 명 | 3~10명 | 협업 시작, 안정성 요구 |
| **SaaS** | 수백~수천 명 | 10~50명 | 멀티테넌트, 과금, SLA |
| **엔터프라이즈** | 대기업 고객 | 50명+ | 온프레미스, 컴플라이언스, 감사 |

### 1.2 단계별 로드맵

| 영역 | MVP | 팀 | SaaS | 엔터프라이즈 |
|------|-----|-----|------|------------|
| **호스팅** | Vercel | Vercel | Vercel + CDN | K8s / 하이브리드 |
| **DB** | Neon (단일) | Neon (환경별 분리) | Neon + 커넥션 풀링 | 관리형 RDS / 온프레미스 |
| **모니터링** | Vercel Logs | Sentry + Logs | Datadog / Grafana | 풀스택 Observability |
| **알림** | 이메일 | Slack 연동 | PagerDuty + 온콜 | 인시던트 관리 플랫폼 |
| **CI/CD** | Git push 자동 배포 | GitHub Actions CI | 승인 게이트 + 스테이징 | GitOps + 자동 롤백 |
| **배포 전략** | 직접 배포 | Preview 배포 | Blue-Green / Canary | Feature Flags + 점진적 릴리스 |
| **보안** | 기본 HTTPS | 의존성 스캔 | SAST + DAST | SOC 2 / ISO 27001 |
| **IaC** | 수동 설정 | 환경 변수 관리 | Terraform | Terraform + GitOps |

### 1.3 Tika 현재 위치와 다음 단계 기준

Tika는 현재 **MVP 단계**에 있다.

```
현재 스택:
- Vercel (프론트엔드 + API Routes)
- Neon Serverless Postgres (단일 DB)
- Git push → Vercel 자동 배포
- Vercel Logs (기본 모니터링)
```

다음 단계(팀)로 넘어가야 하는 신호:

- 2명 이상이 동시에 코드를 커밋하기 시작할 때
- "어제까지 됐는데 오늘 안 돼요"라는 보고가 나올 때
- 배포 후 문제를 사용자보다 늦게 발견할 때
- 스테이징 환경 없이 프로덕션에 직접 배포하는 것이 불안해질 때

---

## 2. Observability (관측 가능성)

운영 환경에서 애플리케이션의 상태를 파악하는 능력이 Observability다. 개발 환경에서는 `console.log`와 디버거로 충분하지만, 프로덕션에서는 체계적인 관측 시스템이 필요하다. "서버에 SSH로 접속해서 로그를 tail한다"는 방식은 서버리스 환경에서 불가능하고, 컨테이너 환경에서도 비효율적이다.

### 2.1 세 기둥: Logs, Metrics, Traces

Observability는 세 가지 신호(signal)로 구성된다. 각각의 역할이 다르며, 함께 사용해야 전체 그림이 보인다.

#### Logs — 무슨 일이 일어났는가

로그는 이벤트의 기록이다. 에러 추적, 디버깅, 감사 기록에 사용된다.

**MVP 단계 (현재)**: `console.log` / `console.error`

```typescript
// 현재 Tika — 비구조화된 로그
console.log('티켓 생성:', ticket.id);
console.error('DB 연결 실패:', error.message);
```

**팀 단계**: 구조화된 로깅 도입

로그를 JSON 형식으로 출력하면 검색, 필터링, 집계가 가능해진다. Node.js에서는 Pino가 성능과 구조화 모두에서 가장 좋은 선택이다.

```typescript
// src/server/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // 프로덕션: JSON, 개발: 사람이 읽기 쉬운 형식
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  // 모든 로그에 포함될 기본 필드
  base: {
    service: 'tika-api',
    env: process.env.NODE_ENV,
  },
});
```

```typescript
// app/api/tickets/route.ts — 구조화된 로그 적용
import { logger } from '@/server/lib/logger';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = logger.child({ requestId });

  log.info({ method: 'POST', path: '/api/tickets' }, 'request started');

  try {
    const body = await request.json();
    const ticket = await ticketService.create(body);
    log.info({ ticketId: ticket.id }, 'ticket created');
    return Response.json(ticket, { status: 201 });
  } catch (error) {
    log.error({ err: error }, 'ticket creation failed');
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

**로그 레벨 전략**:

| 레벨 | 용도 | 프로덕션 | 예시 |
|------|------|---------|------|
| `fatal` | 프로세스 종료 | 항상 | DB 연결 완전 실패 |
| `error` | 요청 실패 | 항상 | 500 에러, 예외 |
| `warn` | 잠재적 문제 | 항상 | 느린 쿼리, 재시도 |
| `info` | 비즈니스 이벤트 | 권장 | 티켓 생성/삭제, 배포 |
| `debug` | 상세 디버깅 | 필요 시 | 쿼리 파라미터, 중간값 |
| `trace` | 매우 상세 | 비활성 | 함수 진입/종료 |

프로덕션에서는 `info` 이상만 출력하고, 문제 조사 시 특정 서비스의 로그 레벨을 `debug`로 낮추는 방식으로 운영한다.

#### Metrics — 시스템이 얼마나 건강한가

메트릭은 시간에 따른 수치 데이터다. 추세 파악, 알림 조건 설정, 용량 계획에 사용된다.

**수집해야 할 핵심 메트릭**:

| 범주 | 메트릭 | 설명 |
|------|--------|------|
| **요청** | `http_request_duration_ms` | API 응답 시간 |
| **요청** | `http_request_total` | 총 요청 수 (상태 코드별) |
| **에러** | `http_error_rate` | 5xx 에러 비율 |
| **DB** | `db_query_duration_ms` | 쿼리 실행 시간 |
| **DB** | `db_pool_active_connections` | 활성 커넥션 수 |
| **비즈니스** | `tickets_created_total` | 생성된 티켓 수 |
| **비즈니스** | `tickets_by_status` | 상태별 티켓 수 |

```typescript
// src/server/lib/metrics.ts — 커스텀 메트릭 수집 예시
// Prometheus client 또는 Datadog StatsD 사용
import { Counter, Histogram } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'API request duration in milliseconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [10, 50, 100, 200, 500, 1000, 3000],
});

export const ticketsCreated = new Counter({
  name: 'tickets_created_total',
  help: 'Total number of tickets created',
  labelNames: ['status'],
});
```

#### Traces — 요청이 어디를 거쳤는가

트레이스는 단일 요청이 시스템을 통과하는 전체 경로를 추적한다. Tika처럼 모놀리식 구조에서는 중요도가 낮지만, 마이크로서비스로 분리하거나 외부 API를 호출하기 시작하면 필수가 된다.

**도입 시점**: 서비스가 2개 이상으로 분리되거나, 외부 API(결제, 이메일, AI 등) 연동이 추가될 때

```typescript
// OpenTelemetry 자동 계측 — 설정만으로 트레이싱 활성화
// instrumentation.ts (Next.js 15)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: 'tika-api',
});

sdk.start();
```

### 2.2 SLI / SLO / SLA

"시스템이 잘 동작하고 있는가"를 주관적 판단이 아닌 **숫자**로 정의하는 프레임워크다.

#### SLI (Service Level Indicator) — 측정 지표

사용자 경험을 직접 반영하는 메트릭을 SLI로 정의한다.

**Tika에 적용할 SLI**:

| SLI | 측정 방법 | 현재 기준 (TRD) |
|-----|----------|----------------|
| **가용성** | 성공 응답(2xx, 3xx) / 전체 요청 | 99.5% |
| **API 지연** | /api/tickets 응답 시간 p95 | 300ms 이내 |
| **페이지 로드** | LCP (Largest Contentful Paint) | 2.5초 이내 |
| **에러율** | 5xx 응답 / 전체 요청 | 0.5% 미만 |

#### SLO (Service Level Objective) — 목표 수준

SLI에 대한 목표값이 SLO다. 100%를 목표로 하면 안 된다 — 변경을 배포할 수 없게 되기 때문이다.

```
SLO 예시:
- 가용성: 30일 기준 99.9% (월간 다운타임 43분 이내)
- API 지연: p95 < 300ms, p99 < 1000ms
- 에러율: 30일 기준 0.1% 미만
```

**에러 버짓 (Error Budget)**:

SLO가 99.9%이면 0.1%의 에러 버짓이 생긴다. 이 버짓은 새 기능 배포, 실험, 인프라 변경 등에 "사용"된다.

```
월간 요청 100만 건 기준:
- 에러 버짓 = 100만 × 0.1% = 1,000건의 실패 허용
- 잔여 버짓 < 20% → 새 기능 배포 중단, 안정성 작업 우선
- 버짓 소진 → 기능 배포 동결, 인시던트 리뷰
```

#### SLA (Service Level Agreement) — 계약

SLA는 고객과의 약속이다. SLO보다 여유를 두고 설정해야 한다 (SLO 99.9% → SLA 99.5%). 위반 시 크레딧 환불이나 페널티가 따르므로 신중하게 결정한다.

SaaS 전환 시 SLA에 포함할 항목:
- 서비스 가용성 보장 수준
- 정기 유지보수 시간 (Maintenance Window)
- 인시던트 대응 시간 (P0: 15분 이내 인지, 1시간 이내 대응)
- 데이터 백업 주기와 복구 시간 (RPO / RTO)

### 2.3 도구 선택 가이드

| 단계 | 추천 조합 | 월 비용 |
|------|----------|---------|
| **MVP** | Vercel Logs + Sentry 무료 | 무료 |
| **팀** | Sentry Pro + Vercel Observability + UptimeRobot | ~$30 |
| **SaaS** | Datadog APM + Sentry + PagerDuty | ~$200+ |
| **엔터프라이즈** | Grafana + Prometheus + Tempo + Loki (셀프호스트) | 인프라 비용 |

**Sentry — 에러 추적의 표준**

런타임 에러를 자동으로 수집하고 분석한다. 에러 그룹핑, 소스맵 연동, 릴리스별 추적이 핵심 기능이다.

```bash
# Next.js 프로젝트에 Sentry 추가
npx @sentry/wizard@latest -i nextjs
```

이 명령으로 `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`가 자동 생성되고, `next.config.js`에 Sentry 플러그인이 추가된다. 이후 런타임 에러가 자동으로 Sentry 대시보드에 보고된다.

**Datadog — APM과 인프라 통합 모니터링**

분산 트레이싱, 커스텀 대시보드, 로그 관리, 복합 조건 알림을 제공한다. 마이크로서비스 아키텍처나 대규모 트래픽 환경에서 진가를 발휘한다.

**Grafana 스택 — 오픈소스 풀스택**

| 구성 요소 | 역할 |
|----------|------|
| Grafana | 대시보드/시각화 |
| Prometheus | 메트릭 수집/저장 |
| Loki | 로그 수집/검색 |
| Tempo | 분산 트레이싱 |

엔터프라이즈 단계에서 벤더 종속을 피하고 싶거나, 온프레미스 환경에서 운영해야 할 때 적합하다. Grafana Cloud를 사용하면 관리 부담 없이 시작할 수 있다.

---

## 3. 알림과 인시던트 관리

모니터링 시스템이 문제를 감지해도, 올바른 사람에게 올바른 시점에 알림이 전달되지 않으면 의미가 없다.

### 3.1 알림 설계 원칙

**심각도 분류**:

| 등급 | 정의 | 대응 시간 | 알림 채널 | 예시 |
|------|------|----------|----------|------|
| **P0 (Critical)** | 서비스 전체 장애 | 즉시 | 전화 + SMS + Slack | DB 연결 전체 실패, 사이트 다운 |
| **P1 (High)** | 주요 기능 장애 | 30분 이내 | SMS + Slack | API 에러율 10% 초과, 티켓 생성 불가 |
| **P2 (Medium)** | 부분 기능 저하 | 4시간 이내 | Slack | 응답 시간 2배 증가, 특정 브라우저 에러 |
| **P3 (Low)** | 사소한 문제 | 다음 업무일 | 이메일/티켓 | 비필수 기능 에러, UI 깨짐 |

**알림 피로 방지 원칙**:

1. **증상 기반 알림**: "CPU 80%" 같은 원인이 아니라 "에러율 5% 초과" 같은 증상에 알림을 건다
2. **묶음 처리**: 같은 원인의 알림을 중복 발송하지 않는다 (디바운싱)
3. **자동 해소**: 조건이 정상으로 돌아오면 자동으로 알림을 해소한다
4. **주기적 리뷰**: 한 달에 한 번 알림 규칙을 리뷰하여, 의미 없는 알림은 제거하거나 임계값을 조정한다

**에스컬레이션 정책**:

```
P0 발생
  → 0분: 온콜 담당자에게 Slack + 전화
  → 15분: 응답 없으면 백업 담당자에게 전화
  → 30분: 팀 리드에게 알림
  → 1시간: 엔지니어링 매니저에게 알림
```

### 3.2 온콜과 인시던트 대응

**온콜 도입 시점**: 팀이 5명 이상이고, SLA를 제공하기 시작할 때

**도구 비교**:

| 도구 | 특징 | 가격 (팀/월) |
|------|------|-------------|
| **PagerDuty** | 업계 표준, 풍부한 연동 | $21/user |
| **OpsGenie (Atlassian)** | Jira/Confluence 연동 | $9/user |
| **Grafana OnCall** | 오픈소스, Grafana 통합 | 무료 (셀프호스트) |
| **incident.io** | Slack 네이티브, 자동화 | $16/user |

**런북(Runbook) — Tika API 장애 대응 예시**:

```markdown
# Runbook: Tika API 500 에러 급증

## 증상
- /api/tickets 엔드포인트에서 500 에러율 > 5%
- Vercel Logs에서 ECONNREFUSED 또는 timeout 에러

## 진단 단계
1. Vercel Dashboard > Logs에서 최근 에러 확인
2. Neon Dashboard에서 DB 상태 확인
   - 연결 수 한도 도달 여부
   - 리전 장애 여부 (status.neon.tech)
3. 최근 배포 이력 확인 (Vercel Deployments)
   - 직전 배포와 에러 시작 시점 일치 여부

## 조치
### DB 연결 문제인 경우
- Neon Dashboard에서 Compute Endpoint 재시작
- 연결 풀 한도 확인 및 조정

### 코드 문제인 경우
- Vercel Dashboard > Deployments > 이전 버전으로 Rollback
- 원인 파악 후 수정, 재배포

### Neon 리전 장애인 경우
- status.neon.tech 확인
- 고객에게 상태 공지
- 복구 대기 (Neon SLA에 따름)

## 해소 확인
- 에러율 < 0.5%로 5분 이상 유지
- /api/tickets 정상 응답 확인
- 인시던트 포스트모템 작성
```

**인시던트 대응 프로세스**:

```
1. 감지 (Detection)
   → 모니터링 알림 또는 사용자 보고

2. 분류 (Triage)
   → 심각도 판정 (P0~P3)
   → 인시던트 채널 생성 (Slack)
   → 인시던트 커맨더 지정

3. 대응 (Response)
   → 런북에 따라 진단 및 조치
   → 고객 커뮤니케이션 (상태 페이지 업데이트)
   → 타임라인 기록

4. 복구 (Recovery)
   → 서비스 정상 확인
   → 알림 해소

5. 포스트모템 (Post-mortem)
   → 48시간 이내 작성
   → 근본 원인 분석 (5 Whys)
   → 재발 방지 액션 아이템 도출
   → 비난 없는 문화 (Blameless)
```

---

## 4. CI/CD 성숙도 모델

### 4.1 5단계 성숙도

각 레벨은 이전 레벨을 포함한다. 한 단계씩 올라가야 하며, 건너뛰면 안 된다.

#### Level 0: 수동 배포

```
개발자가 직접 빌드 → FTP/SCP로 서버에 업로드
```

재현 불가능, 사람마다 결과가 다름, 롤백 어려움. 현대 프로젝트에서는 사용하지 않는다.

#### Level 1: Git 기반 자동 배포 (현재 Tika)

```
git push origin main → Vercel이 감지 → 빌드 → 배포
```

Tika의 현재 상태. 코드를 push하면 자동으로 배포된다. 간편하지만 품질 게이트가 없다 — 타입 에러가 있는 코드도 push만 하면 배포된다.

#### Level 2: CI 게이트

```
PR 생성 → 자동 검사 (lint + typecheck + test) → 통과해야 머지 가능
```

**팀 단계에서 반드시 도입해야 하는 레벨이다.**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: ESLint
        run: npm run lint
      - name: TypeScript
        run: npx tsc --noEmit

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Run Tests
        run: npm test -- --coverage
        env:
          POSTGRES_URL: ${{ secrets.TEST_DATABASE_URL }}
      - name: Upload Coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
```

GitHub의 Branch Protection Rules에서 이 두 Job을 필수 체크로 설정하면, 테스트를 통과하지 못한 PR은 머지가 불가능해진다.

#### Level 3: 보안 스캐닝 + 승인 게이트 + 스테이징

```
PR → CI 통과 → 보안 스캔 → Preview 배포 → 승인 → 스테이징 → 프로덕션
```

SaaS 단계에서 도입한다. 4.3절에서 보안 파이프라인을, 5장에서 배포 전략을 자세히 다룬다.

#### Level 4: GitOps + 자동 롤백 + Chaos Engineering

```
Git 커밋 → ArgoCD 동기화 → K8s 클러스터 → 자동 헬스체크 → 실패 시 자동 롤백
```

엔터프라이즈 단계. 인프라 상태가 모두 Git에 정의되고, 배포와 롤백이 완전히 자동화된다. 7.2절에서 GitOps를 다룬다.

### 4.2 GitHub Actions 고급 패턴

Level 2를 넘어서면 GitHub Actions의 고급 기능이 필요하다.

**매트릭스 빌드 — 여러 환경에서 동시 테스트**:

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
```

**Reusable Workflows — 공통 파이프라인 재사용**:

```yaml
# .github/workflows/reusable-ci.yml
name: Reusable CI
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '20'
    secrets:
      DATABASE_URL:
        required: true

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test
        env:
          POSTGRES_URL: ${{ secrets.DATABASE_URL }}
```

```yaml
# .github/workflows/ci.yml — 호출 측
name: CI
on: [pull_request]
jobs:
  ci:
    uses: ./.github/workflows/reusable-ci.yml
    secrets:
      DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

**Environment + Approval Gate — 프로덕션 배포 승인**:

```yaml
jobs:
  deploy-staging:
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy to staging"

  deploy-production:
    needs: deploy-staging
    environment:
      name: production
      url: https://tika.example.com
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy to production"
```

GitHub Settings > Environments > production에서 Required Reviewers를 설정하면, 스테이징 배포 후 지정된 팀원이 승인해야만 프로덕션 배포가 진행된다.

**OIDC — 시크릿 없는 클라우드 배포**:

장기 시크릿 키를 GitHub Secrets에 저장하는 대신, OIDC(OpenID Connect)로 단기 토큰을 발급받아 클라우드에 인증한다. 키 유출 위험이 사라진다.

```yaml
jobs:
  deploy:
    permissions:
      id-token: write
      contents: read
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/tika-deploy
          aws-region: ap-northeast-2
      - run: aws ecs update-service --cluster tika --service api --force-new-deployment
```

### 4.3 보안 파이프라인 (DevSecOps)

보안 검사를 배포 파이프라인에 통합하여, 취약점이 프로덕션에 도달하기 전에 차단한다.

**SAST (Static Application Security Testing)**:

```yaml
# CodeQL로 코드 취약점 분석
- uses: github/codeql-action/init@v3
  with:
    languages: javascript-typescript
- uses: github/codeql-action/analyze@v3
```

**의존성 취약점 스캔**:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
    reviewers:
      - team/engineering
```

추가로 `npm audit`을 CI에 포함:

```yaml
- name: Security Audit
  run: npm audit --audit-level=high
```

**컨테이너 이미지 스캔 (Docker 사용 시)**:

```yaml
- name: Scan Container Image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'tika-api:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'

- name: Upload Trivy Results
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: 'trivy-results.sarif'
```

**SBOM (Software Bill of Materials) 생성**:

SaaS/엔터프라이즈 고객이 "이 소프트웨어에 어떤 의존성이 포함되어 있는가?"를 요구할 수 있다.

```yaml
- name: Generate SBOM
  uses: anchore/sbom-action@v0
  with:
    format: spdx-json
    output-file: sbom.spdx.json
```

---

## 5. 배포 전략

### 5.1 무중단 배포 패턴

| 전략 | 방식 | 롤백 속도 | 리소스 비용 | 적합한 상황 |
|------|------|----------|-----------|------------|
| **Rolling** | 인스턴스를 순차적으로 교체 | 느림 | 낮음 | K8s 기본, 일반적인 업데이트 |
| **Blue-Green** | 새 환경을 미리 준비 후 트래픽 전환 | 즉시 | 2배 | 빠른 롤백이 필요한 중요 배포 |
| **Canary** | 트래픽 일부만 새 버전으로 | 빠름 | 약간 추가 | 위험한 변경, 점진적 검증 |

**Vercel의 배포 모델**:

Vercel은 기본적으로 **Atomic Deployment**를 제공한다. 새 배포가 완전히 준비된 후에야 트래픽이 전환되므로, 다운타임 없이 배포된다. Preview 배포는 PR별로 생성되어 Blue-Green과 유사한 효과를 준다.

**Skew Protection**: Vercel은 클라이언트가 이전 버전의 자바스크립트를 로드한 상태에서 새 버전의 API를 호출하는 "버전 불일치" 문제를 방지한다. 배포 후 일정 시간 동안 이전 버전과 새 버전을 모두 서빙한다.

**Kubernetes에서의 배포 전략**:

```yaml
# Rolling Update (기본)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tika-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 최대 4개까지 허용
      maxUnavailable: 0   # 항상 3개 이상 유지
  template:
    spec:
      containers:
        - name: tika-api
          image: tika-api:v2.1.0
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

### 5.2 Feature Flags

코드 배포와 기능 릴리스를 분리한다. 코드는 main에 머지하되, 기능은 플래그로 제어하여 점진적으로 활성화한다.

**도입 시점**: SaaS 단계에서 A/B 테스트, 점진적 릴리스, 고객별 기능 제어가 필요할 때

```typescript
// src/shared/features.ts — 간단한 자체 구현
const FEATURES = {
  TICKET_COMMENTS: process.env.FEATURE_TICKET_COMMENTS === 'true',
  KANBAN_SWIMLANES: process.env.FEATURE_KANBAN_SWIMLANES === 'true',
  AI_SUGGESTIONS: process.env.FEATURE_AI_SUGGESTIONS === 'true',
} as const;

export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] ?? false;
}
```

```typescript
// 컴포넌트에서 사용
import { isFeatureEnabled } from '@/shared/features';

export const TicketDetail = ({ ticket }: Props) => {
  return (
    <div>
      <h2>{ticket.title}</h2>
      {isFeatureEnabled('TICKET_COMMENTS') && (
        <CommentSection ticketId={ticket.id} />
      )}
    </div>
  );
};
```

**외부 도구 비교**:

| 도구 | 특징 | 가격 |
|------|------|------|
| **LaunchDarkly** | 업계 표준, 타겟팅/A/B 테스트 | $10/seat/month |
| **Unleash** | 오픈소스, 셀프호스트 가능 | 무료 (셀프호스트) |
| **Flagsmith** | 오픈소스, Remote Config 포함 | 무료 (셀프호스트) |
| **Vercel Edge Config** | Vercel 네이티브, 엣지에서 읽기 | Vercel Pro 포함 |

### 5.3 롤백 전략

**애플리케이션 롤백**:

- Vercel: Dashboard > Deployments > 이전 배포의 ⋯ > "Promote to Production"
- Kubernetes: `kubectl rollout undo deployment/tika-api`
- Git 기반: `git revert` 후 push (자동 배포 트리거)

**DB 마이그레이션 롤백 — Forward-only 패턴**:

DB 마이그레이션을 되돌리는 것은 위험하다. 대신 **forward-only** 방식을 사용한다.

```
잘못된 방식:
  v1: ADD COLUMN description → v2: DROP COLUMN description (데이터 손실!)

올바른 방식 (Expand-Contract Pattern):
  v1: ADD COLUMN description (새 컬럼 추가)
  v2: 코드에서 새 컬럼 사용 시작 (이전 컬럼도 병행)
  v3: 데이터 마이그레이션 (이전 컬럼 → 새 컬럼)
  v4: 이전 컬럼 제거 (모든 코드가 새 컬럼만 사용 확인 후)
```

**호환성 규칙**: 새 코드는 이전 DB 스키마와, 새 DB 스키마는 이전 코드와 호환되어야 한다. Rolling 배포 중에는 두 버전이 공존하기 때문이다.

---

## 6. 컨테이너와 오케스트레이션

### 6.1 Docker 프로덕션 최적화

PaaS(Vercel)를 넘어서 직접 인프라를 관리할 때 Docker가 필요해진다.

**Next.js standalone 모드 Dockerfile**:

```dockerfile
# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# 의존성 레이어 캐싱
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

# 보안: non-root 사용자
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# standalone 출력만 복사 (최소 이미지)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle

# non-root로 실행
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

`next.config.ts`에 `output: 'standalone'` 설정이 필요하다:

```typescript
// next.config.ts
const nextConfig = {
  output: 'standalone',
};
export default nextConfig;
```

**.dockerignore**:

```
node_modules
.next
.git
.env*
*.md
__tests__
coverage
.vercel
```

**이미지 크기 비교**:

| 방식 | 이미지 크기 |
|------|-----------|
| `node:20` + 전체 복사 | ~1.2GB |
| `node:20-alpine` + standalone | ~150MB |
| `gcr.io/distroless/nodejs20` + standalone | ~120MB |

### 6.2 Kubernetes 도입

**도입 판단 기준**:

다음 중 2개 이상 해당되면 Kubernetes를 고려한다:

- 서비스가 3개 이상으로 분리됨 (API, Worker, Scheduler 등)
- 멀티 리전 배포가 필요함
- 오토스케일링이 필수적임 (트래픽 변동 10배 이상)
- 온프레미스 배포 요구사항이 있음
- 팀에 K8s 운영 경험이 있는 인원이 1명 이상 있음

**Tika를 K8s로 배포하는 기본 매니페스트**:

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tika-api
  labels:
    app: tika
    component: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tika
      component: api
  template:
    metadata:
      labels:
        app: tika
        component: api
    spec:
      containers:
        - name: tika-api
          image: registry.example.com/tika-api:latest
          ports:
            - containerPort: 3000
          env:
            - name: POSTGRES_URL
              valueFrom:
                secretKeyRef:
                  name: tika-secrets
                  key: postgres-url
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: tika-api
spec:
  selector:
    app: tika
    component: api
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tika-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - tika.example.com
      secretName: tika-tls
  rules:
    - host: tika.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: tika-api
                port:
                  number: 80
```

**HPA (Horizontal Pod Autoscaler)**:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: tika-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: tika-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

**PDB (Pod Disruption Budget)** — 업데이트/스케일링 중에도 최소 가용성 보장:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: tika-api-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: tika
      component: api
```

### 6.3 관리형 서비스 비교

| 서비스 | 제공사 | 특징 | 적합한 상황 |
|--------|--------|------|------------|
| **ECS Fargate** | AWS | 서버리스 컨테이너, K8s 불필요 | AWS 환경, 간단한 컨테이너 운영 |
| **EKS** | AWS | 관리형 K8s | AWS + 풀 K8s 기능 필요 |
| **Cloud Run** | GCP | 서버리스 컨테이너, 스케일 투 제로 | 이벤트 기반, 간헐적 트래픽 |
| **GKE** | GCP | 관리형 K8s, Autopilot 모드 | GCP + K8s, 자동 노드 관리 |
| **ACA** | Azure | 서버리스 컨테이너 | Azure 환경, 간단한 운영 |
| **AKS** | Azure | 관리형 K8s | Azure + 풀 K8s 기능 필요 |

**선택 가이드**:
- 컨테이너 1~3개, K8s 경험 없음 → **Cloud Run** 또는 **ECS Fargate**
- 컨테이너 3개 이상, 복잡한 네트워킹 → **EKS** 또는 **GKE**
- 이미 특정 클라우드 사용 중 → 해당 클라우드의 관리형 서비스

---

## 7. Infrastructure as Code (IaC)

수동으로 대시보드를 클릭하여 인프라를 설정하면, 환경마다 미세한 차이가 생기고 재현이 불가능해진다. IaC는 인프라 설정을 코드로 관리하여 이 문제를 해결한다.

### 7.1 Terraform

**도입 시점**: 환경이 2개 이상(staging + production)이고, 인프라 변경이 월 1회 이상 발생할 때

**Vercel + Neon을 Terraform으로 관리**:

```hcl
# terraform/main.tf

terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.6"
    }
  }
}

# ---- Neon Database ----
resource "neon_project" "tika" {
  name      = "tika-${var.environment}"
  region_id = "ap-southeast-1"
}

resource "neon_branch" "main" {
  project_id = neon_project.tika.id
  name       = "main"
}

resource "neon_endpoint" "main" {
  project_id = neon_project.tika.id
  branch_id  = neon_branch.main.id
  type       = "read_write"
}

# ---- Vercel Project ----
resource "vercel_project" "tika" {
  name      = "tika-${var.environment}"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "your-org/tika"
  }
}

resource "vercel_project_environment_variable" "postgres_url" {
  project_id = vercel_project.tika.id
  key        = "POSTGRES_URL"
  value      = neon_endpoint.main.connection_uri
  target     = ["production", "preview"]
}
```

```hcl
# terraform/variables.tf
variable "environment" {
  type    = string
  default = "production"
}
```

```bash
# 환경별 적용
terraform workspace new staging
terraform apply -var="environment=staging"

terraform workspace select production
terraform apply -var="environment=production"
```

**Pulumi** — TypeScript로 IaC를 작성하고 싶다면:

```typescript
// infra/index.ts
import * as vercel from '@pulumiverse/vercel';
import * as pulumi from '@pulumi/pulumi';

const project = new vercel.Project('tika', {
  name: 'tika',
  framework: 'nextjs',
  gitRepository: {
    type: 'github',
    repo: 'your-org/tika',
  },
});

new vercel.ProjectEnvironmentVariable('postgres-url', {
  projectId: project.id,
  key: 'POSTGRES_URL',
  value: pulumi.secret(process.env.POSTGRES_URL!),
  targets: ['production', 'preview'],
});
```

### 7.2 GitOps

Kubernetes를 도입하면 GitOps로 배포를 관리하는 것이 효과적이다. 클러스터의 원하는 상태(desired state)를 Git에 정의하고, GitOps 도구가 실제 상태(actual state)와 동기화한다.

**ArgoCD vs Flux**:

| 기준 | ArgoCD | Flux |
|------|--------|------|
| **UI** | 직관적 웹 대시보드 | CLI + K8s CRD |
| **RBAC** | 세밀한 프로젝트/앱 권한 | K8s RBAC 활용 |
| **멀티클러스터** | 네이티브 지원 | 가능하지만 설정 복잡 |
| **학습 곡선** | 중간 | 낮음 |
| **적합한 팀** | 시각적 관리 선호, 대규모 | 자동화 중심, 소규모 |

**ArgoCD 기본 설정 예시**:

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: tika
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/tika-infra.git
    targetRevision: main
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: tika
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

이 설정으로 `tika-infra` 저장소의 `k8s/overlays/production` 경로가 변경되면, ArgoCD가 자동으로 감지하여 클러스터에 적용한다. `selfHeal: true`는 누군가 수동으로 클러스터를 변경해도 Git 상태로 복원한다.

---

## 8. SaaS 전환 시 고려사항

Tika를 여러 조직이 사용하는 SaaS 제품으로 전환할 때의 아키텍처 고려사항이다.

### 8.1 멀티테넌트 아키텍처

**테넌트 격리 전략 비교**:

| 전략 | 격리 수준 | 비용 | 복잡도 | 적합한 상황 |
|------|----------|------|--------|------------|
| **Row-level** | 낮음 | 최저 | 낮음 | 초기 SaaS, 비용 민감 |
| **Schema-per-tenant** | 중간 | 중간 | 중간 | 규제 요구, 데이터 분리 필요 |
| **DB-per-tenant** | 높음 | 높음 | 높음 | 엔터프라이즈, 완전 격리 |

**Row-level Isolation — Drizzle ORM 적용 예시**:

```typescript
// src/server/db/schema.ts — 테넌트 컬럼 추가
export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  // ...
}, (table) => ({
  tenantIdx: index('tickets_tenant_idx').on(table.tenantId),
}));
```

```typescript
// src/server/services/ticketService.ts — 테넌트 필터 적용
import { eq, and } from 'drizzle-orm';

export const ticketService = {
  async getAll(tenantId: string) {
    return db
      .select()
      .from(tickets)
      .where(eq(tickets.tenantId, tenantId));
  },

  async getById(tenantId: string, ticketId: number) {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.id, ticketId),
          eq(tickets.tenantId, tenantId)
        )
      );

    if (!ticket) throw new Error('TICKET_NOT_FOUND');
    return ticket;
  },
};
```

```typescript
// src/server/middleware/tenant.ts — 테넌트 컨텍스트 미들웨어
export function getTenantId(request: Request): string {
  // JWT 토큰에서 추출하거나
  // 서브도메인(acme.tika.app)에서 추출하거나
  // 헤더(X-Tenant-Id)에서 추출
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) throw new Error('TENANT_NOT_FOUND');
  return tenantId;
}
```

**PostgreSQL Row Level Security (RLS)** — DB 수준 강제:

```sql
-- 테넌트 격리를 DB 수준에서 강제
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tickets
  USING (tenant_id = current_setting('app.tenant_id'));
```

RLS를 사용하면 애플리케이션 코드에서 `WHERE tenant_id = ?`를 빠뜨려도 다른 테넌트의 데이터에 접근할 수 없다. 안전장치로서 매우 유용하다.

### 8.2 확장성

**커넥션 풀링**:

Neon은 서버리스 환경에 최적화된 커넥션 풀러를 내장하고 있다. 일반 연결 문자열 대신 풀링 엔드포인트를 사용한다.

```
# 직접 연결 (마이그레이션용)
postgres://user:pass@ep-xxx.neon.tech/neondb

# 풀링 연결 (애플리케이션용)
postgres://user:pass@ep-xxx.neon.tech/neondb?pgbouncer=true
```

Tika의 `src/server/db/index.ts`에서 풀링 엔드포인트를 사용하면 수백 개의 서버리스 함수가 동시에 실행되어도 DB 커넥션 한도에 걸리지 않는다.

**CDN과 Edge Caching**:

Vercel은 Edge Network를 통해 정적 자산을 자동으로 캐싱한다. API 응답도 캐시할 수 있다.

```typescript
// app/api/tickets/route.ts — API 응답 캐싱
export async function GET() {
  const tickets = await ticketService.getAll();

  return Response.json(tickets, {
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
    },
  });
}
```

`s-maxage=10`은 CDN에서 10초간 캐싱하고, `stale-while-revalidate=59`는 캐시 만료 후 59초 동안 오래된 데이터를 제공하면서 백그라운드에서 갱신한다.

### 8.3 과금과 사용량 추적

**API Rate Limiting**:

```typescript
// src/server/middleware/rateLimit.ts
const rateLimits: Record<string, { count: number; resetAt: number }> = {};

export function checkRateLimit(tenantId: string, limit: number = 100): boolean {
  const now = Date.now();
  const window = 60 * 1000; // 1분

  if (!rateLimits[tenantId] || rateLimits[tenantId].resetAt < now) {
    rateLimits[tenantId] = { count: 1, resetAt: now + window };
    return true;
  }

  rateLimits[tenantId].count++;
  return rateLimits[tenantId].count <= limit;
}
```

실제 SaaS에서는 Redis 기반의 분산 Rate Limiter를 사용한다. Upstash Redis + `@upstash/ratelimit` 패키지가 서버리스 환경에 적합하다.

**사용량 메트릭 수집**: 각 API 호출에서 테넌트별 사용량을 기록하고, 월말에 집계하여 과금한다. 실시간 대시보드에서 사용량을 확인할 수 있게 한다.

---

## 9. 온프레미스 / 하이브리드 배포

엔터프라이즈 고객은 데이터 주권, 보안 규정, 네트워크 정책 등의 이유로 클라우드가 아닌 자체 인프라에서 소프트웨어를 운영해야 하는 경우가 많다.

### 9.1 셀프호스트 패키징

**Docker Compose 번들 — 가장 간단한 셀프호스트**:

```yaml
# docker-compose.production.yml
services:
  app:
    image: registry.example.com/tika-api:${VERSION:-latest}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - POSTGRES_URL=postgres://tika:${DB_PASSWORD}@db:5432/tika
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=tika
      - POSTGRES_USER=tika
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tika"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # 리버스 프록시 + SSL
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - app
    restart: unless-stopped

volumes:
  pgdata:
  caddy_data:
```

```
# Caddyfile
{$DOMAIN:localhost} {
    reverse_proxy app:3000
}
```

고객에게 제공하는 설치 가이드:

```bash
# 1. 환경 변수 설정
cp .env.example .env
# .env에서 DB_PASSWORD, DOMAIN 설정

# 2. 실행
docker compose -f docker-compose.production.yml up -d

# 3. DB 마이그레이션
docker compose exec app npx drizzle-kit push

# 4. 확인
curl https://your-domain.com/api/health
```

**Helm 차트 — Kubernetes 환경**:

```yaml
# helm/tika/values.yaml
replicaCount: 3

image:
  repository: registry.example.com/tika-api
  tag: "2.1.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: tika.internal.company.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: tika-tls
      hosts:
        - tika.internal.company.com

postgresql:
  enabled: true
  auth:
    database: tika
    username: tika

resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

```bash
# Helm으로 설치
helm install tika ./helm/tika \
  --namespace tika \
  --create-namespace \
  --set postgresql.auth.password=secure-password \
  --set ingress.hosts[0].host=tika.company.com
```

**에어갭(Air-gapped) 환경**:

인터넷 접근이 불가능한 환경에서는 Docker 이미지를 tar로 내보내고, USB나 보안 전송을 통해 반입한다.

```bash
# 이미지 내보내기
docker save tika-api:2.1.0 postgres:16-alpine caddy:2-alpine \
  | gzip > tika-bundle-2.1.0.tar.gz

# 에어갭 환경에서 가져오기
docker load < tika-bundle-2.1.0.tar.gz
```

### 9.2 보안과 컴플라이언스

**RBAC (Role-Based Access Control)**:

```typescript
// src/server/middleware/rbac.ts
const ROLES = {
  VIEWER: ['ticket:read'],
  MEMBER: ['ticket:read', 'ticket:create', 'ticket:update'],
  ADMIN: ['ticket:read', 'ticket:create', 'ticket:update', 'ticket:delete', 'settings:manage'],
  OWNER: ['*'],
} as const;

type Role = keyof typeof ROLES;

export function checkPermission(role: Role, permission: string): boolean {
  const permissions = ROLES[role];
  return permissions.includes('*') || permissions.includes(permission);
}
```

**감사 로그 (Audit Log)**:

모든 데이터 변경을 기록하여 "누가, 언제, 무엇을" 변경했는지 추적한다.

```typescript
// src/server/db/schema.ts
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // CREATE, UPDATE, DELETE
  resource: varchar('resource', { length: 50 }).notNull(), // ticket, settings
  resourceId: varchar('resource_id', { length: 50 }),
  changes: jsonb('changes'), // { before: {...}, after: {...} }
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

```typescript
// src/server/services/auditService.ts
export const auditService = {
  async log(entry: {
    tenantId: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    changes?: Record<string, unknown>;
    request?: Request;
  }) {
    await db.insert(auditLogs).values({
      ...entry,
      ipAddress: entry.request?.headers.get('x-forwarded-for') ?? undefined,
      userAgent: entry.request?.headers.get('user-agent') ?? undefined,
    });
  },
};
```

**데이터 암호화**:

| 영역 | 방법 |
|------|------|
| 전송 중 (in-transit) | HTTPS/TLS 1.3 (Vercel/Caddy 자동) |
| 저장 중 (at-rest) | PostgreSQL TDE / 디스크 암호화 |
| 필드 수준 | 민감 필드(PII) AES-256 암호화 |

**컴플라이언스 체크포인트**:

| 항목 | SOC 2 | ISO 27001 | GDPR |
|------|-------|-----------|------|
| 접근 제어 (RBAC) | 필수 | 필수 | 필수 |
| 감사 로그 | 필수 | 필수 | 필수 |
| 데이터 암호화 | 필수 | 필수 | 필수 |
| 정기 백업 | 필수 | 필수 | 권장 |
| 인시던트 대응 계획 | 필수 | 필수 | 필수 |
| 데이터 삭제 요청 대응 | - | - | 필수 |
| 데이터 이동 요청 대응 | - | - | 필수 |
| 침투 테스트 | 연 1회 | 연 1회 | 권장 |

### 9.3 하이브리드 아키텍처

고객의 데이터는 온프레미스에, 컴퓨팅과 업데이트는 클라우드에서 관리하는 패턴이다.

```
┌─────────────────────────┐     ┌─────────────────────────┐
│    고객 데이터센터        │     │    클라우드 (관리 영역)    │
│                         │     │                         │
│  ┌───────┐ ┌─────────┐ │     │  ┌───────────────────┐  │
│  │ Tika  │ │PostgreSQL│ │ ←───│──│  관리 대시보드      │  │
│  │ App   │ │  DB     │ │     │  │  (업데이트/설정)    │  │
│  └───────┘ └─────────┘ │     │  └───────────────────┘  │
│                         │     │                         │
│  ← 데이터는 여기에 남음   │     │  ← 메트릭/로그만 전송    │
└─────────────────────────┘     └─────────────────────────┘
```

이 구조에서는 앱 업데이트를 클라우드에서 Helm 차트 버전으로 관리하고, 고객 환경의 ArgoCD가 자동으로 동기화한다. 텔레메트리 데이터만 클라우드로 전송하여 모니터링하되, 실제 사용자 데이터는 고객 인프라를 벗어나지 않는다.

---

## 10. 비용 최적화

### PaaS → IaaS 전환 시점

| 월 비용 | 추천 | 이유 |
|---------|------|------|
| < $100 | Vercel/Railway 유지 | 운영 인력 비용이 더 비쌈 |
| $100~$500 | 비용 분석 시작 | Reserved Instance로 절감 여지 확인 |
| $500~$2,000 | 하이브리드 검토 | 정적 자산은 CDN, API는 컨테이너 |
| > $2,000 | IaaS 전환 검토 | 직접 관리로 30~50% 절감 가능 |

핵심: 인프라 비용만 보지 말고 **운영 인력 비용**도 함께 계산해야 한다. DevOps 엔지니어 1명의 연봉이 PaaS 비용보다 비싼 경우가 많다.

### Serverless vs 상시 운영

| 기준 | Serverless (Vercel) | 상시 운영 (ECS/K8s) |
|------|--------------------|--------------------|
| 트래픽 패턴 | 간헐적, 예측 불가 | 지속적, 예측 가능 |
| Cold Start | 있음 (수백ms) | 없음 |
| 비용 구조 | 요청당 과금 | 시간당 과금 |
| 스케일링 | 자동, 즉시 | 자동이지만 수분 소요 |
| 적합한 시점 | 일 요청 < 100만 | 일 요청 > 100만 |

### 비용 절감 전략

| 전략 | 절감 효과 | 적용 단계 |
|------|----------|----------|
| **CDN 캐싱 최적화** | 오리진 호출 50~80% 감소 | 팀 |
| **이미지 최적화** (next/image) | 대역폭 30~60% 감소 | MVP |
| **DB 쿼리 최적화** | 커넥션 사용 감소 | 팀 |
| **Reserved Instances** | 컴퓨팅 30~50% 절감 | SaaS |
| **Spot/Preemptible** (비핵심 워크로드) | 최대 70% 절감 | 엔터프라이즈 |
| **리전 최적화** | 불필요한 멀티리전 비용 제거 | SaaS |

---

## 부록: 도입 순서 체크리스트

프로젝트 성장에 따라 이 문서의 내용을 단계적으로 적용한다.

### MVP → 팀 전환 시

- [ ] Sentry 무료 계정 설정 (2.3절)
- [ ] GitHub Actions CI 워크플로우 추가 (4.1절 Level 2)
- [ ] Branch Protection Rules 설정
- [ ] 구조화된 로깅 도입 (2.1절)
- [ ] Slack 배포 알림 설정 (3.1절)

### 팀 → SaaS 전환 시

- [ ] SLI/SLO 정의 (2.2절)
- [ ] PagerDuty/OpsGenie 온콜 설정 (3.2절)
- [ ] 보안 스캐닝 파이프라인 추가 (4.3절)
- [ ] Feature Flag 시스템 도입 (5.2절)
- [ ] 멀티테넌트 아키텍처 적용 (8.1절)
- [ ] API Rate Limiting 구현 (8.3절)

### SaaS → 엔터프라이즈 전환 시

- [ ] Docker 이미지 최적화 (6.1절)
- [ ] Kubernetes 매니페스트 작성 (6.2절)
- [ ] Terraform IaC 구성 (7.1절)
- [ ] RBAC + 감사 로그 구현 (9.2절)
- [ ] 온프레미스 설치 가이드 작성 (9.1절)
- [ ] 컴플라이언스 체크리스트 완료 (9.2절)
