-- =============================================================================
-- Tika — Seed Script
-- 구성: OWNER 1명, 개인 WS 1개, 팀 WS 1개
--       팀 WS: Goal 1 → Story 1 → Feature 1 → Task 2
-- Usage: psql $POSTGRES_URL -f scripts/seed.sql
-- =============================================================================

-- ─── USERS ───────────────────────────────────────────────────────────────────
INSERT INTO users (id, email, name, user_type) VALUES
  ('f810abc2-4ac1-4793-90a3-37039058e9c2', 'performizer@gmail.com', 'eDell', 'WORKSPACE');

-- ─── WORKSPACES ──────────────────────────────────────────────────────────────
INSERT INTO workspaces (name, description, owner_id, type, icon_color, is_searchable) VALUES
  ('My-Workspace', '개인 워크스페이스', 'f810abc2-4ac1-4793-90a3-37039058e9c2', 'PERSONAL', '#629584', false),
  ('Tika',         'Tike Project',      'f810abc2-4ac1-4793-90a3-37039058e9c2', 'TEAM',     '#3B82F6', true);

-- ─── MEMBERS ─────────────────────────────────────────────────────────────────
INSERT INTO members (user_id, workspace_id, display_name, color, role, is_primary)
SELECT 'f810abc2-4ac1-4793-90a3-37039058e9c2', id, 'eDell', '#629584', 'OWNER',
  CASE WHEN type = 'TEAM' THEN true ELSE false END
FROM workspaces;

-- ─── LABELS ──────────────────────────────────────────────────────────────────
INSERT INTO labels (workspace_id, name, color)
SELECT id, label.name, label.color
FROM workspaces
CROSS JOIN (VALUES
  ('Plan',     '#2b7fff'),
  ('Frontend', '#615fff'),
  ('Backend',  '#00c950'),
  ('Analyze',  '#ad46ff'),
  ('Test',     '#ffac6d'),
  ('Debug',    '#fb2c36'),
  ('Design',   '#ff29d3'),
  ('Infra',    '#89d0f0'),
  ('QA',       '#46e264')
) AS label(name, color);

-- ─── TICKETS (팀 WS: Goal → Story → Feature → Task × 2) ──────────────────────
DO $$
DECLARE
  v_ws_id   int;
  v_member  int;
  v_goal    int;
  v_story   int;
  v_feature int;
BEGIN
  SELECT id INTO v_ws_id FROM workspaces WHERE type = 'TEAM' LIMIT 1;
  SELECT id INTO v_member FROM members   WHERE workspace_id = v_ws_id LIMIT 1;

  -- Goal
  INSERT INTO tickets (workspace_id, title, type, status, priority, position, assignee_id, due_date)
  VALUES (v_ws_id, 'MVP 출시', 'GOAL', 'IN_PROGRESS', 'HIGH', 0, v_member, CURRENT_DATE + 30)
  RETURNING id INTO v_goal;

  -- Story
  INSERT INTO tickets (workspace_id, title, type, status, priority, position, parent_id, assignee_id)
  VALUES (v_ws_id, '사용자 인증 시스템', 'STORY', 'IN_PROGRESS', 'HIGH', 0, v_goal, v_member)
  RETURNING id INTO v_story;

  -- Feature
  INSERT INTO tickets (workspace_id, title, type, status, priority, position, parent_id, assignee_id)
  VALUES (v_ws_id, 'Google OAuth 구현', 'FEATURE', 'IN_PROGRESS', 'HIGH', 0, v_story, v_member)
  RETURNING id INTO v_feature;

  -- Task × 2
  INSERT INTO tickets (workspace_id, title, type, status, priority, position, parent_id, assignee_id) VALUES
    (v_ws_id, 'NextAuth 설정',    'TASK', 'DONE', 'HIGH',   0,    v_feature, v_member),
    (v_ws_id, '세션 미들웨어 구현', 'TASK', 'TODO', 'MEDIUM', 1024, v_feature, v_member);
END $$;

-- ─── 결과 확인 ────────────────────────────────────────────────────────────────
SELECT
  (SELECT count(*) FROM users)    AS users,
  (SELECT count(*) FROM workspaces) AS workspaces,
  (SELECT count(*) FROM members)  AS members,
  (SELECT count(*) FROM labels)   AS labels,
  (SELECT count(*) FROM tickets)  AS tickets;
