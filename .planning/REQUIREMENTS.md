# Requirements: Tika AI Ticket Automation

**Defined:** 2026-04-11  
**Core Value:** 사용자가 마크다운 체크리스트 하나만 올리면 업무 계획이 칸반 티켓으로 자동 분해된다

## v1 Requirements

### Key Management (API 키 관리)

- [ ] **KEY-01**: OWNER는 시스템 전역 Gemini API 키를 설정 화면에서 등록할 수 있다
- [ ] **KEY-02**: 등록된 API 키는 AES-256-GCM으로 암호화되어 DB에 저장된다 (plaintext 저장 금지)
- [ ] **KEY-03**: OWNER는 저장된 키를 "앞 5자 + `*` × 나머지 길이 + 뒤 5자" 형태로 확인할 수 있다
- [ ] **KEY-04**: OWNER는 저장된 키를 수정(교체)할 수 있다
- [ ] **KEY-05**: OWNER는 저장된 키를 삭제할 수 있다
- [ ] **KEY-06**: 키 저장 시 Gemini API에 probe 요청으로 키 유효성이 검증된다
- [ ] **KEY-07**: MEMBER/VIEWER에게는 API 키 관련 메뉴가 완전히 숨겨진다 (disabled 아닌 hidden)

### AI Analysis (AI 분석 파이프라인)

- [ ] **AI-01**: 사용자는 마크다운 파일을 업로드할 수 있다
- [ ] **AI-02**: 문서가 50K 글자를 초과하면 클라이언트에서 토큰 비용 경고가 표시된다
- [ ] **AI-03**: 서버는 100KB를 초과하는 파일을 거부한다
- [ ] **AI-04**: 업로드된 마크다운은 Gemini API로 분석되어 Goal/Story/Feature/Task 계층 구조로 파싱된다
- [ ] **AI-05**: 분석 중에는 진행 상태가 표시된다 (PROCESSING 상태 인디케이터)
- [ ] **AI-06**: 분석 결과는 커밋 전 프리뷰 패널에 표시된다 (PREVIEW 상태)
- [ ] **AI-07**: 프리뷰에서 사용자는 체크박스로 생성할 티켓을 선택/해제할 수 있다 (기본: 전체 선택)
- [ ] **AI-08**: 생성 전 확인 다이얼로그에 생성될 티켓 수가 표시된다
- [ ] **AI-09**: 확인 후 선택된 티켓이 Backlog에 원자적으로 일괄 생성된다 (전체 성공 또는 전체 롤백)
- [ ] **AI-10**: 생성 완료 후 성공 토스트와 함께 생성된 티켓 수가 표시된다

### Navigation & Access (탐색 및 접근 제어)

- [ ] **NAV-01**: AI 임포트 기능이 사이드바/네비게이션 메뉴에 진입점으로 표시된다
- [ ] **NAV-02**: OWNER만 API 키 설정 페이지에 접근할 수 있다 (API 레벨 RBAC 포함)
- [ ] **NAV-03**: MEMBER 이상만 AI 분석 기능을 사용할 수 있다 (API 레벨 RBAC 포함)

## v2 Requirements

### Enhancements

- **ENH-01**: 프리뷰에서 인라인 티켓 제목 편집
- **ENH-02**: 파일 업로드 전 실시간 토큰 예상치 카운터
- **ENH-03**: SSE 기반 분석 진행률 스트리밍
- **ENH-04**: 멀티 LLM 지원 (Claude, OpenAI 등)
- **ENH-05**: 마크다운 형식 힌트 툴팁

## Out of Scope

| Feature | Reason |
|---------|--------|
| Feature 2 Webhook + MCP | 이 마일스톤 이후 별도 계획; 내부 문서에 정리됨 |
| 사용자별(per-user) API 키 | 시스템 전역으로 확정; 운영 단순화 |
| 실시간 WebSocket 업데이트 | 현재 아키텍처가 폴링 기반; 기존 패턴 유지 |
| 프리뷰 내 티켓 타입 편집 | 구현 복잡도 HIGH; MVP 단순화 |
| 생성 후 rollback/undo | 프리뷰 단계에서 사전 검토로 대체 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| KEY-01 | Phase 1 | Pending |
| KEY-02 | Phase 1 | Pending |
| KEY-03 | Phase 1 | Pending |
| KEY-04 | Phase 1 | Pending |
| KEY-05 | Phase 1 | Pending |
| KEY-06 | Phase 1 | Pending |
| KEY-07 | Phase 1 | Pending |
| NAV-02 | Phase 1 | Pending |
| AI-01 | Phase 2 | Pending |
| AI-02 | Phase 2 | Pending |
| AI-03 | Phase 2 | Pending |
| AI-04 | Phase 2 | Pending |
| AI-05 | Phase 2 | Pending |
| AI-06 | Phase 2 | Pending |
| AI-07 | Phase 2 | Pending |
| AI-08 | Phase 2 | Pending |
| AI-09 | Phase 2 | Pending |
| AI-10 | Phase 2 | Pending |
| NAV-03 | Phase 2 | Pending |
| NAV-01 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-11*  
*Last updated: 2026-04-11 after roadmap creation*
