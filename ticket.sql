-- ==========================================================
-- Tika 프로젝트 백로그 티켓 INSERT SQL
-- 기준일: 2026-03-11
-- 담당자: eDell Lee, brew net
-- 참조 문서:
--   - docs/check_list_workspace.md
--   - docs/check_list_notification.md
--   - docs/phase/REQUIREMENTS-Phase3.md
--   - docs/phase/REQUIREMENT-Phase4.md
--   - docs/phase/REQUIREMENTS-Phase5.md
--
-- 사용법:
--   1. TEAM 워크스페이스가 존재해야 함
--   2. 멤버 display_name 'eDell Lee', 'brew net' 이 해당 워크스페이스에 등록되어 있어야 함
--   3. psql 또는 Drizzle Studio에서 실행

--  # Drizzle Studio 또는 psql에서 실행
--  psql $POSTGRES_URL -f ticket.sql

-- ==========================================================

DO $$
DECLARE
  -- 워크스페이스 + 멤버
  v_ws   INTEGER;
  v_edell    INTEGER;
  v_brewnet  INTEGER;

  -- GOAL IDs
  g_notification  INTEGER;  -- G1: 알림 시스템 완성
  g_team_ws       INTEGER;  -- G2: 팀 워크스페이스 기능 완성
  g_pro           INTEGER;  -- G3: Pro 플랜 기능 구현
  g_enterprise    INTEGER;  -- G4: Enterprise 온프레미스

  -- STORY IDs
  s_inapp_fix     INTEGER;  -- S1: In-App 알림 미완성 항목
  s_personal_ch   INTEGER;  -- S2: 개인별 외부 채널 알림 (Phase 2)
  s_ws_ch_restore INTEGER;  -- S3: 워크스페이스 알림 채널 설정 복원
  s_sprint_fin    INTEGER;  -- S4: 스프린트 기능 완성
  s_member_invite INTEGER;  -- S5: 멤버/초대 기능 완성
  s_board_adv     INTEGER;  -- S6: 보드 고급 기능 (스위밍레인 등)
  s_rich_editor   INTEGER;  -- S7: 리치 텍스트 에디터
  s_file_attach   INTEGER;  -- S8: 파일 첨부
  s_payment       INTEGER;  -- S9: 결제 모듈
  s_mcp_pat       INTEGER;  -- S10: MCP 서버 + PAT
  s_on_premise    INTEGER;  -- S11: 온프레미스 설치
  s_license       INTEGER;  -- S12: 라이센스 관리

  pos INTEGER := 0;

BEGIN
  -- --------------------------------------------------------
  -- 0. Setup: 워크스페이스 + 멤버 조회
  -- --------------------------------------------------------
  SELECT id INTO v_ws
  FROM workspaces
  WHERE type = 'TEAM'
  ORDER BY created_at
  LIMIT 1;

  IF v_ws IS NULL THEN
    RAISE EXCEPTION 'TEAM 워크스페이스를 찾을 수 없습니다. 먼저 팀 워크스페이스를 생성하세요.';
  END IF;

  SELECT id INTO v_edell
  FROM members
  WHERE workspace_id = v_ws AND display_name ILIKE '%eDell%'
  LIMIT 1;

  SELECT id INTO v_brewnet
  FROM members
  WHERE workspace_id = v_ws AND display_name ILIKE '%brew%'
  LIMIT 1;

  IF v_edell IS NULL THEN
    RAISE WARNING 'eDell Lee 멤버를 찾을 수 없습니다. assignee_id = NULL로 삽입됩니다.';
  END IF;

  IF v_brewnet IS NULL THEN
    RAISE WARNING 'brew net 멤버를 찾을 수 없습니다. assignee_id = NULL로 삽입됩니다.';
  END IF;

  -- ========================================================
  -- 1. GOAL 티켓 (4개)
  -- ========================================================

  -- G1: 알림 시스템 완성
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, deleted
  ) VALUES (
    v_ws,
    '[G] 알림 시스템 완성',
    E'## 목표\nIn-App 알림 Phase 1 미완성 항목을 완성하고, 개인별 Slack/Telegram 채널 알림(Phase 2)을 구현한다.\n\n## 범위\n- In-App 알림 미구현 3건 (INVITE_RECEIVED 트리거, 워크스페이스 필터, 댓글 알림 개선)\n- 개인별 외부 채널 알림 전체 (user_notification_channels DB, API, UI)\n- 워크스페이스 알림 채널 설정 탭 복원 (Phase 4 보류 항목)\n\n## 참조\n- docs/check_list_notification.md\n- docs/phase/REQUIREMENT-Phase4.md',
    'GOAL', 'BACKLOG', 'HIGH',
    pos, '2026-03-11', '2026-03-28', v_edell, false
  ) RETURNING id INTO g_notification;

  -- G2: 팀 워크스페이스 기능 완성
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, deleted
  ) VALUES (
    v_ws,
    '[G] 팀 워크스페이스 기능 완성',
    E'## 목표\nPhase 4 잔여 기능 (스프린트 취소/회고, 이메일 초대, 가입 신청 개선, 스위밍 레인, RBAC UI)을 완성한다.\n\n## 범위\n- 스프린트: 취소 API/UI, 회고 기록, 완료 상세 페이지, 목록 관리 페이지\n- 멤버/초대: 이메일 초대 발송(Resend), 초대 재발송, 가입 신청 취소/역할지정\n- RBAC UI: VIEWER/MEMBER 버튼 제어, 내 역할 배지\n- 보드: 스위밍 레인(FR-304), 동적 칼럼 관리\n\n## 참조\n- docs/check_list_workspace.md (섹션 6, 7)\n- docs/phase/REQUIREMENT-Phase4.md',
    'GOAL', 'BACKLOG', 'HIGH',
    pos, '2026-03-11', '2026-04-15', v_brewnet, false
  ) RETURNING id INTO g_team_ws;

  -- G3: Pro 플랜 기능 구현
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, deleted
  ) VALUES (
    v_ws,
    '[G] Pro 플랜 기능 구현 (Phase 3)',
    E'## 목표\n유료 SaaS 플랜을 완성한다. 리치 에디터, 파일 첨부, Stripe 결제 모듈, MCP 서버를 구현한다.\n\n## 범위\n- FR-201: 리치 텍스트 에디터 (Tiptap, 마크다운, XSS 방지)\n- FR-202: 파일 첨부 (Vercel Blob, 10MB, 이미지 썸네일)\n- FR-203: 결제 모듈 (Stripe, Free/Pro 플랜, 기능 제한)\n- FR-204: MCP 서버 + PAT 관리 (9개 MCP 도구, npm 패키지)\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md',
    'GOAL', 'BACKLOG', 'MEDIUM',
    pos, '2026-03-25', '2026-05-30', v_edell, false
  ) RETURNING id INTO g_pro;

  -- G4: Enterprise 온프레미스
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, deleted
  ) VALUES (
    v_ws,
    '[G] Enterprise 온프레미스 지원 (Phase 5)',
    E'## 목표\n기업 고객을 위한 온프레미스 Docker 설치 및 라이센스 관리 시스템을 구현한다.\n\n## 범위\n- FR-401: Docker 이미지 + 설치 위저드\n- FR-402: 라이센스 키 발급/검증 (온라인/오프라인)\n- FR-403: 무료 체험 (7일, 1 워크스페이스, 5명 제한)\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase5.md\n- 별도 레포지토리 개발 예정',
    'GOAL', 'BACKLOG', 'LOW',
    pos, '2026-06-01', '2026-08-31', v_brewnet, false
  ) RETURNING id INTO g_enterprise;

  -- ========================================================
  -- 2. STORY 티켓 (12개)
  -- ========================================================

  -- S1: In-App 알림 미완성 항목 (G1 하위)
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted
  ) VALUES (
    v_ws,
    '[S] In-App 알림 미완성 항목 완성',
    E'## 스토리\nIn-App 알림 Phase 1에서 미구현 또는 부분 구현된 3가지 항목을 완성한다.\n\n## 포함 작업\n1. INVITE_RECEIVED 트리거 연결 (메시지 빌더는 존재, API 연결만 필요)\n2. 알림 내역 페이지 워크스페이스 필터 추가\n3. 댓글 알림 수신자에 기존 댓글 작성자 포함\n\n## 참조\n- docs/check_list_notification.md (1-5-7, 1-7-2, 1-4-5)',
    'STORY', 'BACKLOG', 'HIGH',
    pos, '2026-03-11', '2026-03-15', v_brewnet, g_notification, false
  ) RETURNING id INTO s_inapp_fix;

  -- S2: 개인별 외부 채널 알림 (G1 하위)
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted
  ) VALUES (
    v_ws,
    '[S] 개인별 Slack/Telegram 알림 채널 (Phase 2)',
    E'## 스토리\n사용자가 자신의 개인 Slack Webhook / Telegram Bot을 등록하고 알림을 수신할 수 있다.\n\n## 포함 작업\n- user_notification_channels DB 테이블 생성\n- 쿼리 레이어 (getUserNotificationChannel, upsertUserNotificationChannel)\n- API: GET/PUT /api/notifications/channels/me (slack, telegram), 테스트 발송\n- 알림 생성 헬퍼에서 개인 채널 발송 통합\n- UI: 설정 페이지 개인 채널 설정 섹션\n\n## 참조\n- docs/check_list_notification.md (섹션 2: Phase 2)',
    'STORY', 'BACKLOG', 'MEDIUM',
    pos, '2026-03-16', '2026-03-28', v_edell, g_notification, false
  ) RETURNING id INTO s_personal_ch;

  -- S3: 워크스페이스 알림 채널 설정 복원 (G1 하위)
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted
  ) VALUES (
    v_ws,
    '[S] 워크스페이스 알림 채널 설정 탭 복원',
    E'## 스토리\nPhase 4에서 주석 처리된 워크스페이스 Slack/Telegram 알림 채널 설정 탭을 복원하고 중복 알림 방지를 강화한다.\n\n## 포함 작업\n- SettingsShell에서 notifications 탭 주석 해제\n- SectionKey 타입에 notifications 추가\n- Cron notify-due 중복 알림 방지 idempotency 강화\n\n## 참조\n- docs/phase/REQUIREMENT-Phase4.md\n- docs/check_list_workspace.md (8-2-6)',
    'STORY', 'BACKLOG', 'MEDIUM',
    pos, '2026-03-11', '2026-03-13', v_brewnet, g_notification, false
  ) RETURNING id INTO s_ws_ch_restore;

  -- S4: 스프린트 기능 완성 (G2 하위)
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted
  ) VALUES (
    v_ws,
    '[S] 스프린트 기능 완성',
    E'## 스토리\n미구현된 스프린트 기능 (취소, 회고, 완료 상세, 목록 페이지, 스토리 포인트 입력)을 완성한다.\n\n## 포함 작업\n- 스프린트 취소 API (cancelSprint DB 함수 노출)\n- 스프린트 취소 UI\n- 스프린트 완료 시 회고 기록 (달성률, 메모)\n- 완료된 스프린트 상세 조회 페이지\n- 스프린트 목록 전용 관리 페이지 (app/workspace/[id]/sprints/)\n- 스프린트 생성/편집 폼에 스토리 포인트 총합 입력\n\n## 참조\n- docs/check_list_workspace.md (섹션 6)',
    'STORY', 'BACKLOG', 'MEDIUM',
    pos, '2026-03-11', '2026-03-20', v_edell, g_team_ws, false
  ) RETURNING id INTO s_sprint_fin;

  -- S5: 멤버/초대 기능 완성 (G2 하위)
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted
  ) VALUES (
    v_ws,
    '[S] 멤버/초대 기능 완성',
    E'## 스토리\n이메일 초대 발송, 가입 신청 개선, RBAC UI 역할 제어를 완성한다.\n\n## 포함 작업\n- 이메일 초대 발송 (Resend API 연동, EMAIL_INVITE_GUIDE.md 참고)\n- 초대 재발송 (만료된 초대 토큰 재발행)\n- 가입 신청 취소 (본인 PENDING 신청 취소 API + UI)\n- 가입 신청 승인 시 역할 지정 (MEMBER/VIEWER 선택)\n- VIEWER/MEMBER UI 역할 기반 버튼 노출 제어\n- 내 역할 배지 표시 (헤더 또는 멤버 목록)\n\n## 참조\n- docs/check_list_workspace.md (5-2, 5-3, 5-B)\n- docs/phase/EMAIL_INVITE_GUIDE.md',
    'STORY', 'BACKLOG', 'HIGH',
    pos, '2026-03-14', '2026-03-25', v_brewnet, g_team_ws, false
  ) RETURNING id INTO s_member_invite;

  -- S6: 보드 고급 기능 (G2 하위)
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted
  ) VALUES (
    v_ws,
    '[S] 보드 고급 기능 — 스위밍 레인 & 동적 칼럼',
    E'## 스토리\n보드에 스위밍 레인(가로 행 그룹핑)과 동적 칼럼 관리(OWNER 전용)를 추가한다.\n\n## 포함 작업\n- swim_lanes DB 테이블 신규 설계 + 마이그레이션\n- 스위밍 레인 CRUD API\n- 보드 레이아웃 전면 재구성 (레인 × 칼럼 매트릭스)\n- 레인 배경색/타이틀 커스텀, 드래그 순서 변경\n- 동적 칼럼 DB 스키마 + API (columns 테이블)\n- 동적 칼럼 관리 UI (OWNER 전용)\n\n## 참조\n- docs/check_list_workspace.md (7-1, 7-3)\n- docs/phase/REQUIREMENTS-team.md FR-304',
    'STORY', 'BACKLOG', 'LOW',
    pos, '2026-03-21', '2026-04-15', v_edell, g_team_ws, false
  ) RETURNING id INTO s_board_adv;

  -- S7: 리치 텍스트 에디터 (G3 하위)
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted
  ) VALUES (
    v_ws,
    '[S] 리치 텍스트 에디터 (FR-201)',
    E'## 스토리\n티켓 설명 입력에 마크다운 기반 리치 텍스트 에디터를 제공한다.\n\n## 포함 작업\n- Tiptap 라이브러리 도입 (package.json 변경 허가 필요)\n- 에디터 툴바: H1~H3, Bold, Italic, Underline, Strike, Link, List, Code Block, Clear\n- 마크다운 렌더링 + XSS 방지 (허용 태그 화이트리스트)\n- description 최대 길이 1000→5000자 확장 + Zod + DB 마이그레이션\n- 편집/미리보기 탭 전환\n- 모바일 툴바 상단 고정\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-201\n- NFR-201: 에디터 로드 1초 이내, 타이핑 지연 없음',
    'STORY', 'BACKLOG', 'HIGH',
    pos, '2026-03-25', '2026-04-15', v_brewnet, g_pro, false
  ) RETURNING id INTO s_rich_editor;

  -- S8: 파일 첨부 (G3 하위)
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted
  ) VALUES (
    v_ws,
    '[S] 파일 첨부 (FR-202)',
    E'## 스토리\n티켓에 파일을 첨부하고 다운로드할 수 있다.\n\n## 포함 작업\n- attachments DB 테이블 생성 + 마이그레이션 (ticketId, fileName, fileUrl, fileSize, mimeType)\n- Vercel Blob 스토리지 연동\n- 파일 업로드/삭제 API (10MB 제한, 티켓당 10개, 허용 확장자 검증)\n- 파일 첨부 UI: 드래그앤드롭 업로드 영역, 목록 (파일명/크기/다운로드/삭제)\n- 이미지 파일 썸네일 미리보기\n- 티켓 삭제 시 스토리지 정리 (CASCADE)\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-202',
    'STORY', 'BACKLOG', 'MEDIUM',
    pos, '2026-04-01', '2026-04-20', v_edell, g_pro, false
  ) RETURNING id INTO s_file_attach;

  -- S9: 결제 모듈 (G3 하위)
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted
  ) VALUES (
    v_ws,
    '[S] 결제 모듈 — Free/Pro 구독 (FR-203)',
    E'## 스토리\nStripe 결제 연동으로 Free/Pro 구독 플랜을 제공한다.\n\n## 포함 작업\n- subscriptions DB 테이블 설계 (planType, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd)\n- Stripe Checkout + Webhook 연동 (서명 검증 필수)\n- 플랜별 기능 제한 로직 (티켓 수, 라벨 수, 첨부파일, 알림 채널)\n- 구독 관리 UI (설정 > 구독: 현재 플랜, 결제 수단, 내역)\n- 업그레이드 유도 배너 + 모달 (제한 초과 시)\n- 결제 내역 조회 페이지\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-203\n- NFR-202: PCI DSS, Webhook 서명 검증, 트랜잭션 원자성',
    'STORY', 'BACKLOG', 'HIGH',
    pos, '2026-04-10', '2026-05-15', v_brewnet, g_pro, false
  ) RETURNING id INTO s_payment;

  -- S10: MCP 서버 + PAT (G3 하위)
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted
  ) VALUES (
    v_ws,
    '[S] MCP 서버 & Personal Access Token (FR-204)',
    E'## 스토리\nIDE/터미널에서 AI 도구(Claude Code, Cursor)가 PAT로 인증 후 Tika 티켓을 관리할 수 있다.\n\n## 포함 작업\n- api_tokens DB 테이블 (userId, name, token_hash SHA-256, token_prefix, expires_at, last_used_at)\n- PAT API: POST/GET /api/settings/tokens, DELETE /api/settings/tokens/:id\n- PAT 관리 UI (설정 > API 토큰 탭): 생성/목록/폐기, 토큰 1회 노출 + 복사\n- MCP 서버 npm 패키지 (@tika/mcp-server) 구조 생성\n- 9개 MCP 도구 구현 (list/get/create/update/move/delete ticket, list_labels, list_issues, toggle_checklist)\n- PAT 인증 미들웨어 (Bearer 헤더, SHA-256 조회, last_used_at 갱신)\n- Rate Limit 분당 60회 (429 반환)\n- MCP 클라이언트 설정 가이드 (Claude Code / Cursor)\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-204\n- NFR-203: p95 300ms, 토큰 SHA-256, HTTPS 필수',
    'STORY', 'BACKLOG', 'HIGH',
    pos, '2026-03-25', '2026-04-25', v_edell, g_pro, false
  ) RETURNING id INTO s_mcp_pat;

  -- S11: 온프레미스 설치 (G4 하위)
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted
  ) VALUES (
    v_ws,
    '[S] 온프레미스 Docker 설치 (FR-401)',
    E'## 스토리\nDocker 이미지와 설치 위저드로 기업 자체 서버에 Tika를 설치할 수 있다.\n\n## 포함 작업\n- Dockerfile + Docker Compose (Next.js + PostgreSQL)\n- 설치 위저드 UI (DB 연결 설정 → 관리자 계정 생성 → 마이그레이션 실행)\n- 설치 후 위저드 접근 차단 로직\n- Nginx/Traefik 리버스 프록시 설정 예시\n- Let''s Encrypt HTTPS 자동화 지원\n- 환경변수(.env) 기반 DB 연결 관리\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase5.md FR-401\n- NFR-401: Linux Ubuntu 20.04+, PostgreSQL 14+',
    'STORY', 'BACKLOG', 'MEDIUM',
    pos, '2026-06-01', '2026-07-15', v_brewnet, g_enterprise, false
  ) RETURNING id INTO s_on_premise;

  -- S12: 라이센스 관리 (G4 하위)
  pos := pos + 1000;
  INSERT INTO tickets (
    workspace_id, title, description, type, status, priority,
    position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted
  ) VALUES (
    v_ws,
    '[S] 라이센스 관리 & 무료 체험 (FR-402, FR-403)',
    E'## 스토리\n라이센스 키 발급/검증 시스템과 7일 무료 체험을 제공한다.\n\n## 포함 작업\n- 라이센스 키 발급 서버 설계 (외부 인증 서버)\n- 온라인/오프라인 라이센스 검증 로직\n- 라이센스 등록 UI (이메일 인증 → 키 입력 → 활성화)\n- 무료 체험 제한 로직 (7일, 1 워크스페이스, 5명)\n- 체험 만료 알림 + 라이센스 등록 유도 페이지\n- 만료 후 읽기 전용 모드\n- 갱신 안내 표시 (만료 30일 전)\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase5.md FR-402, FR-403\n- NFR-402: JWT 서명 키, 30일 주기 검증',
    'STORY', 'BACKLOG', 'MEDIUM',
    pos, '2026-07-01', '2026-08-31', v_edell, g_enterprise, false
  ) RETURNING id INTO s_license;

  -- ========================================================
  -- 3. FEATURE / TASK 티켓
  -- ========================================================

  -- === S1 하위: In-App 알림 미완성 ===

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'INVITE_RECEIVED 트리거 연결',
    E'invites POST 핸들러에 sendInAppNotification 후처리 추가.\nbuildInviteReceivedMessage() 빌더는 이미 구현됨, API 연결만 필요.\n\n## 참조\n- docs/check_list_notification.md 1-5-7\n- app/api/workspaces/[id]/invites/route.ts',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-03-11', '2026-03-12', v_brewnet, s_inapp_fix, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '알림 내역 페이지 워크스페이스 필터 추가',
    E'NotificationsPage.tsx에 워크스페이스별 필터 드롭다운 추가.\nGET /api/notifications/in-app?workspaceId= 파라미터 활용.\n\n## 참조\n- docs/check_list_notification.md 1-7-2\n- src/components/notifications/NotificationsPage.tsx',
    'FEATURE', 'BACKLOG', 'MEDIUM', pos, '2026-03-12', '2026-03-14', v_brewnet, s_inapp_fix, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '댓글 알림 수신자에 기존 댓글 작성자 포함',
    E'POST /api/tickets/[id]/comments 핸들러에서 기존 댓글 작성자(memberId→userId 변환) 포함하여 TICKET_COMMENTED 알림 발송.\nmemberId → userId 조인 쿼리 필요.\n\n## 참조\n- docs/check_list_notification.md 1-4-5',
    'TASK', 'BACKLOG', 'LOW', pos, '2026-03-14', '2026-03-15', v_brewnet, s_inapp_fix, false);

  -- === S2 하위: 개인별 외부 채널 알림 ===

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'user_notification_channels DB 스키마 + 마이그레이션',
    E'user_notification_channels 테이블 생성:\n- userId, type(slack|telegram), config(JSON), enabled\n- UNIQUE(userId, type)\n\nnpm run db:generate → npm run db:migrate 실행.',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-03-16', '2026-03-17', v_edell, s_personal_ch, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '개인 채널 쿼리 레이어 구현',
    E'src/db/queries/user-notification-channels.ts 신규 생성:\n- getUserNotificationChannel(userId, type)\n- upsertUserNotificationChannel(userId, type, config, enabled)',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-03-17', '2026-03-18', v_edell, s_personal_ch, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '개인 채널 API 구현 (GET/PUT/Test)',
    E'신규 API 라우트:\n- GET /api/notifications/channels/me\n- PUT /api/notifications/channels/me/slack\n- PUT /api/notifications/channels/me/telegram\n- POST /api/notifications/channels/me/slack/test\n- POST /api/notifications/channels/me/telegram/test\n\n## 참조\n- docs/check_list_notification.md 2-4 ~ 2-8',
    'FEATURE', 'BACKLOG', 'HIGH', pos, '2026-03-18', '2026-03-21', v_edell, s_personal_ch, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '알림 생성 헬퍼 개인 채널 발송 확장',
    E'src/lib/notifications.ts의 sendInAppNotification()을 확장:\n- preferences에서 slackEnabled/telegramEnabled 확인\n- 활성화된 개인 채널에 Slack/Telegram 메시지 발송\n- fire-and-forget 패턴 유지\n\n## 참조\n- docs/check_list_notification.md 2-9, 2-11',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-03-21', '2026-03-23', v_edell, s_personal_ch, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '개인 채널 설정 UI',
    E'설정 페이지 또는 프로필 모달에 개인 Slack/Telegram 채널 설정 섹션 추가:\n- Webhook URL / Bot Token+Chat ID 입력\n- 활성화 토글\n- 테스트 발송 버튼\n\n## 참조\n- docs/check_list_notification.md 2-10',
    'FEATURE', 'BACKLOG', 'MEDIUM', pos, '2026-03-23', '2026-03-28', v_edell, s_personal_ch, false);

  -- === S3 하위: 워크스페이스 알림 채널 복원 ===

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'SettingsShell 알림 채널 탭 주석 해제 및 복원',
    E'docs/phase/REQUIREMENT-Phase4.md 복원 절차 준수:\n1. types.ts SectionKey에 notifications 추가\n2. SettingsShell.tsx 3곳 주석 해제 (import, NAV_ITEMS, sectionRenderers)\n3. 기능 테스트: Slack/Telegram 테스트 발송 정상 확인',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-03-11', '2026-03-12', v_brewnet, s_ws_ch_restore, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'Cron 마감 알림 중복 방지 idempotency 강화',
    E'app/api/cron/notify-due/route.ts에서 1티켓 1회/일 중복 발송 방지 강화:\n- notification_logs에서 오늘 날짜 + ticketId 기준 이미 SENT 여부 체크\n- 중복이면 skip, 없으면 발송\n\n## 참조\n- docs/check_list_workspace.md 8-2-6',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-03-12', '2026-03-13', v_brewnet, s_ws_ch_restore, false);

  -- === S4 하위: 스프린트 기능 완성 ===

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '스프린트 취소 API 구현',
    E'POST /api/workspaces/:id/sprints/:sid/cancel 라우트 신규 생성.\ncancelSprint() DB 함수는 src/db/queries/sprints.ts에 이미 구현됨, API route만 추가.\nOWNER 전용, ACTIVE 스프린트만 취소 가능.\n\n## 참조\n- docs/check_list_workspace.md 6-5-2',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-03-11', '2026-03-13', v_edell, s_sprint_fin, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '스프린트 취소 UI',
    E'SprintSelector 또는 SprintBanner에 "스프린트 취소" 버튼 추가 (OWNER 전용).\nConfirmDialog로 확인 후 POST .../cancel 호출.\n\n## 참조\n- docs/check_list_workspace.md 6-5-3',
    'FEATURE', 'BACKLOG', 'MEDIUM', pos, '2026-03-13', '2026-03-15', v_edell, s_sprint_fin, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '스프린트 완료 회고 기록 기능',
    E'스프린트 완료 시 회고 메모와 달성률을 저장하는 기능 추가:\n- sprints 테이블에 retrospective_notes TEXT, actual_velocity INTEGER 컬럼 추가\n- SprintCompleteDialog에 회고 메모 입력 필드 추가\n- 완료 API에서 저장\n\n## 참조\n- docs/check_list_workspace.md 6-4-6',
    'FEATURE', 'BACKLOG', 'MEDIUM', pos, '2026-03-15', '2026-03-18', v_edell, s_sprint_fin, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '완료된 스프린트 상세 조회 페이지',
    E'app/workspace/[id]/sprints/[sid]/page.tsx 신규 생성:\n- 완료 스프린트 티켓 현황 (완료/미완료 분리)\n- 달성률, 속도(Velocity), 회고 메모 표시\n- TeamSidebar 스프린트 목록에서 링크 연결\n\n## 참조\n- docs/check_list_workspace.md 6-4-7',
    'FEATURE', 'BACKLOG', 'MEDIUM', pos, '2026-03-16', '2026-03-19', v_edell, s_sprint_fin, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '스프린트 목록 전용 관리 페이지',
    E'app/workspace/[id]/sprints/page.tsx 신규 생성:\n- PLANNED/ACTIVE/COMPLETED 스프린트 목록 (날짜, 목표, 티켓 수, 상태)\n- 스프린트 생성/수정/삭제 인라인 조작\n- TeamSidebar에 "스프린트" 내비게이션 항목 추가\n\n## 참조\n- docs/check_list_workspace.md 6-2-5, 6-2-6',
    'FEATURE', 'BACKLOG', 'LOW', pos, '2026-03-18', '2026-03-20', v_edell, s_sprint_fin, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '스프린트 생성/편집 폼에 스토리 포인트 입력 추가',
    E'SprintSelector 내 스프린트 생성/편집 폼에 story_points_total 입력 필드 추가.\nsprint.storyPointsTotal 컬럼은 이미 DB에 존재.\n\n## 참조\n- docs/check_list_workspace.md 6-2-4',
    'TASK', 'BACKLOG', 'LOW', pos, '2026-03-11', '2026-03-12', v_edell, s_sprint_fin, false);

  -- === S5 하위: 멤버/초대 기능 완성 ===

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '이메일 초대 발송 — Resend API 연동',
    E'Resend(또는 SendGrid) API를 연동하여 초대 링크를 이메일로 발송:\n- POST /api/workspaces/:id/invites 에서 이메일 발송 후처리\n- 이메일 템플릿: 초대자 이름, 워크스페이스 이름, 수락 링크\n- 발송 실패 시 링크 생성은 성공, 경고 응답 포함\n\n## 참조\n- docs/check_list_workspace.md 5-2-8\n- docs/phase/EMAIL_INVITE_GUIDE.md',
    'FEATURE', 'BACKLOG', 'HIGH', pos, '2026-03-14', '2026-03-18', v_brewnet, s_member_invite, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '만료된 초대 토큰 재발행 (초대 재발송)',
    E'InviteModal에 "재발송" 버튼 추가:\n- 기존 초대 취소 + 새 초대 생성 (토큰 갱신)\n- 또는 PATCH /api/workspaces/:id/invites/:inviteId 로 expires_at 갱신\n\n## 참조\n- docs/check_list_workspace.md 5-2-10',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-03-18', '2026-03-19', v_brewnet, s_member_invite, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '가입 신청 취소 API + UI',
    E'신청자가 자신의 PENDING 가입 신청을 취소할 수 있도록:\n- DELETE /api/workspaces/:id/join-requests/me (또는 /:reqId with 본인 확인)\n- OnboardingWizard 또는 WorkspaceFinder에 "신청 취소" 버튼 추가\n\n## 참조\n- docs/check_list_workspace.md 5-3-7',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-03-19', '2026-03-21', v_brewnet, s_member_invite, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '가입 신청 승인 시 역할 지정 (MEMBER/VIEWER)',
    E'JoinRequestList에서 승인 시 역할 선택 드롭다운 추가:\n- 현재: 항상 MEMBER로 등록\n- 변경: MEMBER / VIEWER 선택 후 승인\n- PATCH /api/workspaces/:id/join-requests/:reqId 에 role 파라미터 추가\n\n## 참조\n- docs/check_list_workspace.md 5-3-8',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-03-21', '2026-03-22', v_brewnet, s_member_invite, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'UI 레벨 VIEWER/MEMBER 역할 기반 버튼 제어',
    E'현재 isOwner boolean만 전달하는 RBAC UI를 개선:\n- userRole prop (OWNER/MEMBER/VIEWER) 전파\n- VIEWER에게 티켓 생성/수정/삭제 버튼 숨기기\n- MEMBER에게 스프린트 관리 버튼 숨기기\n\n## 참조\n- docs/check_list_workspace.md 5-B-3',
    'FEATURE', 'BACKLOG', 'MEDIUM', pos, '2026-03-20', '2026-03-24', v_brewnet, s_member_invite, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '내 역할 배지 표시 UI',
    E'현재 멤버 본인의 역할(OWNER/MEMBER/VIEWER)을 헤더 프로필 또는 멤버 목록에서 시각적으로 확인할 수 있도록 배지 추가.\nGET /api/workspaces/:id/members/me 활용.\n\n## 참조\n- docs/check_list_workspace.md 5-B-6',
    'TASK', 'BACKLOG', 'LOW', pos, '2026-03-24', '2026-03-25', v_brewnet, s_member_invite, false);

  -- === S6 하위: 보드 고급 기능 ===

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'swim_lanes DB 테이블 설계 + 마이그레이션',
    E'swim_lanes 테이블 신규 생성:\n- id, workspaceId, name, color, position, createdAt\n- tickets 테이블에 swim_lane_id FK 추가\n\nsrc/db/schema.ts 수정 → 사용자 확인 후 진행.\n\n## 참조\n- docs/check_list_workspace.md 7-1 (FR-304)',
    'TASK', 'BACKLOG', 'LOW', pos, '2026-03-21', '2026-03-23', v_edell, s_board_adv, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '스위밍 레인 CRUD API',
    E'API 라우트 신규:\n- POST /api/workspaces/:id/swim-lanes (생성)\n- PATCH /api/workspaces/:id/swim-lanes/:laneId (수정: 이름/색상)\n- DELETE /api/workspaces/:id/swim-lanes/:laneId\n- PATCH /api/workspaces/:id/swim-lanes/reorder (순서)\n\nOWNER 전용.',
    'TASK', 'BACKLOG', 'LOW', pos, '2026-03-22', '2026-03-25', v_edell, s_board_adv, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '스위밍 레인 보드 레이아웃 구현',
    E'Board.tsx를 레인 × 칼럼 2D 매트릭스 레이아웃으로 재구성:\n- 각 레인은 4칼럼(BACKLOG/TODO/IN_PROGRESS/DONE) 가짐\n- 레인 간 카드 드래그앤드롭 지원\n- 레인 배경색/타이틀 표시\n- 레인 드래그 순서 변경\n\n## 참조\n- docs/check_list_workspace.md 7-1',
    'FEATURE', 'BACKLOG', 'LOW', pos, '2026-03-25', '2026-04-05', v_edell, s_board_adv, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '동적 칼럼 관리 DB 스키마 + API + UI',
    E'현재 4칼럼 고정 구조를 동적으로 변경 가능하게 만들기:\n- columns 테이블 신규 설계 (workspaceId, name, type, position, color)\n- CRUD API (OWNER 전용)\n- 보드 칼럼 렌더링을 columns 테이블 기반으로 전환\n\n## 참조\n- docs/check_list_workspace.md 7-3',
    'FEATURE', 'BACKLOG', 'LOW', pos, '2026-04-05', '2026-04-15', v_edell, s_board_adv, false);

  -- === S7 하위: 리치 텍스트 에디터 ===

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'Tiptap 라이브러리 도입 및 기본 에디터 컴포넌트',
    E'@tiptap/react, @tiptap/starter-kit 등 의존성 추가 (package.json 변경 허가 필요).\nRichTextEditor 기본 컴포넌트 생성 (src/components/ui/RichTextEditor.tsx).\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-201',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-03-25', '2026-03-26', v_brewnet, s_rich_editor, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '에디터 툴바 구현 (H1~H3, Bold, Italic, Underline, Strike, Link, List, Code, Clear)',
    E'RichTextEditor 툴바 컴포넌트 구현:\n- 지원 서식: H1/H2/H3, Bold, Italic, Underline, Strike, Link, Bullet List, Code Block, Clear\n- 상단 고정, 선택 영역에 서식 적용\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-201 지원 서식 표',
    'FEATURE', 'BACKLOG', 'HIGH', pos, '2026-03-26', '2026-04-01', v_brewnet, s_rich_editor, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'description 최대 길이 5000자 확장 + 마이그레이션',
    E'- validations.ts: description Zod 스키마 1000 → 5000자\n- schema.ts: description 컬럼 TEXT 유지 (PostgreSQL TEXT는 길이 제한 없음, 검증만 변경)\n- TicketForm.tsx의 maxLength 업데이트',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-03-25', '2026-03-26', v_brewnet, s_rich_editor, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '마크다운 저장 + HTML 렌더링 + XSS 방지',
    E'- DB에 마크다운 원본 저장\n- 렌더링 시 허용 태그 화이트리스트(h1~h6, p, strong, em, a, ul, ol, li, code, pre) 적용\n- DOMPurify 또는 sanitize-html 사용 (패키지 추가 허가 필요)\n- TicketModal의 description 표시를 plain → 렌더링 HTML로 전환',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-04-01', '2026-04-05', v_brewnet, s_rich_editor, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '에디터 편집/미리보기 탭 전환',
    E'RichTextEditor에 편집(Edit) / 미리보기(Preview) 탭 추가.\n미리보기 탭에서 렌더링된 HTML 결과 표시.',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-04-05', '2026-04-10', v_brewnet, s_rich_editor, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '모바일 에디터 툴바 최적화 (스크롤 시 상단 고정)',
    E'모바일(768px 미만)에서 에디터 툴바가 스크롤 시 화면 상단에 고정되도록 구현.\nsticky 포지셔닝 또는 IntersectionObserver 활용.',
    'TASK', 'BACKLOG', 'LOW', pos, '2026-04-10', '2026-04-15', v_brewnet, s_rich_editor, false);

  -- === S8 하위: 파일 첨부 ===

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'attachments DB 테이블 설계 + 마이그레이션',
    E'attachments 테이블 신규 생성:\n- id, ticketId (FK ON DELETE CASCADE), fileName, fileUrl, fileSize, mimeType, createdAt\n\nsrc/db/schema.ts 수정 → 사용자 확인 후 진행.\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-202 파일 첨부 데이터',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-04-01', '2026-04-02', v_edell, s_file_attach, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'Vercel Blob 스토리지 연동',
    E'@vercel/blob 패키지 추가 (허가 필요).\nBLOB_READ_WRITE_TOKEN 환경변수 설정.\n업로드/삭제 헬퍼 함수 src/lib/storage.ts 작성.',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-04-02', '2026-04-05', v_edell, s_file_attach, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '파일 업로드/삭제 API',
    E'API 라우트:\n- POST /api/tickets/:id/attachments (업로드: 10MB, 티켓당 10개, 허용 확장자 검증)\n- DELETE /api/tickets/:id/attachments/:attachId (삭제: Blob에서도 제거)\n- GET /api/tickets/:id/attachments (목록 조회)\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-202 제약조건',
    'FEATURE', 'BACKLOG', 'HIGH', pos, '2026-04-05', '2026-04-10', v_edell, s_file_attach, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '파일 첨부 UI (드래그앤드롭 + 목록)',
    E'TicketModal과 TicketForm에 파일 첨부 섹션 추가:\n- 드래그앤드롭 업로드 영역\n- 첨부 파일 목록 (파일명, 크기, 다운로드 링크, 삭제 버튼)\n- 10MB 초과 시 안내 메시지\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-202 UI 요소',
    'FEATURE', 'BACKLOG', 'HIGH', pos, '2026-04-10', '2026-04-18', v_edell, s_file_attach, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '이미지 파일 썸네일 미리보기',
    E'첨부 파일 목록에서 이미지 파일(jpg, png, gif, webp)은 썸네일 인라인 미리보기 표시.\n리치 에디터에서 이미지 인라인 삽입 지원 (FR-201 연계).',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-04-15', '2026-04-20', v_edell, s_file_attach, false);

  -- === S9 하위: 결제 모듈 ===

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '구독 플랜 DB 스키마 설계 + 마이그레이션',
    E'subscriptions 테이블 신규 생성:\n- id, userId, planType(free|pro), stripeCustomerId, stripeSubscriptionId, currentPeriodEnd, cancelAtPeriodEnd\n\nusers 테이블에 planType 컬럼 추가 (또는 별도 join).\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-203',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-04-10', '2026-04-12', v_brewnet, s_payment, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'Stripe Checkout 연동 + Webhook 검증',
    E'- Stripe 패키지 추가 (허가 필요)\n- POST /api/billing/checkout — Stripe Checkout 세션 생성\n- POST /api/billing/webhook — Stripe 이벤트 처리 (서명 검증 필수)\n  - checkout.session.completed → Pro 활성화\n  - customer.subscription.deleted → Free 전환\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-203, NFR-202',
    'FEATURE', 'BACKLOG', 'HIGH', pos, '2026-04-12', '2026-04-25', v_brewnet, s_payment, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '플랜별 기능 제한 로직 구현',
    E'Free 플랜 제한 적용:\n- 티켓 30개 초과 시 400 PLAN_LIMIT 에러\n- 라벨 5개 초과 시 차단\n- 첨부파일 업로드 차단 (Free)\n- 알림 채널 1개만 허용\n\n미들웨어 또는 각 API에서 planType 확인 후 분기.\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-203 플랜 구조',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-04-25', '2026-05-03', v_brewnet, s_payment, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '구독 관리 UI (설정 > 구독 탭)',
    E'설정 페이지에 "구독" 탭 추가:\n- 현재 플랜 및 사용량 표시\n- Pro 업그레이드 버튼 → Stripe Checkout 리다이렉트\n- 구독 취소 버튼 (기간 종료까지 유지)\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-203 UI 요소',
    'FEATURE', 'BACKLOG', 'HIGH', pos, '2026-04-20', '2026-05-05', v_brewnet, s_payment, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '제한 초과 시 업그레이드 유도 배너 + 모달',
    E'- Free 플랜 제한 도달 시 인라인 업그레이드 배너 표시\n- "Pro로 업그레이드" CTA 버튼\n- 플랜 비교표 모달 (Free vs Pro 기능 비교)',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-05-01', '2026-05-10', v_brewnet, s_payment, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '결제 내역 조회 페이지',
    E'설정 또는 별도 페이지에서 결제 내역 조회:\n- Stripe Customer Portal 연동 또는 자체 내역 페이지\n- 날짜, 금액, 상태(성공/실패) 표시',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-05-05', '2026-05-15', v_brewnet, s_payment, false);

  -- === S10 하위: MCP 서버 + PAT ===

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'api_tokens DB 테이블 설계 + 마이그레이션',
    E'api_tokens 테이블 신규 생성:\n- id, userId (FK→users), name (100자), token_hash (SHA-256, UNIQUE), token_prefix (12자), expires_at (NULLABLE), last_used_at (NULLABLE), created_at\n- 인덱스: (userId), (token_hash)\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-204 DB 테이블',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-03-25', '2026-03-26', v_edell, s_mcp_pat, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'PAT 생성/목록/폐기 API',
    E'API 라우트:\n- POST /api/settings/tokens — 토큰 생성 (SHA-256 해시 저장, 토큰 평문 1회 반환)\n- GET /api/settings/tokens — 목록 조회 (hash 제외, prefix/name/expires 포함)\n- DELETE /api/settings/tokens/:id — 폐기 (revoke)\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-204 API',
    'FEATURE', 'BACKLOG', 'HIGH', pos, '2026-03-26', '2026-04-01', v_edell, s_mcp_pat, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'PAT 관리 UI (설정 > API 토큰 탭)',
    E'설정 페이지에 "API 토큰" 탭 추가 (SectionKey 확장):\n- 토큰 생성: 이름 + 만료일(30일/90일/1년/무기한) 입력\n- 생성 후: 토큰 값 1회 표시 + 클립보드 복사\n- 토큰 목록: prefix, 이름, 만료일, 마지막 사용 시각, 폐기 버튼\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-204 UI 요소',
    'FEATURE', 'BACKLOG', 'HIGH', pos, '2026-04-01', '2026-04-08', v_edell, s_mcp_pat, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'PAT 인증 미들웨어 구현',
    E'Authorization: Bearer tika_pat_xxx 헤더 파싱 → SHA-256 해시 → api_tokens 조회 → 만료 확인 → last_used_at 갱신.\nsrc/lib/pat-auth.ts 헬퍼 함수 생성.\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-204 처리 규칙',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-04-06', '2026-04-10', v_edell, s_mcp_pat, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'MCP 서버 npm 패키지 구조 생성 (@tika/mcp-server)',
    E'별도 packages/mcp-server 디렉토리 또는 별도 레포 생성:\n- package.json (@tika/mcp-server)\n- MCP SDK 연동 (JSON-RPC over stdio/SSE)\n- 환경변수: TIKA_API_URL, TIKA_TOKEN\n- bin 엔트리포인트\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-204 MCP 서버 구현',
    'TASK', 'BACKLOG', 'HIGH', pos, '2026-04-05', '2026-04-08', v_edell, s_mcp_pat, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '9개 MCP 도구 구현',
    E'tika_list_tickets, tika_get_ticket, tika_create_ticket, tika_update_ticket, tika_move_ticket, tika_delete_ticket, tika_list_labels, tika_list_issues, tika_toggle_checklist\n\n각 도구: PAT 인증 → Tika API 호출 → 결과 반환.\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-204 MCP 도구 목록',
    'FEATURE', 'BACKLOG', 'HIGH', pos, '2026-04-08', '2026-04-20', v_edell, s_mcp_pat, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'Rate Limit 분당 60회 구현',
    E'MCP API 요청에 Rate Limit 적용:\n- Redis 또는 Vercel KV 기반 카운터 (또는 메모리 기반)\n- 분당 60회 초과 시 429 Too Many Requests 반환\n- 토큰별로 카운터 관리\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md NFR-203',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-04-20', '2026-04-22', v_edell, s_mcp_pat, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'MCP 클라이언트 설정 가이드 문서',
    E'Claude Code, Cursor 등 클라이언트별 설정 가이드 작성 및 UI에서 링크 제공:\n- .claude/settings.json 설정 예시\n- mcp.json 설정 예시\n- PAT 발급 ~ MCP 연결 전체 플로우 안내\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase3.md FR-204 클라이언트 설정 예시',
    'TASK', 'BACKLOG', 'LOW', pos, '2026-04-22', '2026-04-25', v_edell, s_mcp_pat, false);

  -- === S11 하위: 온프레미스 설치 ===

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'Dockerfile + Docker Compose 구성',
    E'Dockerfile (Next.js standalone 빌드):\n- Node 22 Alpine 기반\n- .env 주입 지원\n\ndocker-compose.yml:\n- tika-app, postgres:16 서비스\n- volume: postgres_data\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase5.md FR-401, NFR-401',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-06-01', '2026-06-10', v_brewnet, s_on_premise, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '설치 위저드 UI 구현',
    E'app/setup/page.tsx 신규 생성 (최초 1회만 접근 가능):\n단계: DB 연결 정보 입력 → 연결 테스트 → 관리자 계정 생성 → 마이그레이션 실행 → 완료\n설치 완료 후 /setup 접근 차단 (setup_completed 플래그).\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase5.md FR-401 초기 설치 플로우',
    'FEATURE', 'BACKLOG', 'MEDIUM', pos, '2026-06-10', '2026-06-30', v_brewnet, s_on_premise, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, 'Nginx/Traefik 리버스 프록시 + HTTPS 설정 가이드',
    E'nginx.conf 예시 및 Traefik docker-compose 예시 작성.\nLet''s Encrypt 자동 HTTPS 설정 가이드 (Certbot / Traefik ACME).\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase5.md NFR-401',
    'TASK', 'BACKLOG', 'LOW', pos, '2026-07-01', '2026-07-15', v_brewnet, s_on_premise, false);

  -- === S12 하위: 라이센스 관리 ===

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '라이센스 검증 로직 구현 (온라인 + 오프라인)',
    E'- 온라인: 외부 인증 서버 API 호출로 라이센스 키 검증\n- 오프라인: JWT 서명 기반 로컬 검증 (30일 유효)\n- licenses 테이블 (licenseKey, companyName, email, maxUsers, expiresAt, activatedAt)\n- 30일마다 재검증 로직\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase5.md FR-402, NFR-402',
    'FEATURE', 'BACKLOG', 'MEDIUM', pos, '2026-07-10', '2026-07-25', v_edell, s_license, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '라이센스 등록 UI',
    E'app/setup/license/page.tsx:\n- 회사 이메일 입력 → 인증 메일 발송\n- 라이센스 키 입력 + 검증\n- 활성화 성공 시 /workspace 리다이렉트\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase5.md FR-402 라이센스 발급 플로우',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-07-20', '2026-07-31', v_edell, s_license, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '무료 체험 제한 로직 (7일, 1 워크스페이스, 5명)',
    E'라이센스 없는 신규 설치 시 7일 무료 체험 모드:\n- 설치 날짜 기준 7일 카운트\n- 워크스페이스 1개, 멤버 5명 초과 시 차단\n- 만료 후 라이센스 등록 페이지로 전환 (데이터 유지)\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase5.md FR-403',
    'TASK', 'BACKLOG', 'MEDIUM', pos, '2026-07-25', '2026-08-05', v_edell, s_license, false);

  pos := pos + 1000;
  INSERT INTO tickets (workspace_id, title, description, type, status, priority, position, planned_start_date, planned_end_date, assignee_id, parent_id, deleted)
  VALUES (v_ws, '만료 후 읽기 전용 모드 + 갱신 안내',
    E'- 라이센스 만료 30일 전: 배너 갱신 안내 표시\n- 만료 후: 티켓 생성/수정/삭제 API 차단 (읽기 전용)\n- 만료 화면에서 라이센스 갱신/구매 링크 표시\n\n## 참조\n- docs/phase/REQUIREMENTS-Phase5.md FR-402 처리 규칙',
    'TASK', 'BACKLOG', 'LOW', pos, '2026-08-05', '2026-08-31', v_edell, s_license, false);

  RAISE NOTICE '✅ 티켓 생성 완료: 4 Goals, 12 Stories, 58 Features/Tasks (총 74개)';
  RAISE NOTICE '워크스페이스 ID: %', v_ws;
  RAISE NOTICE 'eDell Lee member ID: %', v_edell;
  RAISE NOTICE 'brew net member ID: %', v_brewnet;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '티켓 생성 중 오류 발생: % — %', SQLSTATE, SQLERRM;
END $$;

-- ==========================================================
-- 라벨 생성 + 티켓 라벨 배정
-- ==========================================================
DO $$
DECLARE
  v_ws       INTEGER := 8;
  l_frontend INTEGER;
  l_backend  INTEGER;
  l_design   INTEGER;
  l_bug      INTEGER;
  l_docs     INTEGER;
  l_infra    INTEGER;
  t_base     INTEGER;  -- 첫 번째 GOAL 티켓 id (ticket.sql 실행 후 동적으로 조회)
BEGIN
  -- 라벨 생성
  INSERT INTO labels (workspace_id, name, color) VALUES (v_ws, 'Frontend', '#2b7fff') RETURNING id INTO l_frontend;
  INSERT INTO labels (workspace_id, name, color) VALUES (v_ws, 'Backend',  '#00c950') RETURNING id INTO l_backend;
  INSERT INTO labels (workspace_id, name, color) VALUES (v_ws, 'Design',   '#ad46ff') RETURNING id INTO l_design;
  INSERT INTO labels (workspace_id, name, color) VALUES (v_ws, 'Bug',      '#fb2c36') RETURNING id INTO l_bug;
  INSERT INTO labels (workspace_id, name, color) VALUES (v_ws, 'Docs',     '#ffac6d') RETURNING id INTO l_docs;
  INSERT INTO labels (workspace_id, name, color) VALUES (v_ws, 'Infra',    '#615fff') RETURNING id INTO l_infra;

  -- 티켓 id 오프셋 기준 (가장 작은 GOAL id)
  SELECT MIN(id) INTO t_base FROM tickets WHERE workspace_id = v_ws AND type = 'GOAL';

  -- GOALs (t_base+0 ~ t_base+3)
  INSERT INTO ticket_labels VALUES (t_base+0, l_backend),(t_base+0, l_frontend);
  INSERT INTO ticket_labels VALUES (t_base+1, l_backend),(t_base+1, l_frontend);
  INSERT INTO ticket_labels VALUES (t_base+2, l_backend),(t_base+2, l_design);
  INSERT INTO ticket_labels VALUES (t_base+3, l_infra),(t_base+3, l_backend);

  -- STORYs (t_base+4 ~ t_base+15)
  INSERT INTO ticket_labels VALUES (t_base+4,  l_backend),(t_base+4,  l_frontend);
  INSERT INTO ticket_labels VALUES (t_base+5,  l_backend);
  INSERT INTO ticket_labels VALUES (t_base+6,  l_frontend),(t_base+6,  l_backend);
  INSERT INTO ticket_labels VALUES (t_base+7,  l_backend),(t_base+7,  l_frontend);
  INSERT INTO ticket_labels VALUES (t_base+8,  l_backend),(t_base+8,  l_frontend);
  INSERT INTO ticket_labels VALUES (t_base+9,  l_frontend),(t_base+9,  l_design);
  INSERT INTO ticket_labels VALUES (t_base+10, l_frontend),(t_base+10, l_design);
  INSERT INTO ticket_labels VALUES (t_base+11, l_backend),(t_base+11, l_frontend);
  INSERT INTO ticket_labels VALUES (t_base+12, l_backend),(t_base+12, l_infra);
  INSERT INTO ticket_labels VALUES (t_base+13, l_backend),(t_base+13, l_docs);
  INSERT INTO ticket_labels VALUES (t_base+14, l_infra),(t_base+14, l_docs);
  INSERT INTO ticket_labels VALUES (t_base+15, l_backend),(t_base+15, l_infra);

  -- TASKs & FEATUREs (t_base+16 ~ t_base+73) - 삽입 순서 기준
  INSERT INTO ticket_labels VALUES (t_base+16, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+17, l_frontend);
  INSERT INTO ticket_labels VALUES (t_base+18, l_backend),(t_base+18, l_bug);
  INSERT INTO ticket_labels VALUES (t_base+19, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+20, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+21, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+22, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+23, l_frontend),(t_base+23, l_design);
  INSERT INTO ticket_labels VALUES (t_base+24, l_frontend);
  INSERT INTO ticket_labels VALUES (t_base+25, l_backend),(t_base+25, l_infra);
  INSERT INTO ticket_labels VALUES (t_base+26, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+27, l_frontend),(t_base+27, l_design);
  INSERT INTO ticket_labels VALUES (t_base+28, l_frontend),(t_base+28, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+29, l_frontend);
  INSERT INTO ticket_labels VALUES (t_base+30, l_frontend),(t_base+30, l_design);
  INSERT INTO ticket_labels VALUES (t_base+31, l_frontend),(t_base+31, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+32, l_backend),(t_base+32, l_infra);
  INSERT INTO ticket_labels VALUES (t_base+33, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+34, l_backend),(t_base+34, l_frontend);
  INSERT INTO ticket_labels VALUES (t_base+35, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+36, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+37, l_frontend),(t_base+37, l_design);
  INSERT INTO ticket_labels VALUES (t_base+38, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+39, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+40, l_frontend),(t_base+40, l_design);
  INSERT INTO ticket_labels VALUES (t_base+41, l_backend),(t_base+41, l_infra);
  INSERT INTO ticket_labels VALUES (t_base+42, l_frontend),(t_base+42, l_design);
  INSERT INTO ticket_labels VALUES (t_base+43, l_frontend),(t_base+43, l_design);
  INSERT INTO ticket_labels VALUES (t_base+44, l_frontend);
  INSERT INTO ticket_labels VALUES (t_base+45, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+46, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+47, l_frontend),(t_base+47, l_design);
  INSERT INTO ticket_labels VALUES (t_base+48, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+49, l_frontend),(t_base+49, l_design);
  INSERT INTO ticket_labels VALUES (t_base+50, l_backend),(t_base+50, l_infra);
  INSERT INTO ticket_labels VALUES (t_base+51, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+52, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+53, l_backend),(t_base+53, l_infra);
  INSERT INTO ticket_labels VALUES (t_base+54, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+55, l_frontend),(t_base+55, l_design);
  INSERT INTO ticket_labels VALUES (t_base+56, l_frontend),(t_base+56, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+57, l_infra),(t_base+57, l_docs);
  INSERT INTO ticket_labels VALUES (t_base+58, l_frontend),(t_base+58, l_infra);
  INSERT INTO ticket_labels VALUES (t_base+59, l_infra),(t_base+59, l_docs);
  INSERT INTO ticket_labels VALUES (t_base+60, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+61, l_frontend),(t_base+61, l_design);
  INSERT INTO ticket_labels VALUES (t_base+62, l_backend);
  INSERT INTO ticket_labels VALUES (t_base+63, l_frontend),(t_base+63, l_backend);

  RAISE NOTICE '✅ 라벨 생성 및 배정 완료 (workspace_id=%)', v_ws;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '라벨 배정 중 오류 발생: % — %', SQLSTATE, SQLERRM;
END $$;
