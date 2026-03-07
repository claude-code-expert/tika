/**
 * ticket_assignees 시드 스크립트
 *
 * 기존 티켓에 워크스페이스 멤버를 랜덤으로 배정합니다.
 *
 * 사용법:
 *   npx tsx src/db/seed-assignees.ts [workspaceId]
 *   npx tsx src/db/seed-assignees.ts        <- 자동 탐지 (TEAM 워크스페이스 우선)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { db } from './index';
import { tickets, members, workspaces, ticketAssignees } from './schema';
import { eq, and } from 'drizzle-orm';

async function main() {
  const argWsId = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;

  // Resolve workspace
  let workspaceId: number;
  if (argWsId) {
    workspaceId = argWsId;
  } else {
    const wsList = await db.select().from(workspaces);
    const teamWs = wsList.find((w) => w.type === 'TEAM');
    const ws = teamWs ?? wsList[0];
    if (!ws) throw new Error('No workspaces found.');
    workspaceId = ws.id;
    console.log(`Auto-detected workspace: id=${workspaceId}, name=${ws.name}`);
  }

  // Get members
  const memberList = await db
    .select()
    .from(members)
    .where(eq(members.workspaceId, workspaceId));
  if (memberList.length === 0) {
    throw new Error(`No members found in workspace ${workspaceId}`);
  }
  console.log(`Found ${memberList.length} members:`, memberList.map((m) => `${m.id}:${m.displayName}`));

  // Get tickets
  const ticketList = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)));
  console.log(`Found ${ticketList.length} tickets`);

  // Check existing assignees
  const existing = await db.select().from(ticketAssignees);
  const existingSet = new Set(existing.map((r) => `${r.ticketId}-${r.memberId}`));
  console.log(`Existing ticket_assignees rows: ${existing.length}`);

  // Assign members to tickets
  const inserts: { ticketId: number; memberId: number }[] = [];

  for (const ticket of ticketList) {
    // Skip if ticket already has assignees
    const hasAssignee = existing.some((r) => r.ticketId === ticket.id);
    if (hasAssignee) continue;

    // GOAL/STORY: assign 1-2 members, FEATURE/TASK: assign 1 member
    const count = (ticket.type === 'GOAL' || ticket.type === 'STORY') ? Math.min(2, memberList.length) : 1;

    // Pick random members
    const shuffled = [...memberList].sort(() => Math.random() - 0.5);
    for (let i = 0; i < count; i++) {
      const key = `${ticket.id}-${shuffled[i].id}`;
      if (!existingSet.has(key)) {
        inserts.push({ ticketId: ticket.id, memberId: shuffled[i].id });
        existingSet.add(key);
      }
    }
  }

  if (inserts.length === 0) {
    console.log('All tickets already have assignees. Nothing to insert.');
  } else {
    await db.insert(ticketAssignees).values(inserts).onConflictDoNothing();
    console.log(`Inserted ${inserts.length} ticket_assignees rows.`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
