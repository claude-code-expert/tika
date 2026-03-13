-- =============================================================================
-- Tika — Reset Script (데이터만 초기화, 테이블 구조 유지)
-- Usage: psql $POSTGRES_URL -f scripts/reset.sql
-- =============================================================================

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

SELECT 'Reset complete.' AS result;
