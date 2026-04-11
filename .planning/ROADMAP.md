# Roadmap: Tika AI Ticket Automation

## Overview

기존 Tika v0.2 칸반 SaaS 위에 AI 자동화 레이어를 추가한다. 빌드 순서는 보안 기반(DB + 암호화 + API 키 관리) → AI 파이프라인(Gemini 서비스 + Import UI) → 네비게이션 통합(진입점 + RBAC 가시성) 순서를 엄격히 따른다. 각 페이즈는 독립적으로 검증 가능한 능력을 전달한다.

## Phases

- [ ] **Phase 1: Secure Key Management** - OWNER가 Gemini API 키를 안전하게 등록·관리할 수 있는 기반 구축
- [ ] **Phase 2: AI Import Pipeline** - 마크다운 파일 업로드부터 계층 티켓 일괄 생성까지 전체 AI 플로우 구현
- [ ] **Phase 3: Navigation Integration** - AI Import 진입점을 사이드바에 통합하고 RBAC 가시성 완성

## Phase Details

### Phase 1: Secure Key Management
**Goal**: OWNER가 Gemini API 키를 안전하게 등록·수정·삭제할 수 있으며, MEMBER/VIEWER에게 해당 기능이 완전히 숨겨진다
**Depends on**: Nothing (first phase — existing v0.2 codebase is the foundation)
**Requirements**: KEY-01, KEY-02, KEY-03, KEY-04, KEY-05, KEY-06, KEY-07, NAV-02
**Success Criteria** (what must be TRUE):
  1. OWNER는 설정 화면에서 Gemini API 키를 입력·저장할 수 있으며, 저장 직후 키가 유효한지 확인 결과가 표시된다
  2. 저장된 키는 "앞 5자 + *** + 뒤 5자" 마스킹 형태로만 화면에 표시되고, API 응답에 ciphertext/iv/tag가 절대 반환되지 않는다
  3. OWNER는 저장된 키를 교체(수정)하거나 삭제할 수 있다
  4. MEMBER 또는 VIEWER로 로그인한 사용자는 API 키 설정 페이지 URL에 직접 접근해도 403이 반환된다
**Plans**: 3 plans
Plans:
- [ ] 01-01-PLAN.md — Foundation: encryption service, DB schema, query layer, Zod validation
- [ ] 01-02-PLAN.md — API routes: GET/POST/DELETE handlers with RBAC and Gemini probe
- [ ] 01-03-PLAN.md — UI: SettingsShell extension + GeminiKeySection component
**UI hint**: yes

### Phase 2: AI Import Pipeline
**Goal**: 사용자가 마크다운 파일을 업로드하면 Gemini가 분석하고, 프리뷰 확인 후 계층 구조 티켓이 Backlog에 원자적으로 일괄 생성된다
**Depends on**: Phase 1
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08, AI-09, AI-10, NAV-03
**Success Criteria** (what must be TRUE):
  1. 사용자는 마크다운 파일을 업로드할 수 있으며, 50K 글자 초과 시 경고 메시지가 표시되고, 100KB 초과 파일은 서버에서 거부된다
  2. 업로드 후 분석 중에는 진행 상태 인디케이터가 표시되고, 완료 시 Goal/Story/Feature/Task 계층 구조 프리뷰가 나타난다
  3. 프리뷰에서 사용자는 체크박스로 생성할 티켓을 선택/해제할 수 있고, 확인 다이얼로그에 생성될 티켓 수가 표시된다
  4. 확인 후 선택된 티켓 전체가 Backlog에 생성되거나, 실패 시 단 하나도 생성되지 않는다 (원자적 일괄 삽입)
  5. VIEWER로 로그인한 사용자가 분석 API를 직접 호출하면 403이 반환된다
**Plans**: TBD
**UI hint**: yes

### Phase 3: Navigation Integration
**Goal**: AI Import 기능의 사이드바 진입점이 추가되고, OWNER/MEMBER는 메뉴를 볼 수 있지만 VIEWER에게는 완전히 숨겨진다
**Depends on**: Phase 2
**Requirements**: NAV-01
**Success Criteria** (what must be TRUE):
  1. OWNER 또는 MEMBER로 로그인한 사용자는 사이드바에서 AI Import 메뉴 항목을 볼 수 있고 클릭하면 Import 페이지로 이동한다
  2. VIEWER로 로그인한 사용자의 사이드바에는 AI Import 메뉴 항목 자체가 존재하지 않는다 (hidden, disabled가 아님)
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Secure Key Management | 0/3 | Planning complete | - |
| 2. AI Import Pipeline | 0/? | Not started | - |
| 3. Navigation Integration | 0/? | Not started | - |
