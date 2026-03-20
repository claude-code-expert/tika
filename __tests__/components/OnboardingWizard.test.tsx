/**
 * OnboardingWizard component tests — tab-based single screen
 * - Personal tab: calls PATCH /api/users/type with USER, then navigates to /
 * - Team tab: shows WorkspaceCreator (개설) and WorkspaceFinder (찾기) sub-tabs
 * - Error handling: shows error on API failure, no navigation
 */

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));
jest.mock('@/components/onboarding/WorkspaceCreator', () => ({
  WorkspaceCreator: () => <div>WorkspaceCreator</div>,
}));
jest.mock('@/components/onboarding/WorkspaceFinder', () => ({
  WorkspaceFinder: () => <div>WorkspaceFinder</div>,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

const mockPush = jest.fn();
const mockUpdate = jest.fn();

(useRouter as jest.Mock).mockReturnValue({ push: mockPush });
(useSession as jest.Mock).mockReturnValue({ update: mockUpdate });

function renderWizard() {
  return render(<OnboardingWizard userId="user-1" userName="홍길동" />);
}

function mockFetchSuccess() {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ user: { userType: 'USER' } }),
  });
  mockUpdate.mockResolvedValue(null);
}

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useSession as jest.Mock).mockReturnValue({ update: mockUpdate });
  global.fetch = jest.fn();
});

// ─── Rendering (initial state) ───────────────────────────────────────────────

describe('OnboardingWizard — rendering', () => {
  it('shows welcome message with user name', () => {
    renderWizard();
    expect(screen.getByText(/안녕하세요, 홍길동님/)).toBeTruthy();
    expect(screen.getByText(/Tika를 어떻게 시작할까요/)).toBeTruthy();
  });

  it('renders two main tab buttons', () => {
    renderWizard();
    // Use getAllByRole since "개인 보드" also appears in the start button text
    const personalButtons = screen.getAllByRole('button', { name: /개인 보드/ });
    expect(personalButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /팀 워크스페이스/ })).toBeTruthy();
  });

  it('shows personal tab content by default', () => {
    renderWizard();
    expect(screen.getByText(/개인 보드 시작하기/)).toBeTruthy();
  });

  it('does not show team workspace card by default', () => {
    renderWizard();
    expect(screen.queryByText('WorkspaceCreator')).toBeNull();
  });
});

// ─── Personal tab ─────────────────────────────────────────────────────────────

describe('OnboardingWizard — personal tab', () => {
  it('calls PATCH /api/users/type with USER', async () => {
    mockFetchSuccess();
    renderWizard();
    fireEvent.click(screen.getByText(/개인 보드 시작하기/));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/type',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ userType: 'USER' }),
        }),
      );
    });
  });

  it('calls session.update() after successful API call', async () => {
    mockFetchSuccess();
    renderWizard();
    fireEvent.click(screen.getByText(/개인 보드 시작하기/));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
  });

  it('navigates to / on success', async () => {
    mockFetchSuccess();
    renderWizard();
    fireEvent.click(screen.getByText(/개인 보드 시작하기/));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });

  it('shows error message on API failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: '서버 오류입니다.' } }),
    });

    renderWizard();
    fireEvent.click(screen.getByText(/개인 보드 시작하기/));

    await waitFor(() => {
      expect(screen.getByText('서버 오류입니다.')).toBeTruthy();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error message on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    renderWizard();
    fireEvent.click(screen.getByText(/개인 보드 시작하기/));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });
});

// ─── Team tab ─────────────────────────────────────────────────────────────────

describe('OnboardingWizard — team tab', () => {
  it('switches to team tab on click', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: /팀 워크스페이스/ }));
    expect(screen.getByText('WorkspaceCreator')).toBeTruthy();
  });

  it('shows 개설 sub-tab content by default in team tab', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: /팀 워크스페이스/ }));
    expect(screen.getByText('WorkspaceCreator')).toBeTruthy();
    expect(screen.queryByText('WorkspaceFinder')).toBeNull();
  });

  it('switches to 찾기 sub-tab', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: /팀 워크스페이스/ }));
    fireEvent.click(screen.getByRole('button', { name: /찾기/ }));
    expect(screen.getByText('WorkspaceFinder')).toBeTruthy();
    expect(screen.queryByText('WorkspaceCreator')).toBeNull();
  });
});
