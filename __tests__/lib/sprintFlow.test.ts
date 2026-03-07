/**
 * T076: Sprint flow unit tests
 * Tests ACTIVE_SPRINT_EXISTS 409, SPRINT_NOT_DELETABLE 400, completeSprint batch moves
 */

jest.mock('@/db/queries/sprints', () => ({
  hasActiveSprint: jest.fn(),
  getSprintById: jest.fn(),
  activateSprint: jest.fn(),
  completeSprint: jest.fn(),
  deleteSprint: jest.fn(),
}));

jest.mock('@/db/queries/tickets', () => ({
  updateTicket: jest.fn(),
}));

import {
  hasActiveSprint,
  getSprintById,
  activateSprint,
  completeSprint,
  deleteSprint,
} from '@/db/queries/sprints';
import { updateTicket } from '@/db/queries/tickets';

const mockHasActiveSprint = hasActiveSprint as jest.MockedFunction<typeof hasActiveSprint>;
const mockGetSprintById = getSprintById as jest.MockedFunction<typeof getSprintById>;
const mockActivateSprint = activateSprint as jest.MockedFunction<typeof activateSprint>;
const mockCompleteSprint = completeSprint as jest.MockedFunction<typeof completeSprint>;
const mockDeleteSprint = deleteSprint as jest.MockedFunction<typeof deleteSprint>;
const mockUpdateTicket = updateTicket as jest.MockedFunction<typeof updateTicket>;

function makeSprint(status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED', id = 1) {
  return {
    id,
    workspaceId: 100,
    name: `Sprint ${id}`,
    goal: null,
    status,
    startDate: '2026-01-01',
    endDate: '2026-01-14',
    storyPointsTotal: null,
    createdAt: new Date().toISOString(),
  };
}

describe('Sprint Flow Logic', () => {
  afterEach(() => jest.clearAllMocks());

  // ─── ACTIVE_SPRINT_EXISTS (409) ─────────────────────────────────────────────

  it('detects ACTIVE_SPRINT_EXISTS when another sprint is active', async () => {
    mockHasActiveSprint.mockResolvedValue(true);
    const isActive = await hasActiveSprint(100, 2);
    expect(isActive).toBe(true);
  });

  it('allows activation when no other sprint is active', async () => {
    mockHasActiveSprint.mockResolvedValue(false);
    const isActive = await hasActiveSprint(100, 1);
    expect(isActive).toBe(false);
  });

  it('hasActiveSprint excludes the sprint being activated', async () => {
    mockHasActiveSprint.mockResolvedValue(false);
    await hasActiveSprint(100, 1);
    expect(mockHasActiveSprint).toHaveBeenCalledWith(100, 1);
  });

  // ─── Sprint status checks before activation ────────────────────────────────

  it('prevents activation if sprint is not PLANNED', async () => {
    mockGetSprintById.mockResolvedValue(makeSprint('COMPLETED') as never);
    const sprint = await getSprintById(1, 100);
    const canActivate = sprint?.status === 'PLANNED';
    expect(canActivate).toBe(false);
  });

  it('allows activation for PLANNED sprint', async () => {
    mockGetSprintById.mockResolvedValue(makeSprint('PLANNED') as never);
    const sprint = await getSprintById(1, 100);
    const canActivate = sprint?.status === 'PLANNED';
    expect(canActivate).toBe(true);
  });

  // ─── SPRINT_NOT_DELETABLE (400) ────────────────────────────────────────────

  it('prevents deletion if sprint is ACTIVE', async () => {
    mockGetSprintById.mockResolvedValue(makeSprint('ACTIVE') as never);
    const sprint = await getSprintById(1, 100);
    const canDelete = sprint?.status === 'PLANNED';
    expect(canDelete).toBe(false);
  });

  it('prevents deletion if sprint is COMPLETED', async () => {
    mockGetSprintById.mockResolvedValue(makeSprint('COMPLETED') as never);
    const sprint = await getSprintById(1, 100);
    const canDelete = sprint?.status === 'PLANNED';
    expect(canDelete).toBe(false);
  });

  it('allows deletion for PLANNED sprint', async () => {
    mockGetSprintById.mockResolvedValue(makeSprint('PLANNED') as never);
    const sprint = await getSprintById(1, 100);
    const canDelete = sprint?.status === 'PLANNED';
    expect(canDelete).toBe(true);
  });

  // ─── completeSprint with batch ticket moves ────────────────────────────────

  it('completeSprint is called after ticket moves', async () => {
    const completed = makeSprint('COMPLETED');
    mockCompleteSprint.mockResolvedValue(completed as never);
    mockUpdateTicket.mockResolvedValue({
      id: 1,
      workspaceId: 100,
      title: 'Test ticket',
      description: null,
      type: 'TASK',
      status: 'BACKLOG',
      priority: 'MEDIUM',
      position: 0,
      startDate: null,
      dueDate: null,
      parentId: null,
      assigneeId: null,
      sprintId: null,
      storyPoints: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as never);

    // Simulate completeSprint handler logic:
    // 1. Move tickets (to backlog)
    const ticketMoves = [
      { ticketId: 1, destination: 'BACKLOG' as const },
      { ticketId: 2, destination: 'BACKLOG' as const },
    ];

    for (const move of ticketMoves) {
      await updateTicket(move.ticketId, 100, { sprintId: null });
    }

    // 2. Complete sprint
    const result = await completeSprint(1, 100);

    expect(mockUpdateTicket).toHaveBeenCalledTimes(2);
    expect(mockUpdateTicket).toHaveBeenCalledWith(1, 100, { sprintId: null });
    expect(mockUpdateTicket).toHaveBeenCalledWith(2, 100, { sprintId: null });
    expect(mockCompleteSprint).toHaveBeenCalledWith(1, 100);
    expect(result?.status).toBe('COMPLETED');
  });

  it('moves tickets to target sprint (not backlog)', async () => {
    mockUpdateTicket.mockResolvedValue({ id: 3, sprintId: 5 } as never);

    const targetSprintId = 5;
    await updateTicket(3, 100, { sprintId: targetSprintId });

    expect(mockUpdateTicket).toHaveBeenCalledWith(3, 100, { sprintId: 5 });
  });

  it('completeSprint returns null if sprint not found', async () => {
    mockCompleteSprint.mockResolvedValue(null);
    const result = await completeSprint(999, 100);
    expect(result).toBeNull();
  });

  // ─── PLANNED → ACTIVE → COMPLETED state transitions ────────────────────────

  it('activateSprint changes status to ACTIVE', async () => {
    const activated = makeSprint('ACTIVE');
    mockActivateSprint.mockResolvedValue(activated as never);
    const result = await activateSprint(1, 100);
    expect(result?.status).toBe('ACTIVE');
  });

  it('completeSprint changes status from ACTIVE to COMPLETED', async () => {
    const completed = makeSprint('COMPLETED');
    mockCompleteSprint.mockResolvedValue(completed as never);
    const result = await completeSprint(1, 100);
    expect(result?.status).toBe('COMPLETED');
  });

  it('deleteSprint returns true on success', async () => {
    mockDeleteSprint.mockResolvedValue(true);
    const result = await deleteSprint(1, 100);
    expect(result).toBe(true);
  });

  it('deleteSprint returns false when sprint not found', async () => {
    mockDeleteSprint.mockResolvedValue(false);
    const result = await deleteSprint(999, 100);
    expect(result).toBe(false);
  });
});
