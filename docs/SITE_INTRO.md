# Tika — 티켓 기반 칸반 보드

> **Ti**cket-based **Ka**nban Board · Plan Simply. Ship Boldly.

개인 할 일부터 팀 프로젝트까지, 목표를 티켓으로 분해하고 칸반 보드에서 실행하는 생산성 도구입니다.

**웹사이트**: [tika-app.vercel.app](https://tika-app.vercel.app/login)

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| **프레임워크** | Next.js 15 (App Router) |
| **언어** | TypeScript |
| **스타일링** | Tailwind CSS 4 |
| **ORM / DB** | Drizzle ORM · Vercel Postgres (Neon) |
| **인증** | NextAuth.js v5 (Google OAuth) |
| **배포** | Vercel |

---

## 개발 방법론

SDD(Specification-Driven Development) 전체 워크플로우 적용

```
PRD → TRD → REQUIREMENTS.md → API 명세 → 컴포넌트 명세 → 테스트 케이스 → 구현
```

---

## 핵심 기능

### 칸반 보드

- **4단계 고정 칼럼**: Backlog → TODO → In Progress → Done
- **드래그 앤 드롭**: 칼럼 간 이동 및 칼럼 내 순서 변경
- **우선순위 4단계**: LOW · MEDIUM · HIGH · CRITICAL
- **마감일 관리**: 오버듀 시 시각적 경고 표시
- **휴지통**: 삭제 티켓 복원 가능 (Soft Delete)

### 티켓 관리

- **CRUD**: 생성 · 조회 · 수정 · 삭제
- **이슈 계층 구조**: Goal → Story → Feature → Task 4단계 분해
- **체크리스트**: 하위 작업 목록 (티켓당 최대 20개)
- **라벨/태그**: 6개 프리셋 + 커스텀 라벨 (티켓당 최대 5개)
- **담당자 배정**: 멤버 기반 할당

### 팀 워크스페이스

- **멤버 관리**: OWNER · ADMIN · MEMBER · VIEWER 역할 구분
- **초대 시스템**: 링크 기반 팀 초대
- **스프린트**: 스프린트 단위 작업 계획
- **WBS (Work Breakdown Structure)**: 이슈 계층 시각화
- **간트 차트**: 일정 및 진행 현황 타임라인

### 분석 대시보드

| 차트 | 설명 |
|---|---|
| **번다운 차트** | 스프린트별 잔여 작업량 추이 |
| **누적 흐름 다이어그램 (CFD)** | 상태별 티켓 누적 현황 |
| **벨로시티 차트** | 스프린트 처리 속도 분석 |
| **사이클 타임 분석** | 티켓 완료까지 소요 시간 |
| **우선순위-상태 매트릭스** | 우선순위 × 상태 분포 |
| **라벨 분석** | 라벨별 티켓 분포 |
| **워크로드 히트맵** | 멤버별 작업 부하 시각화 |
| **트렌드 차트** | 기간별 생성·완료 티켓 추이 |

### 알림 시스템

- **마감일 D-1 알림**: Vercel Cron으로 자동 발송
- **Slack 연동**: Incoming Webhook 기반 채널 알림
- **Telegram 연동**: Bot API 기반 메시지 알림
- **심각도별 라우팅**: P0·P1(Slack+Telegram) / P2(Slack) / P3(로그)
- **알림 내역**: 읽음/안 읽음 상태 관리

### 기타

- **Google OAuth**: NextAuth.js v5 기반 소셜 로그인
- **워크스페이스 전환**: 개인·팀 워크스페이스 멀티 관리
- **반응형 디자인**: 모바일(360px) ~ 데스크톱(1920px)
- **다중 워크스페이스**: 개인 플랜 영구 무료

---

## 개발 특이사항

- **SEO 최적화**: OpenGraph · Twitter Card · JSON-LD (WebApplication + Organization + FAQPage)
- **다크모드 플래시 방지**: `color-scheme: light` viewport 선언으로 배포 후 CSS 로딩 갭 차단
- **타입 안전성**: Drizzle ORM의 완전한 TypeScript 추론, Zod 입력 검증
- **KST 시간대**: 모든 날짜 연산 Asia/Seoul 기준 표준화
