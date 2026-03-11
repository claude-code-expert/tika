/**
 * workspaceGuard — BUG-001 재발 방지
 *
 * 팀 전용 페이지(대시보드/analytics/burndown/members/trash/wbs)에서
 * PERSONAL 타입 워크스페이스 접근을 차단하는 가드 로직의 정식 정의.
 *
 * ─ 사용 방법 ─────────────────────────────────────────────────────────
 * 각 팀 전용 페이지는 워크스페이스·멤버 조회 직후 아래 두 줄을 반드시 포함해야 한다:
 *
 *   if (!workspace || !member) redirect('/');
 *   if (workspace.type === 'PERSONAL') redirect('/');
 *
 * 이 함수(checkTeamWorkspaceAccess)는 그 로직의 단위 테스트를 위한 순수 함수다.
 * redirect() 를 직접 호출하지 않으므로 테스트에서 next/navigation 모킹 없이 실행 가능하다.
 * ─────────────────────────────────────────────────────────────────────
 *
 * @see docs/BUG_REPORT.md — BUG-001
 */

export type WorkspaceAccessResult = 'OK' | 'NOT_FOUND' | 'PERSONAL';

/**
 * 팀 워크스페이스 접근 가능 여부를 반환한다 (사이드 이펙트 없음).
 *
 * - 'NOT_FOUND' : workspace 또는 member가 없음 → 페이지에서 redirect('/')
 * - 'PERSONAL'  : PERSONAL 타입 워크스페이스  → 페이지에서 redirect('/')
 * - 'OK'        : 팀 워크스페이스 + 멤버 존재 → 정상 진행
 */
export function checkTeamWorkspaceAccess(
  workspace: { type: string } | null | undefined,
  member: unknown,
): WorkspaceAccessResult {
  if (!workspace || !member) return 'NOT_FOUND';
  if (workspace.type === 'PERSONAL') return 'PERSONAL';
  return 'OK';
}
