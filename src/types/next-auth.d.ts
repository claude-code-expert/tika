import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      workspaceId: number | null;
      memberId: number | null;
      userType: 'USER' | 'WORKSPACE' | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string;
    userType?: 'USER' | 'WORKSPACE' | null;
  }
}
