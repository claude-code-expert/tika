import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from '@/db/index';
import { users, workspaces, members, labels } from '@/db/schema';
import { DEFAULT_LABELS } from '@/lib/constants';
import { eq } from 'drizzle-orm';

async function createPersonalWorkspace(userId: string, userName: string) {
  const [newWorkspace] = await db
    .insert(workspaces)
    .values({ ownerId: userId, name: '내 워크스페이스', type: 'PERSONAL' })
    .returning({ id: workspaces.id });

  await db.insert(members).values({
    userId,
    workspaceId: newWorkspace.id,
    displayName: userName,
    color: '#7EB4A2',
  });

  await db.insert(labels).values(
    DEFAULT_LABELS.map((l) => ({
      workspaceId: newWorkspace.id,
      name: l.name,
      color: l.color,
    })),
  );

  return newWorkspace;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return false;
      if (!user.email || !user.name) return false;

      try {
        // Upsert user by email (NextAuth may generate different id each session)
        const [upsertedUser] = await db
          .insert(users)
          .values({
            id: user.id ?? crypto.randomUUID(),
            email: user.email,
            name: user.name,
            avatarUrl: user.image ?? null,
          })
          .onConflictDoUpdate({
            target: users.email,
            set: {
              name: user.name,
              avatarUrl: user.image ?? null,
            },
          })
          .returning({ id: users.id, userType: users.userType });

        // Use the persisted DB user ID (stable across sessions)
        const userId = upsertedUser.id;
        user.id = userId;

        // Only auto-create workspace for USER-type accounts (existing personal users).
        // NULL type = new user, will be routed to /onboarding.
        // WORKSPACE type = user manages their own workspace; no auto-creation.
        if (upsertedUser.userType === 'USER') {
          const existingWorkspace = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(eq(workspaces.ownerId, userId))
            .limit(1);

          if (existingWorkspace.length === 0) {
            await createPersonalWorkspace(userId, user.name);
          }
        }

        return true;
      } catch (err) {
        console.error('signIn callback error:', err);
        return false;
      }
    },

    async session({ session, token }) {
      if (!session.user || !token.sub) return session;

      // Attach user id and userType from JWT token
      const sessionUser = session.user as unknown as Record<string, unknown>;
      sessionUser.id = token.sub;
      sessionUser.userType = (token as Record<string, unknown>).userType ?? null;

      // Attach workspaceId and memberId based on userType
      const userType = sessionUser.userType as string | null;

      if (userType === 'USER') {
        // Personal user: look up their personal workspace by ownerId
        const [workspace] = await db
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(eq(workspaces.ownerId, token.sub))
          .limit(1);

        if (workspace) {
          const [member] = await db
            .select({ id: members.id })
            .from(members)
            .where(eq(members.userId, token.sub))
            .limit(1);

          sessionUser.workspaceId = workspace.id;
          sessionUser.memberId = member?.id ?? null;
        } else {
          sessionUser.workspaceId = null;
          sessionUser.memberId = null;
        }
      } else if (userType === 'WORKSPACE') {
        // Workspace user: find first team workspace they belong to as a member
        const [member] = await db
          .select({ id: members.id, workspaceId: members.workspaceId })
          .from(members)
          .where(eq(members.userId, token.sub))
          .limit(1);

        sessionUser.workspaceId = member?.workspaceId ?? null;
        sessionUser.memberId = member?.id ?? null;
      } else {
        // NULL type: onboarding incomplete
        sessionUser.workspaceId = null;
        sessionUser.memberId = null;
      }

      return session;
    },

    async jwt({ token, user, trigger }) {
      // On initial sign-in, store the user id
      if (user) token.sub = user.id;

      // Fetch fresh userType from DB on sign-in or when session is updated (e.g., after type selection)
      if (user || trigger === 'update') {
        const userId = token.sub;
        if (userId) {
          const [dbUser] = await db
            .select({ userType: users.userType })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
          (token as Record<string, unknown>).userType = dbUser?.userType ?? null;
        }
      }

      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { createPersonalWorkspace };
