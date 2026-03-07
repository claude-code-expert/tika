-- ============================================================
-- Tika WBS Seed: "Tika 웹 사이트 완성"
-- Target workspace: id=2 (tika, TEAM)
-- Members: id=2 (eDell Lee, OWNER), id=3 (added below, MEMBER)
-- Labels (ws=2): 7=Frontend, 8=Backend, 9=Auth, 10=Analytics,
--                11=Design, 12=Infra, 13=Docs
--
-- Usage:
--   psql "$POSTGRES_URL" -f scripts/seed-wbs-tika.sql
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- Step 1: Add second member to workspace 2
--         Copies member id=1's user_id into workspace 2
-- ─────────────────────────────────────────────────────────────
INSERT INTO members (user_id, workspace_id, display_name, color, role, created_at)
SELECT m.user_id, 2, m.display_name, '#A78BFA', 'MEMBER', NOW()
FROM members m
WHERE m.id = 1
ON CONFLICT (user_id, workspace_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Step 2: Insert ticket hierarchy using a single CTE chain
--         GOAL → STORY(×5) → FEATURE(×14) → TASK(×37)
--
--   m2 = OWNER of workspace 2
--   m3 = MEMBER of workspace 2 (just inserted above)
-- ─────────────────────────────────────────────────────────────
WITH
  m2 AS (
    SELECT id FROM members WHERE workspace_id = 2 AND role = 'OWNER' LIMIT 1
  ),
  m3 AS (
    SELECT id FROM members WHERE workspace_id = 2 AND role = 'MEMBER' LIMIT 1
  ),

  -- ── GOAL ────────────────────────────────────────────────────
  goal AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'Tika 웹 사이트 완성', 'GOAL', 'IN_PROGRESS', 'HIGH', 1024,
           m2.id, false, NOW(), NOW()
    FROM m2
    RETURNING id
  ),

  -- ── STORY 1: 알림 시스템 구축 ─────────────────────────────
  s1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '알림 시스템 구축', 'STORY', 'BACKLOG', 'HIGH', 1024,
           goal.id, m2.id, false, NOW(), NOW()
    FROM goal, m2
    RETURNING id
  ),

  -- ── STORY 2: 댓글 & 협업 기능 ────────────────────────────
  s2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '댓글 & 협업 기능', 'STORY', 'BACKLOG', 'MEDIUM', 2048,
           goal.id, m3.id, false, NOW(), NOW()
    FROM goal, m3
    RETURNING id
  ),

  -- ── STORY 3: 검색 & 필터 고도화 ──────────────────────────
  s3 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '검색 & 필터 고도화', 'STORY', 'BACKLOG', 'MEDIUM', 3072,
           goal.id, m2.id, false, NOW(), NOW()
    FROM goal, m2
    RETURNING id
  ),

  -- ── STORY 4: 설정 & 관리 기능 ────────────────────────────
  s4 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '설정 & 관리 기능', 'STORY', 'BACKLOG', 'LOW', 4096,
           goal.id, m3.id, false, NOW(), NOW()
    FROM goal, m3
    RETURNING id
  ),

  -- ── STORY 5: UX 개선 & 안정화 ────────────────────────────
  s5 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'UX 개선 & 안정화', 'STORY', 'BACKLOG', 'LOW', 5120,
           goal.id, m2.id, false, NOW(), NOW()
    FROM goal, m2
    RETURNING id
  ),

  -- ── FEATURE 1-1: 알림 채널 설정 API ──────────────────────
  f1_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '알림 채널 설정 API', 'FEATURE', 'BACKLOG', 'HIGH', 1024,
           s1.id, m2.id, false, NOW(), NOW()
    FROM s1, m2
    RETURNING id
  ),

  -- ── FEATURE 1-2: Cron 마감일 D-1 알림 ───────────────────
  f1_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'Cron 마감일 D-1 알림', 'FEATURE', 'BACKLOG', 'HIGH', 2048,
           s1.id, m2.id, false, NOW(), NOW()
    FROM s1, m2
    RETURNING id
  ),

  -- ── FEATURE 1-3: 알림 설정 UI ────────────────────────────
  f1_3 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '알림 설정 UI', 'FEATURE', 'BACKLOG', 'MEDIUM', 3072,
           s1.id, m3.id, false, NOW(), NOW()
    FROM s1, m3
    RETURNING id
  ),

  -- ── FEATURE 1-4: 알림 내역 UI ────────────────────────────
  f1_4 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '알림 내역 UI', 'FEATURE', 'BACKLOG', 'MEDIUM', 4096,
           s1.id, m3.id, false, NOW(), NOW()
    FROM s1, m3
    RETURNING id
  ),

  -- ── FEATURE 2-1: 댓글 API ────────────────────────────────
  f2_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '댓글 API', 'FEATURE', 'BACKLOG', 'MEDIUM', 1024,
           s2.id, m2.id, false, NOW(), NOW()
    FROM s2, m2
    RETURNING id
  ),

  -- ── FEATURE 2-2: 댓글 UI ─────────────────────────────────
  f2_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '댓글 UI', 'FEATURE', 'BACKLOG', 'MEDIUM', 2048,
           s2.id, m3.id, false, NOW(), NOW()
    FROM s2, m3
    RETURNING id
  ),

  -- ── FEATURE 3-1: 고급 검색 API ───────────────────────────
  f3_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '고급 검색 API', 'FEATURE', 'BACKLOG', 'MEDIUM', 1024,
           s3.id, m2.id, false, NOW(), NOW()
    FROM s3, m2
    RETURNING id
  ),

  -- ── FEATURE 3-2: 검색 & 필터 UI ──────────────────────────
  f3_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '검색 & 필터 UI', 'FEATURE', 'BACKLOG', 'MEDIUM', 2048,
           s3.id, m3.id, false, NOW(), NOW()
    FROM s3, m3
    RETURNING id
  ),

  -- ── FEATURE 4-1: 라벨 관리 UI ────────────────────────────
  f4_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '라벨 관리 UI', 'FEATURE', 'BACKLOG', 'MEDIUM', 1024,
           s4.id, m3.id, false, NOW(), NOW()
    FROM s4, m3
    RETURNING id
  ),

  -- ── FEATURE 4-2: 워크스페이스 설정 UI ────────────────────
  f4_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '워크스페이스 설정 UI', 'FEATURE', 'BACKLOG', 'LOW', 2048,
           s4.id, m3.id, false, NOW(), NOW()
    FROM s4, m3
    RETURNING id
  ),

  -- ── FEATURE 5-1: 사이드바 개선 ───────────────────────────
  f5_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '사이드바 개선', 'FEATURE', 'BACKLOG', 'LOW', 1024,
           s5.id, m3.id, false, NOW(), NOW()
    FROM s5, m3
    RETURNING id
  ),

  -- ── FEATURE 5-2: 키보드 & 접근성 ─────────────────────────
  f5_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '키보드 & 접근성', 'FEATURE', 'BACKLOG', 'LOW', 2048,
           s5.id, m2.id, false, NOW(), NOW()
    FROM s5, m2
    RETURNING id
  ),

  -- ── FEATURE 5-3: 반응형 & 모바일 ─────────────────────────
  f5_3 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '반응형 & 모바일', 'FEATURE', 'BACKLOG', 'LOW', 3072,
           s5.id, m3.id, false, NOW(), NOW()
    FROM s5, m3
    RETURNING id
  ),

  -- ── FEATURE 5-4: E2E 테스트 & QA ─────────────────────────
  f5_4 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'E2E 테스트 & QA', 'FEATURE', 'BACKLOG', 'LOW', 4096,
           s5.id, m2.id, false, NOW(), NOW()
    FROM s5, m2
    RETURNING id
  ),

  -- ── TASKs: FEATURE 1-1 ───────────────────────────────────
  t1_1_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'notification_channels API 라우트 구현', 'TASK', 'BACKLOG', 'HIGH', 1024,
           f1_1.id, m2.id, false, NOW(), NOW()
    FROM f1_1, m2
    RETURNING id
  ),
  t1_1_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'Slack/Telegram 발송 서비스 구현', 'TASK', 'BACKLOG', 'HIGH', 2048,
           f1_1.id, m3.id, false, NOW(), NOW()
    FROM f1_1, m3
    RETURNING id
  ),
  t1_1_3 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '채널 테스트 엔드포인트 구현', 'TASK', 'BACKLOG', 'HIGH', 3072,
           f1_1.id, m2.id, false, NOW(), NOW()
    FROM f1_1, m2
    RETURNING id
  ),

  -- ── TASKs: FEATURE 1-2 ───────────────────────────────────
  t1_2_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'send-due-date-reminders API 구현', 'TASK', 'BACKLOG', 'HIGH', 1024,
           f1_2.id, m2.id, false, NOW(), NOW()
    FROM f1_2, m2
    RETURNING id
  ),
  t1_2_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'Vercel Cron 설정', 'TASK', 'BACKLOG', 'HIGH', 2048,
           f1_2.id, m3.id, false, NOW(), NOW()
    FROM f1_2, m3
    RETURNING id
  ),
  t1_2_3 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '알림 발송 이력 저장 로직', 'TASK', 'BACKLOG', 'HIGH', 3072,
           f1_2.id, m2.id, false, NOW(), NOW()
    FROM f1_2, m2
    RETURNING id
  ),

  -- ── TASKs: FEATURE 1-3 ───────────────────────────────────
  t1_3_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '설정 페이지 알림 탭 UI', 'TASK', 'BACKLOG', 'MEDIUM', 1024,
           f1_3.id, m3.id, false, NOW(), NOW()
    FROM f1_3, m3
    RETURNING id
  ),
  t1_3_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '채널 ON/OFF 토글 구현', 'TASK', 'BACKLOG', 'MEDIUM', 2048,
           f1_3.id, m3.id, false, NOW(), NOW()
    FROM f1_3, m3
    RETURNING id
  ),
  t1_3_3 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '테스트 발송 버튼 구현', 'TASK', 'BACKLOG', 'MEDIUM', 3072,
           f1_3.id, m2.id, false, NOW(), NOW()
    FROM f1_3, m2
    RETURNING id
  ),

  -- ── TASKs: FEATURE 1-4 ───────────────────────────────────
  t1_4_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '/notifications 페이지 생성', 'TASK', 'BACKLOG', 'MEDIUM', 1024,
           f1_4.id, m3.id, false, NOW(), NOW()
    FROM f1_4, m3
    RETURNING id
  ),
  t1_4_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '알림 목록 컴포넌트', 'TASK', 'BACKLOG', 'MEDIUM', 2048,
           f1_4.id, m3.id, false, NOW(), NOW()
    FROM f1_4, m3
    RETURNING id
  ),
  t1_4_3 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '헤더 알림 벨 & 드롭다운', 'TASK', 'BACKLOG', 'MEDIUM', 3072,
           f1_4.id, m2.id, false, NOW(), NOW()
    FROM f1_4, m2
    RETURNING id
  ),

  -- ── TASKs: FEATURE 2-1 ───────────────────────────────────
  t2_1_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'comments API 라우트 구현', 'TASK', 'BACKLOG', 'MEDIUM', 1024,
           f2_1.id, m2.id, false, NOW(), NOW()
    FROM f2_1, m2
    RETURNING id
  ),
  t2_1_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '댓글 조회 쿼리 구현', 'TASK', 'BACKLOG', 'MEDIUM', 2048,
           f2_1.id, m2.id, false, NOW(), NOW()
    FROM f2_1, m2
    RETURNING id
  ),

  -- ── TASKs: FEATURE 2-2 ───────────────────────────────────
  t2_2_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'TicketModal 댓글 섹션 추가', 'TASK', 'BACKLOG', 'MEDIUM', 1024,
           f2_2.id, m3.id, false, NOW(), NOW()
    FROM f2_2, m3
    RETURNING id
  ),
  t2_2_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '댓글 작성 폼 컴포넌트', 'TASK', 'BACKLOG', 'MEDIUM', 2048,
           f2_2.id, m3.id, false, NOW(), NOW()
    FROM f2_2, m3
    RETURNING id
  ),
  t2_2_3 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '본인 댓글 수정/삭제 기능', 'TASK', 'BACKLOG', 'MEDIUM', 3072,
           f2_2.id, m2.id, false, NOW(), NOW()
    FROM f2_2, m2
    RETURNING id
  ),

  -- ── TASKs: FEATURE 3-1 ───────────────────────────────────
  t3_1_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'GET /api/tickets 쿼리 파라미터 확장', 'TASK', 'BACKLOG', 'MEDIUM', 1024,
           f3_1.id, m2.id, false, NOW(), NOW()
    FROM f3_1, m2
    RETURNING id
  ),
  t3_1_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '복합 필터 Drizzle 쿼리 구현', 'TASK', 'BACKLOG', 'MEDIUM', 2048,
           f3_1.id, m2.id, false, NOW(), NOW()
    FROM f3_1, m2
    RETURNING id
  ),

  -- ── TASKs: FEATURE 3-2 ───────────────────────────────────
  t3_2_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '헤더 검색창 기능 구현', 'TASK', 'BACKLOG', 'MEDIUM', 1024,
           f3_2.id, m3.id, false, NOW(), NOW()
    FROM f3_2, m3
    RETURNING id
  ),
  t3_2_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '필터 패널 컴포넌트', 'TASK', 'BACKLOG', 'MEDIUM', 2048,
           f3_2.id, m3.id, false, NOW(), NOW()
    FROM f3_2, m3
    RETURNING id
  ),
  t3_2_3 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'URL 파라미터 상태 동기화', 'TASK', 'BACKLOG', 'MEDIUM', 3072,
           f3_2.id, m2.id, false, NOW(), NOW()
    FROM f3_2, m2
    RETURNING id
  ),

  -- ── TASKs: FEATURE 4-1 ───────────────────────────────────
  t4_1_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '설정 페이지 라벨 탭 UI', 'TASK', 'BACKLOG', 'MEDIUM', 1024,
           f4_1.id, m3.id, false, NOW(), NOW()
    FROM f4_1, m3
    RETURNING id
  ),
  t4_1_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '라벨 생성/수정 폼', 'TASK', 'BACKLOG', 'MEDIUM', 2048,
           f4_1.id, m3.id, false, NOW(), NOW()
    FROM f4_1, m3
    RETURNING id
  ),
  t4_1_3 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '라벨 삭제 확인 다이얼로그', 'TASK', 'BACKLOG', 'MEDIUM', 3072,
           f4_1.id, m2.id, false, NOW(), NOW()
    FROM f4_1, m2
    RETURNING id
  ),

  -- ── TASKs: FEATURE 4-2 ───────────────────────────────────
  t4_2_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '워크스페이스 이름/설명 편집', 'TASK', 'BACKLOG', 'LOW', 1024,
           f4_2.id, m3.id, false, NOW(), NOW()
    FROM f4_2, m3
    RETURNING id
  ),
  t4_2_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '멤버 역할 변경 UI', 'TASK', 'BACKLOG', 'LOW', 2048,
           f4_2.id, m2.id, false, NOW(), NOW()
    FROM f4_2, m2
    RETURNING id
  ),
  t4_2_3 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '멤버 내보내기(kick) 기능', 'TASK', 'BACKLOG', 'LOW', 3072,
           f4_2.id, m3.id, false, NOW(), NOW()
    FROM f4_2, m3
    RETURNING id
  ),

  -- ── TASKs: FEATURE 5-1 ───────────────────────────────────
  t5_1_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '사이드바 접기/펼치기 토글', 'TASK', 'BACKLOG', 'LOW', 1024,
           f5_1.id, m3.id, false, NOW(), NOW()
    FROM f5_1, m3
    RETURNING id
  ),
  t5_1_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '사이드바 너비 리사이저', 'TASK', 'BACKLOG', 'LOW', 2048,
           f5_1.id, m3.id, false, NOW(), NOW()
    FROM f5_1, m3
    RETURNING id
  ),

  -- ── TASKs: FEATURE 5-2 ───────────────────────────────────
  t5_2_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '키보드 단축키 지원', 'TASK', 'BACKLOG', 'LOW', 1024,
           f5_2.id, m2.id, false, NOW(), NOW()
    FROM f5_2, m2
    RETURNING id
  ),
  t5_2_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '모달 포커스 트랩 개선', 'TASK', 'BACKLOG', 'LOW', 2048,
           f5_2.id, m2.id, false, NOW(), NOW()
    FROM f5_2, m2
    RETURNING id
  ),

  -- ── TASKs: FEATURE 5-3 ───────────────────────────────────
  t5_3_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '모바일 뷰포트 대응', 'TASK', 'BACKLOG', 'LOW', 1024,
           f5_3.id, m3.id, false, NOW(), NOW()
    FROM f5_3, m3
    RETURNING id
  ),
  t5_3_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '터치 드래그앤드롭 지원', 'TASK', 'BACKLOG', 'LOW', 2048,
           f5_3.id, m3.id, false, NOW(), NOW()
    FROM f5_3, m3
    RETURNING id
  ),

  -- ── TASKs: FEATURE 5-4 ───────────────────────────────────
  t5_4_1 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'Playwright E2E 테스트 설정', 'TASK', 'BACKLOG', 'LOW', 1024,
           f5_4.id, m2.id, false, NOW(), NOW()
    FROM f5_4, m2
    RETURNING id
  ),
  t5_4_2 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, '주요 플로우 E2E 테스트 작성', 'TASK', 'BACKLOG', 'LOW', 2048,
           f5_4.id, m2.id, false, NOW(), NOW()
    FROM f5_4, m2
    RETURNING id
  ),
  t5_4_3 AS (
    INSERT INTO tickets
      (workspace_id, title, type, status, priority, position,
       parent_id, assignee_id, deleted, created_at, updated_at)
    SELECT 2, 'CI 파이프라인 테스트 통합', 'TASK', 'BACKLOG', 'LOW', 3072,
           f5_4.id, m2.id, false, NOW(), NOW()
    FROM f5_4, m2
    RETURNING id
  )

SELECT '티켓 계층 삽입 완료 (GOAL=1, STORY=5, FEATURE=14, TASK=37)' AS result;

-- ─────────────────────────────────────────────────────────────
-- Step 3: ticket_labels
--         Labels: 7=Frontend, 8=Backend, 9=Auth, 10=Analytics,
--                 11=Design, 12=Infra, 13=Docs
-- ─────────────────────────────────────────────────────────────
INSERT INTO ticket_labels (ticket_id, label_id)
SELECT t.id, v.label_id
FROM tickets t
JOIN (VALUES
  -- STORY labels
  ('알림 시스템 구축',       8),   -- Backend
  ('알림 시스템 구축',       12),  -- Infra
  ('댓글 & 협업 기능',       8),   -- Backend
  ('댓글 & 협업 기능',       7),   -- Frontend
  ('검색 & 필터 고도화',     8),   -- Backend
  ('검색 & 필터 고도화',     7),   -- Frontend
  ('설정 & 관리 기능',       7),   -- Frontend
  ('설정 & 관리 기능',       13),  -- Docs
  ('UX 개선 & 안정화',       7),   -- Frontend
  ('UX 개선 & 안정화',       11),  -- Design
  ('UX 개선 & 안정화',       12),  -- Infra

  -- FEATURE labels
  ('알림 채널 설정 API',     8),   -- Backend
  ('알림 채널 설정 API',     12),  -- Infra
  ('Cron 마감일 D-1 알림',   8),   -- Backend
  ('Cron 마감일 D-1 알림',   12),  -- Infra
  ('알림 설정 UI',           7),   -- Frontend
  ('알림 내역 UI',           7),   -- Frontend
  ('댓글 API',               8),   -- Backend
  ('댓글 UI',                7),   -- Frontend
  ('고급 검색 API',          8),   -- Backend
  ('검색 & 필터 UI',         7),   -- Frontend
  ('라벨 관리 UI',           7),   -- Frontend
  ('워크스페이스 설정 UI',   7),   -- Frontend
  ('사이드바 개선',          7),   -- Frontend
  ('사이드바 개선',          11),  -- Design
  ('키보드 & 접근성',        7),   -- Frontend
  ('반응형 & 모바일',        7),   -- Frontend
  ('반응형 & 모바일',        11),  -- Design
  ('E2E 테스트 & QA',        12),  -- Infra
  ('E2E 테스트 & QA',        13)   -- Docs
) AS v(title, label_id)
  ON t.title = v.title
 AND t.workspace_id = 2
 AND t.deleted = false;

-- ─────────────────────────────────────────────────────────────
-- Step 4: checklist_items
--         position = ordinal * 1024
-- ─────────────────────────────────────────────────────────────
INSERT INTO checklist_items (ticket_id, text, is_completed, position, created_at)
SELECT t.id, v.text, false, v.pos * 1024, NOW()
FROM tickets t
JOIN (VALUES
  -- notification_channels API 라우트 구현
  ('notification_channels API 라우트 구현', 'DB 스키마 확인', 1),
  ('notification_channels API 라우트 구현', 'POST/PATCH/DELETE 라우트 작성', 2),
  ('notification_channels API 라우트 구현', 'Zod 유효성 검증 추가', 3),

  -- Slack/Telegram 발송 서비스 구현
  ('Slack/Telegram 발송 서비스 구현', 'Slack webhookUrl 발송 함수', 1),
  ('Slack/Telegram 발송 서비스 구현', 'Telegram botToken+chatId 발송 함수', 2),
  ('Slack/Telegram 발송 서비스 구현', '에러 핸들링', 3),

  -- 채널 테스트 엔드포인트 구현
  ('채널 테스트 엔드포인트 구현', 'POST /api/notifications/channels/:id/test 라우트', 1),
  ('채널 테스트 엔드포인트 구현', '테스트 메시지 발송', 2),
  ('채널 테스트 엔드포인트 구현', '결과 응답', 3),

  -- send-due-date-reminders API 구현
  ('send-due-date-reminders API 구현', '내일 마감 티켓 조회 쿼리', 1),
  ('send-due-date-reminders API 구현', '채널별 메시지 포맷', 2),
  ('send-due-date-reminders API 구현', '발송 이력 저장', 3),

  -- Vercel Cron 설정
  ('Vercel Cron 설정', 'vercel.json crons 설정', 1),
  ('Vercel Cron 설정', 'CRON_SECRET 환경변수 추가', 2),
  ('Vercel Cron 설정', '인증 미들웨어 구현', 3),

  -- 알림 발송 이력 저장 로직
  ('알림 발송 이력 저장 로직', 'notification_logs INSERT 쿼리', 1),
  ('알림 발송 이력 저장 로직', '실패 케이스 error_message 저장', 2),

  -- 설정 페이지 알림 탭 UI
  ('설정 페이지 알림 탭 UI', '/settings 라우트 생성', 1),
  ('설정 페이지 알림 탭 UI', '탭 컴포넌트', 2),
  ('설정 페이지 알림 탭 UI', '채널 카드 레이아웃', 3),

  -- 채널 ON/OFF 토글 구현
  ('채널 ON/OFF 토글 구현', '토글 컴포넌트', 1),
  ('채널 ON/OFF 토글 구현', 'PATCH API 연동', 2),
  ('채널 ON/OFF 토글 구현', '낙관적 UI 업데이트', 3),

  -- 테스트 발송 버튼 구현
  ('테스트 발송 버튼 구현', '버튼 컴포넌트', 1),
  ('테스트 발송 버튼 구현', '로딩 상태', 2),
  ('테스트 발송 버튼 구현', '성공/실패 토스트', 3),

  -- /notifications 페이지 생성
  ('/notifications 페이지 생성', '페이지 라우트', 1),
  ('/notifications 페이지 생성', '레이아웃 구성', 2),
  ('/notifications 페이지 생성', 'SSR 데이터 fetch', 3),

  -- 알림 목록 컴포넌트
  ('알림 목록 컴포넌트', '목록 렌더링', 1),
  ('알림 목록 컴포넌트', '채널/상태 필터', 2),
  ('알림 목록 컴포넌트', '페이지네이션', 3),

  -- 헤더 알림 벨 & 드롭다운
  ('헤더 알림 벨 & 드롭다운', '읽지 않은 알림 뱃지', 1),
  ('헤더 알림 벨 & 드롭다운', '드롭다운 최근 5건', 2),
  ('헤더 알림 벨 & 드롭다운', '전체보기 링크', 3),

  -- comments API 라우트 구현
  ('comments API 라우트 구현', 'POST /comments', 1),
  ('comments API 라우트 구현', 'PATCH /comments/:id', 2),
  ('comments API 라우트 구현', 'DELETE /comments/:id', 3),

  -- 댓글 조회 쿼리 구현
  ('댓글 조회 쿼리 구현', 'getComments(ticketId) 쿼리', 1),
  ('댓글 조회 쿼리 구현', '작성자 join', 2),
  ('댓글 조회 쿼리 구현', '최신순 정렬', 3),

  -- TicketModal 댓글 섹션 추가
  ('TicketModal 댓글 섹션 추가', '모달 내 댓글 영역 레이아웃', 1),
  ('TicketModal 댓글 섹션 추가', '목록 렌더링', 2),
  ('TicketModal 댓글 섹션 추가', '스크롤 처리', 3),

  -- 댓글 작성 폼 컴포넌트
  ('댓글 작성 폼 컴포넌트', 'textarea 입력', 1),
  ('댓글 작성 폼 컴포넌트', '작성 버튼', 2),
  ('댓글 작성 폼 컴포넌트', 'Enter 제출', 3),
  ('댓글 작성 폼 컴포넌트', '로딩 상태', 4),

  -- 본인 댓글 수정/삭제 기능
  ('본인 댓글 수정/삭제 기능', '수정 인라인 편집', 1),
  ('본인 댓글 수정/삭제 기능', '삭제 확인 다이얼로그', 2),
  ('본인 댓글 수정/삭제 기능', '권한 체크', 3),

  -- GET /api/tickets 쿼리 파라미터 확장
  ('GET /api/tickets 쿼리 파라미터 확장', 'search/status/priority/labelId/overdue 파라미터 파싱', 1),
  ('GET /api/tickets 쿼리 파라미터 확장', 'Drizzle 동적 where 조건', 2),

  -- 복합 필터 Drizzle 쿼리 구현
  ('복합 필터 Drizzle 쿼리 구현', 'AND 조합 필터 함수', 1),
  ('복합 필터 Drizzle 쿼리 구현', 'ILIKE 키워드 검색', 2),
  ('복합 필터 Drizzle 쿼리 구현', '날짜 범위 필터', 3),

  -- 헤더 검색창 기능 구현
  ('헤더 검색창 기능 구현', '검색 입력 디바운스', 1),
  ('헤더 검색창 기능 구현', '보드 필터링 연동', 2),
  ('헤더 검색창 기능 구현', '검색어 하이라이트', 3),

  -- 필터 패널 컴포넌트
  ('필터 패널 컴포넌트', '우선순위/상태 다중선택', 1),
  ('필터 패널 컴포넌트', '라벨 선택', 2),
  ('필터 패널 컴포넌트', '오버듀 토글', 3),
  ('필터 패널 컴포넌트', '초기화 버튼', 4),

  -- URL 파라미터 상태 동기화
  ('URL 파라미터 상태 동기화', 'useSearchParams', 1),
  ('URL 파라미터 상태 동기화', '필터 상태 ↔ URL 동기화', 2),
  ('URL 파라미터 상태 동기화', '공유 가능한 URL', 3),

  -- 설정 페이지 라벨 탭 UI
  ('설정 페이지 라벨 탭 UI', '라벨 목록 렌더링', 1),
  ('설정 페이지 라벨 탭 UI', '색상 칩 표시', 2),
  ('설정 페이지 라벨 탭 UI', '생성 버튼', 3),

  -- 라벨 생성/수정 폼
  ('라벨 생성/수정 폼', '이름 입력', 1),
  ('라벨 생성/수정 폼', '색상 팔레트 선택기', 2),
  ('라벨 생성/수정 폼', 'API 연동', 3),

  -- 라벨 삭제 확인 다이얼로그
  ('라벨 삭제 확인 다이얼로그', 'ConfirmDialog 재사용', 1),
  ('라벨 삭제 확인 다이얼로그', '연결된 티켓 수 표시', 2),
  ('라벨 삭제 확인 다이얼로그', 'DELETE API', 3),

  -- 워크스페이스 이름/설명 편집
  ('워크스페이스 이름/설명 편집', '설정 > 일반 탭', 1),
  ('워크스페이스 이름/설명 편집', '인라인 편집', 2),
  ('워크스페이스 이름/설명 편집', 'PATCH API', 3),

  -- 멤버 역할 변경 UI
  ('멤버 역할 변경 UI', '멤버 목록', 1),
  ('멤버 역할 변경 UI', '역할 드롭다운', 2),
  ('멤버 역할 변경 UI', 'PATCH /api/members/:id', 3),

  -- 멤버 내보내기(kick) 기능
  ('멤버 내보내기(kick) 기능', '내보내기 버튼', 1),
  ('멤버 내보내기(kick) 기능', '확인 다이얼로그', 2),
  ('멤버 내보내기(kick) 기능', 'DELETE /api/members/:id', 3),

  -- 사이드바 접기/펼치기 토글
  ('사이드바 접기/펼치기 토글', '토글 버튼 UI', 1),
  ('사이드바 접기/펼치기 토글', '애니메이션', 2),
  ('사이드바 접기/펼치기 토글', 'localStorage 상태 저장', 3),

  -- 사이드바 너비 리사이저
  ('사이드바 너비 리사이저', '드래그 핸들 컴포넌트', 1),
  ('사이드바 너비 리사이저', '200~400px 범위 제한', 2),
  ('사이드바 너비 리사이저', '커서 변경', 3),

  -- 키보드 단축키 지원
  ('키보드 단축키 지원', 'N=새티켓, /=검색, Esc=모달닫기', 1),
  ('키보드 단축키 지원', '?=단축키 도움말', 2),

  -- 모달 포커스 트랩 개선
  ('모달 포커스 트랩 개선', 'focus-trap 구현', 1),
  ('모달 포커스 트랩 개선', 'Tab 순환', 2),
  ('모달 포커스 트랩 개선', 'Aria 속성', 3),

  -- 모바일 뷰포트 대응
  ('모바일 뷰포트 대응', '최소 너비 처리', 1),
  ('모바일 뷰포트 대응', '칸반 가로 스크롤', 2),
  ('모바일 뷰포트 대응', '헤더 반응형', 3),

  -- 터치 드래그앤드롭 지원
  ('터치 드래그앤드롭 지원', '@dnd-kit 터치 센서 설정', 1),
  ('터치 드래그앤드롭 지원', '모바일 드래그 UX 테스트', 2),

  -- Playwright E2E 테스트 설정
  ('Playwright E2E 테스트 설정', 'playwright 설치/설정', 1),
  ('Playwright E2E 테스트 설정', '테스트 환경 구성', 2),
  ('Playwright E2E 테스트 설정', 'CI 연동', 3),

  -- 주요 플로우 E2E 테스트 작성
  ('주요 플로우 E2E 테스트 작성', '로그인→보드 플로우', 1),
  ('주요 플로우 E2E 테스트 작성', '티켓 생성 플로우', 2),
  ('주요 플로우 E2E 테스트 작성', '드래그앤드롭 플로우', 3),
  ('주요 플로우 E2E 테스트 작성', 'WBS 조회 플로우', 4),

  -- CI 파이프라인 테스트 통합
  ('CI 파이프라인 테스트 통합', 'GitHub Actions 워크플로우', 1),
  ('CI 파이프라인 테스트 통합', 'PR 자동 테스트', 2)

) AS v(title, text, pos)
  ON t.title = v.title
 AND t.workspace_id = 2
 AND t.deleted = false;

COMMIT;

-- ─────────────────────────────────────────────────────────────
-- Verification queries (run manually after execution)
-- ─────────────────────────────────────────────────────────────
-- SELECT type, COUNT(*) FROM tickets
--   WHERE workspace_id = 2 AND deleted = false
--   GROUP BY type ORDER BY type;
-- Expected: FEATURE=14, GOAL=1, STORY=5, TASK=37
--
-- SELECT COUNT(*) FROM ticket_labels
--   WHERE ticket_id IN (
--     SELECT id FROM tickets WHERE workspace_id = 2 AND deleted = false
--   );
-- Expected: 30
--
-- SELECT COUNT(*) FROM checklist_items
--   WHERE ticket_id IN (
--     SELECT id FROM tickets WHERE workspace_id = 2 AND deleted = false
--   );
-- Expected: 109
