# External Integrations

**Analysis Date:** 2026-04-11

## Databases

| Service | Client | Purpose | Connection |
|---------|--------|---------|-----------|
| PostgreSQL (Vercel Postgres) | pg 8.18.0 + @vercel/postgres 0.10.0 | Primary relational database for users, workspaces, tickets, members, sprints, comments, etc. | `src/db/index.ts` initializes Pool with `POSTGRES_URL` env var |

**Connection Details:**
- Location: `src/db/index.ts`
- Driver: node-postgres (pg) with connection pooling
- Pool configuration: max 1 connection, 30s idle timeout, 5s connection timeout
- SSL: Enabled in production (`NODE_ENV=production`)

**Schema:**
- Definition: `src/db/schema.ts`
- Migration tool: Drizzle ORM with drizzle-kit
- Migrations stored: `migrations/` directory

## Authentication

| Provider | Method | Config location |
|----------|--------|----------------|
| Google OAuth 2.0 | OAuth 2.0 (OpenID Connect) | `src/lib/auth.ts` |
| NextAuth.js | Session + JWT (with NextAuth.js beta v5) | `src/lib/auth.ts` |

**Google OAuth Setup:**
- Client ID: Environment variable `GOOGLE_CLIENT_ID`
- Client Secret: Environment variable `GOOGLE_CLIENT_SECRET`
- Implementation: `src/lib/auth.ts` exports `{ auth, handlers, signIn, signOut }`
- Callback handling: `app/api/auth/[...nextauth]/route.ts` exposes handlers via `export { handlers as GET, handlers as POST }`

**Session Management:**
- JWT secret: `NEXTAUTH_SECRET` environment variable
- Callback URL: `NEXTAUTH_URL` (e.g., `http://localhost:3000` or `https://tika.vercel.app`)
- Sign-in page: Redirects to `/login` on auth failure
- Session data: Custom `SessionUserData` interface includes `id`, `userType`, `workspaceId`, `memberId`, `memberColor`

**User Creation Flow:**
- Users are upserted on first Google OAuth sign-in
- Personal workspace automatically created for all new users
- User data stored in `users` table (`src/db/schema.ts`)
- Member relationship created in `members` table with OWNER role in personal workspace

## External APIs

| Service | Purpose | Config |
|---------|---------|--------|
| Resend Email Service | Sending workspace invitation emails | `src/lib/email.ts` |
| Vercel Blob | File storage for ticket attachments | `app/api/tickets/[id]/attachments/route.ts` |

### Resend Email

**Configuration:**
- API Key: `RESEND_API_KEY` environment variable
- Sender Address: `RESEND_FROM` env var (default: `Tika <onboarding@resend.dev>`)
- Base URL for links: `NEXTAUTH_URL`

**Functionality:**
- Location: `src/lib/email.ts` exports `sendInviteEmail()`
- Used by: Workspace member invitation flow
- Email template: HTML-based styled invite (sends invitation link, workspace name, role, expiration date)
- Error handling: Returns `{ success: boolean; error?: string }`

**Integration Points:**
- Called from: `app/api/members/invite/route.ts` (when inviting users to workspace)
- Expiration: Invited users must accept within token lifetime

### Vercel Blob

**Configuration:**
- Implicit authentication via Vercel environment
- Access level: Public files

**Functionality:**
- Location: Used in `app/api/tickets/[id]/attachments/route.ts`
- Purpose: Store ticket attachment files (max 10 MB per file)
- API: `put(fileName, file, { access: 'public' })` from `@vercel/blob`
- Returns: Public URL for stored file

**Integration Points:**
- File upload: `POST /api/tickets/[id]/attachments` handles multipart form data
- File retrieval: `GET /api/tickets/[id]/attachments` lists attachments from database
- Database reference: Attachment metadata stored in `attachments` table
- Cleanup: Delete handled via `DELETE /api/tickets/[id]/attachments/[attachmentId]`

## Cron Jobs & Scheduled Tasks

**Endpoints:** `app/api/cron/` directory

| Endpoint | Trigger | Purpose | Secret |
|----------|---------|---------|--------|
| `GET /api/cron/notify-due` | External cron service | Notify users of upcoming/overdue ticket deadlines | `CRON_SECRET` header |
| `GET /api/cron/expire-invites` | External cron service | Mark workspace invitations as expired after TTL | `CRON_SECRET` header |
| `GET /api/cron/cleanup-notifications` | External cron service | Delete old notification records to manage DB size | `CRON_SECRET` header |

**Security:**
- All cron endpoints require `Authorization: Bearer {CRON_SECRET}` header
- `CRON_SECRET` env var: String token for authentication
- Endpoints return 401 if token missing or invalid

**Files:**
- `app/api/cron/notify-due/route.ts` - Deadline notification logic
- `app/api/cron/expire-invites/route.ts` - Invite expiration logic
- `app/api/cron/cleanup-notifications/route.ts` - Notification cleanup logic

## Webhooks & Callbacks

**Incoming Webhooks:**
- None currently implemented

**Outgoing Webhooks:**
- None currently implemented

**OAuth Callbacks:**
- NextAuth.js handles Google OAuth callback at `NEXTAUTH_URL/api/auth/callback/google`
- Custom callbacks in `src/lib/auth.ts`:
  - `signIn`: User validation and workspace creation on first login
  - `session`: Enriches session with workspace/member context from database
  - `jwt`: Refreshes user type from database

## Data Flow: User Authentication & Session

1. User clicks "Sign in with Google" (login page at `app/(auth)/login/page.tsx`)
2. NextAuth redirects to Google OAuth consent screen
3. User grants permission; Google redirects back with auth code
4. NextAuth exchanges code for token at `/api/auth/callback/google`
5. `signIn()` callback upserts user in `users` table
6. `signIn()` creates personal workspace if first login
7. `jwt()` callback stores user ID in JWT token
8. `session()` callback enriches session with fresh workspace/member data from DB
9. Session available via `auth()` function in all route handlers and server components
10. Client-side access via NextAuth session hook (not implemented in current codebase)

## Data Flow: Email Invitations

1. Workspace admin invites user via `POST /api/members/invite`
2. API generates invitation token (with expiration)
3. Token stored in `invites` table
4. `sendInviteEmail()` called to send HTML email with invitation link
5. User clicks link in email (`/invite/{token}`)
6. `app/(auth)/invite/[token]/page.tsx` validates token and creates member
7. Expired invites cleaned up periodically via cron job

## Data Flow: File Attachments

1. User uploads file via `POST /api/tickets/{id}/attachments` form data
2. File validated (max 10 MB)
3. File uploaded to Vercel Blob using `put(fileName, file, { access: 'public' })`
4. Blob returns public URL
5. Attachment metadata (url, name, size, mimeType) stored in `attachments` table
6. Client retrieves list via `GET /api/tickets/{id}/attachments`
7. User can download via public Blob URL or delete via `DELETE /api/tickets/{id}/attachments/{attachmentId}`

## Environment Configuration

**Required env vars:**
```
POSTGRES_URL=postgresql://user:password@host/db
NEXTAUTH_SECRET=<random-32-byte-hex>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
CRON_SECRET=<random-token>
RESEND_API_KEY=<from-resend-dashboard>
```

**Optional env vars:**
```
NODE_ENV=development|production
RESEND_FROM=Custom Sender Name <email@domain.com>
DATABASE_URL=<fallback-postgres-url>
```

**Secrets location:**
- Development: `.env.local` (git-ignored)
- Production (Vercel): Environment variables in project settings

## Deployment Considerations

**Vercel Integration:**
- Automatic deployment on git push to main branch
- Vercel Postgres and Blob services included with Vercel account
- Environment variables managed via Vercel dashboard
- Automatic SSL certificates

**Database Connection:**
- Vercel Postgres provides `POSTGRES_URL` in production
- Connection pooling configured in `src/db/index.ts` with SSL in production

**Auth Setup:**
- Google OAuth callback URL must match `NEXTAUTH_URL` in Vercel settings
- `NEXTAUTH_URL` should be `https://tika.vercel.app` (your deployed domain)

---

*Integration audit: 2026-04-11*
