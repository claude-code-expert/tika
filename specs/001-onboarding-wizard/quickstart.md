# Quickstart & Integration Scenarios: Onboarding Wizard

**Feature**: 001-onboarding-wizard
**Phase**: 1 — Design
**Date**: 2026-03-05

These scenarios describe how to manually verify each user story after implementation.

---

## Scenario 1: First-Time User — Personal Mode

**Prerequisites**: A Google account that has never logged into Tika.

**Steps**:
1. Visit `http://localhost:3000/`
2. You are redirected to `/login`
3. Click "Google로 로그인"
4. Complete Google authentication
5. **Expected**: You land on `/onboarding` (not the board)
6. Verify: Two cards "개인용" and "워크스페이스" are visible
7. Click "시작하기" under "개인용"
8. **Expected**: Button shows spinner, then redirects to `/`
9. Verify: Personal kanban board is visible with 4 empty columns
10. Check DB: `SELECT user_type FROM users WHERE email = '[your email]'` → should return `'USER'`
11. Check DB: A `workspaces` row with `type='PERSONAL'` and `owner_id` matching your user ID should exist

**Verify returning user skip**:
1. Log out, log back in
2. **Expected**: Land directly on `/` (personal board), no wizard shown

---

## Scenario 2: First-Time User — Workspace Mode (Create)

**Prerequisites**: A Google account that has never logged into Tika.

**Steps**:
1. Visit `http://localhost:3000/` → login → land on `/onboarding`
2. Click "시작하기" under "워크스페이스"
3. **Expected**: Redirect to `/onboarding/workspace` with two tabs (개설 / 찾기)
4. "개설" tab should be active by default
5. Enter workspace name: "Test Team"
6. Enter description: "My first workspace" (optional)
7. Click "워크스페이스 만들기"
8. **Expected**: Spinner → redirect to `/team/[newId]`
9. Verify: Team workspace board is visible
10. Check DB: `SELECT * FROM workspaces WHERE name='Test Team'` → `type='TEAM'`, `is_searchable=FALSE`
11. Check DB: `SELECT * FROM members WHERE workspace_id=[newId]` → `role='OWNER'`

---

## Scenario 3: Workspace Mode — Find and Request to Join

**Prerequisites**:
- User A has already created a workspace with `is_searchable=TRUE` (set manually in DB: `UPDATE workspaces SET is_searchable=TRUE WHERE id=[id]`)
- User B is a new Google account

**Steps** (as User B):
1. Login → `/onboarding` → "워크스페이스" → `/onboarding/workspace`
2. Click "찾기" tab
3. Type the workspace name (e.g., "Test Team") in the search field
4. Click "검색"
5. **Expected**: Workspace card appears with name, member count, "가입신청" button
6. Click "가입신청"
7. **Expected**: Button changes to "신청 완료" with success message
8. Check DB: `SELECT * FROM workspace_join_requests WHERE user_id='[user B id]'` → `status='PENDING'`

**Verify duplicate prevention**:
1. Refresh the page, try clicking "가입신청" again
2. **Expected**: Button still shows "신청 완료" (or 409 error is handled gracefully)

---

## Scenario 4: Workspace Mode — Join via Invite Link

**Prerequisites**:
- User A (OWNER) has a workspace and has created an invite for User B's email via `POST /api/workspaces/[id]/invites`
- The response contains `inviteUrl` which is `/invite/[token]`
- User B is logged in as a WORKSPACE-type user on `/onboarding/workspace`

**Steps** (as User B):
1. On the "찾기" tab, paste the full invite URL (e.g., `http://localhost:3000/invite/abc123-...`)
2. Click "검색"
3. **Expected**: System detects the invite URL pattern, calls `POST /api/invites/[token]/accept`
4. **Expected**: "✅ 워크스페이스에 참여했습니다! → 이동 중..." message appears
5. **Expected**: Redirect to `/team/[workspaceId]`
6. Check DB: `SELECT * FROM members WHERE user_id='[user B id]'` → new MEMBER row exists

**Verify expired link handling**:
1. Manually expire an invite: `UPDATE workspace_invites SET expires_at = NOW() - INTERVAL '1 day' WHERE id=[id]`
2. Paste that link URL in the finder
3. **Expected**: Error message "이 초대 링크가 만료되었습니다. 워크스페이스 오너에게 새 링크를 요청하세요."

---

## Scenario 5: Owner Approves a Join Request

**Prerequisites**: User B has submitted a join request (Scenario 3). User A is logged in as OWNER.

**Steps** (as User A):
1. Visit `/team/[workspaceId]/members`
2. **Expected**: "가입 신청 (1건)" section appears with User B's name, email, request date
3. Click "승인" next to User B's request
4. **Expected**: Row disappears from the pending list (optimistic UI)
5. **Expected**: User B now appears in the active members list
6. Check DB: `workspace_join_requests.status = 'APPROVED'`, `reviewed_by = [user A's memberId]`
7. Check DB: New row in `members` for User B with `role='MEMBER'`

**Verify reject flow**:
1. Have another user submit a request
2. Click "거절" on their request
3. **Expected**: Row disappears, no new member row created
4. Check DB: `workspace_join_requests.status = 'REJECTED'`

---

## Scenario 6: Non-OWNER cannot see join requests

**Prerequisites**: User B is a MEMBER (not OWNER) in a workspace.

**Steps**:
1. Login as User B (MEMBER role)
2. Visit `/team/[workspaceId]/members`
3. **Expected**: "가입 신청" section is NOT visible on the page

---

## Scenario 7: Existing User Migration

**Prerequisites**: An existing user account (type=NULL in DB or needs to be set to USER).

**Verify**:
1. `UPDATE users SET user_type='USER' WHERE email='[existing user email]'`
2. Login with that account
3. **Expected**: Land directly on personal board, no onboarding wizard

---

## Quick API Test Commands (curl)

```bash
# 1. Save user type (personal)
curl -X PATCH http://localhost:3000/api/users/type \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=[token]" \
  -d '{"userType": "USER"}'

# 2. Search workspaces
curl "http://localhost:3000/api/workspaces/search?q=test" \
  -b "next-auth.session-token=[token]"

# 3. Submit join request
curl -X POST http://localhost:3000/api/workspaces/12/join-requests \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=[token]" \
  -d '{"message": "Hi, I want to join!"}'

# 4. List join requests (as OWNER)
curl "http://localhost:3000/api/workspaces/12/join-requests" \
  -b "next-auth.session-token=[token]"

# 5. Approve join request
curl -X PATCH http://localhost:3000/api/workspaces/12/join-requests/7 \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=[token]" \
  -d '{"action": "APPROVE"}'
```

---

## Regression Check

After implementing this feature, verify the following existing flows are unaffected:

1. Personal board ticket CRUD works normally
2. `/dev` route (dev bypass auth) still works in development
3. Workspace invite creation and acceptance via `/invite/[token]` still works
4. Members page (non-OWNER view) still shows member list correctly
5. Header workspace switcher shows correct workspace names
6. All existing tests pass: `npm test`
