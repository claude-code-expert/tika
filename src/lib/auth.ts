import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from '@/db/index';
import { users, workspaces, members, labels } from '@/db/schema';
import { DEFAULT_LABELS } from '@/lib/constants';
import { eq, and } from 'drizzle-orm';

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
    isPrimary: true,
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

export interface SessionUserData {
  id: string;
  userType: string | null;
  workspaceId: number | null;
  memberId: number | null;
}

/**
 * Builds session user data from DB — always fresh, never from stale JWT.
 * Returns null if the user no longer exists in DB (e.g. after DB reset),
 * which signals the session callback to invalidate the session.
 */
export async function buildSessionUser(tokenSub: string): Promise<SessionUserData | null> {
  // Verify user exists — guards against stale JWT after DB reset or user deletion
  const [dbUser] = await db
    .select({ id: users.id, userType: users.userType })
    .from(users)
    .where(eq(users.id, tokenSub))
    .limit(1);

  if (!dbUser) return null;

  const { userType } = dbUser;

  // NULL type: onboarding incomplete
  if (!userType) return { id: tokenSub, userType: null, workspaceId: null, memberId: null };

  // Find the primary member record (is_primary = true) to determine default workspace
  const [primary] = await db
    .select({ id: members.id, workspaceId: members.workspaceId })
    .from(members)
    .where(and(eq(members.userId, tokenSub), eq(members.isPrimary, true)))
    .limit(1);

  if (primary) {
    return { id: tokenSub, userType, workspaceId: primary.workspaceId, memberId: primary.id };
  }

  // Fallback: no primary set — use personal workspace (PERSONAL type owned by user)
  const [personalMember] = await db
    .select({ id: members.id, workspaceId: members.workspaceId })
    .from(members)
    .innerJoin(workspaces, eq(members.workspaceId, workspaces.id))
    .where(and(eq(members.userId, tokenSub), eq(workspaces.type, 'PERSONAL')))
    .limit(1);

  return {
    id: tokenSub,
    userType,
    workspaceId: personalMember?.workspaceId ?? null,
    memberId: personalMember?.id ?? null,
  };
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

        // All users get a personal workspace on first signup (regardless of userType).
        // Guard: only create if no personal workspace exists yet (idempotent).
        const existingPersonal = await db
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(eq(workspaces.ownerId, userId))
          .limit(1);

        if (existingPersonal.length === 0) {
          await createPersonalWorkspace(userId, user.name);
        }

        return true;
      } catch (err) {
        console.error('signIn callback error:', err);
        return false;
      }
    },

    async session({ session, token }) {
      if (!session.user || !token.sub) return session;

      const data = await buildSessionUser(token.sub);
      if (!data) {
        // User not in DB — invalidate session to force re-login
        return { ...session, user: undefined } as unknown as typeof session;
      }

      const sessionUser = session.user as unknown as Record<string, unknown>;
      sessionUser.id = data.id;
      sessionUser.userType = data.userType;
      sessionUser.workspaceId = data.workspaceId;
      sessionUser.memberId = data.memberId;

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
