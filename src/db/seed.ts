import { db } from './index';
import { labels, tickets, checklistItems, ticketLabels } from './schema';
import { DEFAULT_LABELS } from '@/lib/constants';
import { eq } from 'drizzle-orm';

export async function seedDefaultLabels(workspaceId: number): Promise<void> {
  const existing = await db
    .select({ id: labels.id })
    .from(labels)
    .where(eq(labels.workspaceId, workspaceId));

  if (existing.length > 0) return; // already seeded

  await db.insert(labels).values(
    DEFAULT_LABELS.map((l) => ({
      workspaceId,
      name: l.name,
      color: l.color,
    })),
  );
}

export async function seedDefaultIssues(workspaceId: number, memberId?: number): Promise<void> {
  const existing = await db
    .select({ id: tickets.id, title: tickets.title })
    .from(tickets)
    .where(eq(tickets.workspaceId, workspaceId));

  if (existing.some((t) => t.title === 'MVP 출시')) return;

  const assignee = memberId ? { assigneeId: memberId } : {};

  // GOAL
  const [goal] = await db
    .insert(tickets)
    .values({ workspaceId, title: 'MVP 출시', type: 'GOAL', status: 'IN_PROGRESS', priority: 'HIGH', position: 0, parentId: null, ...assignee })
    .returning({ id: tickets.id });

  // STORY x2
  const [story1, story2] = await db
    .insert(tickets)
    .values([
      { workspaceId, title: '사용자 인증 시스템', type: 'STORY', status: 'IN_PROGRESS', priority: 'HIGH', position: 0, parentId: goal.id, ...assignee },
      { workspaceId, title: '칸반 보드', type: 'STORY', status: 'TODO', priority: 'MEDIUM', position: 1024, parentId: goal.id, ...assignee },
    ])
    .returning({ id: tickets.id });

  // FEATURE x2 per Story
  const [feat1_1, feat1_2, feat2_1, feat2_2] = await db
    .insert(tickets)
    .values([
      { workspaceId, title: 'OAuth 로그인 구현', type: 'FEATURE', status: 'DONE', priority: 'HIGH', position: 0, parentId: story1.id, ...assignee },
      { workspaceId, title: '사용자 프로필 관리', type: 'FEATURE', status: 'IN_PROGRESS', priority: 'MEDIUM', position: 1024, parentId: story1.id, ...assignee },
      { workspaceId, title: '드래그앤드롭', type: 'FEATURE', status: 'TODO', priority: 'HIGH', position: 0, parentId: story2.id, ...assignee },
      { workspaceId, title: '티켓 CRUD', type: 'FEATURE', status: 'TODO', priority: 'MEDIUM', position: 1024, parentId: story2.id, ...assignee },
    ])
    .returning({ id: tickets.id });

  // TASK x2 per Feature
  await db.insert(tickets).values([
    // feat1_1 (OAuth) — DONE
    { workspaceId, title: 'Google OAuth 설정', type: 'TASK', status: 'DONE', priority: 'HIGH', position: 0, parentId: feat1_1.id, ...assignee },
    { workspaceId, title: '세션 관리 구현', type: 'TASK', status: 'DONE', priority: 'MEDIUM', position: 1024, parentId: feat1_1.id, ...assignee },
    // feat1_2 (프로필) — IN_PROGRESS / TODO
    { workspaceId, title: '프로필 페이지 UI', type: 'TASK', status: 'IN_PROGRESS', priority: 'MEDIUM', position: 0, parentId: feat1_2.id, ...assignee },
    { workspaceId, title: '프로필 수정 API', type: 'TASK', status: 'TODO', priority: 'MEDIUM', position: 1024, parentId: feat1_2.id, ...assignee },
    // feat2_1 (드래그앤드롭) — TODO
    { workspaceId, title: '칼럼 간 이동 구현', type: 'TASK', status: 'TODO', priority: 'HIGH', position: 0, parentId: feat2_1.id, ...assignee },
    { workspaceId, title: '순서 변경 구현', type: 'TASK', status: 'BACKLOG', priority: 'MEDIUM', position: 1024, parentId: feat2_1.id, ...assignee },
    // feat2_2 (티켓 CRUD) — BACKLOG
    { workspaceId, title: '티켓 생성 폼 구현', type: 'TASK', status: 'BACKLOG', priority: 'MEDIUM', position: 0, parentId: feat2_2.id, ...assignee },
    { workspaceId, title: '티켓 상세 모달 구현', type: 'TASK', status: 'BACKLOG', priority: 'LOW', position: 1024, parentId: feat2_2.id, ...assignee },
  ]);
}

export async function seedSampleTickets(
  workspaceId: number,
  memberId?: number,
): Promise<void> {
  const existing = await db
    .select({ id: tickets.id, title: tickets.title })
    .from(tickets)
    .where(eq(tickets.workspaceId, workspaceId));

  if (existing.some((t) => t.title === '알림 기능 조사')) return;

  // Fetch label IDs (assumes seedDefaultLabels ran first)
  const allLabels = await db
    .select({ id: labels.id, name: labels.name })
    .from(labels)
    .where(eq(labels.workspaceId, workspaceId));

  const labelId = (name: string) => allLabels.find((l) => l.name === name)?.id;

  // Fetch parent ticket IDs (GOAL/STORY/FEATURE hierarchy)
  const parentTickets = await db
    .select({ id: tickets.id, title: tickets.title })
    .from(tickets)
    .where(eq(tickets.workspaceId, workspaceId));

  const parentId = (title: string) => parentTickets.find((t) => t.title === title)?.id;

  const sampleTickets = [
    // BACKLOG
    {
      workspaceId,
      title: '알림 기능 조사',
      type: 'STORY' as const,
      status: 'BACKLOG' as const,
      priority: 'LOW' as const,
      position: 0,
    },
    {
      workspaceId,
      title: '성능 테스트 계획',
      type: 'TASK' as const,
      status: 'BACKLOG' as const,
      priority: 'MEDIUM' as const,
      position: 1024,
      assigneeId: memberId,
    },
    {
      workspaceId,
      title: 'CI/CD 파이프라인 구축',
      type: 'FEATURE' as const,
      status: 'BACKLOG' as const,
      priority: 'LOW' as const,
      position: 2048,
    },
    // TODO
    {
      workspaceId,
      title: '칸반 보드 UI 구현',
      type: 'FEATURE' as const,
      status: 'TODO' as const,
      priority: 'HIGH' as const,
      position: 0,
      parentId: parentId('드래그앤드롭'),
      assigneeId: memberId,
    },
    {
      workspaceId,
      title: '드래그앤드롭 기능 구현',
      type: 'TASK' as const,
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
      position: 1024,
      parentId: parentId('드래그앤드롭'),
      assigneeId: memberId,
    },
    // IN_PROGRESS
    {
      workspaceId,
      title: 'API 설계 문서 작성',
      type: 'FEATURE' as const,
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      position: 0,
      parentId: parentId('인증 API'),
      assigneeId: memberId,
    },
    {
      workspaceId,
      title: 'DB 스키마 설계',
      type: 'TASK' as const,
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      position: 1024,
      assigneeId: memberId,
    },
    // DONE
    {
      workspaceId,
      title: '프로젝트 요구사항 정리',
      type: 'TASK' as const,
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      position: 0,
      assigneeId: memberId,
    },
  ];

  const inserted = await db.insert(tickets).values(sampleTickets).returning({ id: tickets.id });

  // Attach labels to a few tickets
  const frontendId = labelId('Frontend');
  const backendId = labelId('Backend');
  const docsId = labelId('Docs');

  const labelAttachments: { ticketId: number; labelId: number }[] = [];
  if (inserted[3] && frontendId) labelAttachments.push({ ticketId: inserted[3].id, labelId: frontendId });
  if (inserted[4] && frontendId) labelAttachments.push({ ticketId: inserted[4].id, labelId: frontendId });
  if (inserted[5] && backendId) labelAttachments.push({ ticketId: inserted[5].id, labelId: backendId });
  if (inserted[7] && docsId) labelAttachments.push({ ticketId: inserted[7].id, labelId: docsId });

  if (labelAttachments.length > 0) {
    await db.insert(ticketLabels).values(labelAttachments);
  }

  // Add checklist to IN_PROGRESS ticket
  if (inserted[5]) {
    await db.insert(checklistItems).values([
      { ticketId: inserted[5].id, text: 'REST API 엔드포인트 목록 작성', isCompleted: true, position: 0 },
      { ticketId: inserted[5].id, text: '요청/응답 스키마 정의', isCompleted: false, position: 1024 },
      { ticketId: inserted[5].id, text: 'OpenAPI 문서 생성', isCompleted: false, position: 2048 },
    ]);
  }
}

// Standalone script entry point
if (process.argv[1] === import.meta.url || process.argv[1]?.endsWith('seed.ts')) {
  const workspaceId = parseInt(process.argv[2] ?? '1', 10);
  const memberId = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;

  (async () => {
    await seedDefaultLabels(workspaceId);
    await seedDefaultIssues(workspaceId, memberId);
    await seedSampleTickets(workspaceId, memberId);
    console.log(`Seeded workspace ${workspaceId} successfully`);
    process.exit(0);
  })().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
