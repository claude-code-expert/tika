import { db } from './index';
import { labels, issues, tickets, checklistItems, ticketLabels } from './schema';
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

export async function seedDefaultIssues(workspaceId: number): Promise<void> {
  const existing = await db
    .select({ id: issues.id })
    .from(issues)
    .where(eq(issues.workspaceId, workspaceId));

  if (existing.length > 0) return;

  // GOAL
  const [goal] = await db
    .insert(issues)
    .values({ workspaceId, name: 'MVP 출시', type: 'GOAL', parentId: null })
    .returning({ id: issues.id });

  // STORY
  const [story1, story2] = await db
    .insert(issues)
    .values([
      { workspaceId, name: '사용자 인증 시스템', type: 'STORY', parentId: goal.id },
      { workspaceId, name: '칸반 보드', type: 'STORY', parentId: goal.id },
    ])
    .returning({ id: issues.id });

  // FEATURE
  await db.insert(issues).values([
    { workspaceId, name: '인증 API', type: 'FEATURE', parentId: story1.id },
    { workspaceId, name: '드래그앤드롭', type: 'FEATURE', parentId: story2.id },
    { workspaceId, name: '티켓 CRUD', type: 'FEATURE', parentId: story2.id },
  ]);
}

export async function seedSampleTickets(
  workspaceId: number,
  memberId?: number,
): Promise<void> {
  const existing = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.workspaceId, workspaceId));

  if (existing.length > 0) return;

  // Fetch label IDs (assumes seedDefaultLabels ran first)
  const allLabels = await db
    .select({ id: labels.id, name: labels.name })
    .from(labels)
    .where(eq(labels.workspaceId, workspaceId));

  const labelId = (name: string) => allLabels.find((l) => l.name === name)?.id;

  // Fetch issue IDs
  const allIssues = await db
    .select({ id: issues.id, name: issues.name })
    .from(issues)
    .where(eq(issues.workspaceId, workspaceId));

  const issueId = (name: string) => allIssues.find((i) => i.name === name)?.id;

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
      issueId: issueId('드래그앤드롭'),
      assigneeId: memberId,
    },
    {
      workspaceId,
      title: '드래그앤드롭 기능 구현',
      type: 'TASK' as const,
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
      position: 1024,
      issueId: issueId('드래그앤드롭'),
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
      issueId: issueId('인증 API'),
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
    await seedDefaultIssues(workspaceId);
    await seedSampleTickets(workspaceId, memberId);
    console.log(`Seeded workspace ${workspaceId} successfully`);
    process.exit(0);
  })().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
