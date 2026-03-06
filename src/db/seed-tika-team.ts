/**
 * Tika Team 버전 계층 시드 스크립트
 *
 * Goal → Story × 6 → Feature × 13 Issues 계층 생성 후
 * GOAL(1) + STORY(6) + FEATURE(13) + TASK(40) 티켓 생성
 *
 * 사용법:
 *   tsx src/db/seed-tika-team.ts [workspaceId] [memberId]
 *   tsx src/db/seed-tika-team.ts        ← 자동 탐지 (TEAM 워크스페이스 우선)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' }); // fallback
import { db } from './index';
import { issues, tickets, workspaces, members } from './schema';
import { eq } from 'drizzle-orm';

// ─── Phase 0: Pre-flight check ───────────────────────────────────────────────

async function preflight(): Promise<{ workspaceId: number; memberId: number | undefined }> {
  const argWsId = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;
  const argMemberId = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;

  // Workspace resolution
  let workspaceId: number;
  if (argWsId) {
    workspaceId = argWsId;
    console.log(`[Phase 0] Using provided workspaceId: ${workspaceId}`);
  } else {
    // Auto-detect: prefer TEAM workspace
    const wsList = await db.select().from(workspaces);
    const teamWs = wsList.find((w) => w.type === 'TEAM');
    const ws = teamWs ?? wsList[0];
    if (!ws) throw new Error('No workspaces found. Run onboarding first.');
    workspaceId = ws.id;
    console.log(
      `[Phase 0] Auto-detected workspaceId=${workspaceId} (${ws.name}, type=${ws.type})`,
    );
  }

  // Member resolution
  let memberId: number | undefined;
  if (argMemberId) {
    memberId = argMemberId;
    console.log(`[Phase 0] Using provided memberId: ${memberId}`);
  } else {
    const membersList = await db
      .select()
      .from(members)
      .where(eq(members.workspaceId, workspaceId));
    if (membersList.length > 0) {
      memberId = membersList[0].id;
      console.log(
        `[Phase 0] Auto-detected memberId=${memberId} (${membersList[0].displayName}, role=${membersList[0].role})`,
      );
    } else {
      console.warn('[Phase 0] No members found. Tasks will be created without assignee.');
    }
  }

  // Check existing issues for this workspace
  const existingIssues = await db
    .select({ id: issues.id, name: issues.name, type: issues.type })
    .from(issues)
    .where(eq(issues.workspaceId, workspaceId));
  if (existingIssues.length > 0) {
    console.log(
      `[Phase 0] Found ${existingIssues.length} existing issues in workspace ${workspaceId}.`,
    );
    console.log('  Existing:', existingIssues.map((i) => `[${i.type}] ${i.name}`).join(', '));
  }

  // Check existing tickets
  const existingTickets = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.workspaceId, workspaceId));
  console.log(
    `[Phase 0] Found ${existingTickets.length} existing tickets in workspace ${workspaceId}.`,
  );

  return { workspaceId, memberId };
}

// ─── Phase 1: Issues hierarchy ───────────────────────────────────────────────

async function createIssueHierarchy(workspaceId: number): Promise<{
  goalId: number;
  storyIds: number[];
  featureIds: number[];
}> {
  console.log('\n[Phase 1-1] Creating GOAL issue...');
  const [goalIssue] = await db
    .insert(issues)
    .values({ workspaceId, name: 'tika team 버전 개발 완료', type: 'GOAL', parentId: null })
    .returning({ id: issues.id });
  console.log(`  ✓ GOAL issue created: id=${goalIssue.id}`);

  console.log('\n[Phase 1-2] Creating 6 STORY issues...');
  const storyData = [
    '팀 버전 UI 수정',
    '팀 온보딩 플로우 완성',
    '역할 기반 접근 제어(RBAC)',
    '팀 협업 보드',
    '스프린트 관리',
    '팀 분석 대시보드',
  ];
  const storyIssues = await db
    .insert(issues)
    .values(storyData.map((name) => ({ workspaceId, name, type: 'STORY', parentId: goalIssue.id })))
    .returning({ id: issues.id });
  storyIssues.forEach((s, i) => console.log(`  ✓ STORY[${i + 1}] id=${s.id}: ${storyData[i]}`));

  const [s1, s2, s3, s4, s5, s6] = storyIssues.map((s) => s.id);

  console.log('\n[Phase 1-3] Creating 13 FEATURE issues...');
  const featureData: { name: string; parentId: number }[] = [
    // Story 1
    { name: '공통 컴포넌트 UI 개선', parentId: s1 },
    { name: '팀 대시보드 레이아웃 개선', parentId: s1 },
    // Story 2
    { name: '워크스페이스 생성 & 검색', parentId: s2 },
    { name: '초대 & 가입 요청 관리', parentId: s2 },
    // Story 3
    { name: 'API 권한 제어', parentId: s3 },
    { name: 'UI 권한 제어', parentId: s3 },
    // Story 4
    { name: '팀 칸반 보드 & 다중 담당자', parentId: s4 },
    { name: '스윔레인 & WIP 한도', parentId: s4 },
    // Story 5
    { name: '스프린트 생성 & 관리', parentId: s5 },
    { name: '스프린트 보드 & 계획', parentId: s5 },
    // Story 6
    { name: '스프린트 분석 차트', parentId: s6 },
    { name: '팀 워크로드 & 통계', parentId: s6 },
    // Story 6 (extra)
    { name: '실시간 팀 활동 피드', parentId: s6 },
  ];
  const featureIssues = await db
    .insert(issues)
    .values(featureData.map((f) => ({ workspaceId, name: f.name, type: 'FEATURE', parentId: f.parentId })))
    .returning({ id: issues.id });
  featureIssues.forEach((f, i) =>
    console.log(`  ✓ FEATURE[${i + 1}] id=${f.id}: ${featureData[i].name}`),
  );

  return {
    goalId: goalIssue.id,
    storyIds: storyIssues.map((s) => s.id),
    featureIds: featureIssues.map((f) => f.id),
  };
}

// ─── Phase 2: Tickets ─────────────────────────────────────────────────────────

type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type TicketType = 'GOAL' | 'STORY' | 'FEATURE' | 'TASK';

interface TicketSeed {
  title: string;
  type: TicketType;
  priority: TicketPriority;
  issueId?: number;
  assigneeId?: number;
  dueDate?: string;
  position?: number;
}

async function createTickets(
  workspaceId: number,
  memberId: number | undefined,
  goalId: number,
  storyIds: number[],
  featureIds: number[],
): Promise<void> {
  const [s1Id, s2Id, s3Id, s4Id, s5Id, s6Id] = storyIds;
  const [f1Id, f2Id, f3Id, f4Id, f5Id, f6Id, f7Id, f8Id, f9Id, f10Id, f11Id, f12Id, f13Id] =
    featureIds;

  // ── 2-1: GOAL ticket ──────────────────────────────────────────────────────
  console.log('\n[Phase 2-1] Creating GOAL ticket...');
  const goalTickets: TicketSeed[] = [
    {
      title: 'tika team 버전 개발 완료',
      type: 'GOAL',
      priority: 'HIGH',
      issueId: goalId,
    },
  ];

  // ── 2-2: STORY tickets × 6 ───────────────────────────────────────────────
  console.log('[Phase 2-2] Creating 6 STORY tickets...');
  const storyTickets: TicketSeed[] = [
    { title: '팀 버전 UI 수정', type: 'STORY', priority: 'HIGH', issueId: s1Id },
    { title: '팀 온보딩 플로우 완성', type: 'STORY', priority: 'HIGH', issueId: s2Id },
    { title: '역할 기반 접근 제어(RBAC)', type: 'STORY', priority: 'HIGH', issueId: s3Id },
    { title: '팀 협업 보드', type: 'STORY', priority: 'HIGH', issueId: s4Id },
    { title: '스프린트 관리', type: 'STORY', priority: 'MEDIUM', issueId: s5Id },
    { title: '팀 분석 대시보드', type: 'STORY', priority: 'MEDIUM', issueId: s6Id },
  ];

  // ── 2-3: FEATURE tickets × 13 ────────────────────────────────────────────
  console.log('[Phase 2-3] Creating 13 FEATURE tickets...');
  const featureTickets: TicketSeed[] = [
    { title: '공통 컴포넌트 UI 개선', type: 'FEATURE', priority: 'HIGH', issueId: f1Id },
    { title: '팀 대시보드 레이아웃 개선', type: 'FEATURE', priority: 'MEDIUM', issueId: f2Id },
    { title: '워크스페이스 생성 & 검색', type: 'FEATURE', priority: 'HIGH', issueId: f3Id },
    { title: '초대 & 가입 요청 관리', type: 'FEATURE', priority: 'HIGH', issueId: f4Id },
    { title: 'API 권한 제어', type: 'FEATURE', priority: 'HIGH', issueId: f5Id },
    { title: 'UI 권한 제어', type: 'FEATURE', priority: 'MEDIUM', issueId: f6Id },
    { title: '팀 칸반 보드 & 다중 담당자', type: 'FEATURE', priority: 'HIGH', issueId: f7Id },
    { title: '스윔레인 & WIP 한도', type: 'FEATURE', priority: 'MEDIUM', issueId: f8Id },
    { title: '스프린트 생성 & 관리', type: 'FEATURE', priority: 'HIGH', issueId: f9Id },
    { title: '스프린트 보드 & 계획', type: 'FEATURE', priority: 'MEDIUM', issueId: f10Id },
    { title: '스프린트 분석 차트', type: 'FEATURE', priority: 'MEDIUM', issueId: f11Id },
    { title: '팀 워크로드 & 통계', type: 'FEATURE', priority: 'LOW', issueId: f12Id },
    { title: '실시간 팀 활동 피드', type: 'FEATURE', priority: 'LOW', issueId: f13Id },
  ];

  // ── 2-4: TASK tickets × 40 ───────────────────────────────────────────────
  console.log('[Phase 2-4] Creating 40 TASK tickets...');
  const taskTickets: TicketSeed[] = [
    // Feature 1: 공통 컴포넌트 UI 개선
    { title: '헤더 새 업무 버튼 팀 Shell 연동', type: 'TASK', priority: 'HIGH', issueId: f1Id, assigneeId: memberId, dueDate: '2026-03-10' },
    { title: '팀 사이드바 활성 메뉴 & 내비게이션 개선', type: 'TASK', priority: 'MEDIUM', issueId: f1Id, assigneeId: memberId },
    { title: '모바일 반응형 팀 레이아웃 점검', type: 'TASK', priority: 'LOW', issueId: f1Id, assigneeId: memberId },

    // Feature 2: 팀 대시보드 레이아웃 개선
    { title: '대시보드 그리드/카드 레이아웃 정리', type: 'TASK', priority: 'MEDIUM', issueId: f2Id, assigneeId: memberId },
    { title: '스프린트 배너 UI 개선', type: 'TASK', priority: 'LOW', issueId: f2Id, assigneeId: memberId },
    { title: '마감일·목표 섹션 UI 개선', type: 'TASK', priority: 'LOW', issueId: f2Id, assigneeId: memberId },

    // Feature 3: 워크스페이스 생성 & 검색
    { title: '워크스페이스 생성 폼 UI 구현', type: 'TASK', priority: 'HIGH', issueId: f3Id, assigneeId: memberId, dueDate: '2026-03-08' },
    { title: '공개 워크스페이스 검색 API 구현', type: 'TASK', priority: 'HIGH', issueId: f3Id, assigneeId: memberId },
    { title: '워크스페이스 검색 결과 UI 구현', type: 'TASK', priority: 'MEDIUM', issueId: f3Id, assigneeId: memberId },

    // Feature 4: 초대 & 가입 요청 관리
    { title: '이메일 초대 링크 생성 & 발송', type: 'TASK', priority: 'HIGH', issueId: f4Id, assigneeId: memberId, dueDate: '2026-03-12' },
    { title: '가입 요청 목록 & 승인 UI', type: 'TASK', priority: 'HIGH', issueId: f4Id, assigneeId: memberId },
    { title: '초대 토큰 만료 처리', type: 'TASK', priority: 'MEDIUM', issueId: f4Id, assigneeId: memberId },

    // Feature 5: API 권한 제어
    { title: 'OWNER/MEMBER/VIEWER 역할 정의', type: 'TASK', priority: 'HIGH', issueId: f5Id, assigneeId: memberId },
    { title: 'API 미들웨어 역할 검증 구현', type: 'TASK', priority: 'HIGH', issueId: f5Id, assigneeId: memberId },
    { title: '권한 오류 응답 표준화', type: 'TASK', priority: 'MEDIUM', issueId: f5Id, assigneeId: memberId },

    // Feature 6: UI 권한 제어
    { title: '역할별 메뉴/버튼 숨김 처리', type: 'TASK', priority: 'MEDIUM', issueId: f6Id, assigneeId: memberId },
    { title: 'VIEWER 읽기 전용 모드 구현', type: 'TASK', priority: 'MEDIUM', issueId: f6Id, assigneeId: memberId },
    { title: '권한 없음 페이지 UI', type: 'TASK', priority: 'LOW', issueId: f6Id, assigneeId: memberId },

    // Feature 7: 팀 칸반 보드 & 다중 담당자
    { title: '다중 담당자 UI (아바타 스택)', type: 'TASK', priority: 'HIGH', issueId: f7Id, assigneeId: memberId, dueDate: '2026-03-15' },
    { title: '담당자 필터 & 검색', type: 'TASK', priority: 'HIGH', issueId: f7Id, assigneeId: memberId },
    { title: '팀원 간 티켓 재배정 UI', type: 'TASK', priority: 'MEDIUM', issueId: f7Id, assigneeId: memberId },

    // Feature 8: 스윔레인 & WIP 한도
    { title: '스윔레인 담당자별 뷰 구현', type: 'TASK', priority: 'MEDIUM', issueId: f8Id, assigneeId: memberId },
    { title: 'WIP 한도 설정 UI', type: 'TASK', priority: 'MEDIUM', issueId: f8Id, assigneeId: memberId },
    { title: 'WIP 초과 시각 경고 표시', type: 'TASK', priority: 'LOW', issueId: f8Id, assigneeId: memberId },

    // Feature 9: 스프린트 생성 & 관리
    { title: '스프린트 생성/수정 폼 UI', type: 'TASK', priority: 'HIGH', issueId: f9Id, assigneeId: memberId, dueDate: '2026-03-20' },
    { title: '스프린트 시작/종료 API', type: 'TASK', priority: 'HIGH', issueId: f9Id, assigneeId: memberId },
    { title: '스프린트 백로그 티켓 할당 UI', type: 'TASK', priority: 'MEDIUM', issueId: f9Id, assigneeId: memberId },
    { title: '스프린트 상태 표시 배너', type: 'TASK', priority: 'MEDIUM', issueId: f9Id, assigneeId: memberId },

    // Feature 10: 스프린트 보드 & 계획
    { title: '스프린트 전용 보드 뷰', type: 'TASK', priority: 'HIGH', issueId: f10Id, assigneeId: memberId },
    { title: '스프린트 계획 드래그앤드롭', type: 'TASK', priority: 'MEDIUM', issueId: f10Id, assigneeId: memberId },
    { title: '스토리 포인트 입력 & 합산', type: 'TASK', priority: 'MEDIUM', issueId: f10Id, assigneeId: memberId },

    // Feature 11: 스프린트 분석 차트
    { title: '번다운 차트 구현', type: 'TASK', priority: 'MEDIUM', issueId: f11Id, assigneeId: memberId },
    { title: '속도 차트 구현', type: 'TASK', priority: 'LOW', issueId: f11Id, assigneeId: memberId },
    { title: '스프린트 완료율 통계 카드', type: 'TASK', priority: 'LOW', issueId: f11Id, assigneeId: memberId },

    // Feature 12: 팀 워크로드 & 통계
    { title: '팀원별 담당 티켓 수 시각화', type: 'TASK', priority: 'MEDIUM', issueId: f12Id, assigneeId: memberId },
    { title: '워크로드 히트맵 차트', type: 'TASK', priority: 'LOW', issueId: f12Id, assigneeId: memberId },
    { title: '팀 생산성 주간 리포트 UI', type: 'TASK', priority: 'LOW', issueId: f12Id, assigneeId: memberId },

    // Feature 13: 실시간 팀 활동 피드
    { title: '활동 피드 데이터 모델 설계', type: 'TASK', priority: 'MEDIUM', issueId: f13Id, assigneeId: memberId },
    { title: '티켓 변경 이벤트 로깅', type: 'TASK', priority: 'MEDIUM', issueId: f13Id, assigneeId: memberId },
    { title: '활동 피드 UI 컴포넌트', type: 'TASK', priority: 'LOW', issueId: f13Id, assigneeId: memberId },
    { title: '실시간 업데이트 폴링 구현', type: 'TASK', priority: 'LOW', issueId: f13Id, assigneeId: memberId },
  ];

  const allTickets = [...goalTickets, ...storyTickets, ...featureTickets, ...taskTickets];

  // Insert in batches to avoid overwhelming the DB
  const BATCH_SIZE = 20;
  let inserted = 0;
  for (let i = 0; i < allTickets.length; i += BATCH_SIZE) {
    const batch = allTickets.slice(i, i + BATCH_SIZE);
    await db.insert(tickets).values(
      batch.map((t, idx) => ({
        workspaceId,
        title: t.title,
        type: t.type,
        status: 'BACKLOG' as const,
        priority: t.priority,
        position: (i + idx) * 1024,
        issueId: t.issueId ?? null,
        assigneeId: t.assigneeId ?? null,
        dueDate: t.dueDate ?? null,
      })),
    );
    inserted += batch.length;
    console.log(`  ✓ Inserted batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${inserted}/${allTickets.length} tickets`);
  }

  console.log(`\n[Phase 2] Done. Total tickets created: ${allTickets.length}`);
  console.log(`  - GOAL: ${goalTickets.length}`);
  console.log(`  - STORY: ${storyTickets.length}`);
  console.log(`  - FEATURE: ${featureTickets.length}`);
  console.log(`  - TASK: ${taskTickets.length}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    console.log('='.repeat(60));
    console.log('Tika Team Seed Script');
    console.log('='.repeat(60));

    const { workspaceId, memberId } = await preflight();
    const { goalId, storyIds, featureIds } = await createIssueHierarchy(workspaceId);
    await createTickets(workspaceId, memberId, goalId, storyIds, featureIds);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Seed completed successfully!');
    console.log(`  workspaceId: ${workspaceId}`);
    console.log(`  memberId: ${memberId ?? '(none)'}`);
    console.log(`  Issues: 1 GOAL + 6 STORY + 13 FEATURE = 20 total`);
    console.log(`  Tickets: 1 + 6 + 13 + 40 = 60 total`);
    console.log('='.repeat(60));
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  }
})();
