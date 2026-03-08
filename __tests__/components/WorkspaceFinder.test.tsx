/**
 * WorkspaceFinder component tests
 * - Plain text search flow
 * - Invite link (/invite/<uuid>) auto-accept flow
 * - /workspace/<id> URL join-request flow
 * - No results state
 * - Error state
 */

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { WorkspaceFinder } from '@/components/onboarding/WorkspaceFinder';

const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  global.fetch = jest.fn();
});

function renderFinder() {
  return render(<WorkspaceFinder userId="user-1" userName="홍길동" />);
}

function typeInput(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('WorkspaceFinder — rendering', () => {
  it('renders search input and button', () => {
    renderFinder();
    expect(screen.getByPlaceholderText(/워크스페이스 이름 또는 초대 링크/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /검색/ })).toBeTruthy();
  });

  it('disables search button when input is empty', () => {
    renderFinder();
    const btn = screen.getByRole('button', { name: /검색/ });
    expect(btn).toBeDisabled();
  });

  it('enables search button when input has text', () => {
    renderFinder();
    const input = screen.getByPlaceholderText(/워크스페이스 이름 또는 초대 링크/);
    typeInput(input, '팀');
    const btn = screen.getByRole('button', { name: /검색/ });
    expect(btn).not.toBeDisabled();
  });
});

// ─── Plain text search ──────────────────────────────────────────────────────

describe('WorkspaceFinder — plain text search', () => {
  it('calls GET /api/workspaces/search and shows results', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        workspaces: [
          { id: 1, name: '마케팅팀', memberCount: 5 },
          { id: 2, name: '마케팅 스쿼드', memberCount: 3 },
        ],
      }),
    });

    renderFinder();
    const input = screen.getByPlaceholderText(/워크스페이스 이름 또는 초대 링크/);
    typeInput(input, '마케팅');
    fireEvent.click(screen.getByRole('button', { name: /검색/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workspaces/search?q='),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('마케팅팀')).toBeTruthy();
      expect(screen.getByText('마케팅 스쿼드')).toBeTruthy();
    });
  });

  it('shows no-results message when empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ workspaces: [] }),
    });

    renderFinder();
    const input = screen.getByPlaceholderText(/워크스페이스 이름 또는 초대 링크/);
    typeInput(input, '없는팀');
    fireEvent.click(screen.getByRole('button', { name: /검색/ }));

    await waitFor(() => {
      expect(screen.getByText(/워크스페이스가 없습니다/)).toBeTruthy();
    });
  });

  it('triggers search on Enter key', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ workspaces: [] }),
    });

    renderFinder();
    const input = screen.getByPlaceholderText(/워크스페이스 이름 또는 초대 링크/);
    typeInput(input, '팀명');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

// ─── Join request from search results ──────────────────────────────────────

describe('WorkspaceFinder — join request from search', () => {
  it('calls POST join-requests and shows 신청 완료', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspaces: [{ id: 3, name: '개발팀', memberCount: 8 }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ joinRequest: { id: 99 } }),
      });

    renderFinder();
    const input = screen.getByPlaceholderText(/워크스페이스 이름 또는 초대 링크/);
    typeInput(input, '개발팀');
    fireEvent.click(screen.getByRole('button', { name: /검색/ }));

    await waitFor(() => screen.getByText('개발팀'));
    fireEvent.click(screen.getByRole('button', { name: /가입신청/ }));

    await waitFor(() => {
      expect(screen.getByText(/신청 완료/)).toBeTruthy();
    });
  });
});

// ─── Invite link flow ────────────────────────────────────────────────────────

describe('WorkspaceFinder — invite link', () => {
  it('auto-accepts invite link and shows success message', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ workspaceId: 42 }),
    });

    renderFinder();
    const input = screen.getByPlaceholderText(/워크스페이스 이름 또는 초대 링크/);
    typeInput(input, 'http://localhost/invite/550e8400-e29b-41d4-a716-446655440000');
    fireEvent.click(screen.getByRole('button', { name: /검색/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/invites/550e8400-e29b-41d4-a716-446655440000/accept'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/워크스페이스에 참여했습니다/)).toBeTruthy();
    });
  });

  it('redirects to /workspace/[id] after 1500ms', async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ workspaceId: 42 }),
    });

    renderFinder();
    const input = screen.getByPlaceholderText(/워크스페이스 이름 또는 초대 링크/);
    typeInput(input, 'http://localhost/invite/550e8400-e29b-41d4-a716-446655440000');
    fireEvent.click(screen.getByRole('button', { name: /검색/ }));

    await waitFor(() => {
      expect(screen.getByText(/워크스페이스에 참여했습니다/)).toBeTruthy();
    });

    act(() => jest.runAllTimers());
    expect(mockPush).toHaveBeenCalledWith('/workspace/42');
    jest.useRealTimers();
  });

  it('shows error for expired invite link (status 410)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({ error: { code: 'INVITE_EXPIRED', message: '초대 링크가 만료되었습니다. 오너에게 새 링크를 요청하세요.' } }),
    });

    renderFinder();
    const input = screen.getByPlaceholderText(/워크스페이스 이름 또는 초대 링크/);
    typeInput(input, 'http://localhost/invite/550e8400-e29b-41d4-a716-446655440000');
    fireEvent.click(screen.getByRole('button', { name: /검색/ }));

    await waitFor(() => {
      expect(screen.getByText(/초대 링크가 만료되었습니다/)).toBeTruthy();
    });
  });
});

// ─── /workspace/<id> URL flow ─────────────────────────────────────────────────────

describe('WorkspaceFinder — /workspace/<id> URL', () => {
  it('submits join request for /workspace/<id> URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ joinRequest: { id: 55 } }),
    });

    renderFinder();
    const input = screen.getByPlaceholderText(/워크스페이스 이름 또는 초대 링크/);
    typeInput(input, 'http://localhost/workspace/99');
    fireEvent.click(screen.getByRole('button', { name: /검색/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workspaces/99/join-requests'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/가입 신청이 완료되었습니다/)).toBeTruthy();
    });
  });
});

// ─── Error state ─────────────────────────────────────────────────────────────

describe('WorkspaceFinder — error state', () => {
  it('shows error message on search API failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: '검색 중 오류.' } }),
    });

    renderFinder();
    const input = screen.getByPlaceholderText(/워크스페이스 이름 또는 초대 링크/);
    typeInput(input, '팀명');
    fireEvent.click(screen.getByRole('button', { name: /검색/ }));

    await waitFor(() => {
      expect(screen.getByText('검색 중 오류.')).toBeTruthy();
    });
  });
});
