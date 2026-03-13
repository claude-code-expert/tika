-- =============================================================================
-- Tika — Reset & Seed Script
-- Usage: psql $POSTGRES_URL -f scripts/reset-and-seed.sql
-- =============================================================================

-- ─── 1. TRUNCATE (leaf → root 순서) ─────────────────────────────────────────
TRUNCATE TABLE
  notification_preferences,
  in_app_notifications,
  notification_logs,
  notification_signups,
  workspace_join_requests,
  workspace_invites,
  ticket_assignees,
  ticket_labels,
  checklist_items,
  comments,
  notification_channels,
  tickets,
  sprints,
  labels,
  members,
  workspaces,
  users
RESTART IDENTITY CASCADE;

-- =============================================================================
-- 2. USERS (Google OAuth sub 형식 더미 ID)
-- =============================================================================
INSERT INTO users (id, email, name, user_type) VALUES
  ('seed-user-owner-001', 'owner@tika.dev',   'Owner Kim',   'WORKSPACE'),
  ('seed-user-member-002','member@tika.dev',  'Member Lee',  'WORKSPACE'),
  ('seed-user-viewer-003','viewer@tika.dev',  'Viewer Park', 'WORKSPACE');

-- =============================================================================
-- 3. WORKSPACES
-- =============================================================================
INSERT INTO workspaces (id, name, description, owner_id, type, icon_color, is_searchable) VALUES
  (1, 'My Workspace',  '개인 워크스페이스',       'seed-user-owner-001', 'PERSONAL', '#629584', false),
  (2, 'Tika Team',     '팀 협업 워크스페이스',     'seed-user-owner-001', 'TEAM',     '#3B82F6', true);

SELECT setval('workspaces_id_seq', 2);

-- =============================================================================
-- 4. MEMBERS
-- =============================================================================
INSERT INTO members (id, user_id, workspace_id, display_name, color, role, is_primary) VALUES
  (1, 'seed-user-owner-001',  1, 'Owner Kim',   '#629584', 'OWNER',  false),
  (2, 'seed-user-owner-001',  2, 'Owner Kim',   '#629584', 'OWNER',  true),
  (3, 'seed-user-member-002', 2, 'Member Lee',  '#3B82F6', 'MEMBER', true),
  (4, 'seed-user-viewer-003', 2, 'Viewer Park', '#F59E0B', 'VIEWER', true);

SELECT setval('members_id_seq', 4);

-- =============================================================================
-- 5. LABELS
-- =============================================================================
INSERT INTO labels (workspace_id, name, color) VALUES
  -- 개인 워크스페이스
  (1, 'Plan',     '#2b7fff'),
  (1, 'Frontend', '#615fff'),
  (1, 'Backend',  '#00c950'),
  (1, 'Analyze',  '#ad46ff'),
  (1, 'Test',     '#ffac6d'),
  (1, 'Debug',    '#fb2c36'),
  (1, 'Design',   '#ff29d3'),
  (1, 'Infra',    '#89d0f0'),
  (1, 'QA',       '#46e264'),
  -- 팀 워크스페이스
  (2, 'Plan',     '#2b7fff'),
  (2, 'Frontend', '#615fff'),
  (2, 'Backend',  '#00c950'),
  (2, 'Analyze',  '#ad46ff'),
  (2, 'Test',     '#ffac6d'),
  (2, 'Debug',    '#fb2c36'),
  (2, 'Design',   '#ff29d3'),
  (2, 'Infra',    '#89d0f0'),
  (2, 'QA',       '#46e264');

-- =============================================================================
-- 6. SPRINTS (팀 워크스페이스)
-- =============================================================================
INSERT INTO sprints (id, workspace_id, name, goal, status, start_date, end_date, story_points_total) VALUES
  (1, 2, 'Sprint 1', 'MVP 핵심 기능 완성', 'ACTIVE',     CURRENT_DATE - 7,  CURRENT_DATE + 7,  40),
  (2, 2, 'Sprint 2', '알림 및 설정 구현',  'PLANNED',    CURRENT_DATE + 8,  CURRENT_DATE + 21, 30);

SELECT setval('sprints_id_seq', 2);

-- =============================================================================
-- 7. TICKETS — 팀 워크스페이스 (Goal→Story→Feature→Task 계층)
-- =============================================================================

-- GOAL
INSERT INTO tickets (id, workspace_id, title, type, status, priority, position, assignee_id, sprint_id, story_points, due_date) VALUES
  (1, 2, 'Tika MVP 출시', 'GOAL', 'IN_PROGRESS', 'HIGH', 0, 2, NULL, NULL, CURRENT_DATE + 30);

-- STORY
INSERT INTO tickets (id, workspace_id, title, type, status, priority, position, parent_id, assignee_id, sprint_id, story_points) VALUES
  (2, 2, '인증 및 온보딩',   'STORY', 'DONE',        'HIGH',   0,    1, 2, 1, 13),
  (3, 2, '칸반 보드',        'STORY', 'IN_PROGRESS', 'HIGH',   1024, 1, 2, 1, 13),
  (4, 2, '팀 협업',          'STORY', 'TODO',        'MEDIUM', 2048, 1, 3, 2, 8),
  (5, 2, '알림 시스템',      'STORY', 'BACKLOG',     'MEDIUM', 3072, 1, 3, 2, 8);

-- FEATURE
INSERT INTO tickets (id, workspace_id, title, type, status, priority, position, parent_id, assignee_id, sprint_id, story_points) VALUES
  (6,  2, 'Google OAuth 구현',       'FEATURE', 'DONE',        'HIGH',   0,    2, 2, 1, 5),
  (7,  2, '온보딩 위저드',            'FEATURE', 'DONE',        'MEDIUM', 1024, 2, 3, 1, 3),
  (8,  2, '드래그앤드롭',             'FEATURE', 'IN_PROGRESS', 'HIGH',   0,    3, 2, 1, 5),
  (9,  2, '티켓 CRUD',               'FEATURE', 'IN_PROGRESS', 'HIGH',   1024, 3, 3, 1, 5),
  (10, 2, '고급 필터',               'FEATURE', 'TODO',        'MEDIUM', 2048, 3, 2, 1, 3),
  (11, 2, '멤버 초대 & 역할 관리',   'FEATURE', 'TODO',        'HIGH',   0,    4, 2, 2, 5),
  (12, 2, 'WBS / 간트 차트',         'FEATURE', 'BACKLOG',     'MEDIUM', 1024, 4, 3, 2, 3),
  (13, 2, '인앱 알림',               'FEATURE', 'BACKLOG',     'HIGH',   0,    5, 2, NULL, 5),
  (14, 2, 'Slack / Telegram 연동',   'FEATURE', 'BACKLOG',     'LOW',    1024, 5, 3, NULL, 3);

-- TASK
INSERT INTO tickets (id, workspace_id, title, type, status, priority, position, parent_id, assignee_id, sprint_id, story_points, completed_at) VALUES
  -- OAuth
  (15, 2, 'NextAuth Google Provider 설정', 'TASK', 'DONE', 'HIGH',   0,    6, 2, 1, 2, NOW() - INTERVAL '5 days'),
  (16, 2, '세션 미들웨어 구현',            'TASK', 'DONE', 'MEDIUM', 1024, 6, 3, 1, 2, NOW() - INTERVAL '4 days'),
  -- 온보딩
  (17, 2, '워크스페이스 선택 UI',          'TASK', 'DONE', 'MEDIUM', 0,    7, 2, 1, 1, NOW() - INTERVAL '3 days'),
  (18, 2, '최초 로그인 리다이렉트',        'TASK', 'DONE', 'LOW',    1024, 7, 3, 1, 1, NOW() - INTERVAL '2 days'),
  -- 드래그앤드롭
  (19, 2, '칼럼 간 이동 구현',             'TASK', 'IN_PROGRESS', 'HIGH',   0,    8, 2, 1, 3, NULL),
  (20, 2, '순서 변경 구현',               'TASK', 'TODO',        'MEDIUM', 1024, 8, 3, 1, 2, NULL),
  -- 티켓 CRUD
  (21, 2, '티켓 생성 폼',                 'TASK', 'IN_PROGRESS', 'HIGH',   0,    9, 2, 1, 2, NULL),
  (22, 2, '티켓 상세 모달',               'TASK', 'TODO',        'MEDIUM', 1024, 9, 3, 1, 2, NULL),
  (23, 2, '티켓 삭제 & 휴지통',          'TASK', 'BACKLOG',     'LOW',    2048, 9, 2, 1, 1, NULL),
  -- 고급 필터
  (24, 2, '필터 칩 UI',                   'TASK', 'TODO',        'MEDIUM', 0,    10, 3, 1, 2, NULL),
  (25, 2, '날짜 범위 필터',               'TASK', 'BACKLOG',     'LOW',    1024, 10, 2, 1, 1, NULL),
  -- 멤버 관리
  (26, 2, '초대 링크 발급 API',           'TASK', 'TODO',        'HIGH',   0,    11, 2, 2, 3, NULL),
  (27, 2, 'RBAC 권한 체계 구현',          'TASK', 'BACKLOG',     'HIGH',   1024, 11, 3, 2, 3, NULL);

SELECT setval('tickets_id_seq', 27);

-- =============================================================================
-- 8. TICKETS — 개인 워크스페이스
-- =============================================================================
INSERT INTO tickets (id, workspace_id, title, type, status, priority, position, assignee_id) VALUES
  (28, 1, '사이드 프로젝트 계획',   'GOAL',    'IN_PROGRESS', 'HIGH',   0,    1),
  (29, 1, '기술 블로그 작성',       'STORY',   'TODO',        'MEDIUM', 0,    1),
  (30, 1, '포트폴리오 업데이트',    'TASK',    'IN_PROGRESS', 'MEDIUM', 0,    1),
  (31, 1, '독서 목록 정리',         'TASK',    'BACKLOG',     'LOW',    1024, 1),
  (32, 1, 'Next.js 15 공부',        'TASK',    'TODO',        'HIGH',   0,    1),
  (33, 1, 'TypeScript 심화 학습',   'TASK',    'DONE',        'MEDIUM', 0,    1);

SELECT setval('tickets_id_seq', 33);

-- =============================================================================
-- 9. CHECKLIST ITEMS
-- =============================================================================
INSERT INTO checklist_items (ticket_id, text, is_completed, position) VALUES
  -- 드래그앤드롭 (19)
  (19, '@dnd-kit 라이브러리 설치 및 설정',   true,  0),
  (19, 'DragOverlay 구현',                   true,  1024),
  (19, '칼럼 간 이동 로직 작성',              false, 2048),
  (19, '애니메이션 적용',                     false, 3072),
  -- 티켓 생성 폼 (21)
  (21, '제목 입력 유효성 검사',               true,  0),
  (21, '타입 / 우선순위 선택',               true,  1024),
  (21, '마감일 데이트피커',                  false, 2048),
  (21, 'Optimistic UI 적용',                 false, 3072);

-- =============================================================================
-- 10. TICKET_LABELS
-- =============================================================================
-- label IDs: Frontend=7, Backend=8, Design=9, Bug=10, Docs=11, Infra=12 (팀)
INSERT INTO ticket_labels (ticket_id, label_id)
SELECT t.id, l.id
FROM (VALUES
  (6,  'Backend'),
  (8,  'Frontend'),
  (9,  'Backend'),
  (10, 'Frontend'),
  (11, 'Backend'),
  (13, 'Backend'),
  (14, 'Infra'),
  (19, 'Frontend'),
  (21, 'Frontend'),
  (26, 'Backend')
) AS v(ticket_id, label_name)
JOIN labels l ON l.name = v.label_name AND l.workspace_id = 2
JOIN tickets t ON t.id = v.ticket_id;

-- =============================================================================
-- 11. TICKET_ASSIGNEES (멀티 담당자 — 일부 티켓에 2명 배정)
-- =============================================================================
INSERT INTO ticket_assignees (ticket_id, member_id) VALUES
  (8,  2), (8,  3),   -- 드래그앤드롭: Owner + Member
  (9,  3), (9,  2),   -- 티켓 CRUD: Member + Owner
  (11, 2), (11, 3),   -- 멤버 초대: Owner + Member
  (19, 2),
  (21, 3);

-- =============================================================================
-- 완료
-- =============================================================================
SELECT
  (SELECT count(*) FROM users)       AS users,
  (SELECT count(*) FROM workspaces)  AS workspaces,
  (SELECT count(*) FROM members)     AS members,
  (SELECT count(*) FROM labels)      AS labels,
  (SELECT count(*) FROM sprints)     AS sprints,
  (SELECT count(*) FROM tickets)     AS tickets,
  (SELECT count(*) FROM checklist_items) AS checklist_items,
  (SELECT count(*) FROM ticket_labels)   AS ticket_labels,
  (SELECT count(*) FROM ticket_assignees) AS ticket_assignees;
