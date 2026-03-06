/**
 * JoinRequestList component tests
 * - Returns null for empty list
 * - Renders request rows with name, email, date
 * - Optimistic approve removes row
 * - Optimistic reject removes row
 * - Rolls back on API error
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JoinRequestList } from '@/components/workspace/JoinRequestList';
import type { JoinRequestWithUser } from '@/types/index';

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

function makeRequest(overrides: Partial<JoinRequestWithUser> = {}): JoinRequestWithUser {
  return {
    id: 1,
    workspaceId: 5,
    userId: 'user-2',
    message: null,
    status: 'PENDING',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date('2026-01-15').toISOString(),
    userName: '김철수',
    userEmail: 'kim@example.com',
    userAvatarUrl: null,
    ...overrides,
  };
}

// ─── Empty list ──────────────────────────────────────────────────────────────

describe('JoinRequestList — empty list', () => {
  it('renders nothing when initialRequests is empty', () => {
    const { container } = render(<JoinRequestList workspaceId={5} initialRequests={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('JoinRequestList — rendering', () => {
  it('shows section heading and request count', () => {
    const requests = [makeRequest({ id: 1 }), makeRequest({ id: 2, userName: '박영수' })];
    render(<JoinRequestList workspaceId={5} initialRequests={requests} />);
    expect(screen.getByText(/가입 신청/)).toBeTruthy();
    expect(screen.getByText('2건')).toBeTruthy();
  });

  it('renders user name and email for each request', () => {
    const requests = [makeRequest()];
    render(<JoinRequestList workspaceId={5} initialRequests={requests} />);
    expect(screen.getByText('김철수')).toBeTruthy();
    expect(screen.getByText(/kim@example\.com/)).toBeTruthy();
  });

  it('renders 승인 and 거절 buttons', () => {
    const requests = [makeRequest()];
    render(<JoinRequestList workspaceId={5} initialRequests={requests} />);
    expect(screen.getByTitle('승인')).toBeTruthy();
    expect(screen.getByTitle('거절')).toBeTruthy();
  });
});

// ─── Approve ─────────────────────────────────────────────────────────────────

describe('JoinRequestList — approve', () => {
  it('optimistically removes row and calls PATCH approve', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ joinRequest: { id: 1, status: 'APPROVED' }, member: { id: 99 } }),
    });

    const requests = [makeRequest()];
    render(<JoinRequestList workspaceId={5} initialRequests={requests} />);

    fireEvent.click(screen.getByTitle('승인'));

    // Row should be removed immediately (optimistic)
    await waitFor(() => {
      expect(screen.queryByText('김철수')).toBeNull();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/workspaces/5/join-requests/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ action: 'APPROVE' }),
      }),
    );
  });
});

// ─── Reject ──────────────────────────────────────────────────────────────────

describe('JoinRequestList — reject', () => {
  it('optimistically removes row and calls PATCH reject', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ joinRequest: { id: 1, status: 'REJECTED' } }),
    });

    const requests = [makeRequest()];
    render(<JoinRequestList workspaceId={5} initialRequests={requests} />);

    fireEvent.click(screen.getByTitle('거절'));

    await waitFor(() => {
      expect(screen.queryByText('김철수')).toBeNull();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/workspaces/5/join-requests/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ action: 'REJECT' }),
      }),
    );
  });
});

// ─── Rollback on error ────────────────────────────────────────────────────────

describe('JoinRequestList — rollback on error', () => {
  it('restores row and shows error message on API failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: '처리 중 오류가 발생했습니다.' } }),
    });

    const requests = [makeRequest()];
    render(<JoinRequestList workspaceId={5} initialRequests={requests} />);

    fireEvent.click(screen.getByTitle('승인'));

    // Row reappears after error
    await waitFor(() => {
      expect(screen.getByText('김철수')).toBeTruthy();
    });

    expect(screen.getByText('처리 중 오류가 발생했습니다.')).toBeTruthy();
  });

  it('restores row on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const requests = [makeRequest()];
    render(<JoinRequestList workspaceId={5} initialRequests={requests} />);

    fireEvent.click(screen.getByTitle('거절'));

    // Row reappears after rollback
    await waitFor(() => {
      expect(screen.getByText('김철수')).toBeTruthy();
    });

    // Error shows the actual Error.message
    expect(screen.getByText('Network error')).toBeTruthy();
  });
});

// ─── Multiple requests ───────────────────────────────────────────────────────

describe('JoinRequestList — multiple requests', () => {
  it('handles multiple requests and removes only the actioned one', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ joinRequest: { id: 1, status: 'APPROVED' }, member: {} }),
    });

    const requests = [
      makeRequest({ id: 1, userName: '김철수', userEmail: 'kim@example.com' }),
      makeRequest({ id: 2, userName: '이영희', userEmail: 'lee@example.com' }),
    ];
    render(<JoinRequestList workspaceId={5} initialRequests={requests} />);

    expect(screen.getByText('김철수')).toBeTruthy();
    expect(screen.getByText('이영희')).toBeTruthy();

    const approveButtons = screen.getAllByTitle('승인');
    fireEvent.click(approveButtons[0]); // approve first request

    await waitFor(() => {
      expect(screen.queryByText('김철수')).toBeNull();
      expect(screen.getByText('이영희')).toBeTruthy();
    });
  });
});
