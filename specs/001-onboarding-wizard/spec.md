# Feature Specification: Onboarding Wizard & Workspace Flow

**Feature Branch**: `001-onboarding-wizard`
**Created**: 2026-03-05
**Status**: Draft
**Input**: Implement personal and workspace onboarding flow based on ONBOARDING-DESIGN.md. Look and feel matches current Tika design with Lucide icons.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Time User Onboarding Wizard (Priority: P1)

A brand-new user logs in via Google for the first time and is presented with a choice screen asking how they want to use Tika: personally (just me) or as part of a workspace (team). The user selects their preference, which is saved, and they are routed to the appropriate experience.

**Why this priority**: Every new user must go through this step. Without it, users have no way to declare their intent or access the right experience. This is the foundation for all downstream flows.

**Independent Test**: Can be fully tested by logging in as a new Google account and verifying the onboarding selection screen appears with two cards (personal / workspace), the selection is saved, and the user is redirected correctly.

**Acceptance Scenarios**:

1. **Given** a user has never logged into Tika before, **When** they authenticate via Google, **Then** they are redirected to the onboarding wizard page (not the main board)
2. **Given** the onboarding wizard is displayed, **When** the user selects "개인용 (Personal)", **Then** their account is marked as personal type and they are taken to the personal kanban board
3. **Given** the onboarding wizard is displayed, **When** the user selects "워크스페이스 (Workspace)", **Then** their account is marked as workspace type and they are taken to the workspace onboarding page
4. **Given** a user has already completed onboarding (type is set), **When** they log in again, **Then** they are taken directly to the appropriate board without seeing the wizard again

---

### User Story 2 - Personal Mode Board Access (Priority: P2)

A user who selected personal mode is taken to their personal kanban board. They can use all existing ticket and board features without any workspace or team features.

**Why this priority**: The simplest and most common use case must work perfectly before adding workspace complexity.

**Independent Test**: After selecting "개인용" in the wizard, the user reaches the personal board and can create, view, and manage tickets using the full existing board feature set.

**Acceptance Scenarios**:

1. **Given** a user has selected personal mode, **When** they visit the app, **Then** they see their personal kanban board with the 4 columns (Backlog, TODO, In Progress, Done)
2. **Given** a returning personal-mode user, **When** they log in, **Then** they land directly on the personal board without going through onboarding again
3. **Given** a personal-mode user is on the board, **When** they navigate, **Then** no workspace-invite or workspace-join UI elements are shown

---

### User Story 3 - Create a Workspace (Priority: P3)

A user who selected workspace mode and wants to start a new team creates a workspace by entering a name and optional description. They become the sole owner of that workspace and are immediately taken to the workspace board.

**Why this priority**: Owners are the entry point for all workspace activity. Without workspace creation, no workspace flows are possible.

**Independent Test**: After selecting "워크스페이스" in the wizard and choosing the "개설 (Create)" tab, the user enters a workspace name, submits, and lands on the workspace board as OWNER.

**Acceptance Scenarios**:

1. **Given** a user is on the workspace onboarding page, **When** they view the "개설" tab, **Then** they see a required workspace name field and an optional description field
2. **Given** the user enters a workspace name and submits, **When** the form is submitted successfully, **Then** the workspace is created, the user is set as OWNER, and they are redirected to the workspace board
3. **Given** the user leaves the workspace name blank, **When** they try to submit, **Then** the form shows a validation error and does not proceed
4. **Given** a workspace is successfully created, **When** the owner visits team settings, **Then** they can generate and share an invite link with team members

---

### User Story 4 - Find and Join a Workspace (Priority: P4)

A user who selected workspace mode searches for an existing workspace by name, or pastes an invite link URL. If a matching public workspace is found, they can submit a join request. If a valid invite link is pasted, they are auto-approved and taken directly to the workspace board.

**Why this priority**: Without the ability to find and join a workspace, only owners can use the workspace feature. Most users will be joining existing workspaces.

**Independent Test**: On the workspace onboarding "찾기 (Find)" tab, a user can (a) search by name and submit a join request, or (b) paste an invite link URL and be auto-joined. Both paths are independently testable.

**Acceptance Scenarios**:

1. **Given** a user is on the "찾기" tab, **When** they type a workspace name and search, **Then** matching searchable workspaces appear as cards showing name, member count, and a "가입신청" button
2. **Given** a search returns no results, **When** the results are displayed, **Then** the message "워크스페이스가 없습니다. 초대 링크로 진입하세요" is shown
3. **Given** a user clicks "가입신청" on a workspace card, **When** the request is submitted, **Then** a success message confirms the request is pending, and the button changes to "신청 완료"
4. **Given** a user pastes a valid invite link URL in the search field, **When** the system detects it is an invite link, **Then** the user is automatically added to the workspace and redirected to the workspace board without owner approval
5. **Given** a user pastes an expired invite link, **When** the system processes it, **Then** an error message explains the link has expired and advises requesting a new one from the owner

---

### User Story 5 - Owner Manages Join Requests (Priority: P5)

A workspace owner sees pending join requests in the members management page and can approve or reject each one. Approved users are immediately added as members and can access the workspace.

**Why this priority**: Without this, join requests accumulate with no way to process them. This completes the join request workflow for owners.

**Independent Test**: As a workspace OWNER on the members page, pending join requests are listed with approve/reject controls. Approving a request adds the user to the active members list.

**Acceptance Scenarios**:

1. **Given** there are pending join requests, **When** the OWNER visits the members page, **Then** a "가입 신청 (N건)" section appears with each requester's name, email, request date, and Approve/Reject buttons
2. **Given** the owner clicks "승인 (Approve)", **When** the action completes, **Then** the user moves from the pending list to the active members list
3. **Given** the owner clicks "거절 (Reject)", **When** the action completes, **Then** the request is removed and the user is not added as a member
4. **Given** there are no pending requests, **When** the owner views the members page, **Then** the join requests section is hidden or shows an empty state message
5. **Given** a non-owner member views the members page, **When** the page loads, **Then** the join requests section is not visible

---

### Edge Cases

- What happens when a user pastes an expired invite link? → Show a clear expiry error with guidance to request a new link from the owner
- What happens if a user submits a duplicate join request for the same workspace? → The system prevents duplicate requests; the user sees "신청 완료" status instead of a join button
- What if a workspace's searchability flag is off? → It does not appear in name search results; it can only be accessed via invite link
- What happens if the user pastes a workspace board URL (e.g. `/team/[id]`) instead of an invite link? → Detect as workspace ID, navigate to join request flow for that specific workspace
- What if a user closes the browser mid-onboarding before completing their type selection? → Their type remains unset; they will see the wizard again on next login

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an onboarding wizard to users who have not yet completed type selection (first-time login)
- **FR-002**: System MUST offer exactly two options: "개인용 (Personal)" and "워크스페이스 (Workspace)" as selectable cards
- **FR-003**: System MUST save the user's selected type to their account upon selection
- **FR-004**: System MUST redirect personal-type users to the personal kanban board after selection
- **FR-005**: System MUST redirect workspace-type users to the workspace onboarding screen after selection
- **FR-006**: System MUST skip the onboarding wizard for returning users who have already set their type
- **FR-007**: System MUST route workspace-type users with no workspace to the workspace onboarding screen on login
- **FR-008**: System MUST allow workspace-type users to create a new workspace with a required name and optional description
- **FR-009**: System MUST assign the OWNER role to the user who creates a workspace
- **FR-010**: System MUST redirect the workspace creator to the new workspace board immediately after creation
- **FR-011**: System MUST allow workspace-type users to search for workspaces by name
- **FR-012**: System MUST only show workspaces in search results that have been explicitly marked as searchable by their owner
- **FR-013**: System MUST allow users to submit a join request for a workspace found in search results
- **FR-014**: System MUST prevent duplicate join requests from the same user to the same workspace
- **FR-015**: System MUST detect when a user pastes an invite link URL in the workspace finder input
- **FR-016**: System MUST auto-approve and add the user to the workspace when a valid non-expired invite link is pasted
- **FR-017**: System MUST display a clear error message when an expired or invalid invite link is entered
- **FR-018**: System MUST display pending join requests to the workspace OWNER on the members management page
- **FR-019**: System MUST allow OWNER to approve a join request, which immediately adds the user as a MEMBER
- **FR-020**: System MUST allow OWNER to reject a join request, which removes the request without adding the user
- **FR-021**: System MUST hide the join requests section from non-owner members on the members page
- **FR-022**: All new screens MUST visually match the existing Tika design system (colors, fonts, spacing, component patterns)
- **FR-023**: All icons on new screens MUST use the Lucide icon library already used throughout the application

### Key Entities

- **User**: A Google-authenticated person with a usage type (unset / personal / workspace). Type persists once set.
- **Workspace**: A shared project space with a name, optional description, and a public-searchability flag. Type is either PERSONAL (auto-created) or TEAM (owner-created).
- **WorkspaceJoinRequest**: A request from a user to join a specific workspace. Tracks status (pending / approved / rejected), reviewer, and timestamps.
- **Member**: The relationship between a user and a workspace, including their role (OWNER / MEMBER / VIEWER).
- **InviteLink**: A time-limited token granting direct workspace entry without owner approval. Valid for 7 days after generation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can complete the full onboarding flow (login → type selection → board) in under 2 minutes
- **SC-002**: A user creating a new workspace can complete the process (name entry → submission → workspace board) in under 60 seconds
- **SC-003**: A user joining via invite link completes the process (paste link → auto-approve → workspace board) in under 30 seconds
- **SC-004**: 100% of users who have already completed onboarding bypass the wizard on subsequent logins
- **SC-005**: A workspace owner can review and act on all pending join requests from a single page without navigating away
- **SC-006**: Workspace name search results appear within 2 seconds of submitting the search
- **SC-007**: All onboarding screens are visually indistinguishable in style from the existing Tika board (same color palette, font, and icon family)
- **SC-008**: Zero data loss — a user who closes mid-onboarding has their type remain unset and will re-enter the wizard on next login

## Assumptions

- Authentication is Google OAuth only; email/password login is out of scope
- The personal workspace (PERSONAL type) is auto-created for personal-mode users via the existing workspace creation mechanism
- Workspace searchability defaults to "not searchable"; owners enable public search from workspace settings (out of scope for this feature)
- Invite links expire after 7 days, consistent with existing invite behavior
- Only one OWNER per workspace is allowed; owner transfer is out of scope
- Existing users at time of deployment are treated as personal-type users via a one-time data migration (no re-onboarding required)
- The workspace finder input intelligently detects: plain name search, invite link URL (`/invite/[token]`), or workspace URL (`/team/[id]`)
