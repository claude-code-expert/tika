# 작업 목록: Create Ticket API

**기능**: 001-create-ticket-api
**입력**: `/specs/001-create-ticket-api/`의 설계 문서
**전제 조건**: plan.md, spec.md, research.md, data-model.md, contracts/post-tickets.openapi.yaml

**테스트**: 포함됨 (plan.md에 명시된 TDD 접근 방식)
**구성**: 독립적인 구현 및 테스트를 위해 사용자 스토리별로 그룹화된 작업

## 형식: `[ID] [P?] [Story?] 설명`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 이 작업이 속한 사용자 스토리 (US1, US2, US3)
- 설명에 정확한 파일 경로 포함

---

## Phase 1: 설정 (공유 인프라)

**목적**: 디렉토리 준비 및 기존 인프라 확인

- [x] T001 프로젝트 구조가 plan.md와 일치하는지 확인 (app/, src/, __tests__ 디렉토리 존재)
- [x] T002 [P] 데이터베이스 연결이 구성되어 있는지 확인 (.env.local에 DATABASE_URL 존재)
- [x] T003 [P] src/shared/types/index.ts에 공유 타입 존재 확인 (Ticket, TicketStatus, TicketPriority, CreateTicketInput)
- [x] T004 [P] src/shared/validations/ticket.ts에 Zod 검증 스키마 존재 확인 (createTicketSchema)
- [x] T005 [P] src/server/db/schema.ts에 데이터베이스 스키마 존재 확인 (tickets 테이블)

**체크포인트**: 인프라 검증 완료 - 구현 시작 가능

---

## Phase 2: 기초 작업 (차단 전제 조건)

**목적**: 모든 사용자 스토리에 필요한 핵심 컴포넌트 - 사용자 스토리 구현 전 반드시 완료해야 함

**⚠️ 중요**: 이 단계가 완료될 때까지 사용자 스토리 작업을 시작할 수 없음

- [x] T006 [P] src/shared/errors/index.ts에 도메인 에러 클래스 생성 (TicketNotFoundError, ValidationError)
- [x] T007 [P] src/server/db/types.ts에 데이터베이스 타입 파일 생성 (Database, Transaction 타입)
- [x] T008 서비스 디렉토리 구조 생성: src/server/services/ 및 src/server/services/index.ts

**체크포인트**: 기반 준비 완료 - 이제 사용자 스토리 구현을 병렬로 시작 가능

---

## Phase 3: 사용자 스토리 1 - 기본 티켓 생성 (우선순위: P1) 🎯 MVP

**목표**: 사용자가 제목만으로 티켓을 생성할 수 있습니다. 시스템은 기본값(우선순위 MEDIUM, 최상단 위치)으로 BACKLOG에 티켓을 생성합니다.

**독립 테스트**: POST /api/tickets에 `{"title":"Test"}`만 전송 → BACKLOG 상태, position 0(첫 번째인 경우) 또는 계산된 position을 가진 201 반환

### 사용자 스토리 1 테스트 (TDD Red 단계)

> **중요**: 구현 전에 이 테스트를 먼저 작성하고, 실패하는지 확인하세요

- [x] T009 [P] [US1] __tests__/services/ticketService.test.ts에 서비스 테스트 작성: 제목만으로 티켓 생성
- [x] T010 [P] [US1] __tests__/services/ticketService.test.ts에 서비스 테스트 작성: 빈 BACKLOG의 첫 번째 티켓은 position을 0으로 설정
- [x] T011 [P] [US1] __tests__/services/ticketService.test.ts에 서비스 테스트 작성: 새 티켓을 최상단에 배치 (min - 1024)
- [x] T012 [P] [US1] __tests__/services/ticketService.test.ts에 서비스 테스트 작성: 여러 티켓으로 올바른 순서 유지
- [x] T013 [P] [US1] __tests__/services/ticketService.test.ts에 서비스 테스트 작성: startedAt과 completedAt을 null로 설정
- [x] T014 [P] [US1] __tests__/api/tickets.test.ts에 API 테스트 작성: 제목만 있는 요청에 대해 티켓 데이터와 함께 201 반환

**체크포인트**: `npm test` 실행 - 모든 테스트가 실패해야 함 (Red 단계) ✅

### 사용자 스토리 1 구현 (TDD Green 단계)

- [x] T015 [US1] src/server/services/ticketService.ts에 toTicket() 타입 변환 헬퍼 구현
- [x] T016 [US1] src/server/services/ticketService.ts에 calculatePosition() 메서드 구현
- [x] T017 [US1] src/server/services/ticketService.ts에 기본 티켓 생성을 위한 ticketService.create() 구현
- [x] T018 [US1] src/server/services/index.ts에서 ticketService 내보내기
- [x] T019 [US1] app/api/tickets/route.ts에 Zod 검증 및 서비스 호출이 포함된 Route Handler POST 메서드 생성
- [x] T020 [US1] 서비스 레이어 테스트: `npm test __tests__/services/` 실행 - 통과해야 함 (Green 단계) ✅
- [x] T021 [US1] API 레이어 테스트: `npm test __tests__/api/` 실행 - 통과해야 함 (Green 단계) ✅

**체크포인트**: 사용자 스토리 1이 이제 완전히 작동합니다 - 독립적으로 기본 티켓을 생성할 수 있습니다!

**검증**:
```bash
# 타입 체크
npx tsc --noEmit

# 수동 테스트
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Basic Ticket"}'
# 예상: 티켓 데이터와 함께 201 Created
```

---

## Phase 4: 사용자 스토리 2 - 상세 티켓 생성 (우선순위: P2)

**목표**: 사용자가 모든 선택적 필드(description, priority, plannedStartDate, dueDate)를 포함하여 티켓을 생성할 수 있습니다. 시스템이 모든 필드를 검증하고 올바르게 저장합니다.

**독립 테스트**: 모든 필드를 포함하여 POST /api/tickets 전송 → 모든 값이 보존된 201 반환

**의존성**: 사용자 스토리 1 (ticketService.create가 이미 존재, 확장)

### 사용자 스토리 2 테스트 (TDD Red 단계)

- [x] T022 [P] [US2] __tests__/services/ticketService.test.ts에 서비스 테스트 작성: 모든 선택적 필드를 포함한 티켓 생성
- [x] T023 [P] [US2] __tests__/services/ticketService.test.ts에 서비스 테스트 작성: 제공되지 않은 경우 우선순위를 MEDIUM으로 기본 설정
- [x] T024 [P] [US2] __tests__/api/tickets.test.ts에 API 테스트 작성: 모든 선택적 필드와 함께 201 반환

**체크포인트**: `npm test` 실행 - 새 테스트가 실패해야 함 (Red 단계) ✅

### 사용자 스토리 2 구현 (TDD Green 단계)

- [x] T025 [US2] ticketService.create()가 이미 선택적 필드(description, priority, plannedStartDate, dueDate)를 처리하는지 확인 - US1에서 완료되어야 함
- [x] T026 [US2] Route Handler POST가 이미 모든 선택적 필드를 처리하는지 확인 - US1에서 완료되어야 함
- [x] T027 [US2] 테스트: `npm test` 실행 - 모든 US2 테스트가 이제 통과해야 함 (Green 단계) ✅

**체크포인트**: 사용자 스토리 2 완료 - 독립적으로 상세 티켓을 생성할 수 있습니다!

**검증**:
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Detailed Test",
    "description":"Full description",
    "priority":"HIGH",
    "plannedStartDate":"2026-02-10",
    "dueDate":"2026-02-15"
  }'
# 예상: 모든 필드가 보존된 201 Created
```

---

## Phase 5: 사용자 스토리 3 - 잘못된 입력 처리 (우선순위: P3)

**목표**: 시스템이 모든 입력을 검증하고 다음에 대해 명확한 한글 오류 메시지를 반환합니다: 빈 제목, 200자를 초과하는 제목, 공백만 있는 제목, 1000자를 초과하는 설명, 잘못된 우선순위, 과거 dueDate.

**독립 테스트**: 잘못된 요청 전송 → 적절한 한글 오류 메시지와 함께 400 반환

**의존성**: 사용자 스토리 1 (Zod 스키마 및 Route Handler의 검증 로직)

### 사용자 스토리 3 테스트 (TDD Red 단계)

- [x] T028 [P] [US3] __tests__/api/tickets.test.ts에 API 테스트 작성: 제목이 누락된 경우 400 반환
- [x] T029 [P] [US3] __tests__/api/tickets.test.ts에 API 테스트 작성: 제목이 200자를 초과하는 경우 400 반환
- [x] T030 [P] [US3] __tests__/api/tickets.test.ts에 API 테스트 작성: 제목이 공백만 있는 경우 400 반환
- [x] T031 [P] [US3] __tests__/api/tickets.test.ts에 API 테스트 작성: 설명이 1000자를 초과하는 경우 400 반환
- [x] T032 [P] [US3] __tests__/api/tickets.test.ts에 API 테스트 작성: 우선순위가 잘못된 경우 400 반환
- [x] T033 [P] [US3] __tests__/api/tickets.test.ts에 API 테스트 작성: dueDate가 과거인 경우 400 반환

**체크포인트**: `npm test` 실행 - 새 검증 테스트가 실패해야 함 (Red 단계) ✅

### 사용자 스토리 3 구현 (TDD Green 단계)

- [x] T034 [US3] src/shared/validations/ticket.ts의 Zod 스키마에 모든 검증 규칙이 있는지 확인 (이미 존재해야 함)
- [x] T035 [US3] Route Handler가 적절한 에러 형식 { error: { code, message } }를 반환하는지 확인 (US1에서 완료되어야 함)
- [x] T036 [US3] 검증 테스트: `npm test __tests__/api/tickets.test.ts` 실행 - 모든 US3 검증 테스트가 통과해야 함 ✅

**체크포인트**: 사용자 스토리 3 완료 - 독립적으로 검증 작동!

**검증**:
```bash
# 빈 제목 테스트
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"description":"No title"}'
# 예상: "제목을 입력해주세요"와 함께 400 Bad Request

# 너무 긴 제목 테스트
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$(printf 'a%.0s' {1..201})\"}"
# 예상: "제목은 200자 이내로 입력해주세요"와 함께 400 Bad Request

# 과거 dueDate 테스트
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","dueDate":"2020-01-01"}'
# 예상: "종료예정일은 오늘 이후 날짜를 선택해주세요"와 함께 400 Bad Request
```

---

## Phase 6: 마무리 및 교차 관심사

**목적**: 최종 검증, 리팩터링 및 문서화

- [x] T037 [P] 전체 타입 체크 실행: `npx tsc --noEmit` - 에러가 없어야 함
- [ ] T038 [P] 모든 테스트 실행: `npm test` - 모든 테스트가 통과해야 함
- [x] T039 [P] 빌드 실행: `npm run build` - 성공해야 함
- [ ] T040 리팩터링: src/server/utils/errorHandler.ts로 에러 처리 추출 (선택사항, quickstart.md Step 7에 설명)
- [x] T041 [P] 에러 응답이 API_SPEC.md와 정확히 일치하는지 확인 (에러 코드 및 한글 메시지)
- [x] T042 [P] spec.md의 성공 기준 확인 (SC-001부터 SC-007까지)
- [ ] T043 엣지 케이스 테스트: 여러 빠른 생성, 빈 BACKLOG, 제목의 특수 문자
- [ ] T044 quickstart.md Step 6.4를 따라 수동 종단 간 테스트
- [x] T045 정리: console.log 문 제거, .env 파일이 커밋되지 않았는지 확인

**최종 검증 체크리스트**:
- [ ] 모든 사용자 스토리(US1, US2, US3)가 독립적으로 작동
- [ ] 타입 체크 통과
- [ ] 모든 테스트 통과
- [ ] 빌드 성공
- [ ] curl을 사용한 수동 테스트 작동
- [ ] 한글 에러 메시지
- [ ] CLAUDE.md 규칙 준수

---

## 의존성 및 실행 순서

### 단계 의존성

- **설정 (Phase 1)**: 의존성 없음 - 기존 구조 확인
- **기초 작업 (Phase 2)**: 설정에 의존 - 모든 사용자 스토리를 차단
- **사용자 스토리 1 (Phase 3)**: 기초 작업에 의존 - 핵심 기능 (MVP)
- **사용자 스토리 2 (Phase 4)**: US1에 의존 - 선택적 필드로 create() 확장
- **사용자 스토리 3 (Phase 5)**: US1에 의존 - 검증 테스트 추가
- **마무리 (Phase 6)**: 모든 사용자 스토리에 의존

### 사용자 스토리 의존성

```
기초 작업 (Phase 2)
        ↓
사용자 스토리 1 (P1) ← MVP - 먼저 완료해야 함
        ↓
        ├─→ 사용자 스토리 2 (P2) - US1 확장
        └─→ 사용자 스토리 3 (P3) - US1 검증
```

- **사용자 스토리 1** (P1): 독립적 - MVP로 단독 완료 가능
- **사용자 스토리 2** (P2): US1 서비스/Route Handler 확장
- **사용자 스토리 3** (P3): US1 검증 로직 테스트

### 각 사용자 스토리 내 (TDD 사이클)

1. **RED**: 테스트를 먼저 작성 → 테스트 실행 → 실패 ✅
2. **GREEN**: 코드 구현 → 테스트 실행 → 통과 ✅
3. **REFACTOR**: 코드 개선 → 테스트 여전히 통과 ✅

### 병렬 실행 기회

**Phase 1 (설정)**: 모든 T001-T005를 병렬 실행 가능 (확인 작업)

**Phase 2 (기초 작업)**: T006-T007을 병렬 실행 가능 (다른 파일)

**Phase 3 (사용자 스토리 1 테스트)**: T009-T014를 모두 병렬 실행 가능 (다른 시나리오에 대한 테스트 작성)

**Phase 5 (사용자 스토리 3 테스트)**: T028-T033을 모두 병렬 실행 가능 (검증 테스트 작성)

**Phase 6 (마무리)**: T037, T038, T039, T041, T042를 병렬 실행 가능

---

## 병렬 실행 예제: 사용자 스토리 1 구현

### Step 1: 모든 테스트를 병렬로 작성 (Red 단계)
```bash
# 모든 테스트 작업을 함께 시작:
Task T009: 서비스 테스트 작성 - 제목만
Task T010: 서비스 테스트 작성 - 첫 번째는 position 0
Task T011: 서비스 테스트 작성 - min - 1024 배치
Task T012: 서비스 테스트 작성 - 여러 티켓 순서
Task T013: 서비스 테스트 작성 - null 타임스탬프
Task T014: API 테스트 작성 - 201 응답

# 그런 다음 실행: npm test
# 결과: 모든 테스트 실패 ✅ (Red 단계 완료)
```

### Step 2: 순차적으로 구현 (Green 단계)
```bash
# 의존성으로 인해 순차적이어야 함:
Task T015: toTicket() 헬퍼 구현
Task T016: calculatePosition() 구현
Task T017: create() 메서드 구현
Task T018: 서비스 내보내기
Task T019: Route Handler 생성
Task T020: 서비스 레이어 테스트 → 통과 ✅
Task T021: API 레이어 테스트 → 통과 ✅

# 결과: 모든 테스트 통과 ✅ (Green 단계 완료)
```

---

## 구현 전략

### 권장 접근 방식: 사용자 스토리별 TDD

**1주차 - MVP (사용자 스토리 1)**:
1. Day 1: Phase 1 (설정) + Phase 2 (기초 작업) - ~1-2시간
2. Day 2: Phase 3 (사용자 스토리 1) - 모든 테스트 작성 (T009-T014) - ~30분
3. Day 2: Phase 3 (사용자 스토리 1) - 구현 (T015-T019) - ~45분
4. Day 2: Phase 3 (사용자 스토리 1) - 검증 및 테스트 - ~15분
5. **중단 및 검증**: MVP가 데모/배포 준비 완료

**2주차 - 개선**:
6. Day 3: Phase 4 (사용자 스토리 2) - ~30분 (주로 확인)
7. Day 4: Phase 5 (사용자 스토리 3) - 검증 테스트 작성 + 확인 - ~1시간
8. Day 5: Phase 6 (마무리) - 최종 체크 및 리팩터링 - ~30분

### 점진적 전달 타임라인

| 마일스톤 | 결과물 | 가치 |
|---------|--------|------|
| Phase 3 이후 | 사용자 스토리 1 완료 | MVP: 기본 티켓 생성 ✅ |
| Phase 4 이후 | 사용자 스토리 2 완료 | 개선: 상세 티켓 생성 ✅ |
| Phase 5 이후 | 사용자 스토리 3 완료 | 품질: 명확한 에러가 있는 검증 ✅ |
| Phase 6 이후 | 모든 스토리 마무리 | 프로덕션 준비 기능 ✅ |

### 병렬 팀 전략

기초 작업 단계 이후 2명의 개발자:

- **개발자 A**: 사용자 스토리 1에 집중 (T009-T021) - 핵심 MVP
- **개발자 B**: 사용자 스토리 2에 집중 (T022-T027) - 선택적 필드
- 그런 다음 병합하고 둘 다 사용자 스토리 3 작업 (T028-T036) - 검증
- 마지막으로 둘 다 Phase 6 작업 (T037-T045) - 마무리

---

## 작업 요약

**총 작업**: 45개
- Phase 1 (설정): 5개 작업 (확인)
- Phase 2 (기초 작업): 3개 작업 (차단)
- Phase 3 (사용자 스토리 1): 13개 작업 (6개 테스트 + 7개 구현)
- Phase 4 (사용자 스토리 2): 6개 작업 (3개 테스트 + 3개 확인)
- Phase 5 (사용자 스토리 3): 9개 작업 (6개 테스트 + 3개 확인)
- Phase 6 (마무리): 9개 작업 (최종 체크)

**병렬 실행 기회**: 23개 작업을 병렬 실행 가능 ([P]로 표시)

**예상 시간**:
- MVP (Phases 1-3): ~2-3시간
- 전체 기능 (모든 단계): ~4-5시간
- 병렬 실행 시: ~3-4시간

**독립 테스트 기준**:
- ✅ 사용자 스토리 1: 제목으로 POST → BACKLOG 티켓과 함께 201
- ✅ 사용자 스토리 2: 모든 필드로 POST → 모든 값과 함께 201
- ✅ 사용자 스토리 3: 잘못된 데이터로 POST → 한글 에러와 함께 400

---

## 참고사항

- **[P] 작업**: 다른 파일, 의존성 없음 - 병렬화 안전
- **[Story] 레이블**: 추적 가능성을 위해 작업을 특정 사용자 스토리에 매핑
- **TDD 원칙**: RED (테스트 실패) → GREEN (테스트 통과) → REFACTOR
- **각 단계 후 체크포인트**: 스토리가 독립적으로 작동하는지 검증
- **MVP 우선**: 사용자 스토리 1만으로도 완전하고 배포 가능한 기능
- **점진적 가치**: 각 스토리는 이전 스토리를 손상시키지 않고 가치를 추가
- **커밋 전략**: 완료된 각 사용자 스토리 단계 후에 커밋
- **참조**: 자세한 구현 지침은 quickstart.md 참조
