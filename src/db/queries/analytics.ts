import { eq, and, count, gte, isNotNull, inArray, sql, lt, ne } from 'drizzle-orm';
import { db } from '@/db/index';
import { tickets, sprints, labels, ticketLabels, members, ticketAssignees, users } from '@/db/schema';
import type {
  BurndownDataPoint,
  CfdDataPoint,
  VelocitySprint,
  CycleTimeDistribution,
  LabelAnalytic,
  MemberWorkload,
  TeamRole,
  TicketStatus,
} from '@/types/index';
import { TICKET_STATUS } from '@/types/index';

// ─── Burndown ────────────────────────────────────────────────────────────────

export async function getBurndownData(
  workspaceId: number,
  sprintId: number,
): Promise<BurndownDataPoint[]> {
  const [sprint] = await db
    .select()
    .from(sprints)
    .where(and(eq(sprints.id, sprintId), eq(sprints.workspaceId, workspaceId)))
    .limit(1);

  if (!sprint || !sprint.startDate || !sprint.endDate) return [];

  const sprintTickets = await db
    .select({ id: tickets.id, completedAt: tickets.completedAt, storyPoints: tickets.storyPoints, createdAt: tickets.createdAt })
    .from(tickets)
    .where(and(eq(tickets.sprintId, sprintId), eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)));

  return computePeriodBurndown(sprintTickets, sprint.startDate, sprint.endDate);
}

// ─── Period Burndown (date-range based) ──────────────────────────────────────

function computePeriodBurndown(
  allTickets: { id: number; completedAt: Date | null; storyPoints: number | null; createdAt: Date }[],
  startDate: string,
  endDate: string,
): BurndownDataPoint[] {
  const periodStart = new Date(startDate);
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = new Date(endDate);
  periodEnd.setHours(23, 59, 59, 999);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const lastDay = periodEnd < today ? periodEnd : today;

  const relevantTickets = allTickets.filter((t) => t.createdAt.getTime() <= lastDay.getTime());
  const total = relevantTickets.length;
  const totalPoints = relevantTickets.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

  const totalDays = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));

  // Pre-sort by completedAt for efficient cumulative counting
  const completed = relevantTickets
    .filter((t): t is typeof t & { completedAt: Date } => t.completedAt !== null)
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());

  const result: BurndownDataPoint[] = [];
  let completedIdx = 0;
  let completedCount = 0;
  let completedPoints = 0;

  for (let d = new Date(periodStart); d.getTime() <= lastDay.getTime(); d.setDate(d.getDate() + 1)) {
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    const dayEndMs = dayEnd.getTime();

    while (completedIdx < completed.length && completed[completedIdx].completedAt.getTime() <= dayEndMs) {
      completedCount++;
      completedPoints += completed[completedIdx].storyPoints ?? 0;
      completedIdx++;
    }

    const dayIndex = Math.ceil((d.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const idealTickets = Math.max(0, total - Math.round((total / totalDays) * dayIndex));

    result.push({
      date: d.toISOString().slice(0, 10),
      remainingTickets: total - completedCount,
      remainingPoints: totalPoints - completedPoints,
      idealTickets,
    });
  }

  return result;
}

export async function getPeriodBurndownData(
  workspaceId: number,
  startDate: string,
  endDate: string,
): Promise<BurndownDataPoint[]> {
  const allTickets = await db
    .select({ id: tickets.id, completedAt: tickets.completedAt, storyPoints: tickets.storyPoints, createdAt: tickets.createdAt })
    .from(tickets)
    .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)));

  return computePeriodBurndown(allTickets, startDate, endDate);
}

export async function getMultiPeriodBurndownData(
  workspaceId: number,
  periods: { startDate: string; endDate: string }[],
): Promise<BurndownDataPoint[][]> {
  const allTickets = await db
    .select({ id: tickets.id, completedAt: tickets.completedAt, storyPoints: tickets.storyPoints, createdAt: tickets.createdAt })
    .from(tickets)
    .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)));

  return periods.map((p) => computePeriodBurndown(allTickets, p.startDate, p.endDate));
}

// ─── CFD (Cumulative Flow Diagram) ───────────────────────────────────────────

export async function getCfdData(
  workspaceId: number,
  days: number = 30,
): Promise<CfdDataPoint[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // Current status counts
  const statusRows = await db
    .select({ status: tickets.status, cnt: count() })
    .from(tickets)
    .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)))
    .groupBy(tickets.status);

  const currentCounts: Record<string, number> = {};
  for (const row of statusRows) {
    currentCounts[row.status] = Number(row.cnt);
  }

  // Completed tickets in the period (to approximate DONE trend)
  const completedTickets = await db
    .select({ completedAt: tickets.completedAt })
    .from(tickets)
    .where(
      and(
        eq(tickets.workspaceId, workspaceId),
        eq(tickets.status, 'DONE'),
        isNotNull(tickets.completedAt),
        gte(tickets.completedAt, cutoff),
        eq(tickets.deleted, false),
      ),
    );

  const doneCounts: Record<string, number> = {};
  for (const t of completedTickets) {
    if (t.completedAt) {
      const day = t.completedAt.toISOString().split('T')[0];
      doneCounts[day] = (doneCounts[day] ?? 0) + 1;
    }
  }

  // Build cumulative DONE (starting from total DONE minus those in the period)
  const doneInPeriod = Object.values(doneCounts).reduce((s, c) => s + c, 0);
  let cumulativeDone = (currentCounts['DONE'] ?? 0) - doneInPeriod;

  const result: CfdDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = d.toISOString().split('T')[0];

    cumulativeDone += doneCounts[day] ?? 0;

    result.push({
      date: day,
      backlog: currentCounts['BACKLOG'] ?? 0,
      todo: currentCounts['TODO'] ?? 0,
      inProgress: currentCounts['IN_PROGRESS'] ?? 0,
      done: Math.max(0, cumulativeDone),
    });
  }

  return result;
}

// ─── Velocity ────────────────────────────────────────────────────────────────

export async function getVelocityData(workspaceId: number): Promise<VelocitySprint[]> {
  const completedSprints = await db
    .select()
    .from(sprints)
    .where(and(eq(sprints.workspaceId, workspaceId), eq(sprints.status, 'COMPLETED')))
    .orderBy(sprints.createdAt);

  if (completedSprints.length === 0) return [];

  const sprintIds = completedSprints.map((s) => s.id);

  // Single GROUP BY query instead of N+1 loop
  const ticketRows = await db
    .select({
      sprintId: tickets.sprintId,
      completedPoints: sql<number>`coalesce(sum(${tickets.storyPoints}), 0)`.as('completedPoints'),
    })
    .from(tickets)
    .where(and(inArray(tickets.sprintId, sprintIds), eq(tickets.status, 'DONE'), eq(tickets.deleted, false)))
    .groupBy(tickets.sprintId);

  const pointsBySprintId: Record<number, number> = {};
  for (const row of ticketRows) {
    if (row.sprintId != null) pointsBySprintId[row.sprintId] = Number(row.completedPoints);
  }

  return completedSprints.map((sprint) => ({
    sprintId: sprint.id,
    name: sprint.name,
    completedPoints: pointsBySprintId[sprint.id] ?? 0,
    plannedPoints: sprint.storyPointsTotal ?? 0,
  }));
}

// ─── Cycle Time ───────────────────────────────────────────────────────────────

export async function getCycleTimeData(workspaceId: number): Promise<CycleTimeDistribution[]> {
  const completedTickets = await db
    .select({ createdAt: tickets.createdAt, completedAt: tickets.completedAt })
    .from(tickets)
    .where(
      and(
        eq(tickets.workspaceId, workspaceId),
        eq(tickets.status, 'DONE'),
        isNotNull(tickets.completedAt),
        eq(tickets.deleted, false),
      ),
    );

  const distribution: Record<number, number> = {};

  for (const t of completedTickets) {
    if (t.completedAt) {
      const days = Math.max(
        0,
        Math.ceil((t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      );
      const bucket = Math.min(days, 30);
      distribution[bucket] = (distribution[bucket] ?? 0) + 1;
    }
  }

  return Object.entries(distribution)
    .map(([days, count]) => ({ days: Number(days), count }))
    .sort((a, b) => a.days - b.days);
}

// ─── Label Analytics ──────────────────────────────────────────────────────────

export async function getLabelAnalytics(workspaceId: number): Promise<LabelAnalytic[]> {
  const rows = await db
    .select({
      name: labels.name,
      color: labels.color,
      cnt: count(ticketLabels.ticketId),
    })
    .from(labels)
    .leftJoin(ticketLabels, eq(ticketLabels.labelId, labels.id))
    .where(eq(labels.workspaceId, workspaceId))
    .groupBy(labels.id, labels.name, labels.color);

  const total = rows.reduce((s, r) => s + Number(r.cnt), 0);

  return rows.map((r) => ({
    name: r.name,
    color: r.color,
    count: Number(r.cnt),
    percentage: total > 0 ? Math.round((Number(r.cnt) / total) * 100) : 0,
  }));
}

// ─── Member Workload ──────────────────────────────────────────────────────────

export async function getMemberWorkload(workspaceId: number): Promise<MemberWorkload[]> {
  const workspaceMembers = await db
    .select({
      id: members.id,
      userId: members.userId,
      displayName: members.displayName,
      color: members.color,
      role: members.role,
      email: users.email,
    })
    .from(members)
    .leftJoin(users, eq(users.id, members.userId))
    .where(eq(members.workspaceId, workspaceId));

  if (workspaceMembers.length === 0) return [];

  const memberIds = workspaceMembers.map((m) => m.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [assignmentRows, overdueRows] = await Promise.all([
    db
      .select({
        memberId: ticketAssignees.memberId,
        status: tickets.status,
        cnt: count(),
      })
      .from(ticketAssignees)
      .innerJoin(tickets, eq(tickets.id, ticketAssignees.ticketId))
      .where(and(inArray(ticketAssignees.memberId, memberIds), eq(tickets.deleted, false)))
      .groupBy(ticketAssignees.memberId, tickets.status),

    db
      .select({
        memberId: ticketAssignees.memberId,
        cnt: count(),
      })
      .from(ticketAssignees)
      .innerJoin(tickets, eq(tickets.id, ticketAssignees.ticketId))
      .where(
        and(
          inArray(ticketAssignees.memberId, memberIds),
          eq(tickets.deleted, false),
          ne(tickets.status, TICKET_STATUS.DONE),
          isNotNull(tickets.plannedEndDate),
          lt(tickets.plannedEndDate, today.toISOString().slice(0, 10)),
        ),
      )
      .groupBy(ticketAssignees.memberId),
  ]);

  // Build lookup: memberId → status → count
  const lookup: Record<number, Record<string, number>> = {};
  for (const row of assignmentRows) {
    if (!lookup[row.memberId]) lookup[row.memberId] = {};
    lookup[row.memberId][row.status] = Number(row.cnt);
  }

  // Build overdue lookup: memberId → count
  const overdueLookup: Record<number, number> = {};
  for (const row of overdueRows) {
    overdueLookup[row.memberId] = Number(row.cnt);
  }

  return workspaceMembers.map((m) => {
    const byStatusMap = lookup[m.id] ?? {};
    const byStatus: Record<TicketStatus, number> = {
      BACKLOG: byStatusMap['BACKLOG'] ?? 0,
      TODO: byStatusMap['TODO'] ?? 0,
      IN_PROGRESS: byStatusMap['IN_PROGRESS'] ?? 0,
      DONE: byStatusMap['DONE'] ?? 0,
    };

    const assigned = Object.values(byStatus).reduce((s, c) => s + c, 0);

    return {
      memberId: m.id,
      displayName: m.displayName,
      email: m.email ?? null,
      color: m.color,
      role: m.role as TeamRole,
      assigned,
      inProgress: byStatus[TICKET_STATUS.IN_PROGRESS],
      completed: byStatus[TICKET_STATUS.DONE],
      overdue: overdueLookup[m.id] ?? 0,
      byStatus,
    };
  });
}
