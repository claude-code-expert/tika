/**
 * OnboardingWizard component tests
 * - Step 1: always creates personal workspace (PATCH /api/users/type with USER)
 * - Step 2: shows team workspace option and personal board option
 * - Team workspace: navigates to /onboarding/workspace
 * - Personal board: navigates to /
 * - Shows error message on API failure
 */

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
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
    json: async () => ({ user: { userType: 'USER' }, workspace: { id: 1 } }),
  });
  mockUpdate.mockResolvedValue(null);
}

async function advanceToStep2() {
  mockFetchSuccess();
  const btn = screen.getByRole('button', { name: /개인 워크스페이스 생성하기/ });
  fireEvent.click(btn);
  await waitFor(() => expect(screen.getByText(/팀 워크스페이스를 만드시겠어요/)).toBeTruthy());
}

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useSession as jest.Mock).mockReturnValue({ update: mockUpdate });
  global.fetch = jest.fn();
});

// ─── Rendering (Step 1) ──────────────────────────────────────────────────────

describe('OnboardingWizard — rendering (step 1)', () => {
  it('shows welcome message with user name', () => {
    renderWizard();
    expect(screen.getByText(/홍길동/)).toBeTruthy();
    expect(screen.getByText(/Tika에 오신 것을 환영합니다/)).toBeTruthy();
  });

  it('shows step indicator', () => {
    renderWizard();
    // step indicator has "팀 워크스페이스 (선택)" — unique to the indicator
    expect(screen.getByText('팀 워크스페이스 (선택)')).toBeTruthy();
    expect(screen.getAllByText('개인 워크스페이스').length).toBeGreaterThanOrEqual(1);
  });

  it('renders 개인 워크스페이스 생성 button', () => {
    renderWizard();
    expect(screen.getByText(/개인 워크스페이스 생성하기/)).toBeTruthy();
  });
});

// ─── Step 1 — personal workspace creation ────────────────────────────────────

describe('OnboardingWizard — step 1 (personal workspace)', () => {
  it('calls PATCH /api/users/type with USER', async () => {
    mockFetchSuccess();
    renderWizard();
    fireEvent.click(screen.getByText(/개인 워크스페이스 생성하기/));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/type', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ userType: 'USER' }),
      }));
    });
  });

  it('calls session.update() after successful API call', async () => {
    mockFetchSuccess();
    renderWizard();
    fireEvent.click(screen.getByText(/개인 워크스페이스 생성하기/));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
  });

  it('advances to step 2 after success', async () => {
    renderWizard();
    await advanceToStep2();
    expect(screen.getByRole('button', { name: /팀 워크스페이스 만들기/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /개인 보드로 바로 시작/ })).toBeTruthy();
  });
});

// ─── Step 2 — team workspace or personal board ────────────────────────────────

describe('OnboardingWizard — step 2 (team or personal)', () => {
  it('navigates to /onboarding/workspace when team workspace button clicked', async () => {
    renderWizard();
    await advanceToStep2();

    fireEvent.click(screen.getByRole('button', { name: /팀 워크스페이스 만들기/ }));
    expect(mockPush).toHaveBeenCalledWith('/onboarding/workspace');
  });

  it('navigates to / when 개인 보드로 바로 시작 clicked', async () => {
    renderWizard();
    await advanceToStep2();

    fireEvent.click(screen.getByText(/개인 보드로 바로 시작/));
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});

// ─── Error handling ──────────────────────────────────────────────────────────

describe('OnboardingWizard — error handling', () => {
  it('shows error message on API failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: '서버 오류입니다.' } }),
    });

    renderWizard();
    fireEvent.click(screen.getByText(/개인 워크스페이스 생성하기/));

    await waitFor(() => {
      expect(screen.getByText('서버 오류입니다.')).toBeTruthy();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error message on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    renderWizard();
    fireEvent.click(screen.getByText(/개인 워크스페이스 생성하기/));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });

  it('does not advance to step 2 on API failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: '오류' } }),
    });

    renderWizard();
    fireEvent.click(screen.getByText(/개인 워크스페이스 생성하기/));

    await waitFor(() => expect(screen.getByText('오류')).toBeTruthy());
    expect(screen.queryByText(/팀 워크스페이스를 만드시겠어요/)).toBeNull();
  });
});
