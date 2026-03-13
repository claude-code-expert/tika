/**
 * WorkspaceCreator component tests
 * - Renders name input and description textarea
 * - Shows validation error when name is empty
 * - Calls POST /api/workspaces on submit
 * - Navigates to /workspace/[id] on success
 * - Shows error on API failure
 */

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { WorkspaceCreator } from '@/components/onboarding/WorkspaceCreator';

const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  global.fetch = jest.fn();
});

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('WorkspaceCreator — rendering', () => {
  it('renders name input and description textarea', () => {
    render(<WorkspaceCreator />);
    expect(screen.getByLabelText(/워크스페이스 이름/)).toBeTruthy();
    expect(screen.getByLabelText(/설명/)).toBeTruthy();
  });

  it('renders submit button', () => {
    render(<WorkspaceCreator />);
    expect(screen.getByRole('button', { name: /워크스페이스 만들기/ })).toBeTruthy();
  });
});

// ─── Validation ──────────────────────────────────────────────────────────────

describe('WorkspaceCreator — validation', () => {
  it('shows error when submitting with empty name', async () => {
    render(<WorkspaceCreator />);
    const submitBtn = screen.getByRole('button', { name: /워크스페이스 만들기/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/워크스페이스 이름을 입력해주세요/)).toBeTruthy();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows error when name is only whitespace', async () => {
    render(<WorkspaceCreator />);
    const nameInput = screen.getByLabelText(/워크스페이스 이름/);
    await userEvent.type(nameInput, '   ');
    fireEvent.click(screen.getByRole('button', { name: /워크스페이스 만들기/ }));

    await waitFor(() => {
      expect(screen.getByText(/워크스페이스 이름을 입력해주세요/)).toBeTruthy();
    });
  });
});

// ─── Successful submit ──────────────────────────────────────────────────────

describe('WorkspaceCreator — successful submit', () => {
  it('calls POST /api/workspaces and navigates to /workspace/[id]', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ workspace: { id: 7, name: 'marketing-team' } }),
    });

    render(<WorkspaceCreator />);
    const nameInput = screen.getByLabelText(/워크스페이스 이름/);
    await userEvent.type(nameInput, 'marketing-team');
    fireEvent.click(screen.getByRole('button', { name: /워크스페이스 만들기/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/workspaces', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"name":"marketing-team"'),
      }));
    });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/workspace/7'));
  });

  it('submits with trimmed name', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ workspace: { id: 8 } }),
    });

    render(<WorkspaceCreator />);
    const nameInput = screen.getByLabelText(/워크스페이스 이름/);
    await userEvent.type(nameInput, 'dev-team');
    fireEvent.click(screen.getByRole('button', { name: /워크스페이스 만들기/ }));

    await waitFor(() => {
      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.name).toBe('dev-team');
    });
  });
});

// ─── Error handling ──────────────────────────────────────────────────────────

describe('WorkspaceCreator — error handling', () => {
  it('shows error when API returns failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: '이름이 중복됩니다.' } }),
    });

    render(<WorkspaceCreator />);
    const nameInput = screen.getByLabelText(/워크스페이스 이름/);
    await userEvent.type(nameInput, 'duplicate-team');
    fireEvent.click(screen.getByRole('button', { name: /워크스페이스 만들기/ }));

    await waitFor(() => {
      expect(screen.getByText('이름이 중복됩니다.')).toBeTruthy();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
