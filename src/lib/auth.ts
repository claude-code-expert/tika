import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from '@/db/index';
import { users, workspaces, members, labels } from '@/db/schema';
import { DEFAULT_LABELS } from '@/lib/constants';
import { eq } from 'drizzle-orm';

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
          .returning({ id: users.id });

        // Use the persisted DB user ID (stable across sessions)
        const userId = upsertedUser.id;
        user.id = userId;

        // Check if workspace already exists
        const existingWorkspace = await db
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(eq(workspaces.ownerId, userId))
          .limit(1);

        if (existingWorkspace.length === 0) {
          // Atomic creation: workspace → member → default labels
          const [newWorkspace] = await db
            .insert(workspaces)
            .values({ ownerId: userId, name: '내 워크스페이스' })
            .returning({ id: workspaces.id });

          await db.insert(members).values({
            userId: userId,
            workspaceId: newWorkspace.id,
            displayName: user.name,
            color: '#7EB4A2',
          });

          await db.insert(labels).values(
            DEFAULT_LABELS.map((l) => ({
              workspaceId: newWorkspace.id,
              name: l.name,
              color: l.color,
            })),
          );
        }

        return true;
      } catch (err) {
        console.error('signIn callback error:', err);
        return false;
      }
    },

    async session({ session, token }) {
      if (!session.user || !token.sub) return session;

      // Attach workspaceId and memberId to session
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

        (session.user as unknown as Record<string, unknown>).id = token.sub;
        (session.user as unknown as Record<string, unknown>).workspaceId = workspace.id;
        (session.user as unknown as Record<string, unknown>).memberId = member?.id ?? null;
      }

      return session;
    },

    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});
